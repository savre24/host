'use client';

import { createProduct } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AddProductPage = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Parse booleans
    data.isRenewable = data.isRenewable === 'on';
    data.isActive = data.isActive === 'on';

    startTransition(async () => {
      setError(null);
      const result = await createProduct(data);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Service created successfully');
        router.push('/products');
      }
    });
  };

  return (
    <>
      <PageTitle title="Add Service" subTitle="Catalog" />
      <Row className="mb-3">
        <Col>
          <Link href="/products" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Catalog
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="Service Details">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} md="6" controlId="name">
                  <Form.Label>Service Name</Form.Label>
                  <Form.Control required type="text" name="name" placeholder="e.g. Website Hosting" />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="category">
                  <Form.Label>Category</Form.Label>
                  <Form.Select name="category" defaultValue="GENERAL">
                    <option value="GENERAL">General</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="HOSTING">Hosting</option>
                    <option value="DESIGN">Design</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="RETAINER">Retainer</option>
                  </Form.Select>
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="12" controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" placeholder="Service description..." />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="6" controlId="defaultPrice">
                  <Form.Label>Default Price (₹)</Form.Label>
                  <Form.Control required type="number" step="0.01" min="0" name="defaultPrice" placeholder="0.00" />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="billingCycle">
                  <Form.Label>Billing Cycle</Form.Label>
                  <Form.Select name="billingCycle" defaultValue="ONE_TIME">
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
                <Form.Group as={Col} md="6">
                  <Form.Label>Is Renewable?</Form.Label>
                  <div className="mt-2">
                    <input type="checkbox" id="isRenewable" name="isRenewable" data-switch="success" />
                    <label htmlFor="isRenewable" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
                  </div>
                  <Form.Text className="text-muted">
                    Does this service require renewal tracking?
                  </Form.Text>
                </Form.Group>
                <Form.Group as={Col} md="6">
                  <Form.Label>Status</Form.Label>
                  <div className="mt-2">
                    <input type="checkbox" id="isActive" name="isActive" defaultChecked data-switch="success" />
                    <label htmlFor="isActive" data-on-label="Active" data-off-label="Draft" className="mb-0 d-block" />
                  </div>
                </Form.Group>
              </Row>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Service'}
                </Button>
              </div>
            </Form>
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default AddProductPage;
