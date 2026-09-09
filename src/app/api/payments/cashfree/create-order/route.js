import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(req) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // 1. Fetch the invoice and client details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          include: { user: true }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // 2. Fetch Cashfree Settings
    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE', isActive: true }
    });

    if (!gatewaySetting || !gatewaySetting.appId || !gatewaySetting.secretKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured or active' }, { status: 500 });
    }

    // 3. Configure Cashfree SDK
    const cashfreeEnvironment = gatewaySetting.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(cashfreeEnvironment, gatewaySetting.appId, gatewaySetting.secretKey);

    // 4. Create Order Payload
    const orderId = `order_${invoice.id.replace(/-/g, '').substring(0, 8)}_${Date.now()}`;
    const orderAmount = invoice.total;
    
    // Ensure amount is formatted as a Number for the SDK (e.g., 1780.00 -> 1780)
    const formattedAmount = parseFloat(Number(orderAmount).toFixed(2));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://localhost:3000';
    // Cashfree strictly requires HTTPS for return_url
    const secureBaseUrl = baseUrl.startsWith('http://') && !baseUrl.includes('localhost') 
      ? baseUrl.replace('http://', 'https://') 
      : baseUrl.includes('localhost') 
        ? baseUrl.replace('http://', 'https://') // Force https for localhost as well to pass validation
        : baseUrl;

    const request = {
      order_amount: formattedAmount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: invoice.clientId.replace(/-/g, '').substring(0, 20),
        customer_name: invoice.client.user?.name || invoice.client.companyName || 'Client',
        customer_email: invoice.client.user?.email || 'no-email@example.com',
        customer_phone: invoice.client.phone ? (invoice.client.phone.replace(/\D/g, '').length >= 10 ? invoice.client.phone.replace(/\D/g, '').slice(-10) : '9999999999') : '9999999999',
      },
      order_meta: {
        return_url: `${secureBaseUrl}/client/payments/verify?order_id={order_id}&invoice_id=${invoice.id}`,
      },
      order_tags: {
        invoice_id: invoice.id
      }
    };

    // 5. Create Order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(request);
    
    if (response && response.data) {
      return NextResponse.json({
        success: true,
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id
      });
    } else {
      throw new Error('Failed to create Cashfree order');
    }

  } catch (error) {
    const errorDetails = error?.response?.data || error?.message || error;
    console.error('Cashfree Order Creation Error:', errorDetails);
    
    // Return detailed error for easier debugging
    return NextResponse.json({ 
      error: 'Failed to initiate payment process', 
      details: error?.response?.data?.message || error?.message || String(error)
    }, { status: 500 });
  }
}
