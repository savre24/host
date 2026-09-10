'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get all quotations with pagination/search
 */
export async function getQuotations(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { quoteNumber: { contains: searchQuery } },
        { client: { user: { name: { contains: searchQuery } } } },
        { client: { companyName: { contains: searchQuery } } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        client: {
          include: { user: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: quotations };
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return { error: 'Failed to fetch quotations' };
  }
}

/**
 * Get a specific quotation by ID
 */
export async function getQuotationById(id) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: {
          include: { user: true }
        },
        items: true,
      },
    });

    if (!quotation) {
      return { error: 'Quotation not found' };
    }

    return { success: true, data: quotation };
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return { error: 'Failed to fetch quotation' };
  }
}

/**
 * Create a new quotation
 */
export async function createQuotation(data, items) {
  try {
    const { clientId, quoteNumber, date, validUntil, notes, terms, subtotal, discount, taxAmount, total, status } = data;

    const newQuotation = await prisma.quotation.create({
      data: {
        clientId,
        quoteNumber,
        date: new Date(date),
        validUntil: new Date(validUntil),
        notes: notes || null,
        terms: terms || null,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount || 0),
        taxAmount: parseFloat(taxAmount || 0),
        total: parseFloat(total),
        status: status || 'DRAFT',
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity, 10),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || 0),
            taxRate: parseFloat(item.taxRate || 0),
            total: parseFloat(item.total)
          }))
        }
      }
    });

    revalidatePath('/quotations');
    return { success: true, data: newQuotation };
  } catch (error) {
    console.error('Error creating quotation:', error);
    if (error.code === 'P2002') {
      return { error: 'Quotation number must be unique.' };
    }
    return { error: 'Failed to create quotation' };
  }
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(id, status) {
  try {
    await prisma.quotation.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/quotations');
    revalidatePath(`/quotations/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return { error: 'Failed to update status' };
  }
}

/**
 * Delete a quotation
 */
export async function deleteQuotation(id) {
  try {
    await prisma.quotation.delete({
      where: { id }
    });
    revalidatePath('/quotations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return { error: 'Failed to delete quotation' };
  }
}

/**
 * Convert Quotation to Invoice
 */
export async function convertToInvoice(id) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!quotation) return { error: 'Quotation not found' };

    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;

    const newInvoice = await prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          clientId: quotation.clientId,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          notes: quotation.notes,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          taxAmount: quotation.taxAmount,
          total: quotation.total,
          status: 'DRAFT',
          items: {
            create: quotation.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              total: item.total
            }))
          }
        }
      });

      // Mark quote as converted
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' }
      });

      return invoice;
    });

    revalidatePath('/quotations');
    revalidatePath('/invoices');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error converting quotation:', error);
    return { error: 'Failed to convert quotation to invoice' };
  }
}
