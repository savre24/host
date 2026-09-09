'use server';

import prisma from '@/lib/prisma';
import { notifyAdmins } from './notifications';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppMessage } from './whatsapp';
import { getBusinessSetting } from './settings';

async function getClientProfileByUserId(userId) {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId }
  });
  return profile;
}

export async function getClientDashboardStats(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const activeServices = await prisma.clientService.count({
      where: { clientId: profile.id, status: 'ACTIVE' }
    });

    const pendingInvoices = await prisma.invoice.aggregate({
      where: { clientId: profile.id, status: 'PENDING' },
      _sum: { total: true }
    });

    const openTickets = await prisma.supportTicket.count({
      where: { clientId: userId, status: 'OPEN' }
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const latestInvoice = await prisma.invoice.findFirst({
      where: { clientId: profile.id, status: { not: 'DRAFT' } },
      orderBy: { invoiceDate: 'desc' },
      take: 1
    });

    const pendingInvoicesList = await prisma.invoice.findMany({
      where: { clientId: profile.id, status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    const upcomingRenewals = await prisma.clientService.findMany({
      where: { 
        clientId: profile.id, 
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        expiryDate: { lte: thirtyDaysFromNow, not: null }
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
      take: 5
    });

    return {
      success: true,
      data: {
        activeServices,
        pendingBalance: pendingInvoices._sum.total || 0,
        openTickets,
        latestInvoice,
        pendingInvoicesList,
        upcomingRenewals
      }
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return { error: 'Failed to fetch dashboard stats' };
  }
}

export async function getClientServices(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const services = await prisma.clientService.findMany({
      where: { clientId: profile.id },
      include: { product: true },
      orderBy: { startDate: 'desc' }
    });

    return { success: true, data: services };
  } catch (error) {
    return { error: 'Failed to fetch services' };
  }
}

export async function getClientInvoices(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const invoices = await prisma.invoice.findMany({
      where: { 
        clientId: profile.id,
        status: { not: 'DRAFT' }
      },
      orderBy: { invoiceDate: 'desc' }
    });

    return { success: true, data: invoices };
  } catch (error) {
    return { error: 'Failed to fetch invoices' };
  }
}

export async function getClientQuotations(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const quotations = await prisma.quotation.findMany({
      where: { clientId: profile.id },
      orderBy: { date: 'desc' }
    });

    return { success: true, data: quotations };
  } catch (error) {
    return { error: 'Failed to fetch quotations' };
  }
}

export async function getClientPayments(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const payments = await prisma.payment.findMany({
      where: { clientId: profile.id },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' }
    });

    return { success: true, data: payments };
  } catch (error) {
    return { error: 'Failed to fetch payments' };
  }
}

// Support tickets use userId directly
export async function getClientTickets(userId) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { clientId: userId },
      orderBy: { updatedAt: 'desc' }
    });

    return { success: true, data: tickets };
  } catch (error) {
    return { error: 'Failed to fetch tickets' };
  }
}

export async function createClientTicket(userId, data) {
  try {
    const { subject, category, priority, message, clientServiceId } = data;
    
    const newTicket = await prisma.supportTicket.create({
      data: {
        clientId: userId,
        clientServiceId: clientServiceId || null,
        subject,
        category,
        priority: priority || 'NORMAL',
        status: 'OPEN',
        messages: {
          create: {
            senderId: userId,
            message: message
          }
        }
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await notifyAdmins({
      title: 'New Support Ticket',
      message: `${user?.name || 'A client'} opened a new ticket: ${subject}`,
      icon: 'tabler:headset',
      variant: 'primary',
      link: `/support/${newTicket.id}`
    });

    const businessSetting = await getBusinessSetting();
    if (businessSetting?.data?.phone) {
      const adminMessage = `🚨 *New Support Ticket*\n\n*Subject:* ${subject}\n*Client:* ${user?.name || 'A client'}\n*Priority:* ${priority || 'NORMAL'}\n\nPlease check the admin dashboard.`;
      await sendWhatsAppMessage(businessSetting.data.phone, adminMessage);
    }

    revalidatePath('/client/support');
    return { success: true, data: newTicket };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { error: 'Failed to create ticket' };
  }
}

export async function getClientRenewals(userId) {
  try {
    const profile = await getClientProfileByUserId(userId);
    if (!profile) return { error: 'Client profile not found' };

    const renewals = await prisma.renewal.findMany({
      where: { 
        clientService: {
          clientId: profile.id
        }
      },
      include: { 
        clientService: {
          include: {
            product: true
          }
        },
        invoice: true
      },
      orderBy: { renewalDate: 'asc' }
    });

    return { success: true, data: renewals };
  } catch (error) {
    return { error: 'Failed to fetch renewals' };
  }
}
