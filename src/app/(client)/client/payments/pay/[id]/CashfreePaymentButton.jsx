'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { load } from '@cashfreepayments/cashfree-js';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const CashfreePaymentButton = ({ invoice }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfree, setCashfree] = useState(null);
  const router = useRouter();

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // 1. Call our backend to generate a Cashfree order and get the session ID
      const response = await fetch('/api/payments/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to initialize payment');
      }

      // Initialize Cashfree SDK dynamically based on environment returned from backend
      const mode = data.environment === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfreeInstance = await load({ mode });

      // 2. Open Cashfree Checkout Modal
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_modal', // Opens seamlessly in a modal without redirecting
      };

      cashfreeInstance.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          // Payment failed or user closed modal
          toast.error(result.error.message || 'Payment cancelled or failed');
          setIsProcessing(false);
        }
        if (result.redirect) {
          // Cashfree wants to redirect (shouldn't happen with _modal target, but just in case)
          console.log("Payment redirecting");
        }
        if (result.paymentDetails) {
          // Payment might be successful, we need to verify with our backend
          verifyPayment(data.order_id);
        }
      });
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Payment error occurred');
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      toast.info('Verifying payment...');
      const response = await fetch('/api/payments/cashfree/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, invoiceId: invoice.id })
      });

      const data = await response.json();

      if (data.success && data.status === 'PAID') {
        toast.success('Payment successful! Your invoice has been marked as paid.');
        router.refresh(); // Refresh the page to show the "PAID" state
      } else {
        toast.error(`Payment not verified: ${data.message || 'Unknown status'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Could not verify payment status automatically. Please contact support if amount was deducted.');
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      variant="primary" 
      size="lg" 
      className="w-100 py-3 fw-bold"
      onClick={handlePayment}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Processing Securely...
        </>
      ) : (
        <>
          <i className="ti ti-lock me-2"></i>
          Pay ₹{invoice.total.toFixed(2)} Securely
        </>
      )}
    </Button>
  );
};

export default CashfreePaymentButton;
