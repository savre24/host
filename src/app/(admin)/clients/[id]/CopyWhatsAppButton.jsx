'use client';

import React, { useState } from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { toast } from 'react-toastify';

const CopyWhatsAppButton = ({ client, invoices }) => {
  const [copied, setCopied] = useState(false);

  const pendingInvoices = invoices?.filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID' || i.status === 'OVERDUE') || [];
  const totalPending = pendingInvoices.reduce((sum, inv) => {
    const paid = inv.payments ? inv.payments.reduce((pSum, p) => pSum + p.amount, 0) : 0;
    return sum + (inv.total - paid);
  }, 0).toFixed(2);

  const handleCopy = () => {
    if (pendingInvoices.length === 0) {
      toast.info('No pending invoices to copy.');
      return;
    }

    let message = `Dear ${client.name},\n\nYou have pending dues for the following services:\n\n`;

    pendingInvoices.forEach(inv => {
      message += `🧾 Invoice #${inv.invoiceNumber} (${new Date(inv.invoiceDate).toLocaleDateString()})\n`;
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          message += `   - ${item.description}: ₹${item.total.toFixed(2)}\n`;
        });
      }
      if (inv.payments && inv.payments.length > 0) {
        const paid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
        message += `   *Amount Due: ₹${(inv.total - paid).toFixed(2)}*\n\n`;
      } else {
        message += `   *Amount Due: ₹${inv.total.toFixed(2)}*\n\n`;
      }
    });

    message += `*Total Pending Amount: ₹${totalPending}*\n\n`;
    message += `Please clear the dues at your earliest convenience to avoid interruption of services.\n\nThank you,\nHosting Space India`;

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy message.');
    });
  };

  if (pendingInvoices.length === 0) return null;

  return (
    <button 
      onClick={handleCopy} 
      className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-success'} me-2 d-flex align-items-center`}
      title="Copy WhatsApp Message"
    >
      <IconifyIcon icon={copied ? "tabler:check" : "tabler:brand-whatsapp"} className="me-1" /> 
      {copied ? 'Copied!' : 'Copy WA Reminder'}
    </button>
  );
};

export default CopyWhatsAppButton;
