'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getTaxSetting } from '@/app/actions/settings';
import { sendWhatsAppMessage, fillWhatsAppTemplate } from '@/app/actions/whatsapp';

/**
 * Creates a new Product/Service in the catalog
 */
export async function createProduct(formData) {
  try {
    const { name, category, description, defaultPrice, renewalPrice, billingCycle, isRenewable, isActive } = formData;

    const newProduct = await prisma.productService.create({
      data: {
        name,
        category,
        description,
        defaultPrice: parseFloat(defaultPrice),
        renewalPrice: renewalPrice ? parseFloat(renewalPrice) : null,
        billingCycle,
        isRenewable: Boolean(isRenewable),
        isActive: Boolean(isActive),
      },
    });

    revalidatePath('/admin/products');
    return { success: true, data: newProduct };
  } catch (error) {
    console.error('Error creating product:', error);
    return { error: 'Failed to create product' };
  }
}

/**
 * Updates an existing Product/Service
 */
export async function updateProduct(id, formData) {
  try {
    const { name, category, description, defaultPrice, renewalPrice, billingCycle, isRenewable, isActive } = formData;

    const updatedProduct = await prisma.productService.update({
      where: { id },
      data: {
        name,
        category,
        description,
        defaultPrice: parseFloat(defaultPrice),
        renewalPrice: renewalPrice ? parseFloat(renewalPrice) : null,
        billingCycle,
        isRenewable: Boolean(isRenewable),
        isActive: Boolean(isActive),
      },
    });

    revalidatePath('/admin/products');
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error('Error updating product:', error);
    return { error: 'Failed to update product' };
  }
}

/**
 * Gets all Products/Services
 */
export async function getProducts(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { category: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    const products = await prisma.productService.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { error: 'Failed to fetch products' };
  }
}

/**
 * Gets a specific Product by ID
 */
export async function getProductById(id) {
  try {
    const product = await prisma.productService.findUnique({
      where: { id },
    });
    if (!product) return { error: 'Product not found' };
    return { success: true, data: product };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { error: 'Failed to fetch product' };
  }
}

/**
 * Deletes a product
 */
export async function deleteProduct(id) {
  try {
    await prisma.productService.delete({
      where: { id },
    });
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product. It may be assigned to clients.' };
  }
}

/**
 * Gets active Products/Services (for assigning to clients)
 */
export async function getActiveProducts() {
  try {
    const products = await prisma.productService.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching active products:', error);
    return { error: 'Failed to fetch active products' };
  }
}

/**
 * Assigns a service to a client
 */
export async function assignServiceToClient(clientProfileId, formData) {
  try {
    const { productId, customName, price, renewalPrice, billingCycle, startDate, expiryDate, notes, autoRenewReminder, status, autoInvoice } = formData;
    const priceFloat = parseFloat(price);
    const renewalPriceFloat = renewalPrice ? parseFloat(renewalPrice) : null;
    const nextDueDateObj = expiryDate ? new Date(expiryDate) : null;

    const profile = await prisma.clientProfile.findUnique({
      where: { id: clientProfileId },
      include: { user: true }
    });

    const newClientService = await prisma.clientService.create({
      data: {
        clientId: clientProfileId,
        productId,
        customName: customName || null,
        price: priceFloat,
        renewalPrice: renewalPriceFloat,
        billingCycle,
        startDate: new Date(startDate),
        expiryDate: nextDueDateObj,
        status: status || 'ACTIVE',
        notes: notes || null,
        autoRenewReminder: Boolean(autoRenewReminder),
      },
      include: {
        product: true
      }
    });

    let invoiceId = null;

    // AUTO INVOICING LOGIC
    if (autoInvoice) {
      if (profile) {
        // Fetch tax settings
        const { data: taxSetting } = await getTaxSetting();
        const taxRate = taxSetting?.isEnabled ? taxSetting.percentage : 0;

        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;
        
        const basePrice = priceFloat;
        const taxAmount = (basePrice * taxRate) / 100;
        const total = basePrice + taxAmount;

        const newInvoice = await prisma.invoice.create({
          data: {
            clientId: profile.id,
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
            notes: `Setup invoice for ${newClientService.product.name}`,
            subtotal: basePrice,
            discount: 0,
            taxAmount,
            total,
            status: 'PENDING', // Pending by default
            items: {
              create: [
                {
                  description: newClientService.customName || newClientService.product.name,
                  quantity: 1,
                  unitPrice: basePrice,
                  discount: 0,
                  taxRate,
                  total
                }
              ]
            }
          }
        });
        invoiceId = newInvoice.id;
      }
    }

    // WhatsApp Notification for New Service
    if (profile?.phone) {
      const waSettings = await prisma.whatsAppSetting.findFirst();
      if (waSettings?.isActive && waSettings?.templateNewService) {
        const message = await fillWhatsAppTemplate(waSettings.templateNewService, {
          CLIENT_NAME: profile.user?.name || profile.companyName || 'Client',
          SERVICE_NAME: newClientService.customName || newClientService.product.name,
          PRICE: priceFloat.toString()
        });
        // We do not await to avoid blocking the response unnecessarily
        sendWhatsAppMessage(profile.phone, message).catch(console.error);
      }
    }

    revalidatePath(`/admin/clients/${clientProfileId}`);
    revalidatePath('/admin/services');
    revalidatePath('/renewals');
    return { success: true, data: newClientService, invoiceId };
  } catch (error) {
    console.error('Error assigning service:', error);
    return { error: 'Failed to assign service' };
  }
}

