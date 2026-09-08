'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

/**
 * Gets the current user's unread notifications, up to a limit (default 10).
 */
export async function getUserNotifications(limit = 10) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', data: [] };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { error: 'Failed to fetch notifications', data: [] };
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(id) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== session.user.id) {
      return { error: 'Notification not found or unauthorized' };
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: 'Failed to mark notification as read' };
  }
}

/**
 * Marks all notifications for the current user as read.
 */
export async function markAllAsRead() {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error: 'Failed to mark notifications as read' };
  }
}

/**
 * Deletes a specific notification (used for dismissing permanently).
 */
export async function deleteNotification(id) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== session.user.id) {
      return { error: 'Notification not found or unauthorized' };
    }

    await prisma.notification.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { error: 'Failed to delete notification' };
  }
}

/**
 * Helper to create a single notification for a specific user.
 */
export async function createNotification(data) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        icon: data.icon || 'tabler:bell',
        variant: data.variant || 'primary',
        link: data.link
      }
    });
    return { success: true, data: notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { error: 'Failed to create notification' };
  }
}

/**
 * Notifies all admins (or specific users with role ADMIN).
 */
export async function notifyAdmins(data) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length === 0) return { success: false, error: 'No admins found' };

    const notifications = admins.map(admin => ({
      userId: admin.id,
      title: data.title,
      message: data.message,
      icon: data.icon || 'tabler:bell',
      variant: data.variant || 'primary',
      link: data.link
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    return { success: true };
  } catch (error) {
    console.error('Error notifying admins:', error);
    return { error: 'Failed to notify admins' };
  }
}
