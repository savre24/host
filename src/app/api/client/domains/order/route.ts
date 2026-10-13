import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { getTaxSetting } from '@/app/actions/settings';
import { checkDomainAvailability } from '@/lib/resellerclub/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to order a domain name.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { domain, years = 1, nameservers = ['ns1.hostingspaceindia.com', 'ns2.hostingspaceindia.com'] } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain name is required.' }, { status: 400 });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = cleanDomain.split('.');
    if (parts.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid domain name with extension.' }, { status: 400 });
    }

    // Determine TLD
    let tld = 'com';
    if (cleanDomain.endsWith('.co.in')) {
      tld = 'co.in';
    } else {
      tld = parts[parts.length - 1];
    }

    // 1. Fetch Client Profile
    const profile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Client profile could not be found.' }, { status: 404 });
    }

    // 2. Real-time availability check via ResellerClub
    try {
      const sld = cleanDomain.split('.')[0];
      const checkResults = await checkDomainAvailability(sld, [tld]);
      const match = checkResults.find(r => r.domain.toLowerCase() === cleanDomain);
      if (match && match.status !== 'available') {
        return NextResponse.json(
          { error: `The domain ${cleanDomain} is no longer available. Please choose another name.` },
          { status: 400 }
        );
      }
    } catch (checkErr: any) {
      console.warn('Live availability pre-check warning:', checkErr?.message);
      // Proceed if temporary check network error, but log
    }

    // 3. Resolve Pricing from database ProductService
    let product: any = null;
    try {
      if (tld === 'in') {
        const allIn = await prisma.productService.findMany({
          where: {
            category: 'DOMAIN',
            name: { contains: '.in' },
          },
        });
        product = allIn.find(p => !p.name.toLowerCase().includes('.co.in'));
      } else {
        product = await prisma.productService.findFirst({
          where: {
            category: 'DOMAIN',
            name: { contains: `.${tld}` },
          },
        });
      }
    } catch (e) {
      console.warn('Could not query productService:', e);
    }

    const fallbackPricing: Record<string, { sell: number; renew: number }> = {
      'com': { sell: 1850, renew: 1780 },
      'in': { sell: 899, renew: 899 },
      'co.in': { sell: 899, renew: 899 },
      'net': { sell: 1799, renew: 2099 },
      'org': { sell: 1850, renew: 2280 },
      'online': { sell: 499, renew: 3499 },
    };

    const tldFallback = fallbackPricing[tld] || { sell: 1799, renew: 2099 };
    const durationYears = Math.max(1, Math.min(10, parseInt(String(years), 10) || 1));
    const unitPrice = product?.defaultPrice ? Number(product.defaultPrice) : tldFallback.sell;
    const renewalPrice = product?.renewalPrice ? Number(product.renewalPrice) : tldFallback.renew;
    const subtotal = unitPrice * durationYears;

    // 4. Calculate Taxes & Online Payment Charge
    const taxRes = await getTaxSetting();
    const taxRate = taxRes?.data?.isEnabled ? (taxRes.data.percentage || 18.0) : 0;
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));

    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE', isActive: true },
    }).catch(() => null);
    const onlineRate = gatewaySetting?.onlinePaymentCharge || 0;
    const subWithTax = subtotal + taxAmount;
    const onlineCharge = parseFloat(((subWithTax * onlineRate) / 100).toFixed(2));
    const total = parseFloat((subWithTax + onlineCharge).toFixed(2));

    // 5. Generate unique Invoice Number
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;

    // 6. Persist ClientService & Invoice in database
    const nsString = Array.isArray(nameservers) && nameservers.length > 0 
      ? nameservers.filter(Boolean).join(', ') 
      : 'ns1.hostingspaceindia.com, ns2.hostingspaceindia.com';

    // Create ClientService
    const clientService = await prisma.clientService.create({
      data: {
        clientId: profile.id,
        productId: product?.id || (await getOrCreateDefaultDomainProduct(tld)),
        customName: cleanDomain,
        price: unitPrice,
        renewalPrice: renewalPrice,
        billingCycle: 'YEARLY',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + durationYears * 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        notes: `Domain ordered online by client (Invoice #${invoiceNumber}). Nameservers: ${nsString}`,
        domainDetail: {
          create: {
            dnsNameservers: nsString,
            domainOwnership: 'Client',
          },
        },
      },
    });

    // Create Invoice with item
    const newInvoice = await prisma.invoice.create({
      data: {
        clientId: profile.id,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
        notes: `Domain Registration for ${cleanDomain} (${durationYears} Year${durationYears > 1 ? 's' : ''})`,
        subtotal,
        discount: 0,
        taxAmount,
        onlinePaymentCharge: onlineCharge,
        total,
        status: 'PENDING',
        items: {
          create: [
            {
              productId: product?.id,
              description: `Domain Registration: ${cleanDomain} (${durationYears} Year${durationYears > 1 ? 's' : ''})`,
              quantity: durationYears,
              unitPrice,
              taxRate,
              total: subtotal,
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice #${invoiceNumber} generated successfully.`,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      serviceId: clientService.id,
      domain: cleanDomain,
      total: newInvoice.total,
      redirectUrl: `/client/payments/pay/${newInvoice.id}`,
    });
  } catch (error: any) {
    console.error('Error in /api/client/domains/order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process domain order.' },
      { status: 500 }
    );
  }
}

async function getOrCreateDefaultDomainProduct(tld: string): Promise<string> {
  const existing = await prisma.productService.findFirst({
    where: { category: 'DOMAIN', name: { contains: `.${tld}` } },
  });
  if (existing) return existing.id;

  const created = await prisma.productService.create({
    data: {
      name: `.${tld} Domain Registration`,
      category: 'DOMAIN',
      description: `Domain Registration and Management for .${tld}`,
      defaultPrice: 1799,
      renewalPrice: 2099,
    },
  });
  return created.id;
}