/**
 * Deletes a client service assignment
 */
export async function deleteClientService(id, clientId) {
  try {
    await prisma.clientService.delete({
      where: { id },
    });
    // We need to revalidate the specific client's page and the master list
    if (clientId) {
      revalidatePath(`/admin/clients/${clientId}`);
    }
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client service:', error);
    return { error: 'Failed to delete assigned service' };
  }
}

/**
 * Gets all client services (assigned subscriptions) across all clients
 */
export async function getAllClientServices(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { customName: { contains: searchQuery, mode: 'insensitive' } },
        { client: { companyName: { contains: searchQuery, mode: 'insensitive' } } },
        { client: { user: { name: { contains: searchQuery, mode: 'insensitive' } } } },
        { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ];
    }
    
    const services = await prisma.clientService.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: true,
          }
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: services };
  } catch (error) {
    console.error('Error fetching all client services:', error);
    return { error: 'Failed to fetch all client services' };
  }
}

/**
 * Gets a specific client service assignment by ID
 */
export async function getClientServiceById(id) {
  try {
    const service = await prisma.clientService.findUnique({
      where: { id },
      include: {
        product: true,
        domainDetail: true,
        client: {
          include: { user: true }
        }
      }
    });
    if (!service) return { error: 'Client service not found' };
    return { success: true, data: service };
  } catch (error) {
    console.error('Error fetching client service:', error);
    return { error: 'Failed to fetch client service' };
  }
}

/**
 * Updates a client service assignment
 */
export async function updateClientService(id, formData) {
  try {
    const { customName, price, renewalPrice, billingCycle, startDate, expiryDate, status, notes, autoRenewReminder, dnsNameservers, domainOwnership } = formData;
    
    const updateData = {
      customName,
      price: parseFloat(price),
      renewalPrice: renewalPrice ? parseFloat(renewalPrice) : null,
      billingCycle,
      startDate: new Date(startDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status,
      notes,
      autoRenewReminder: Boolean(autoRenewReminder),
    };

    if (dnsNameservers !== undefined || domainOwnership !== undefined) {
      updateData.domainDetail = {
        upsert: {
          create: {
            dnsNameservers: dnsNameservers || '',
            domainOwnership: domainOwnership || ''
          },
          update: {
            dnsNameservers: dnsNameservers || '',
            domainOwnership: domainOwnership || ''
          }
        }
      };
    }

    const updatedService = await prisma.clientService.update({
      where: { id },
      data: updateData,
      include: { client: true }
    });

    revalidatePath(`/admin/clients/${updatedService.client.userId}`);
    revalidatePath('/admin/services');
    return { success: true, data: updatedService };
  } catch (error) {
    console.error('Error updating client service:', error);
    return { error: 'Failed to update assigned service' };
  }
}

/**
 * Gets services that are expiring within a certain number of days, or already expired.
 * Ordered by most urgent (oldest expiry date) first.
 */
export async function getUpcomingRenewals(days = 30) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const services = await prisma.clientService.findMany({
      where: {
        expiryDate: {
          lte: futureDate
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        client: {
          include: { user: true }
        },
        product: true
      },
      orderBy: { expiryDate: 'asc' }
    });
    return { success: true, data: services };
  } catch (error) {
    console.error('Error fetching renewals:', error);
    return { error: 'Failed to fetch renewals' };
  }
}

/**
 * Pushes the expiry date of a service forward based on its billing cycle
 */
export async function processRenewal(id) {
  try {
    const service = await prisma.clientService.findUnique({ where: { id } });
    if (!service) return { error: 'Service not found' };
    if (!service.expiryDate) return { error: 'Service has no expiry date' };

    let newExpiry = new Date(service.expiryDate);
    
    // If the service is already deeply expired, we might want to renew from NOW instead of the old date.
    // But for strict billing, usually you renew from the old expiry date. We will stick to old expiry date.
    switch(service.billingCycle) {
      case 'MONTHLY': newExpiry.setMonth(newExpiry.getMonth() + 1); break;
      case 'QUARTERLY': newExpiry.setMonth(newExpiry.getMonth() + 3); break;
      case 'HALF_YEARLY': newExpiry.setMonth(newExpiry.getMonth() + 6); break;
      case 'YEARLY': newExpiry.setFullYear(newExpiry.getFullYear() + 1); break;
      case 'ONE_TIME': return { error: 'Cannot renew a one-time service' };
      default: return { error: 'Please manually update the expiry date for custom billing cycles.' };
    }

    const updated = await prisma.clientService.update({
      where: { id },
      data: { 
        expiryDate: newExpiry, 
        status: 'ACTIVE' 
      },
      include: { client: true }
    });

    revalidatePath('/renewals');
    revalidatePath('/services');
    revalidatePath(`/clients/${updated.client.userId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error processing renewal:', error);
    return { error: 'Failed to process renewal' };
  }
}
