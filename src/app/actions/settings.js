'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Gets the global Tax Setting, creating a default one if it doesn't exist
 */
export async function getTaxSetting() {
  try {
    let setting = await prisma.taxSetting.findFirst();
    
    if (!setting) {
      setting = await prisma.taxSetting.create({
        data: {
          isEnabled: true,
          taxName: 'GST',
          percentage: 18.0,
        }
      });
    }
    
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error fetching tax setting:', error);
    return { error: 'Failed to fetch tax settings' };
  }
}

/**
 * Updates the global Tax Setting
 */
export async function updateTaxSetting(data) {
  try {
    const { isEnabled, percentage, taxName } = data;
    
    let setting = await prisma.taxSetting.findFirst();
    
    const parsedPercentage = percentage !== undefined ? parseFloat(percentage) : (setting?.percentage || 0);
    const finalTaxName = taxName !== undefined ? taxName : (setting?.taxName || 'GST');

    if (setting) {
      setting = await prisma.taxSetting.update({
        where: { id: setting.id },
        data: { isEnabled, percentage: parsedPercentage, taxName: finalTaxName }
      });
    } else {
      setting = await prisma.taxSetting.create({
        data: { isEnabled, percentage: parsedPercentage, taxName: finalTaxName }
      });
    }

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error updating tax settings:', error);
    return { error: 'Failed to update tax settings' };
  }
}

export async function getBusinessSetting() {
  try {
    let setting = await prisma.businessSetting.findFirst();
    if (!setting) {
      setting = await prisma.businessSetting.create({
        data: {}
      });
    }
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return { error: 'Failed to fetch business settings' };
  }
}

export async function updateBusinessSetting(data) {
  try {
    const { companyName, address, phone, email, gstNumber, logoUrl, iconUrl } = data;
    let setting = await prisma.businessSetting.findFirst();
    
    if (setting) {
      setting = await prisma.businessSetting.update({
        where: { id: setting.id },
        data: { companyName, address, phone, email, gstNumber, logoUrl, iconUrl }
      });
    } else {
      setting = await prisma.businessSetting.create({
        data: { companyName, address, phone, email, gstNumber, logoUrl, iconUrl }
      });
    }
    
    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error updating business settings:', error);
    return { error: 'Failed to update business settings' };
  }
}

export async function getPaymentGatewaySetting() {
  try {
    let setting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE' }
    });
    if (!setting) {
      setting = await prisma.paymentGatewaySetting.create({
        data: { provider: 'CASHFREE' }
      });
    }
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error fetching payment gateway settings:', error);
    return { error: 'Failed to fetch payment gateway settings' };
  }
}

export async function updatePaymentGatewaySetting(data) {
  try {
    const { appId, secretKey, environment, isActive } = data;
    let setting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE' }
    });
    
    if (setting) {
      setting = await prisma.paymentGatewaySetting.update({
        where: { id: setting.id },
        data: { appId, secretKey, environment, isActive }
      });
    } else {
      setting = await prisma.paymentGatewaySetting.create({
        data: { provider: 'CASHFREE', appId, secretKey, environment, isActive }
      });
    }
    
    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Error updating payment gateway settings:', error);
    return { error: 'Failed to update payment gateway settings' };
  }
}
