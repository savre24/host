import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRenewalInvoice } from '@/app/actions/billing';

// Note: To secure this cron route in production, you should check for a secret token
// (e.g., const authHeader = req.headers.get('authorization'); if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error: 'Unauthorized'}, {status: 401}))
export async function GET(req) {
  try {
    const today = new Date();
    // We want to find services that expire exactly (or roughly) 10 days from today
    const targetDateStart = new Date(today);
    targetDateStart.setDate(targetDateStart.getDate() + 10);
    targetDateStart.setHours(0, 0, 0, 0);
    
    const targetDateEnd = new Date(targetDateStart);
    targetDateEnd.setHours(23, 59, 59, 999);

    // Find active, renewable services expiring within the target 10-day window
    const upcomingRenewals = await prisma.clientService.findMany({
      where: {
        status: 'ACTIVE',
        isRenewable: true,
        expiryDate: {
          gte: targetDateStart,
          lte: targetDateEnd
        }
      },
      include: { product: true }
    });

    if (upcomingRenewals.length === 0) {
      return NextResponse.json({ message: 'No services found expiring in 10 days.' }, { status: 200 });
    }

    const results = [];

    // For each service, check if a renewal for this expiry date already exists
    // (To prevent duplicate invoice generation if the cron runs twice in one day)
    for (const service of upcomingRenewals) {
      const existingRenewal = await prisma.renewal.findFirst({
        where: {
          clientServiceId: service.id,
          // Check if a renewal exists around the same expiry date
          renewalDate: {
            gte: targetDateStart,
            lte: targetDateEnd
          }
        }
      });

      if (!existingRenewal) {
        // Generate the invoice using the existing action
        const invoiceResult = await generateRenewalInvoice(service.id);
        if (invoiceResult.success) {
          results.push({ serviceId: service.id, invoiceId: invoiceResult.invoiceId, status: 'Generated' });
        } else {
          results.push({ serviceId: service.id, error: invoiceResult.error, status: 'Failed' });
        }
      } else {
        results.push({ serviceId: service.id, status: 'Skipped - Already Generated' });
      }
    }

    return NextResponse.json({ 
      message: `Processed ${upcomingRenewals.length} services.`, 
      results 
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
