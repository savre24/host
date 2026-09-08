'use client';

import { deleteQuotation, updateQuotationStatus, convertToInvoice } from '@/app/actions/quotations';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'react-toastify';
import { Dropdown } from 'react-bootstrap';

const QuotationActions = ({ quotationId, status }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this quotation? This cannot be undone.')) {
      startTransition(async () => {
        const result = await deleteQuotation(quotationId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Quotation deleted successfully');
        }
      });
    }
  };

  const handleStatusChange = (newStatus) => {
    startTransition(async () => {
      const result = await updateQuotationStatus(quotationId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Quotation marked as ${newStatus}`);
      }
    });
  };

  const handleConvert = () => {
    if (window.confirm('Are you sure you want to convert this quotation to an invoice?')) {
      startTransition(async () => {
        const result = await convertToInvoice(quotationId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Converted to Invoice successfully!');
        }
      });
    }
  };

  return (
    <td className="text-center">
      <div className="d-flex justify-content-center align-items-center gap-2">
        <Link href={`/quotations/${quotationId}`} className="text-reset fs-16 d-flex align-items-center" title="View">
          <IconifyIcon icon="tabler:eye" width={18} height={18} />
        </Link>
        
        <Dropdown>
          <Dropdown.Toggle variant="link" className="text-reset fs-16 p-0 border-0 d-flex align-items-center arrow-none" title="Change Status" disabled={isPending}>
            <IconifyIcon icon="tabler:settings" width={18} height={18} />
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item onClick={() => handleStatusChange('DRAFT')} disabled={status === 'DRAFT'}>Mark as Draft</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('SENT')} disabled={status === 'SENT'}>Mark as Sent</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('ACCEPTED')} disabled={status === 'ACCEPTED'} className="text-success">Mark as Accepted</Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange('REJECTED')} disabled={status === 'REJECTED'} className="text-danger">Mark as Rejected</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleConvert} disabled={status === 'CONVERTED'}>
              <IconifyIcon icon="tabler:file-invoice" className="me-2" /> Convert to Invoice
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

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

export default QuotationActions;
