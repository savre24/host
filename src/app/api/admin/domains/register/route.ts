import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { executeLiveDomainRegistration } from '@/lib/resellerclub/domains';
import { getTaxSetting } from '@/app/actions/settings';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      domainName, 
      clientId, 
      years = 1, 
      nameservers = ['ns1.hostingspaceindia.com', 'ns2.hostingspaceindia.com'],
      action = 'LIVE_REGISTER', // 'LIVE_REGISTER' or 'INVOICE_ONLY'
    } = body;

    if (!domainName || !clientId) {
      return NextResponse.json(
        { error: 'domainName and clientId are required' },
        { status: 400 }
      );
    }

    const cleanDomain = domainName.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: { user: true },
    });

    if (!clientProfile) {
      return NextResponse.json({ error: 'Selected client not found' }, { status: 404 });
    }

    // Determine TLD
    let tld = 'com';
    if (cleanDomain.endsWith('.co.in')) {
      tld = 'co.in';
    } else {
      const parts = cleanDomain.split('.');
      tld = parts[parts.length - 1];
    }

    // Find ProductService
    let product: any = null;
    if (tld === 'in') {
      const allIn = await prisma.productService.findMany({
        where: { category: 'DOMAIN', name: { contains: '.in' } },
      });
      product = allIn.find(p => !p.name.toLowerCase().includes('.co.in'));
    } else {
      product = await prisma.productService.findFirst({
        where: { category: 'DOMAIN', name: { contains: `.${tld}` } },
      });
    }

    const unitPrice = product?.defaultPrice ? Number(product.defaultPrice) : 1799;
    const renewalPrice = product?.renewalPrice ? Number(product.renewalPrice) : 2099;
    const durationYears = Math.max(1, Math.min(10, parseInt(String(years), 10) || 1));
    const nsString = Array.isArray(nameservers) && nameservers.length > 0 
      ? nameservers.join(', ') 
      : 'ns1.hostingspaceindia.com, ns2.hostingspaceindia.com';

    // 1. LIVE REGISTRATION VIA RESELLERCLUB
    if (action === 'LIVE_REGISTER') {
      const regResult = await executeLiveDomainRegistration({
        domainName: cleanDomain,
        years: durationYears,
        nameservers,
        clientProfile,
      });

      if (!regResult.success) {
        return NextResponse.json(
          { 
            error: regResult.error,
            isBalanceError: regResult.isBalanceError,
          },
          { status: 400 }
        );
      }

      // Live registration succeeded! Create service record
      const service = await prisma.clientService.create({
        data: {
          clientId: clientProfile.id,
          productId: product?.id || (await getOrCreateDefaultDomainProduct(tld)),
          customName: cleanDomain,
          price: unitPrice,
          renewalPrice: renewalPrice,
          billingCycle: 'YEARLY',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + durationYears * 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          notes: `Live registered via Admin Panel (ResellerClub Order #${regResult.orderId})`,
          domainDetail: {
            create: {
              dnsNameservers: nsString,
              domainOwnership: `ResellerClub Order #${regResult.orderId}`,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully registered ${cleanDomain} via ResellerClub!`,
        orderId: regResult.orderId,
        serviceId: service.id,
      });
    }

    // 2. INVOICE ONLY
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;
    const subtotal = unitPrice * durationYears;

    const taxRes = await getTaxSetting();
    const taxRate = taxRes?.data?.isEnabled ? (taxRes.data.percentage || 18.0) : 0;
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));

    const service = await prisma.clientService.create({
      data: {
        clientId: clientProfile.id,
        productId: product?.id || (await getOrCreateDefaultDomainProduct(tld)),
        customName: cleanDomain,
        price: unitPrice,
        renewalPrice: renewalPrice,
        billingCycle: 'YEARLY',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + durationYears * 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        notes: `Assigned via Admin Panel (Invoice #${invoiceNumber}). Nameservers: ${nsString}`,
        domainDetail: {
          create: {
            dnsNameservers: nsString,
            domainOwnership: 'Client',
          },
        },
      },
    });

    const newInvoice = await prisma.invoice.create({
      data: {
        clientId: clientProfile.id,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `Domain Registration for ${cleanDomain} (${durationYears} Year${durationYears > 1 ? 's' : ''})`,
        subtotal,
        discount: 0,
        taxAmount,
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
      message: `Invoice #${invoiceNumber} created and assigned to ${clientProfile.user?.name || clientProfile.companyName}.`,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      serviceId: service.id,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/domains/register:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process domain registration.' },
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
