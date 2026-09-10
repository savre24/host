'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notifyAdmins, createNotification } from './notifications';
import { sendWhatsAppMessage } from './whatsapp';
import { getBusinessSetting } from './settings';

/**
 * Get all support tickets
 */
export async function getTickets(searchQuery = '', statusFilter = '') {
  try {
    const whereClause = {};
    
    if (searchQuery) {
      whereClause.OR = [
        { subject: { contains: searchQuery } },
        { client: { name: { contains: searchQuery } } },
      ];
    }
    
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        client: {
          include: { clientProfile: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { success: true, data: tickets };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { error: 'Failed to fetch tickets' };
  }
}

/**
 * Get a specific ticket by ID, including messages
 */
export async function getTicketById(id) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        client: {
          include: { clientProfile: true }
        },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) return { error: 'Ticket not found' };

    return { success: true, data: ticket };
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return { error: 'Failed to fetch ticket' };
  }
}

/**
 * Reply to a support ticket
 */
export async function replyToTicket(ticketId, senderId, message, attachment = null) {
  try {
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        message,
        attachment
      }
    });

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const isAdmin = sender?.role === 'ADMIN';

    // Update ticket's updatedAt timestamp and status
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { 
        updatedAt: new Date(),
        status: isAdmin ? 'WAITING_FOR_CLIENT' : 'OPEN' 
      },
      include: {
        client: { include: { clientProfile: true } }
      }
    });

    if (isAdmin) {
      // Notify the client that admin replied
      await createNotification({
        userId: ticket.clientId,
        title: 'New Reply to your Ticket',
        message: `Support replied to: ${ticket.subject}`,
        icon: 'tabler:message',
        variant: 'info',
        link: `/client/support/${ticket.id}`
      });

      const clientProfile = ticket.client?.clientProfile;
      if (clientProfile?.phone) {
        const clientMessage = `👋 *New Reply on your Ticket*\n\n*Subject:* ${ticket.subject}\n*Reply:* ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}\n\nPlease check your client portal for details.`;
        await sendWhatsAppMessage(clientProfile.phone, clientMessage);
      }
    } else {
      // Notify the admins that client replied
      await notifyAdmins({
        title: 'New Reply from Client',
        message: `${sender?.name || 'A client'} replied to: ${ticket.subject}`,
        icon: 'tabler:message',
        variant: 'info',
        link: `/support/${ticket.id}`
      });

      const businessSetting = await getBusinessSetting();
      if (businessSetting?.data?.phone) {
        const adminMessage = `📩 *New Client Reply*\n\n*Ticket:* ${ticket.subject}\n*Client:* ${sender?.name || 'A client'}\n*Reply:* ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
        await sendWhatsAppMessage(businessSetting.data.phone, adminMessage);
      }
    }

    revalidatePath(`/support/${ticketId}`);
    return { success: true, data: newMessage };
  } catch (error) {
    console.error('Error replying to ticket:', error);
    return { error: 'Failed to send reply' };
  }
}

/**
 * Change Ticket Status
 */
export async function updateTicketStatus(id, status) {
  try {
    await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });
    
    revalidatePath('/support');
    revalidatePath(`/support/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return { error: 'Failed to update ticket status' };
  }
}
