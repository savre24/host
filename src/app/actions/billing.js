'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getTaxSetting } from '@/app/actions/settings';
import { sendWhatsAppMessage, fillWhatsAppTemplate } from '@/app/actions/whatsapp';
import prisma from '@/lib/prisma';

/**
 * Get all invoices with pagination/search
 */
export async function getInvoices(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { invoiceNumber: { contains: searchQuery } },
        { client: { companyName: { contains: searchQuery } } },
        { client: { user: { name: { contains: searchQuery } } } },
      ];
    }
    
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          include: { user: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { error: 'Failed to fetch invoices' };
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(id) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          include: { user: true }
        },
        items: true,
        payments: true,
        renewal: {
          include: {
            clientService: {
              include: { product: true }
            }
          }
        }
      }
    });
    if (!invoice) return { error: 'Invoice not found' };
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return { error: 'Failed to fetch invoice' };
  }
}

/**
 * Create a new Invoice with Items
 */
export async function createInvoice(formData, items) {
  try {
    const { clientId, invoiceNumber, invoiceDate, dueDate, notes, subtotal, discount, taxAmount, onlinePaymentCharge, total, status } = formData;
    
    // Ensure invoice number is unique
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existing) {
      return { error: 'An invoice with this number already exists.' };
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        notes,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount),
        taxAmount: parseFloat(taxAmount),
        onlinePaymentCharge: onlinePaymentCharge ? parseFloat(onlinePaymentCharge) : 0,
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
      },
      include: {
        client: { include: { user: true } }
      }
    });

    // Send WhatsApp Notification for Payment Reminder / Invoice
    if (newInvoice.client?.phone) {
      const waSettings = await prisma.whatsAppSetting.findFirst();
      if (waSettings?.isActive && waSettings?.templatePaymentReminder) {
        const message = await fillWhatsAppTemplate(waSettings.templatePaymentReminder, {
          CLIENT_NAME: newInvoice.client.user?.name || newInvoice.client.companyName || 'Client',
          INVOICE_NUMBER: newInvoice.invoiceNumber,
          AMOUNT: newInvoice.total.toString(),
          DUE_DATE: new Date(newInvoice.dueDate).toLocaleDateString()
        });
        sendWhatsAppMessage(newInvoice.client.phone, message).catch(console.error);
      }
    }

    revalidatePath('/invoices');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { error: 'Failed to create invoice' };
  }
}

/**
 * Update an existing Invoice with Items
 */
export async function updateInvoice(invoiceId, formData, items) {
  try {
    const { clientId, invoiceNumber, invoiceDate, dueDate, notes, subtotal, discount, taxAmount, onlinePaymentCharge, total, status } = formData;
    
    // Check if invoice number is taken by another invoice
    const existing = await prisma.invoice.findFirst({ 
      where: { 
        invoiceNumber,
        NOT: { id: invoiceId }
      } 
    });
    
    if (existing) {
      return { error: 'Another invoice with this number already exists.' };
    }

    // Delete existing items first
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId }
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        notes,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount),
        taxAmount: parseFloat(taxAmount),
        onlinePaymentCharge: onlinePaymentCharge ? parseFloat(onlinePaymentCharge) : 0,
        total: parseFloat(total),
        status: status,
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
      },
      include: {
        client: { include: { user: true } }
      }
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return { error: 'Failed to update invoice' };
  }
}

/**
 * Update Invoice Status
 */
export async function updateInvoiceStatus(id, status) {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { error: 'Failed to update invoice status' };
  }
}

/**
 * Delete an Invoice
 */
export async function deleteInvoice(id) {
  try {
    // Due to onDelete: Cascade on items, the items will be deleted automatically
    await prisma.invoice.delete({
      where: { id }
    });
    revalidatePath('/invoices');
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { error: 'Failed to delete invoice' };
  }
}

/**
 * Record a Payment for an Invoice
 */
