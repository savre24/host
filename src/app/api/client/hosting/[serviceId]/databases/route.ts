import { NextResponse } from "next/server";
import { getServerSession, AuthOptions } from "next-auth";
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { fetchDatabases, createDatabase, deleteDatabase } from "@/lib/cyberpanel/databases";

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

    const response = await fetchDatabases(serverConfig, detail.domainName);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch databases" },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Databases GET error:", error);
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
    const { action, dbName, dbUser, dbPassword } = body;

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
      if (!dbName || !dbUser || !dbPassword) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      // CyberPanel prefixes DB name and user with something usually. But the API might handle it.
      // Wait, in CyberPanel, usually creating a DB via API takes the exact dbName. Let's pass it directly.
      const response = await createDatabase(serverConfig, detail.domainName, dbName, dbUser, dbPassword);
      if (!response.success) {
        return NextResponse.json({ error: response.error || "Failed to create database" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "Database created successfully" });
    } 
    
    if (action === "DELETE") {
      if (!dbName) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const response = await deleteDatabase(serverConfig, detail.domainName, dbName);
      if (!response.success) {
        return NextResponse.json({ error: response.error || "Failed to delete database" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "Database deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Databases POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
