import { NextResponse } from "next/server";
import { getServerSession, AuthOptions } from "next-auth";
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { fetchFTPAccounts, createFTPAccount, deleteFTPAccount, changeFTPPassword } from "@/lib/cyberpanel/ftp";

export async function GET(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceId } = params;

    const service = await prisma.clientService.findFirst({
      where: {
        id: serviceId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        cyberPanelDetail: {
          include: {
            server: true,
          },
        },
      },
    });

    if (!service || !service.cyberPanelDetail) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const detail = service.cyberPanelDetail;
    const serverConfig = {
      url: detail.server.url,
      username: detail.server.username,
      passwordEnc: detail.server.passwordEnc,
    };

    const response = await fetchFTPAccounts(serverConfig, detail.domainName);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch FTP accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("FTP GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceId } = params;
    const body = await request.json();
    const { action, ftpUsername, ftpPassword, path } = body;

    const service = await prisma.clientService.findFirst({
      where: {
        id: serviceId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        cyberPanelDetail: {
          include: {
            server: true,
          },
        },
      },
    });

    if (!service || !service.cyberPanelDetail) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const detail = service.cyberPanelDetail;
    const serverConfig = {
      url: detail.server.url,
      username: detail.server.username,
      passwordEnc: detail.server.passwordEnc,
    };

    if (action === "CREATE") {
      if (!ftpUsername || !ftpPassword || !path) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const response = await createFTPAccount(serverConfig, detail.domainName, ftpUsername, ftpPassword, path);
      if (!response.success) {
        return NextResponse.json({ error: response.error || "Failed to create FTP account" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "FTP account created successfully" });
    } 
    
    if (action === "DELETE") {
      if (!ftpUsername) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const response = await deleteFTPAccount(serverConfig, detail.domainName, ftpUsername);
      if (!response.success) {
        return NextResponse.json({ error: response.error || "Failed to delete FTP account" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "FTP account deleted successfully" });
    }

    if (action === "CHANGE_PASSWORD") {
      if (!ftpUsername || !ftpPassword) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const response = await changeFTPPassword(serverConfig, detail.domainName, ftpUsername, ftpPassword);
      if (!response.success) {
        return NextResponse.json({ error: response.error || "Failed to change FTP password" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "FTP password changed successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("FTP POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
