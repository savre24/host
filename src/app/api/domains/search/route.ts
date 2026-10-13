import { NextRequest, NextResponse } from 'next/server';
import { checkDomainAvailability } from '@/lib/resellerclub/client';
import prisma from '@/lib/prisma';

const FALLBACK_PRICES: Record<string, { sell: number; renew: number }> = {
  'com': { sell: 1299, renew: 1399 },
  'in': { sell: 899, renew: 999 },
  'co.in': { sell: 799, renew: 899 },
  'org': { sell: 1599, renew: 1799 },
  'net': { sell: 1399, renew: 1499 },
  'online': { sell: 499, renew: 1299 },
  'biz': { sell: 999, renew: 1199 },
  'info': { sell: 799, renew: 1299 },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const tldsParam = searchParams.get('tlds');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    const tlds = tldsParam
      ? tldsParam.split(',').map(t => t.trim())
      : ['com', 'in', 'net', 'org', 'co.in'];

    // 1. Check availability via ResellerClub
    const [results, dbProducts] = await Promise.all([
      checkDomainAvailability(domain, tlds),
      prisma.productService.findMany({
        where: { category: 'DOMAIN' }
      }).catch(() => [])
    ]);

    // 2. Attach admin configured selling and renewal prices
    const enrichedResults = results.map(item => {
      const cleanTld = item.tld.toLowerCase();
      const matchedDb = (dbProducts as any[]).find(p => 
        p.name.toLowerCase().includes(`.${cleanTld}`) || 
        p.description?.toLowerCase().includes(`.${cleanTld}`)
      );

      const fallback = FALLBACK_PRICES[cleanTld] || { sell: 999, renew: 999 };
      const sellingPrice = matchedDb?.defaultPrice ?? fallback.sell;
      const renewalPrice = matchedDb?.renewalPrice ?? fallback.renew;

      return {
        ...item,
        sellingPrice,
        renewalPrice,
        currency: 'INR',
      };
    });

    return NextResponse.json({
      success: true,
      query: domain,
      results: enrichedResults,
    });
  } catch (error: any) {
    console.error('API /api/domains/search error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check domain availability',
      },
      { status: 500 }
    );
  }
}
