const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const settings = await prisma.whatsAppSetting.findFirst();
  console.log('Settings:', settings);
  if (!settings) return console.log('No settings found');

  try {
    const createRes = await fetch(`${settings.serverUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.apiKey
      },
      body: JSON.stringify({
        instanceName: 'crm-main-test',
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    console.log('Create Status:', createRes.status);
    const text = await createRes.text();
    console.log('Create Response:', text);
  } catch (e) {
    console.error('Exception:', e);
  }
  await prisma.$disconnect();
}
test();
