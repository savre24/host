import { cyberPanelRequest, CyberPanelServerConfig } from './client';
import { CyberPanelResponse } from './websites';

export interface DatabaseData {
  dbName: string;
  dbUser: string;
}

export async function fetchDatabases(server: CyberPanelServerConfig, domain: string): Promise<CyberPanelResponse<DatabaseData[]>> {
  try {
    const payload = { websiteName: domain };
    const response = await cyberPanelRequest("/dataBases/fetchDatabases", payload, server);

    if (response.error_message) {
      return { success: false, error: `CyberPanel Error: ${response.error_message}` };
    }

    let rawData: any;
    try {
      rawData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    } catch (e) {
      return { success: false, error: "Invalid response format from server" };
    }

    const dbs: DatabaseData[] = (rawData || []).map((db: any) => ({
      dbName: db.dbName,
      dbUser: db.dbUser,
    }));

    return { success: true, data: dbs };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch databases" };
  }
}

export async function createDatabase(server: CyberPanelServerConfig, domain: string, dbName: string, dbUser: string, dbPassword: string): Promise<CyberPanelResponse<boolean>> {
  try {
    const payload = { websiteName: domain, dbName, dbUser, dbPassword };
    const response = await cyberPanelRequest("/dataBases/submitDBCreation", payload, server);

    if (response.status === 0 || response.success === 1 || response.status === 1) {
       return { success: true, data: true };
    }
    return { success: false, error: response.error_message || "Failed to create database" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create database" };
  }
}

export async function deleteDatabase(server: CyberPanelServerConfig, domain: string, dbName: string): Promise<CyberPanelResponse<boolean>> {
  try {
    const payload = { websiteName: domain, dbName };
    const response = await cyberPanelRequest("/dataBases/submitDatabaseDeletion", payload, server);

    if (response.status === 0 || response.success === 1 || response.status === 1) {
       return { success: true, data: true };
    }
    return { success: false, error: response.error_message || "Failed to delete database" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete database" };
  }
}
