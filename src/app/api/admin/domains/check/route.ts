import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { checkDomainAvailability } from '@/lib/resellerclub/client';
import { getResellerWholesalePricing } from '@/lib/resellerclub/domains';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'domain query parameter is required' }, { status: 400 });
    }

    const targetTlds = ['com', 'in', 'co.in', 'org'];

    // 1. Check availability
    const [availability, wholesalePrices, dbProducts] = await Promise.all([
      checkDomainAvailability(domain, targetTlds),
      getResellerWholesalePricing().catch(() => ({})),
      prisma.productService.findMany({
        where: { category: 'DOMAIN' }
      }).catch(() => [])
    ]);

    const results = availability.map((item) => {
      const wholesale = (wholesalePrices as any)[item.tld];
      const matchedDb = (dbProducts as any[]).find(p => 
        p.name.toLowerCase().includes(`.${item.tld}`)
      );

      const defaultSelling = {
        'com': { sell: 1299, renew: 1399 },
        'in': { sell: 899, renew: 999 },
        'co.in': { sell: 799, renew: 899 },
        'org': { sell: 1599, renew: 1799 },
      }[item.tld] || { sell: 999, renew: 999 };

      const sellingPrice = matchedDb?.defaultPrice ?? defaultSelling.sell;
      const renewalPrice = matchedDb?.renewalPrice ?? defaultSelling.renew;

      return {
        ...item,
        wholesaleRegister: wholesale?.registerCost ?? null,
        wholesaleRenew: wholesale?.renewCost ?? null,
        sellingPrice,
        renewalPrice,
        currency: 'INR',
      };
    });

    return NextResponse.json({
      success: true,
      query: domain,
      results,
    });
  } catch (error: any) {
    console.error('Error checking domain in admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
