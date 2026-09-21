import { cyberPanelRequest, CyberPanelServerConfig } from "./client";

/**
 * Verify connectivity and authentication with CyberPanel.
 * We use /api/listPackage as a read-only test endpoint to ensure API Tokens work.
 */
export async function verifyConnection(server: CyberPanelServerConfig) {
  try {
    const result = await cyberPanelRequest("/api/listPackage", {
      adminUser: server.username
    }, server);
    
    // We expect the CyberPanelResponse to be returned directly by our new client implementation
    if (!result.error_message) {
      // If the request succeeds and returns no error, we assume authentication is valid.
      return { success: true };
    }

    return { success: false, error: result.error_message || "CyberPanel connection failed" };
  } catch (error: any) {
    return { success: false, error: error.message || "CyberPanel connection failed" };
  }
}
