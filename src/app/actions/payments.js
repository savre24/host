'use server';

import prisma from '@/lib/prisma';

/**
 * Get all payments with optional search
 */
export async function getPayments(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { paymentReference: { contains: searchQuery } },
        { client: { user: { name: { contains: searchQuery } } } },
        { invoice: { invoiceNumber: { contains: searchQuery } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        client: {
          include: { user: true }
        },
        invoice: true
      },
      orderBy: { paymentDate: 'desc' },
    });
    
    return { success: true, data: payments };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { error: 'Failed to fetch payments' };
  }
}
