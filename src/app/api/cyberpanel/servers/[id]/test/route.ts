import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { decryptPassword } from '@/lib/cyberpanel/crypto';
import { verifyConnection } from '@/lib/cyberpanel/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(options as AuthOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const server = await prisma.cyberPanelServer.findUnique({ where: { id } });

    if (!server) {
      return NextResponse.json({ success: false, message: 'Server not found' }, { status: 404 });
    }

    if (!server.isActive) {
      return NextResponse.json({ success: false, message: 'Server is currently disabled' }, { status: 400 });
    }

    // Decrypt password only in memory
    const plaintextPassword = decryptPassword(server.passwordEnc);

    const config = {
      url: server.url,
      username: server.username,
      password: plaintextPassword,
    };

    const result = await verifyConnection(config);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Connection successful' });
    } else {
      return NextResponse.json({ success: false, message: 'Connection failed. Please check credentials or firewall.' }, { status: 502 });
    }
  } catch (error: any) {
    // We intentionally mask the actual error here to prevent leaking internal traces or credentials
    console.error('CyberPanel Test Connection Error:', error.message || 'Unknown error');
    return NextResponse.json({ success: false, message: 'Connection failed due to an unexpected error' }, { status: 500 });
  }
}
