'use server';

import prisma from '@/lib/prisma';

export async function getReceivedPaymentsReport(startDate, endDate) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: 'COMPLETED'
      },
      include: {
        invoice: {
          include: {
            client: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return { success: true, data: payments, totalAmount };
  } catch (error) {
    console.error('Error fetching received payments report:', error);
    return { error: 'Failed to fetch received payments report' };
  }
}

export async function getPendingInvoicesReport(startDate, endDate) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] }
      },
      include: {
        client: {
          include: { user: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return { success: true, data: invoices, totalAmount };
  } catch (error) {
    console.error('Error fetching pending invoices report:', error);
    return { error: 'Failed to fetch pending invoices report' };
  }
}

export async function getUpcomingRenewalsReport(startDate, endDate) {
  try {
    const renewals = await prisma.clientService.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        expiryDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      },
      include: {
        product: true,
        client: {
          include: { user: true }
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    const totalAmount = renewals.reduce((sum, r) => sum + r.price, 0);

    return { success: true, data: renewals, totalAmount };
  } catch (error) {
    console.error('Error fetching renewals report:', error);
    return { error: 'Failed to fetch renewals report' };
  }
}
