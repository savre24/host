import { cyberPanelRequest, CyberPanelServerConfig } from './client';

export interface WebsiteData {
  id: number;
  domain: string;
  adminEmail: string;
  ipAddress: string;
  state: string; // e.g. "Active", "Suspended"
  package: string;
}

export interface CyberPanelResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates a domain name format strictly
 */
function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false;
  // Basic domain validation regex (avoids catastrophic backtracking, safe for simple checks)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Safely fetches a list of websites from the specified CyberPanel server.
 */
export async function getWebsites(server: CyberPanelServerConfig): Promise<CyberPanelResponse<WebsiteData[]>> {
  try {
    const payload = {
      page: 1,
      recordsToShow: 10,
    };

    const response = await cyberPanelRequest("/websites/fetchWebsitesList", payload, server);

    if (response.error_message) {
      return { success: false, error: `CyberPanel Error: ${response.error_message}` };
    }

    let rawData: any;
    try {
      rawData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    } catch (e) {
      return { success: false, error: "Invalid response format from server" };
    }

    let websiteList = [];
    if (Array.isArray(rawData)) {
      websiteList = rawData;
    } else if (rawData && typeof rawData === "object" && rawData.data) {
      const parsedData = typeof rawData.data === "string" ? JSON.parse(rawData.data) : rawData.data;
      websiteList = Array.isArray(parsedData) ? parsedData : [];
    } else {
      return { success: false, error: "Unexpected response format from server" };
    }

    const websites: WebsiteData[] = websiteList.map((site: any) => ({
      id: site.id,
      domain: site.domain,
      adminEmail: site.adminEmail,
      ipAddress: site.ipAddress,
      state: site.state,
      package: site.package,
    }));

    return { success: true, data: websites };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch websites" };
  }
}

/**
 * Safely fetches status for a specific domain from the specified CyberPanel server.
 */
export async function getWebsiteStatus(server: CyberPanelServerConfig, domain: string): Promise<CyberPanelResponse<WebsiteData>> {
  try {
    if (!isValidDomain(domain)) {
      return { success: false, error: "Invalid domain format provided" };
    }

    const response = await getWebsites(server);
    if (!response.success || !response.data) {
      return { success: false, error: response.error || "Failed to retrieve websites for status check" };
    }

    const websites = response.data;
    const foundWebsite = websites.find(w => w.domain.toLowerCase() === domain.toLowerCase());

    if (!foundWebsite) {
      return { success: false, error: "Website not found on this server" };
    }

    return { success: true, data: foundWebsite };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch website status" };
  }
}
