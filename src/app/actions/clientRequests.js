'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { notifyAdmins } from './notifications';

/**
 * Creates a support ticket for a specific domain action (Transfer or DNS Update).
 */
export async function requestDomainAction(serviceId, actionType, details) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const service = await prisma.clientService.findUnique({
      where: { id: serviceId },
      include: { product: true }
    });

    if (!service) {
      return { error: 'Service not found' };
    }

    if (service.clientId !== session.user.id && session.user.role !== 'ADMIN') {
      // Validate that this service belongs to the logged in user or they are admin
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      });
      
      if (!clientProfile || service.clientId !== clientProfile.id) {
        return { error: 'Unauthorized to modify this service' };
      }
    }

    const domainName = service.customName || service.product?.name;
    const subject = actionType === 'TRANSFER' 
      ? `Domain Transfer Request: ${domainName}`
      : `DNS Update Request: ${domainName}`;

    const formattedMessage = `**${subject}**\n\nClient has requested a ${actionType === 'TRANSFER' ? 'domain transfer' : 'DNS update'}.\n\n**Additional Details provided by client:**\n${details}`;

    // Create the support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        clientId: session.user.id,
        clientServiceId: service.id,
        category: 'DOMAIN',
        subject: subject,
        priority: 'HIGH',
        status: 'OPEN',
        messages: {
          create: {
            senderId: session.user.id,
            message: formattedMessage
          }
        }
      }
    });

    await notifyAdmins({
      title: 'Domain Action Request',
      message: `${session.user?.name || 'A client'} requested a ${actionType} for ${domainName}`,
      icon: 'tabler:world',
      variant: 'warning',
      link: `/support/${ticket.id}`
    });

    return { success: true, data: ticket };
  } catch (error) {
    console.error('Error submitting domain action request:', error);
    return { error: 'Failed to submit request' };
  }
}

/**
 * Updates the domain details directly from the client side and notifies the admin.
 */
export async function updateDomainDetail(serviceId, dnsNameservers, domainOwnership) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const service = await prisma.clientService.findUnique({
      where: { id: serviceId },
      include: { product: true, domainDetail: true }
    });

    if (!service) {
      return { error: 'Service not found' };
    }

    if (service.clientId !== session.user.id && session.user.role !== 'ADMIN') {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      });
      if (!clientProfile || service.clientId !== clientProfile.id) {
        return { error: 'Unauthorized to modify this service' };
      }
    }

    const oldDns = service.domainDetail?.dnsNameservers || 'None';
    const oldOwnership = service.domainDetail?.domainOwnership || 'None';

    // Update the domain details
    await prisma.domainDetail.upsert({
      where: { clientServiceId: serviceId },
      create: {
        clientServiceId: serviceId,
        dnsNameservers,
        domainOwnership
      },
      update: {
        dnsNameservers,
        domainOwnership
      }
    });

    // Create a support ticket to notify the admin about the change
    const domainName = service.customName || service.product?.name;
    const formattedMessage = `**Automated Notification: Domain Details Updated**

The client has updated the Domain Information for **${domainName}**.

**Previous DNS / Nameservers:**
${oldDns}
**New DNS / Nameservers:**
${dnsNameservers}

**Previous Ownership Details:**
${oldOwnership}
**New Ownership Details:**
${domainOwnership}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        clientId: session.user.id,
        clientServiceId: service.id,
        category: 'DOMAIN',
        subject: `Automated: Domain Info Updated for ${domainName}`,
        priority: 'NORMAL',
        status: 'OPEN',
        messages: {
          create: {
            senderId: session.user.id,
            message: formattedMessage
          }
        }
      }
    });

    await notifyAdmins({
      title: 'Domain Info Updated',
      message: `${session.user?.name || 'A client'} updated domain details for ${domainName}`,
      icon: 'tabler:settings',
      variant: 'info',
      link: `/support/${ticket.id}`
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating domain details:', error);
    return { error: 'Failed to update domain details' };
  }
}
