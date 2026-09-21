import { NextResponse } from "next/server";
import { getServerSession, AuthOptions } from "next-auth";
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { getWebsiteStatus } from "@/lib/cyberpanel/websites";

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

    // Verify ownership
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
    const server = detail.server;

    const serverConfig = {
      url: server.url,
      username: server.username,
      passwordEnc: server.passwordEnc,
    };

    const statusResponse = await getWebsiteStatus(serverConfig, detail.domainName);

    if (!statusResponse.success) {
      return NextResponse.json(
        { error: statusResponse.error || "Failed to fetch stats" },
        { status: 500 }
      );
    }

    return NextResponse.json(statusResponse.data);
  } catch (error: any) {
    console.error("Overview error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
