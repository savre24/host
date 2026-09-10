'use client';

import { deleteInvoice, updateInvoiceStatus } from '@/app/actions/billing';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'react-toastify';
import { Dropdown } from 'react-bootstrap';

const InvoiceActions = ({ invoiceId, status }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
      startTransition(async () => {
        const result = await deleteInvoice(invoiceId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Invoice deleted successfully');
        }
      });
    }
  };

  const handleStatusChange = (newStatus) => {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Invoice marked as ${newStatus}`);
      }
    });
  };

  return (
    <td className="text-center">
      <div className="d-flex justify-content-center align-items-center gap-2">
        <Link href={`/invoices/${invoiceId}`} className="text-reset fs-16 d-flex align-items-center" title="View">
          <IconifyIcon icon="tabler:eye" width={18} height={18} />
        </Link>
        
        <Link href={`/invoices/${invoiceId}?download=true`} className="text-reset fs-16 d-flex align-items-center" title="Download PDF">
          <IconifyIcon icon="tabler:download" width={18} height={18} />
        </Link>
        
        <Dropdown>
          <Dropdown.Toggle variant="link" className="text-reset fs-16 p-0 border-0 d-flex align-items-center arrow-none" title="Change Status" disabled={isPending}>
            <IconifyIcon icon="tabler:settings" width={18} height={18} />
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item onClick={() => handleStatusChange('DRAFT')} disabled={status === 'DRAFT'}>Mark as Draft</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('PENDING')} disabled={status === 'PENDING'}>Mark as Pending (Sent)</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('PAID')} disabled={status === 'PAID'} className="text-success">Mark as Paid</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('CANCELLED')} disabled={status === 'CANCELLED'} className="text-danger">Mark as Cancelled</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        
        <Link href={`/invoices/${invoiceId}/edit`} className="text-warning fs-16 d-flex align-items-center" title="Edit">
          <IconifyIcon icon="tabler:pencil" width={18} height={18} />
        </Link>

        <button 
          onClick={handleDelete} 
          disabled={isPending}
          className="btn btn-link text-danger fs-16 p-0 border-0 d-flex align-items-center" 
          title="Delete"
        >
          <IconifyIcon icon="tabler:trash" width={18} height={18} />
        </button>
      </div>
    </td>
  );
};

export default InvoiceActions;
