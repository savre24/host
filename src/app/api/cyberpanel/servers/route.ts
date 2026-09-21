import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { encryptPassword } from '@/lib/cyberpanel/crypto';

export async function GET() {
  const session = await getServerSession(options as AuthOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const servers = await prisma.cyberPanelServer.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // CRITICAL: passwordEnc is explicitly omitted.
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: servers });
  } catch (error: any) {
    console.error('Error fetching CyberPanel servers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch servers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(options as AuthOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, url, username, password } = body;

    if (!name || !url || !username || !password) {
      return NextResponse.json({ success: false, message: 'Name, URL, username, and password are required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid URL format' }, { status: 400 });
    }

    const existing = await prisma.cyberPanelServer.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Server with this name already exists' }, { status: 400 });
    }

    const encryptedPassword = encryptPassword(password);

    const newServer = await prisma.cyberPanelServer.create({
      data: {
        name,
        url,
        username,
        passwordEnc: encryptedPassword,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        isActive: true,
      }
    });

    return NextResponse.json({ success: true, data: newServer });
  } catch (error: any) {
    console.error('Error creating CyberPanel server:', error);
    return NextResponse.json({ success: false, message: 'Failed to create server' }, { status: 500 });
  }
}
