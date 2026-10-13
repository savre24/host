import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { renewDomain, getDomainDetailsByName, getDomainDetails } from '@/lib/resellerclub/domains';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { orderId, domainName, clientServiceId, years = 1 } = body;

    if (!orderId && !domainName) {
      return NextResponse.json(
        { error: 'Either orderId or domainName is required' },
        { status: 400 }
      );
    }

    // 1. If orderId not provided, look it up by domainName
    let details: any;
    if (!orderId && domainName) {
      details = await getDomainDetailsByName(domainName);
      orderId = details.orderid || details.entityid;
    } else {
      details = await getDomainDetails(orderId);
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Could not find ResellerClub order for domain' },
        { status: 404 }
      );
    }

    const currentExpiryTimestamp = parseInt(details.endtime || details.expirydate || '0');
    if (!currentExpiryTimestamp) {
      return NextResponse.json(
        { error: 'Could not determine current domain expiry date from ResellerClub' },
        { status: 400 }
      );
    }

    // 2. Call ResellerClub Renewal API
    const renewalResult = await renewDomain({
      orderId,
      years,
      expDate: currentExpiryTimestamp,
    });

    // 3. Update database if clientServiceId is provided
    if (clientServiceId) {
      const currentService = await prisma.clientService.findUnique({
        where: { id: clientServiceId },
      });

      if (currentService) {
        const baseDate = currentService.expiryDate ? new Date(currentService.expiryDate) : new Date();
        const newExpiryDate = new Date(baseDate);
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + years);

        await prisma.clientService.update({
          where: { id: clientServiceId },
          data: {
            expiryDate: newExpiryDate,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Domain renewal successfully processed for ${years} year(s)`,
      result: renewalResult,
    });
  } catch (error: any) {
    console.error('Error renewing domain in admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to renew domain' },
      { status: 500 }
    );
  }
}
