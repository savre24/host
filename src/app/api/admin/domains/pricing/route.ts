import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { getResellerWholesalePricing } from '@/lib/resellerclub/domains';

const DEFAULT_TLD_CONFIG = [
  { tld: 'com', name: '.com Domain Registration', defaultPrice: 1850, renewalPrice: 1780 },
  { tld: 'in', name: '.in Domain Registration', defaultPrice: 899, renewalPrice: 899 },
  { tld: 'co.in', name: '.co.in Domain Registration', defaultPrice: 899, renewalPrice: 899 },
  { tld: 'net', name: '.net Domain Registration', defaultPrice: 1499, renewalPrice: 1799 },
  { tld: 'org', name: '.org Domain Registration', defaultPrice: 1650, renewalPrice: 2280 },
  { tld: 'online', name: '.online Domain Registration', defaultPrice: 499, renewalPrice: 3499 },
];

export async function GET() {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch live wholesale pricing from ResellerClub
    let wholesalePricing: any = {};
    try {
      wholesalePricing = await getResellerWholesalePricing();
    } catch (e: any) {
      console.warn('Could not fetch ResellerClub live wholesale prices:', e.message);
    }

    // 2. Fetch or match products from database
    let dbProducts: any[] = [];
    try {
      dbProducts = await prisma.productService.findMany({
        where: {
          category: 'DOMAIN',
        },
      });
    } catch (dbErr) {
      console.warn('DB read error (using fallback defaults):', dbErr);
    }

    // 3. Combine wholesale costs with admin retail & renewal prices
    const combined = DEFAULT_TLD_CONFIG.map((cfg) => {
      const wholesale = wholesalePricing[cfg.tld] || null;
      const matchedDb = dbProducts.find((p) => {
        const name = p.name.toLowerCase();
        if (cfg.tld === 'in') {
          return name.includes('.in') && !name.includes('.co.in');
        }
        return name.includes(`.${cfg.tld}`) || p.description?.toLowerCase().includes(`.${cfg.tld}`);
      });

      const sellingPrice = matchedDb?.defaultPrice ?? cfg.defaultPrice;
      const renewalPrice = matchedDb?.renewalPrice ?? cfg.renewalPrice;

      return {
        tld: cfg.tld,
        productId: matchedDb?.id || null,
        name: matchedDb?.name || cfg.name,
        // Live ResellerClub wholesale cost
        wholesaleRegister: wholesale?.registerCost ?? null,
        wholesaleRenew: wholesale?.renewCost ?? null,
        wholesaleTransfer: wholesale?.transferCost ?? null,
        currency: 'INR',
        // Admin configured prices
        sellingPrice,
        renewalPrice,
        // Calculated profit margins
        registerProfit: wholesale?.registerCost ? sellingPrice - wholesale.registerCost : null,
        renewalProfit: wholesale?.renewCost ? renewalPrice - wholesale.renewCost : null,
      };
    });

    return NextResponse.json({
      success: true,
      pricing: combined,
    });
  } catch (error: any) {
    console.error('Error fetching domain pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch domain pricing' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tld, sellingPrice, renewalPrice } = body;

    if (!tld || sellingPrice === undefined || renewalPrice === undefined) {
      return NextResponse.json(
        { error: 'tld, sellingPrice, and renewalPrice are required' },
        { status: 400 }
      );
    }

    const tldConfig = DEFAULT_TLD_CONFIG.find(c => c.tld === tld.toLowerCase().replace(/^\./, ''));
    if (!tldConfig) {
      return NextResponse.json({ error: `Unsupported TLD: ${tld}` }, { status: 400 });
    }

    const productName = `.${tldConfig.tld} Domain Registration`;

    // Upsert or update product in database
    let existing;
    if (tldConfig.tld === 'in') {
      const allIn = await prisma.productService.findMany({
        where: {
          category: 'DOMAIN',
          name: { contains: '.in' },
        },
      });
      existing = allIn.find(p => !p.name.toLowerCase().includes('.co.in'));
    } else {
      existing = await prisma.productService.findFirst({
        where: {
          category: 'DOMAIN',
          name: { contains: `.${tldConfig.tld}` },
        },
      });
    }

    let savedProduct;
    if (existing) {
      savedProduct = await prisma.productService.update({
        where: { id: existing.id },
        data: {
          defaultPrice: parseFloat(sellingPrice),
          renewalPrice: parseFloat(renewalPrice),
          updatedAt: new Date(),
        },
      });
    } else {
      savedProduct = await prisma.productService.create({
        data: {
          name: productName,
          category: 'DOMAIN',
          description: `Annual registration and renewal for .${tldConfig.tld} domains.`,
          defaultPrice: parseFloat(sellingPrice),
          renewalPrice: parseFloat(renewalPrice),
          billingCycle: 'YEARLY',
          isRenewable: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated pricing for .${tldConfig.tld}`,
      product: savedProduct,
    });
  } catch (error: any) {
    console.error('Error updating domain pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update domain pricing' },
      { status: 500 }
    );
  }
}
