const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    console.log("Starting provisioning test...");

    const serviceId = "cb00d71c-ff51-4088-8018-d35a4c310198";
    const serverName = "CP-01";
    const domain = "cp-test.savredigital.com";
    const pkg = "Default";
    const phpVersion = "PHP 8.4";
    const email = "dummy@savredigital.com";

    // 1. Fetch Server
    const server = await prisma.cyberPanelServer.findFirst({ where: { name: serverName } });
    if (!server) throw new Error(`Server ${serverName} not found`);

    // Decrypt password
    const ALGORITHM = 'aes-256-gcm';
    const key = Buffer.from('92cd28e2fe825736eae4b26fe4f44cf341b295b0f33f5f1f06f06bf26ef55ef8', 'hex');
    const parts = server.passwordEnc.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(parts[0], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[1], 'hex'));
    let password = decipher.update(parts[2], 'hex', 'utf8') + decipher.final('utf8');

    const url = server.url;
    
    // Login
    const initialResponse = await fetch(url + '/', { method: 'GET' });
    const cookies = initialResponse.headers.get('set-cookie');
    const initialCsrfToken = cookies.match(/csrftoken=([^;]+)/)[1];
    
    const loginResponse = await fetch(url + '/verifyLogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `csrftoken=${initialCsrfToken}`,
        'X-CSRFToken': initialCsrfToken,
        'Referer': url + '/'
      },
      body: JSON.stringify({ username: server.username, password })
    });
    
    const loginCookies = loginResponse.headers.get('set-cookie');
    const authSessionId = loginCookies.match(/cyberpanel_sessionid=([^;]+)/)[1];
    const authCookie = `csrftoken=${initialCsrfToken}; cyberpanel_sessionid=${authSessionId}`;

    // Generate Client User Credentials
    const cpUsername = "cptest_" + crypto.randomBytes(4).toString('hex');
    const cpPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + "1@Xz";

    console.log(`1. Creating CyberPanel User: ${cpUsername}...`);
    const createUserPayload = {
      firstName: "Test",
      lastName: "User",
      email: email,
      selectedACL: "user",
      websitesLimit: 0,
      userName: cpUsername,
      password: cpPassword,
      securityLevel: "HIGH"
    };

    const createUserResponse = await fetch(url + '/users/submitUserCreation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRFToken': initialCsrfToken,
        'Referer': url + '/users/createUser'
      },
      body: JSON.stringify(createUserPayload)
    });
    
    const createUserResult = await createUserResponse.json();
    if (createUserResult.status !== 1) {
      throw new Error(`Failed to create user: ${createUserResult.error_message}`);
    }
    console.log("User created successfully!");

    console.log(`2. Creating Website: ${domain}...`);
    const createWebsitePayload = {
      package: pkg,
      domainName: domain,
      adminEmail: email,
      phpSelection: phpVersion,
      ssl: 0,
      websiteOwner: cpUsername,
      dkimCheck: 0,
      openBasedir: 1,
      mailDomain: 0,
      apacheBackend: 0
    };

    const createWebsiteResponse = await fetch(url + '/websites/submitWebsiteCreation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRFToken': initialCsrfToken,
        'Referer': url + '/websites/createWebsite'
      },
      body: JSON.stringify(createWebsitePayload)
    });

    const createWebsiteResult = await createWebsiteResponse.json();
    if (createWebsiteResult.createWebSiteStatus !== 1) {
      throw new Error(`Failed to initiate website creation: ${createWebsiteResult.error_message}`);
    }
    
    const statusFile = createWebsiteResult.tempStatusPath;
    console.log(`Creation initiated. Polling status from ${statusFile}...`);

    let websiteCreated = false;
    for (let i = 0; i < 60; i++) {
      await delay(2000);
      const statusRes = await fetch(url + '/websites/installWordpressStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
          'X-CSRFToken': initialCsrfToken,
          'Referer': url + '/websites/createWebsite'
        },
        body: JSON.stringify({ statusFile })
      });
      const statusText = await statusRes.text();
      // Usually it returns lines of text. We look for success.
      if (statusText.toLowerCase().includes("successfully Installed") || statusText.toLowerCase().includes("successfully")) {
        websiteCreated = true;
        break;
      }
      if (statusText.toLowerCase().includes("error") || statusText.toLowerCase().includes("failed")) {
        throw new Error(`Website creation failed during polling: ${statusText}`);
      }
    }
    
    if (!websiteCreated) {
       console.log("Polling timed out, but proceeding to verify via fetchWebsitesList...");
    } else {
       console.log("Website created successfully (per polling)!");
    }

    console.log("3. Verifying website existence...");
    const fetchRes = await fetch(url + '/websites/fetchWebsitesList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRFToken': initialCsrfToken,
        'Referer': url + '/'
      },
      body: JSON.stringify({ page: 1, recordsToShow: 100 })
    });
    
    const data = await fetchRes.json();
    const websites = JSON.parse(data.data);
    const site = websites.find(w => w.domain === domain);
    
    if (!site) {
      throw new Error("Website not found in fetchWebsitesList after creation.");
    }
    
    if (site.admin !== cpUsername) {
       throw new Error(`Website owner mismatch. Expected: ${cpUsername}, Got: ${site.admin}`);
    }
    if (site.package !== pkg) {
       throw new Error(`Package mismatch. Expected: ${pkg}, Got: ${site.package}`);
    }
    if (site.phpVersion !== phpVersion) {
       throw new Error(`PHP Version mismatch. Expected: ${phpVersion}, Got: ${site.phpVersion}`);
    }
    console.log("Website verification passed!");

    console.log("4. Creating CyberPanelHostingDetail in DB...");
    const detail = await prisma.cyberPanelHostingDetail.create({
      data: {
        clientServiceId: serviceId,
        serverId: server.id,
        domainName: domain,
        username: cpUsername,
        packageName: pkg,
        phpVersion: phpVersion,
        status: site.state,
        sslEnabled: false
      }
    });

    console.log(`Detail Record Created: ${detail.id}`);
    
    // Check linkage
    const linkedService = await prisma.clientService.findUnique({
       where: { id: serviceId },
       include: { cyberPanelDetail: true }
    });
    
    if (!linkedService || !linkedService.cyberPanelDetail || linkedService.cyberPanelDetail.id !== detail.id) {
       throw new Error("Linkage to HostOS service failed.");
    }
    console.log("HostOS linkage verified!");

    console.log("=== Provisioning Flow Complete ===");

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
