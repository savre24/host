'use client';

import { updateClientService } from '@/app/actions/product';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const EditClientServiceForm = ({ service }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse booleans
    data.autoRenewReminder = data.autoRenewReminder === 'on';

    startTransition(async () => {
      setError(null);
      const result = await updateClientService(service.id, data);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Service updated successfully');
        router.push(`/clients/${service.client?.userId || ''}`);
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="productId">
          <Form.Label>Product / Service Type</Form.Label>
          <Form.Control type="text" disabled defaultValue={service.product?.name || 'Unknown'} />
          <Form.Text className="text-muted">You cannot change the core product once assigned.</Form.Text>
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="customName">
          <Form.Label>Custom Name (Optional)</Form.Label>
          <Form.Control type="text" name="customName" defaultValue={service.customName || ''} placeholder="e.g. Primary Domain - myclient.com" />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="price">
          <Form.Label>Assigned Price (₹)</Form.Label>
          <Form.Control required type="number" step="0.01" min="0" name="price" defaultValue={service.price} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="billingCycle">
          <Form.Label>Billing Cycle</Form.Label>
          <Form.Select name="billingCycle" defaultValue={service.billingCycle}>
            <option value="ONE_TIME">One-time</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="HALF_YEARLY">Semi-Annually</option>
            <option value="YEARLY">Annually</option>
            <option value="CUSTOM">Custom</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="startDate">
          <Form.Label>Start Date</Form.Label>
          <Form.Control required type="date" name="startDate" defaultValue={service.startDate ? new Date(service.startDate).toISOString().split('T')[0] : ''} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="expiryDate">
          <Form.Label>Expiry/Renewal Date (Optional)</Form.Label>
          <Form.Control type="date" name="expiryDate" defaultValue={service.expiryDate ? new Date(service.expiryDate).toISOString().split('T')[0] : ''} />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="12" controlId="notes">
          <Form.Label>Internal Notes</Form.Label>
          <Form.Control as="textarea" rows={2} name="notes" defaultValue={service.notes || ''} />
        </Form.Group>
      </Row>

      <Row className="mb-4">
        <Form.Group as={Col} md="6">
          <Form.Label>Auto-Renew Reminders?</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="autoRenewReminder" name="autoRenewReminder" defaultChecked={service.autoRenewReminder} data-switch="success" />
            <label htmlFor="autoRenewReminder" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Status</Form.Label>
          <Form.Select name="status" defaultValue={service.status}>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </Form.Select>
        </Form.Group>
      </Row>

      {service.product?.category?.toUpperCase() === 'DOMAIN' && (
        <div className="border rounded p-3 mb-4 bg-light">
          <h5 className="mb-3">Domain Configuration</h5>
          <Row className="mb-3">
            <Form.Group as={Col} md="6" controlId="dnsNameservers">
              <Form.Label>DNS / Nameservers</Form.Label>
              <Form.Control as="textarea" rows={3} name="dnsNameservers" defaultValue={service.domainDetail?.dnsNameservers || ''} placeholder="ns1.example.com&#10;ns2.example.com" />
            </Form.Group>
            <Form.Group as={Col} md="6" controlId="domainOwnership">
              <Form.Label>Domain Ownership Details</Form.Label>
              <Form.Control as="textarea" rows={3} name="domainOwnership" defaultValue={service.domainDetail?.domainOwnership || ''} placeholder="Registered via GoDaddy&#10;Owner: John Doe" />
            </Form.Group>
          </Row>
        </div>
      )}

      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Form>
  );
};

export default EditClientServiceForm;
