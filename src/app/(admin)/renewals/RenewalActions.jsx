'use client';

import { processRenewal, updateClientService } from '@/app/actions/product';
import { generateRenewalInvoice } from '@/app/actions/billing';
import { useRouter } from 'next/navigation';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useTransition } from 'react';
import { toast } from 'react-toastify';

const RenewalActions = ({ service }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRenew = () => {
    if (window.confirm(`Are you sure you want to renew ${service.product?.name}? This will push the expiry date forward by its billing cycle (${service.billingCycle}).`)) {
      startTransition(async () => {
        const result = await processRenewal(service.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Service successfully renewed!');
        }
      });
    }
  };

  const handleGenerateInvoice = () => {
    startTransition(async () => {
      const result = await generateRenewalInvoice(service.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invoice generated successfully!');
        router.push(`/invoices/${result.invoiceId}`);
      }
    });
  };

  const handleRemind = () => {
    alert('Email Reminder Sent! (This is a placeholder until email integration is set up)');
  };

  const handleSuspend = () => {
    if (window.confirm('Are you sure you want to suspend this service?')) {
      startTransition(async () => {
        // We reuse the updateClientService action but just change status
        const formData = new FormData();
        formData.append('status', 'SUSPENDED');
        formData.append('price', service.price); // required fields
        formData.append('startDate', new Date(service.startDate).toISOString().split('T')[0]);
        formData.append('billingCycle', service.billingCycle);
        if (service.expiryDate) {
          formData.append('expiryDate', new Date(service.expiryDate).toISOString().split('T')[0]);
        }
        
        const data = Object.fromEntries(formData.entries());
        data.autoRenewReminder = service.autoRenewReminder;

        const result = await updateClientService(service.id, data);
        if (result.error) {
          toast.error('Failed to suspend service.');
        } else {
          toast.success('Service suspended.');
        }
      });
    }
  };

  return (
    <td className="text-center">
      <div className="d-flex justify-content-center align-items-center gap-2">
        <button 
          onClick={handleGenerateInvoice} 
          disabled={isPending || service.billingCycle === 'ONE_TIME'}
          className="btn btn-sm btn-primary d-flex align-items-center" 
          title="Generate Renewal Invoice"
        >
          <IconifyIcon icon="tabler:file-invoice" width={16} height={16} className="me-1" /> Invoice
        </button>

        <button 
          onClick={handleRenew} 
          disabled={isPending || service.billingCycle === 'ONE_TIME'}
          className="btn btn-sm btn-outline-success d-flex align-items-center" 
          title="Mark as Renewed (No Invoice)"
        >
          <IconifyIcon icon="tabler:check" width={16} height={16} />
        </button>

        <button 
          onClick={handleRemind} 
          disabled={isPending}
          className="btn btn-sm btn-outline-info d-flex align-items-center" 
          title="Send Reminder"
        >
          <IconifyIcon icon="tabler:bell" width={16} height={16} />
        </button>

        <button 
          onClick={handleSuspend} 
          disabled={isPending || service.status === 'SUSPENDED'}
          className="btn btn-sm btn-outline-danger d-flex align-items-center" 
          title="Suspend Service"
        >
          <IconifyIcon icon="tabler:player-pause" width={16} height={16} />
        </button>
      </div>
    </td>
  );
};

export default RenewalActions;
