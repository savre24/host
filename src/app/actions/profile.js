'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

export async function getUserProfile() {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    });
    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { error: 'Failed to fetch user profile' };
  }
}

export async function updateUserProfile(data) {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const { name, image, password } = data;
    const updateData = { name, image };

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    });

    revalidatePath('/profile');
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error: 'Failed to update user profile' };
  }
}
