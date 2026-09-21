export interface CyberPanelServerConfig {
  url: string;
  username: string;
  password: string; // The decrypted plaintext password, existing only in memory
}

export interface CyberPanelResponse<T = any> {
  error_message: string | null;
  [key: string]: any;
}

export async function cyberPanelRequest<T = any>(
  endpoint: string, 
  payload: any = {}, 
  server: CyberPanelServerConfig
): Promise<CyberPanelResponse<T>> {
  const url = server.url;
  const username = server.username;
  const password = server.password;
  
  if (!url || !username || !password) {
    throw new Error('Incomplete CyberPanel Server configuration. Check URL, Username, and Password.');
  }

  // Ensure endpoint starts with slash
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  const isApiKey = password.startsWith('Basic cp_api_') || password.startsWith('cp_api_');
  const actualApiKey = password.startsWith('Basic ') ? password : (password.startsWith('cp_api_') ? `Basic ${password}` : null);

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let initialCsrfToken = '';
  let authSessionId = '';

  if (actualApiKey) {
    // Modern API Key approach
    headers['Authorization'] = actualApiKey;
  } else {
    // Legacy CSRF/Session approach
    const initialResponse = await fetch(`${url}/`, { method: 'GET' });
    const cookies = initialResponse.headers.get('set-cookie');
    if (!cookies) throw new Error('Failed to retrieve initial cookies from CyberPanel');
    
    const csrfMatch = cookies.match(/csrftoken=([^;]+)/);
    const sessionMatch = cookies.match(/cyberpanel_sessionid=([^;]+)/);
    if (!csrfMatch) throw new Error('Failed to parse CSRF token from initial response');
    
    initialCsrfToken = csrfMatch[1];
    const initialSessionId = sessionMatch ? sessionMatch[1] : '';

    const loginPayload = { username, password };
    const initialCookies = [`csrftoken=${initialCsrfToken}`];
    if (initialSessionId) initialCookies.push(`cyberpanel_sessionid=${initialSessionId}`);

    const loginResponse = await fetch(`${url}/verifyLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': initialCookies.join('; '),
        'X-CSRFToken': initialCsrfToken,
        'Referer': `${url}/`,
      },
      body: JSON.stringify(loginPayload),
    });

    const loginCookies = loginResponse.headers.get('set-cookie');
    if (!loginCookies) throw new Error('Failed to retrieve authenticated cookies from CyberPanel');
    
    const authSessionMatch = loginCookies.match(/cyberpanel_sessionid=([^;]+)/);
    if (!authSessionMatch) throw new Error('Failed to parse authenticated Session ID');
    
    authSessionId = authSessionMatch[1];
    
    headers['Cookie'] = `csrftoken=${initialCsrfToken}; cyberpanel_sessionid=${authSessionId}`;
    headers['X-CSRFToken'] = initialCsrfToken;
    headers['Referer'] = `${url}/`;
  }

  // 3. Make the Actual API Request
  const apiPayload = { 
    adminUser: username,
    ...(actualApiKey ? {} : { adminPass: password }),
    ...payload 
  };

  const apiResponse = await fetch(`${url}${endpoint}`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(apiPayload),
  });

  if (!apiResponse.ok) {
    throw new Error(`CyberPanel API Request failed: ${apiResponse.statusText}`);
  }

  const responseText = await apiResponse.text();
  try {
    const json = JSON.parse(responseText);
    // Standardize error handling internally
    if (json.error_message === "None") {
      json.error_message = null; 
    }
    return json;
  } catch (err) {
    // Return raw text if not JSON
    return { error_message: null, raw: responseText } as any;
  }
}
