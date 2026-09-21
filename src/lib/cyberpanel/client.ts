/**
 * Core CyberPanel API Client (Session Based)
 */

const CYBERPANEL_URL = process.env.CYBERPANEL_URL?.replace(/\/$/, ""); 
const CYBERPANEL_USERNAME = process.env.CYBERPANEL_USERNAME;
const CYBERPANEL_PASSWORD = process.env.CYBERPANEL_PASSWORD;

type CyberPanelResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Helper to safely extract a cookie value from Set-Cookie header
 */
function extractCookie(cookieString: string | null, cookieName: string): string | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Establish a session and return the headers/cookies needed for API calls
 */
async function getCyberPanelSession(controller: AbortController) {
  if (!CYBERPANEL_URL || !CYBERPANEL_USERNAME || !CYBERPANEL_PASSWORD) {
    throw new Error("Missing credentials");
  }

  // Step 1: Get initial CSRF token
  const initialRes = await fetch(`${CYBERPANEL_URL}/`, {
    method: "GET",
    signal: controller.signal,
  });
  
  const initialCookies = initialRes.headers.get("set-cookie");
  const csrfToken = extractCookie(initialCookies, "csrftoken");

  if (!csrfToken) {
    throw new Error("Failed to obtain CSRF token");
  }

  // Step 2: Login to get session ID
  const loginRes = await fetch(`${CYBERPANEL_URL}/verifyLogin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
      "Referer": `${CYBERPANEL_URL}/`,
      "Origin": CYBERPANEL_URL,
      "Cookie": `csrftoken=${csrfToken}`,
    },
    body: JSON.stringify({
      username: CYBERPANEL_USERNAME,
      password: CYBERPANEL_PASSWORD,
    }),
    signal: controller.signal,
  });

  const loginCookies = loginRes.headers.get("set-cookie");
  const sessionToken = extractCookie(loginCookies, "cyberpanel_sessionid");

  if (!sessionToken) {
    throw new Error("Failed to authenticate session");
  }

  return {
    csrfToken,
    sessionToken,
  };
}

/**
 * Make a secure POST request to CyberPanel with automatic session handling
 */
export async function cyberPanelRequest<T = any>(
  endpoint: string,
  payload: Record<string, any> = {}
): Promise<CyberPanelResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { csrfToken, sessionToken } = await getCyberPanelSession(controller);
    
    const url = `${CYBERPANEL_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
        "Referer": `${CYBERPANEL_URL}/`,
        "Origin": CYBERPANEL_URL as string,
        "Cookie": `csrftoken=${csrfToken}; cyberpanel_sessionid=${sessionToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: "CyberPanel connection failed" };
    }

    const data = await response.json();
    return { success: true, data };
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("[CyberPanel] Network/Fetch Error:", error.message || error);
    // Safe generic error handling without exposing stack traces or credentials
    return { success: false, error: "CyberPanel connection failed" };
  }
}
