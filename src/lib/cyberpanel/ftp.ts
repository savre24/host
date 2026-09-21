import { cyberPanelRequest, CyberPanelServerConfig } from './client';
import { CyberPanelResponse } from './websites';

export interface FTPData {
  ftpUsername: string;
  domain: string;
  path: string;
}

export async function fetchFTPAccounts(server: CyberPanelServerConfig, domain: string): Promise<CyberPanelResponse<FTPData[]>> {
  try {
    const payload = { websiteName: domain };
    const response = await cyberPanelRequest("/ftp/fetchFTPAccounts", payload, server);

    if (response.error_message) {
      return { success: false, error: `CyberPanel Error: ${response.error_message}` };
    }

    let rawData: any;
    try {
      rawData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    } catch (e) {
      return { success: false, error: "Invalid response format from server" };
    }

    const ftps: FTPData[] = (rawData || []).map((ftp: any) => ({
      ftpUsername: ftp.ftpUsername,
      domain: ftp.domain,
      path: ftp.path,
    }));

    return { success: true, data: ftps };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch FTP accounts" };
  }
}

export async function createFTPAccount(server: CyberPanelServerConfig, domain: string, ftpUsername: string, ftpPassword: string, path: string): Promise<CyberPanelResponse<boolean>> {
  try {
    const payload = { domainName: domain, ftpUsername, ftpPassword, path };
    const response = await cyberPanelRequest("/ftp/submitFTPCreation", payload, server);

    if (response.status === 0 || response.success === 1 || response.status === 1) {
       return { success: true, data: true };
    }
    return { success: false, error: response.error_message || "Failed to create FTP account" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create FTP account" };
  }
}

export async function deleteFTPAccount(server: CyberPanelServerConfig, domain: string, ftpUsername: string): Promise<CyberPanelResponse<boolean>> {
  try {
    const payload = { domainName: domain, ftpUsername };
    const response = await cyberPanelRequest("/ftp/submitFTPDelete", payload, server);

    if (response.status === 0 || response.success === 1 || response.status === 1) {
       return { success: true, data: true };
    }
    return { success: false, error: response.error_message || "Failed to delete FTP account" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete FTP account" };
  }
}

export async function changeFTPPassword(server: CyberPanelServerConfig, domain: string, ftpUsername: string, ftpPassword: string): Promise<CyberPanelResponse<boolean>> {
  try {
    const payload = { domainName: domain, ftpUsername, ftpPassword };
    const response = await cyberPanelRequest("/ftp/changePassword", payload, server);

    if (response.status === 0 || response.success === 1 || response.status === 1) {
       return { success: true, data: true };
    }
    return { success: false, error: response.error_message || "Failed to change FTP password" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to change FTP password" };
  }
}
