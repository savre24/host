import { cyberPanelRequest } from "./client";

/**
 * Verify connectivity and authentication with CyberPanel.
 * We use /websites/fetchWebsitesList as a read-only test endpoint.
 */
export async function verifyConnection() {
  const result = await cyberPanelRequest("/websites/fetchWebsitesList", {
    page: 1,
    recordsToShow: 10
  });
  
  if (result.success && result.data) {
    // If the request succeeds and returns data, we assume authentication is valid.
    return { success: true };
  }

  return { success: false, error: "CyberPanel connection failed" };
}
