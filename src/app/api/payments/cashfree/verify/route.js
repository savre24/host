import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(req) {
  try {
    const { orderId, invoiceId } = await req.json();

    if (!orderId || !invoiceId) {
      return NextResponse.json({ error: 'Order ID and Invoice ID are required' }, { status: 400 });
    }

    // 1. Fetch Cashfree Settings
    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE', isActive: true }
    });

    if (!gatewaySetting || !gatewaySetting.appId || !gatewaySetting.secretKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured or active' }, { status: 500 });
    }

    // 2. Configure Cashfree SDK
    const cashfreeEnvironment = gatewaySetting.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(cashfreeEnvironment, gatewaySetting.appId, gatewaySetting.secretKey);
    cashfree.XApiVersion = "2023-08-01"; // Explicitly set for compatibility

    // 3. Verify Payment Status with Cashfree API
    const response = await cashfree.PGOrderFetchPayments(orderId);
    
    if (response && response.data && response.data.length > 0) {
      const payments = response.data;
      
      // Look for a successful payment
      const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

      if (successfulPayment) {
        // 4. Update Database
        await prisma.$transaction(async (tx) => {
          // Check if invoice exists and is not already paid
          const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
            include: {
              items: true,
              client: {
                include: { user: true }
              }
            }
          });

          if (invoice && invoice.status !== 'PAID') {
            // Update Invoice Status
            await tx.invoice.update({
              where: { id: invoiceId },
              data: { status: 'PAID' }
            });

            // If it's a renewal invoice, update the Renewal Status
            await tx.renewal.updateMany({
              where: { invoiceId: invoiceId },
              data: { status: 'PAID' }
            });
            
            // Check for Domain Registration item
            const domainItem = invoice.items?.find(it => it.description?.toLowerCase().includes('domain registration'));
            let domainServiceId = null;
            let domainName = null;

            if (domainItem) {
              const match = domainItem.description.match(/Domain Registration:\s*([^\s(]+)/i);
              domainName = match ? match[1].toLowerCase().trim() : null;
              if (domainName) {
                const service = await tx.clientService.findFirst({
                  where: {
                    clientId: invoice.clientId,
                    customName: domainName
                  }
                });
                if (service) {
                  domainServiceId = service.id;
                  await tx.clientService.update({
                    where: { id: service.id },
                    data: {
                      status: 'ACTIVE',
                      notes: `${service.notes || ''} | Paid via Cashfree (${orderId}). Active.`
                    }
                  });
                }
              }
            }

            // Create a Payment Record
            await tx.payment.create({
              data: {
                invoiceId: invoice.id,
                clientId: invoice.clientId,
                amount: invoice.total,
                paymentMethod: 'Cashfree',
                paymentReference: orderId,
                status: 'COMPLETED'
              }
            });

            // Log the activity
            await tx.activityLog.create({
              data: {
                userId: invoice.clientId,
                action: 'PAYMENT_SUCCESS',
                details: `Invoice ${invoice.invoiceNumber} paid via Cashfree (Order ID: ${orderId})`
              }
            });
          }
        });

        // Background / Async Domain Provisioning Attempt
        try {
          const freshInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true, client: { include: { user: true } } }
          });
          const domainItem = freshInvoice?.items?.find(it => it.description?.toLowerCase().includes('domain registration'));
          if (domainItem) {
            const match = domainItem.description.match(/Domain Registration:\s*([^\s(]+)/i);
            const domainName = match ? match[1].toLowerCase().trim() : null;
            if (domainName && freshInvoice.client) {
              const { executeLiveDomainRegistration } = await import('@/lib/resellerclub/domains');
              const regResult = await executeLiveDomainRegistration({
                domainName,
                years: domainItem.quantity || 1,
                clientProfile: freshInvoice.client
              });

              if (regResult.success) {
                await prisma.clientService.updateMany({
                  where: { clientId: freshInvoice.clientId, customName: domainName },
                  data: {
                    notes: `Successfully registered via ResellerClub (Order #${regResult.orderId})`
                  }
                });
              } else {
                console.warn(`ResellerClub auto-registration deferred for ${domainName}:`, regResult.error);
                await prisma.clientService.updateMany({
                  where: { clientId: freshInvoice.clientId, customName: domainName },
                  data: {
                    notes: `Payment received. Pending ResellerClub API registration: ${regResult.error}. Admin can 1-click retry from Admin Domains panel.`
                  }
                });
              }
            }
          }
        } catch (provErr) {
          console.error('Error during automatic domain registration attempt:', provErr);
        }

        return NextResponse.json({ success: true, status: 'PAID' });
      } else {
        // Payment is not successful
        const latestPayment = payments[payments.length - 1];
        return NextResponse.json({ 
          success: false, 
          status: latestPayment.payment_status,
          message: latestPayment.payment_message || 'Payment was not successful'
        });
      }
    } else {
      return NextResponse.json({ error: 'No payments found for this order' }, { status: 404 });
    }

  } catch (error) {
    console.error('Cashfree Verification Error:', error?.response?.data || error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
