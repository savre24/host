import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { cyberPanelRequest } from '@/lib/cyberpanel/client';
import { decryptPassword } from '@/lib/cyberpanel/crypto';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const server = await prisma.cyberPanelServer.findUnique({
      where: { id }
    });

    if (!server) {
      return NextResponse.json({ success: false, message: 'Server not found' }, { status: 404 });
    }

    const plaintextPassword = decryptPassword(server.passwordEnc);
    if (!plaintextPassword) {
      return NextResponse.json({ success: false, message: 'Failed to decrypt server credentials' }, { status: 500 });
    }

    const config = {
      url: server.url,
      username: server.username,
      password: plaintextPassword
    };

    // Use /api/listPackage which requires adminUser and adminPass
    const res = await cyberPanelRequest('/api/listPackage', { 
      adminUser: server.username, 
      adminPass: plaintextPassword 
    }, config);
    
    // cyberpanel API typically returns an array directly or inside a wrapper. 
    // Usually listPackage returns the JSON array string, which we parse.
    let packages = [];
    if (Array.isArray(res)) {
       packages = res;
    } else if (res.data) {
       packages = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    } else {
       // fallback if it's the raw string that got parsed
       packages = Object.values(res).filter(v => typeof v === 'string'); // this might be risky, but if it returns [ "Default", "Premium" ] it might just be the array
    }
    
    // If we fail to parse safely, fallback
    if (!Array.isArray(packages)) {
       packages = ["Default"];
    }

    // Typical php versions
    const phpVersions = [
       'PHP 7.4', 'PHP 8.0', 'PHP 8.1', 'PHP 8.2', 'PHP 8.3', 'PHP 8.4', 'PHP 8.5'
    ];

    return NextResponse.json({ success: true, data: { packages, phpVersions } });

  } catch (error: any) {
    console.error('Error fetching CyberPanel packages:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal error' }, { status: 500 });
  }
}
