import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { cyberPanelRequest } from '@/lib/cyberpanel/client';
import { decryptPassword } from '@/lib/cyberpanel/crypto';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientServiceId, serverId, domainName, packageName, phpVersion, sslEnabled } = body;

    // Validate request
    if (!clientServiceId || !serverId || !domainName || !packageName || !phpVersion) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check if already provisioned
    const existingDetail = await prisma.cyberPanelHostingDetail.findUnique({
      where: { clientServiceId }
    });

    if (existingDetail) {
      return NextResponse.json({ success: false, message: 'Service is already provisioned.' }, { status: 400 });
    }

    // Fetch dependencies
    const clientService = await prisma.clientService.findUnique({
      where: { id: clientServiceId },
      include: {
        client: {
          include: { user: true }
        }
      }
    });

    if (!clientService) {
      return NextResponse.json({ success: false, message: 'ClientService not found' }, { status: 404 });
    }

    const cyberPanelServer = await prisma.cyberPanelServer.findUnique({
      where: { id: serverId }
    });

    if (!cyberPanelServer) {
      return NextResponse.json({ success: false, message: 'CyberPanelServer not found' }, { status: 404 });
    }

    // Decrypt server password
    const decryptedPassword = decryptPassword(cyberPanelServer.passwordEnc);
    if (!decryptedPassword) {
      return NextResponse.json({ success: false, message: 'Failed to decrypt CyberPanel server credentials' }, { status: 500 });
    }

    const serverConfig = {
      url: cyberPanelServer.url,
      username: cyberPanelServer.username,
      password: decryptedPassword
    };

    // Generate safe customer CyberPanel credentials
    const baseUsername = clientService.client.user.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8) || 'user';
    const customerUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
    const customerPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'A1!'; 
    
    // Step 1: Create User
    const userPayload = {
      firstName: clientService.client.user.name?.split(' ')[0] || 'Customer',
      lastName: clientService.client.user.name?.split(' ')[1] || 'User',
      email: clientService.client.user.email || 'customer@example.com',
      userName: customerUsername,
      password: customerPassword,
      websitesLimit: 0,
      selectedACL: 'user'
    };

    const userRes = await cyberPanelRequest('/api/submitUserCreation', userPayload, serverConfig);
    
    if (userRes.createStatus !== 1 && userRes.status !== 1) {
      const errMsg = userRes.error_message || 'Unknown error';
      // Safety fix: Never silently reuse an existing account because we cannot 
      // securely guarantee the existing account belongs to this exact customer 
      // without extra cross-checks. We abort provisioning if the username exists.
      return NextResponse.json({ success: false, message: `User creation failed: ${errMsg}` }, { status: 500 });
    }

    // Step 2: Create Website
    const websitePayload = {
      domainName,
      ownerEmail: clientService.client.user.email || 'customer@example.com',
      phpSelection: phpVersion,
      packageName: packageName,
      websiteOwner: customerUsername,
      ownerPassword: customerPassword,
      openBasedir: 1
    };

    const websiteRes = await cyberPanelRequest('/api/createWebsite', websitePayload, serverConfig);

    if (websiteRes.createWebSiteStatus !== 1 && websiteRes.status !== 1) {
      return NextResponse.json({ success: false, message: `Website creation failed: ${websiteRes.error_message || 'Unknown error'}` }, { status: 500 });
    }

    // Step 3: Issue SSL if requested
    let sslSuccess = false;
    if (sslEnabled) {
      try {
         const sslRes = await cyberPanelRequest('/manageSSL/issueSSL', { virtualHost: domainName }, serverConfig);
         if (sslRes.SSL === 1) {
            sslSuccess = true;
         } else {
            sslSuccess = false;
            console.error('SSL Issuance Failed:', sslRes.error_message);
         }
      } catch (e) {
         sslSuccess = false;
         console.error('SSL Issuance Error:', e);
      }
    }

    // Step 4: Verify Website Exists
    try {
      const checkRes = await cyberPanelRequest('/api/fetchAccountsFromRemoteServer', {}, serverConfig);
      if (checkRes.fetchStatus === 1 && checkRes.data) {
         const accounts = typeof checkRes.data === 'string' ? JSON.parse(checkRes.data) : checkRes.data;
         const exists = accounts.find((a: any) => a.website === domainName);
         if (!exists) {
            throw new Error('Website not found in CyberPanel after creation');
         }
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, message: `Website verification failed: ${err.message}` }, { status: 500 });
    }

    // Step 5: Save to Database
    const detail = await prisma.cyberPanelHostingDetail.create({
      data: {
        clientServiceId,
        serverId,
        domainName,
        username: customerUsername,
        packageName,
        phpVersion,
        status: 'Active',
        sslEnabled: sslSuccess
      }
    });

    return NextResponse.json({ success: true, data: detail });

  } catch (error: any) {
    console.error('Provisioning Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
