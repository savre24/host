'use client';

import { assignServiceToClient } from '@/app/actions/product';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AssignServiceForm = ({ clientId, clientProfileId, products }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [price, setPrice] = useState(products[0]?.defaultPrice || 0);

  const handleProductChange = (e) => {
    const prod = products.find(p => p.id === e.target.value);
    setSelectedProduct(prod);
    if (prod) {
      setPrice(prod.defaultPrice);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse booleans
    data.autoRenewReminder = data.autoRenewReminder === 'on';
    data.autoInvoice = data.autoInvoice === 'on';

    startTransition(async () => {
      setError(null);
      // Notice: The action might need clientProfileId instead of userId if it expects the ClientProfile ID
      const result = await assignServiceToClient(clientProfileId, data);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Service assigned successfully');
        if (result.invoiceId) {
          toast.success('Invoice generated automatically!');
          router.push(`/invoices/${result.invoiceId}`);
        } else {
          router.push(`/clients/${clientId}`);
        }
      }
    });
  };

  if (!products || products.length === 0) {
    return <div className="alert alert-warning">No active services available in the catalog. Please add some first.</div>;
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="productId">
          <Form.Label>Select Service</Form.Label>
          <Form.Select name="productId" onChange={handleProductChange} required>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (₹{p.defaultPrice.toFixed(2)})</option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="customName">
          <Form.Label>Custom Name (Optional)</Form.Label>
          <Form.Control type="text" name="customName" placeholder="e.g. Primary Domain - myclient.com" />
          <Form.Text className="text-muted">Use this to identify specific instances of the service.</Form.Text>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="price">
          <Form.Label>Assigned Price (₹)</Form.Label>
          <Form.Control required type="number" step="0.01" min="0" name="price" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="billingCycle">
          <Form.Label>Billing Cycle</Form.Label>
          <Form.Select name="billingCycle" defaultValue={selectedProduct?.billingCycle || 'MONTHLY'}>
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
          <Form.Control required type="date" name="startDate" defaultValue={new Date().toISOString().split('T')[0]} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="expiryDate">
          <Form.Label>Expiry/Renewal Date (Optional)</Form.Label>
          <Form.Control type="date" name="expiryDate" />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="12" controlId="notes">
          <Form.Label>Internal Notes</Form.Label>
          <Form.Control as="textarea" rows={2} name="notes" placeholder="Any specific configurations or notes..." />
        </Form.Group>
      </Row>

      <Row className="mb-4">
        <Form.Group as={Col} md="4">
          <Form.Label>Auto-Renew Reminders?</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="autoRenewReminder" name="autoRenewReminder" defaultChecked={selectedProduct?.isRenewable} data-switch="success" />
            <label htmlFor="autoRenewReminder" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
        </Form.Group>
        <Form.Group as={Col} md="4">
          <Form.Label>Auto-Generate Invoice?</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="autoInvoice" name="autoInvoice" defaultChecked={true} data-switch="primary" />
            <label htmlFor="autoInvoice" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
        </Form.Group>
        <Form.Group as={Col} md="4">
          <Form.Label>Initial Status</Form.Label>
          <Form.Select name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Assigning...' : 'Assign Service'}
        </Button>
      </div>
    </Form>
  );
};

export default AssignServiceForm;
