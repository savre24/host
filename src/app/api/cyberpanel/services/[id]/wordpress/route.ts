import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cyberPanelRequest } from '@/lib/cyberpanel/client';
import crypto from 'crypto';

function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { domain, blogTitle, adminUser, adminEmail } = body;

    const service = await prisma.clientService.findUnique({
      where: { id },
      include: {
        cyberPanelDetail: {
          include: { server: true }
        }
      }
    });

    if (!service || !service.cyberPanelDetail) {
      return NextResponse.json({ error: 'CyberPanel service not found' }, { status: 404 });
    }

    const serverConfig = service.cyberPanelDetail.server;
    const adminPassword = generatePassword(14);

    // Call CyberPanel's installWordpress API
    const wpPayload = {
      domain: domain,
      home: 0,
      blogTitle: blogTitle || 'My WordPress Blog',
      adminUser: adminUser || 'wpadmin',
      passwordByPass: adminPassword,
      adminEmail: adminEmail || 'admin@example.com'
    };

    const wpRes = await cyberPanelRequest('/websites/installWordpress', wpPayload, serverConfig);

    if (wpRes.installStatus === 1 || (wpRes.error_message && wpRes.error_message.includes('Successfully Installed'))) {
      return NextResponse.json({ success: true, password: adminPassword });
    } else {
      return NextResponse.json({ error: wpRes.error_message || 'Installation failed' }, { status: 400 });
    }

  } catch (error) {
    console.error('WP Install Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
