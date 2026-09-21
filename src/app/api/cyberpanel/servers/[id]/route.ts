import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { encryptPassword } from '@/lib/cyberpanel/crypto';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(options as AuthOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, url, username, password, isActive } = body;

    if (!name || !url || !username) {
      return NextResponse.json({ success: false, message: 'Name, URL, and username are required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid URL format' }, { status: 400 });
    }

    const existing = await prisma.cyberPanelServer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Server not found' }, { status: 404 });
    }

    const nameCheck = await prisma.cyberPanelServer.findUnique({ where: { name } });
    if (nameCheck && nameCheck.id !== id) {
      return NextResponse.json({ success: false, message: 'Server with this name already exists' }, { status: 400 });
    }

    const updateData: any = {
      name,
      url,
      username,
    };
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Only update password if a new one is provided.
    if (password) {
      updateData.passwordEnc = encryptPassword(password);
    }

    const updatedServer = await prisma.cyberPanelServer.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        isActive: true,
      }
    });

    return NextResponse.json({ success: true, data: updatedServer });
  } catch (error: any) {
    console.error('Error updating CyberPanel server:', error);
    return NextResponse.json({ success: false, message: 'Failed to update server' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(options as AuthOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Check if exists
    const existing = await prisma.cyberPanelServer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Server not found' }, { status: 404 });
    }

    await prisma.cyberPanelServer.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Server deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting CyberPanel server:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete server' }, { status: 500 });
  }
}
