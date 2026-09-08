'use client';

import { useState, useTransition } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { updateDomainDetail } from '@/app/actions/clientRequests';
import { useRouter } from 'next/navigation';

export default function DomainInfoEditableClient({ serviceId, initialDns, initialOwnership }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dnsNameservers = formData.get('dnsNameservers');
    const domainOwnership = formData.get('domainOwnership');

    startTransition(async () => {
      const result = await updateDomainDetail(serviceId, dnsNameservers, domainOwnership);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Domain details updated! The admin has been notified.');
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  if (!isEditing) {
    return (
      <div className="position-relative">
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="bg-light p-3 rounded h-100">
              <h6 className="text-uppercase fs-12 text-muted">DNS / Nameservers</h6>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {initialDns || 'No nameservers assigned.'}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="bg-light p-3 rounded h-100 mt-3 mt-md-0">
              <h6 className="text-uppercase fs-12 text-muted">Domain Ownership</h6>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {initialOwnership || 'Ownership details pending.'}
              </div>
            </div>
          </div>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm" 
          className="position-absolute" 
          style={{ top: '-40px', right: '0' }}
          onClick={() => setIsEditing(true)}
        >
          <i className="mdi mdi-pencil me-1"></i> Edit Details
        </Button>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="border p-3 rounded bg-light mb-4">
      <h5 className="mb-3">Edit Domain Information</h5>
      <p className="text-muted small mb-3">
        Note: Any changes made here will automatically open a support ticket to notify the admin.
      </p>
      <div className="row mb-3">
        <Form.Group className="col-md-6" controlId="dnsNameservers">
          <Form.Label>DNS / Nameservers</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={4} 
            name="dnsNameservers" 
            defaultValue={initialDns || ''} 
            placeholder="ns1.example.com&#10;ns2.example.com" 
          />
        </Form.Group>
        <Form.Group className="col-md-6 mt-3 mt-md-0" controlId="domainOwnership">
          <Form.Label>Domain Ownership</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={4} 
            name="domainOwnership" 
            defaultValue={initialOwnership || ''} 
            placeholder="Registered via GoDaddy&#10;Owner: John Doe" 
          />
        </Form.Group>
      </div>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? (
            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Saving...</>
          ) : 'Save & Notify Admin'}
        </Button>
      </div>
    </Form>
  );
}
