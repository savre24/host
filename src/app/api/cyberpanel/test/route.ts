import { getServerSession, AuthOptions } from "next-auth";
import { NextResponse } from "next/server";
import { verifyConnection } from "@/lib/cyberpanel/auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { CyberPanelServerConfig } from "@/lib/cyberpanel/client";

export async function GET() {
  try {
    const session = await getServerSession(options as AuthOptions);
    
    // Require authenticated admin session
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You must be logged in as an ADMIN" },
        { status: 401 }
      );
    }

    // Temporary Fallback to .env for CP-01 testing
    const fallbackServer: CyberPanelServerConfig = {
      url: process.env.CYBERPANEL_URL?.replace(/^['"]|['"]$/g, '') || "",
      username: process.env.CYBERPANEL_USERNAME?.replace(/^['"]|['"]$/g, '') || "",
      password: process.env.CYBERPANEL_PASSWORD?.replace(/^['"]|['"]$/g, '') || "",
    };

    const result = await verifyConnection(fallbackServer);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Connected to CyberPanel"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "CyberPanel connection failed"
      }, { status: 502 });
    }
  } catch (error) {
    // Catch-all safety for unexpected exceptions
    return NextResponse.json(
      { success: false, message: "CyberPanel connection failed" },
      { status: 500 }
    );
  }
}
