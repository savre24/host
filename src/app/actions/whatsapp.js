'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Helper to get WhatsApp settings
async function getWhatsAppSettings() {
  const settings = await prisma.whatsAppSetting.findFirst();
  return settings;
}

/**
 * Creates an instance on Evolution API and returns the QR code.
 */
export async function createWhatsAppInstance(instanceName = 'crm-main') {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

  const settings = await getWhatsAppSettings();
  if (!settings || !settings.serverUrl || !settings.apiKey) {
    return { error: 'WhatsApp settings (Server URL and API Key) are not configured.' };
  }

  try {
    // Check if instance already exists
    let exists = false;
    try {
      const checkRes = await fetch(`${settings.serverUrl}/instance/fetchInstances`, {
        headers: { 'apikey': settings.apiKey }
      });
      const instances = await checkRes.json();
      if (Array.isArray(instances) && instances.find(i => i.instance.instanceName === instanceName)) {
        exists = true;
      }
    } catch (e) {
      console.log('Error checking instances, assuming it does not exist', e);
    }

    if (!exists) {
      // Create new instance
      const createRes = await fetch(`${settings.serverUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.apiKey
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!createRes.ok) {
        return { error: 'Failed to create instance on Evolution API' };
      }
    }

    // Connect / Get QR Code
    const connectRes = await fetch(`${settings.serverUrl}/instance/connect/${instanceName}`, {
      headers: { 'apikey': settings.apiKey }
    });

    const connectData = await connectRes.json();
    return { success: true, data: connectData };
  } catch (error) {
    console.error('Error creating WhatsApp instance:', error);
    return { error: 'Failed to communicate with Evolution API server' };
  }
}

/**
 * Checks the connection status of the instance
 */
export async function checkWhatsAppStatus(instanceName = 'crm-main') {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

  const settings = await getWhatsAppSettings();
  if (!settings || !settings.serverUrl || !settings.apiKey) return { error: 'Not configured' };

  try {
    const res = await fetch(`${settings.serverUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': settings.apiKey }
    });
    const data = await res.json();
    
    // Update local DB status based on connection
    if (data && data.instance && data.instance.state === 'open') {
      await prisma.whatsAppSetting.update({
        where: { id: settings.id },
        data: { isActive: true }
      });
    } else {
      await prisma.whatsAppSetting.update({
        where: { id: settings.id },
        data: { isActive: false }
      });
    }
    
    return { success: true, data };
  } catch (error) {
    return { error: 'Failed to fetch status' };
  }
}

/**
 * Update WhatsApp Settings (Server URL and API Key)
 */
export async function updateWhatsAppSettings(serverUrl, apiKey, templates = null) {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

  try {
    const data = { 
      serverUrl, 
      apiKey,
      ...(templates && {
        templateRenewal: templates.templateRenewal,
        templateNewService: templates.templateNewService,
        templatePaymentReminder: templates.templatePaymentReminder,
        templatePaymentReceived: templates.templatePaymentReceived
      })
    };

    let settings = await prisma.whatsAppSetting.findFirst();
    if (settings) {
      settings = await prisma.whatsAppSetting.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.whatsAppSetting.create({
        data: { ...data, isActive: false }
      });
    }
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { error: 'Failed to save settings' };
  }
}

/**
 * Fetch WhatsApp Settings for admin view
 */
export async function getAdminWhatsAppSettings() {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };
  
  const settings = await getWhatsAppSettings();
  return { success: true, data: settings || { serverUrl: '', apiKey: '', isActive: false } };
}

/**
 * Send a WhatsApp Message
 * Intended to be called internally by other functions (not directly by client UI)
 */
export async function sendWhatsAppMessage(number, message, instanceName = 'crm-main') {
  const settings = await getWhatsAppSettings();
  if (!settings || !settings.isActive || !settings.serverUrl || !settings.apiKey) {
    console.log('WhatsApp messaging skipped: Not configured or inactive');
    return { success: false, error: 'WhatsApp not active' };
  }

  // Format number (strip +, spaces, etc)
  let formattedNumber = number.replace(/\D/g, '');
  if (formattedNumber.length === 10) {
    formattedNumber = '91' + formattedNumber;
  }

  try {
    const res = await fetch(`${settings.serverUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.apiKey
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: { delay: 1200, presence: "composing" },
        text: message
      })
    });

    if (!res.ok) {
      console.error('Failed to send WhatsApp message:', await res.text());
      return { success: false, error: 'API Error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Replace variables in a WhatsApp template string
 */
export async function fillWhatsAppTemplate(template, variables) {
  if (!template) return '';
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}
