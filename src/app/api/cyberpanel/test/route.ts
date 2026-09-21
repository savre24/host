import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { verifyConnection } from "@/lib/cyberpanel/auth";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  try {
    const session = await getServerSession(options);
    
    // Require authenticated admin session
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You must be logged in as an ADMIN" },
        { status: 401 }
      );
    }

    const result = await verifyConnection();

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
