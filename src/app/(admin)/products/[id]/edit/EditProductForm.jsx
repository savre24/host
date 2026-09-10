'use client';

import { updateProduct } from '@/app/actions/product';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const EditProductForm = ({ product }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse booleans
    data.isRenewable = data.isRenewable === 'on';
    data.applyOnlineCharge = data.applyOnlineCharge === 'on';
    data.isActive = data.isActive === 'on';

    startTransition(async () => {
      setError(null);
      const result = await updateProduct(product.id, data);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Service updated successfully');
        router.push('/products');
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="name">
          <Form.Label>Service Name</Form.Label>
          <Form.Control required type="text" name="name" defaultValue={product.name} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="category">
          <Form.Label>Category</Form.Label>
          <Form.Select name="category" defaultValue={product.category}>
            <option value="GENERAL">General</option>
            <option value="DOMAIN">Domain</option>
            <option value="HOSTING">Hosting</option>
            <option value="RADIO_SERVER">Radio Server</option>
            <option value="DESIGN">Design</option>
            <option value="MARKETING">Marketing</option>
            <option value="RETAINER">Retainer</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="12" controlId="description">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={3} name="description" defaultValue={product.description} />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="4" controlId="defaultPrice">
          <Form.Label>Default Price (₹)</Form.Label>
          <Form.Control required type="number" step="0.01" min="0" name="defaultPrice" defaultValue={product.defaultPrice} />
        </Form.Group>
        <Form.Group as={Col} md="4" controlId="renewalPrice">
          <Form.Label>Renewal Price (₹)</Form.Label>
          <Form.Control type="number" step="0.01" min="0" name="renewalPrice" defaultValue={product.renewalPrice || ''} placeholder="Same as default" />
        </Form.Group>
        <Form.Group as={Col} md="4" controlId="billingCycle">
          <Form.Label>Billing Cycle</Form.Label>
          <Form.Select name="billingCycle" defaultValue={product.billingCycle}>
            <option value="ONE_TIME">One-time</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="HALF_YEARLY">Semi-Annually</option>
            <option value="YEARLY">Annually</option>
            <option value="CUSTOM">Custom</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-4">
        <Form.Group as={Col} md="4">
          <Form.Label>Is Renewable?</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="isRenewable" name="isRenewable" defaultChecked={product.isRenewable} data-switch="success" />
            <label htmlFor="isRenewable" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
          <Form.Text className="text-muted">
            Does this service require renewal tracking?
          </Form.Text>
        </Form.Group>
        <Form.Group as={Col} md="4">
          <Form.Label>Online Charge?</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="applyOnlineCharge" name="applyOnlineCharge" defaultChecked={product.applyOnlineCharge} data-switch="success" />
            <label htmlFor="applyOnlineCharge" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
          <Form.Text className="text-muted">
            Apply online payment fee?
          </Form.Text>
        </Form.Group>
        <Form.Group as={Col} md="4">
          <Form.Label>Status</Form.Label>
          <div className="mt-2">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={product.isActive} data-switch="success" />
            <label htmlFor="isActive" data-on-label="Active" data-off-label="Draft" className="mb-0 d-block" />
          </div>
        </Form.Group>
      </Row>

      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Service'}
        </Button>
      </div>
    </Form>
  );
};

export default EditProductForm;
