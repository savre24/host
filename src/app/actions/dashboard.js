'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function getAdminDashboardStats() {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'STAFF') {
    return { error: 'Unauthorized' };
  }

  try {
    const totalClients = await prisma.clientProfile.count();
    
    const activeServices = await prisma.clientService.count({
      where: { status: 'ACTIVE' }
    });

    const pendingInvoices = await prisma.invoice.aggregate({
      where: { 
        status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } 
      },
      _sum: { total: true }
    });

    const openTickets = await prisma.supportTicket.count({
      where: { status: 'OPEN' }
    });

    return {
      success: true,
      data: {
        totalClients,
        activeServices,
        pendingRevenue: pendingInvoices._sum.total || 0,
        openTickets
      }
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { error: 'Failed to fetch dashboard stats' };
  }
}

export async function getRecentActivities() {
  const session = await getServerSession(options);
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'STAFF') {
    return { error: 'Unauthorized' };
  }

  try {
    const recentTickets = await prisma.supportTicket.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          include: { clientProfile: true }
        }
      }
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true
      }
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        invoice: true
      }
    });

    return {
      success: true,
      data: {
        recentTickets,
        recentInvoices,
        recentPayments
      }
    };
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return { error: 'Failed to fetch recent activities' };
  }
}
