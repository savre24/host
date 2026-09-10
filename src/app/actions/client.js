'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new Client (User + ClientProfile)
 */
export async function createClient(formData) {
  try {
    const { email, password, name, companyName, phone, address, notes } = formData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'CLIENT',
        clientProfile: {
          create: {
            companyName,
            phone,
            address,
            notes,
            loginStatus: true,
          },
        },
      },
      include: {
        clientProfile: true,
      },
    });

    revalidatePath('/admin/clients'); // Assuming the list is here
    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error creating client:', error);
    return { error: 'Failed to create client' };
  }
}

/**
 * Updates an existing client
 */
export async function updateClient(userId, formData) {
  try {
    const { name, companyName, phone, address, notes, loginStatus, password } = formData;

    const updateData = {
      name,
      clientProfile: {
        update: {
          companyName,
          phone,
          address,
          notes,
          loginStatus,
        },
      },
    };

    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedClient = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        clientProfile: true,
      },
    });

    revalidatePath('/admin/clients');
    revalidatePath(`/admin/clients/${userId}`);
    return { success: true, data: updatedClient };
  } catch (error) {
    console.error('Error updating client:', error);
    return { error: 'Failed to update client' };
  }
}

/**
 * Gets all clients with optional search query
 */
export async function getClients(searchQuery = '') {
  try {
    const whereClause = { role: 'CLIENT' };
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { email: { contains: searchQuery } },
        { clientProfile: { companyName: { contains: searchQuery } } },
      ];
    }

    const clients = await prisma.user.findMany({
      where: whereClause,
      include: {
        clientProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: clients };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { error: 'Failed to fetch clients' };
  }
}

/**
 * Gets a specific client by ID
 */
export async function getClientById(userId) {
  try {
    const client = await prisma.user.findUnique({
      where: { id: userId, role: 'CLIENT' },
      include: {
        clientProfile: {
          include: {
            services: {
              include: {
                product: true,
              },
            },
            quotations: true,
            invoices: {
              include: {
                items: true
              }
            },
            payments: true,
          },
        },
        supportTickets: true,
      },
    });

    if (!client) {
      return { error: 'Client not found' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Error fetching client details:', error);
    return { error: 'Failed to fetch client details' };
  }
}

/**
 * Soft deletes or disables a client (just toggles loginStatus for now as deleting can break references)
 */
export async function disableClient(userId) {
  try {
    await prisma.clientProfile.update({
      where: { userId },
      data: { loginStatus: false },
    });
    
    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Error disabling client:', error);
    return { error: 'Failed to disable client' };
  }
}

/**
 * Deletes a client and their profile (cascade delete handles related records if configured in schema)
 */
export async function deleteClient(id) {
  try {
    // Delete the user record (which cascades to ClientProfile)
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { error: 'Failed to delete client' };
  }
}

/**
 * Gets all services assigned to a client
 */
export async function getClientServices(clientId) {
  try {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId: clientId },
      select: { id: true }
    });

    if (!profile) return { error: 'Client profile not found' };

    const services = await prisma.clientService.findMany({
      where: { clientId: profile.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: services };
  } catch (error) {
    console.error('Error fetching client services:', error);
    return { error: 'Failed to fetch client services' };
  }
}
