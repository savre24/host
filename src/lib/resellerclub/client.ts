/**
 * ResellerClub HTTP API Integration Client
 * Docs: https://manage.resellerclub.com/kb/answer/754
 */

export interface ResellerClubConfig {
  resellerId: string;
  apiKey: string;
  isTest?: boolean;
}

export function getResellerClubConfig(): ResellerClubConfig {
  const resellerId = process.env.RESELLERCLUB_RESELLER_ID || '1154026';
  const apiKey = process.env.RESELLERCLUB_API_KEY || '0XLHRvNuHjgE47Wl1gVwOTXEkeyGmlIJ';
  const isTest = process.env.RESELLERCLUB_IS_TEST === 'true';

  return { resellerId, apiKey, isTest };
}

export function getBaseUrl(isTest = false, isDomainCheck = false): string {
  if (isDomainCheck) {
    return isTest 
      ? 'https://test.httpapi.com/api' 
      : 'https://domaincheck.httpapi.com/api';
  }
  return isTest 
    ? 'https://test.httpapi.com/api' 
    : 'https://httpapi.com/api';
}

export interface DomainCheckResult {
  domain: string;
  tld: string;
  status: 'available' | 'taken' | 'unknown';
  classkey?: string;
}

/**
 * Check availability of a domain across multiple TLDs (e.g. com, in, net, org)
 */
export async function checkDomainAvailability(
  domainName: string,
  tlds: string[] = ['com', 'in', 'net', 'org', 'co.in']
): Promise<DomainCheckResult[]> {
  const config = getResellerClubConfig();
  const cleanDomain = domainName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].trim();

  if (!cleanDomain) {
    throw new Error('Invalid domain name provided');
  }

  const baseUrl = getBaseUrl(config.isTest, true);
  const params = new URLSearchParams();
  params.append('auth-userid', config.resellerId);
  params.append('api-key', config.apiKey);
  params.append('domain-name', cleanDomain);
  
  tlds.forEach(tld => {
    params.append('tlds', tld.replace(/^\./, ''));
  });

  const url = `${baseUrl}/domains/available.json?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.status === 403) {
      throw new Error(
        'ResellerClub API returned 403 Forbidden. Your server IP address is not whitelisted. Please add your server IP in ResellerClub -> Settings -> API -> Authorized IPs.'
      );
    }

    const data = await res.json();

    if (data.status === 'ERROR') {
      throw new Error(data.message || 'ResellerClub API Error');
    }

    const results: DomainCheckResult[] = [];

    // Response format: { "example.com": { "status": "available", "classkey": "domcno" } }
    for (const [fullDomain, info] of Object.entries(data)) {
      const typedInfo = info as { status?: string; classkey?: string };
      const parts = fullDomain.split('.');
      const tld = parts.slice(1).join('.');

      results.push({
        domain: fullDomain,
        tld,
        status: typedInfo.status === 'available' ? 'available' : 'taken',
        classkey: typedInfo.classkey,
      });
    }

    return results;
  } catch (error: any) {
    console.error('Error checking domain availability:', error);
    throw error;
  }
}

/**
 * ResellerClub generic helper for authenticated POST / GET requests
 */
export async function resellerClubRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  bodyParams: Record<string, string | string[] | number | boolean> = {}
): Promise<T> {
  const config = getResellerClubConfig();
  const baseUrl = getBaseUrl(config.isTest, false);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const params = new URLSearchParams();
  params.append('auth-userid', config.resellerId);
  params.append('api-key', config.apiKey);

  for (const [key, value] of Object.entries(bodyParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }

  let url = `${baseUrl}${cleanEndpoint}`;
  let options: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
    },
  };

  if (method === 'GET') {
    url = `${url}?${params.toString()}`;
  } else {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    options.body = params.toString();
  }

  const res = await fetch(url, options);

  if (res.status === 403) {
    throw new Error(
      'ResellerClub API returned 403 Forbidden. IP address not whitelisted in ResellerClub Settings -> API.'
    );
  }

  const data = await res.json();
  if (data?.status === 'ERROR') {
    throw new Error(data.message || 'ResellerClub API Error');
  }

  return data as T;
}