export async function recordPayment(invoiceId, formData) {
  try {
    const { amount, paymentMethod, paymentReference, paymentDate } = formData;
    
    // Get the invoice to verify totals
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, client: { include: { user: true } } }
    });
    
    if (!invoice) return { error: 'Invoice not found' };

    const paymentAmount = parseFloat(amount);
    
    // Create the payment record
    await prisma.payment.create({
      data: {
        invoiceId,
        clientId: invoice.clientId,
        amount: paymentAmount,
        paymentMethod,
        paymentReference,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      }
    });

    // Check if total payments now cover the invoice total
    // If it's an offline payment, the onlinePaymentCharge is waived.
    const isOnlinePayment = paymentMethod === 'ONLINE' || paymentMethod === 'CASHFREE' || paymentMethod === 'RAZORPAY';
    const requiredTotal = isOnlinePayment ? invoice.total : (invoice.total - (invoice.onlinePaymentCharge || 0));

    const totalPaidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + paymentAmount;
    
    if (totalPaidSoFar >= requiredTotal) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' }
      });
      
      // MAGIC AUTOMATION: If this invoice is linked to a Renewal, push the expiry date!
      if (invoice.renewal) {
        // Need to update the ClientService expiry date
        const renewal = await prisma.renewal.findUnique({
          where: { id: invoice.renewal.id },
          include: { clientService: { include: { product: true } } }
        });
        
        if (renewal) {
          const billingCycle = renewal.clientService.product.billingCycle; // MONTHLY, YEARLY
          const currentExpiry = new Date(renewal.clientService.expiryDate || renewal.clientService.startDate);
          
          let newExpiry = new Date(currentExpiry);
          if (billingCycle === 'MONTHLY') {
            newExpiry.setMonth(newExpiry.getMonth() + 1);
          } else if (billingCycle === 'YEARLY') {
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
          } else if (billingCycle === 'QUARTERLY') {
            newExpiry.setMonth(newExpiry.getMonth() + 3);
          } else if (billingCycle === 'BIANNUAL') {
            newExpiry.setMonth(newExpiry.getMonth() + 6);
          }
          
          // Update the ClientService
          await prisma.clientService.update({
            where: { id: renewal.clientService.id },
            data: { 
              expiryDate: newExpiry,
              status: 'ACTIVE'
            }
          });
          
          // Mark Renewal as fulfilled/archived? We can just keep it or update status if we had one.
        }
      }
    } else if (invoice.status === 'DRAFT') {
      // If partial payment, mark as Partially Paid
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PARTIALLY_PAID' }
      });
    }

    // Send WhatsApp Notification for Payment Received
    if (invoice.client?.phone) {
      const waSettings = await prisma.whatsAppSetting.findFirst();
      if (waSettings?.isActive && waSettings?.templatePaymentReceived) {
        const message = await fillWhatsAppTemplate(waSettings.templatePaymentReceived, {
          CLIENT_NAME: invoice.client.user?.name || invoice.client.companyName || 'Client',
          INVOICE_NUMBER: invoice.invoiceNumber,
          AMOUNT: paymentAmount.toString()
        });
        sendWhatsAppMessage(invoice.client.phone, message).catch(console.error);
      }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { error: 'Failed to record payment' };
  }
}

/**
 * Generate an Invoice for an upcoming Renewal
 */
export async function generateRenewalInvoice(clientServiceId) {
  try {
    const service = await prisma.clientService.findUnique({
      where: { id: clientServiceId },
      include: { product: true }
    });

    if (!service) return { error: 'Service not found' };

    // Priority: Client-specific renewal price -> Product renewal price -> Client price -> Product default price
    const renewalAmount = service.renewalPrice ?? service.product.renewalPrice ?? service.price ?? service.product.defaultPrice;
    
    // Fetch settings
    const { data: taxSetting } = await getTaxSetting();
    const taxRate = taxSetting?.isEnabled ? taxSetting.percentage : 0;
    
    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({ where: { provider: 'CASHFREE' } });
    const onlinePaymentChargeRate = service.applyOnlineCharge ? (gatewaySetting?.onlinePaymentCharge || 2.0) : 0;
    
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;
    const taxAmount = (renewalAmount * taxRate) / 100;
    
    const subTotalWithTax = renewalAmount + taxAmount;
    const onlinePaymentCharge = (subTotalWithTax * onlinePaymentChargeRate) / 100;
    const total = subTotalWithTax + onlinePaymentCharge;

    // We will create the Renewal and Invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          clientId: service.clientId,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          notes: `Renewal invoice for ${service.customName || service.product.name} (Valid from ${new Date(service.expiryDate).toLocaleDateString()})`,
          subtotal: renewalAmount,
          discount: 0,
          taxAmount,
          onlinePaymentCharge,
          total,
          status: 'PENDING',
          items: {
            create: [
              {
                description: `Renewal: ${service.customName || service.product.name}`,
                quantity: 1,
                unitPrice: renewalAmount,
                discount: 0,
                taxRate,
                total
              }
            ]
          }
        }
      });

      // 2. Create Renewal Record linked to Invoice
      const renewal = await tx.renewal.create({
        data: {
          clientServiceId: service.id,
          renewalDate: service.expiryDate || new Date(),
          amount: total,
          status: 'INVOICED',
          invoiceId: invoice.id
        }
      });

      return invoice.id;
    });

    // Send WhatsApp Notification for Renewal
    const profile = await prisma.clientProfile.findUnique({
      where: { id: service.clientId },
      include: { user: true }
    });
    
    if (profile?.phone) {
      const waSettings = await prisma.whatsAppSetting.findFirst();
      if (waSettings?.isActive && waSettings?.templateRenewal) {
        const message = await fillWhatsAppTemplate(waSettings.templateRenewal, {
          CLIENT_NAME: profile.user?.name || profile.companyName || 'Client',
          SERVICE_NAME: service.customName || service.product.name,
          DATE: service.expiryDate ? new Date(service.expiryDate).toLocaleDateString() : 'N/A',
          AMOUNT: total.toString()
        });
        sendWhatsAppMessage(profile.phone, message).catch(console.error);
      }
    }

    revalidatePath('/renewals');
    revalidatePath('/invoices');
    return { success: true, invoiceId: result };
  } catch (error) {
    console.error('Error generating renewal invoice:', error);
    return { error: 'Failed to generate renewal invoice' };
  }
}

// ==========================================
// QUOTATIONS
// ==========================================

export async function getQuotations(searchQuery = '') {
  try {
    const whereClause = {};
    if (searchQuery) {
      whereClause.OR = [
        { quoteNumber: { contains: searchQuery } },
        { client: { companyName: { contains: searchQuery } } },
        { client: { user: { name: { contains: searchQuery } } } },
      ];
    }
    
    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        client: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: quotations };
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return { error: 'Failed to fetch quotations' };
  }
}

export async function getQuotationById(id) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        items: true,
      }
    });
    if (!quotation) return { error: 'Quotation not found' };
    return { success: true, data: quotation };
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return { error: 'Failed to fetch quotation' };
  }
}

export async function createQuotation(formData, items) {
  try {
    const { clientId, quoteNumber, date, validUntil, notes, terms, subtotal, discount, taxAmount, total, status } = formData;
    
    const existing = await prisma.quotation.findUnique({ where: { quoteNumber } });
    if (existing) {
      return { error: 'A quotation with this number already exists.' };
    }

    const newQuote = await prisma.quotation.create({
      data: {
        clientId,
        quoteNumber,
        date: new Date(date),
        validUntil: new Date(validUntil),
        notes,
        terms,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount),
        taxAmount: parseFloat(taxAmount),
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
      },
    });

    revalidatePath('/quotations');
    return { success: true, data: newQuote };
  } catch (error) {
    console.error('Error creating quotation:', error);
    return { error: 'Failed to create quotation' };
  }
}

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
    return { error: 'Failed to update quotation status' };
  }
}

export async function deleteQuotation(id) {
  try {
    await prisma.quotation.delete({ where: { id } });
    revalidatePath('/quotations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return { error: 'Failed to delete quotation' };
  }
}
