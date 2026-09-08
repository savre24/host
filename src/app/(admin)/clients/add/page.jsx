'use client';

import { createClient } from '@/app/actions/client';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AddClientPage = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    startTransition(async () => {
      setError(null);
      const result = await createClient(data);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Client created successfully');
        router.push('/clients');
      }
    });
  };

  return (
    <>
      <PageTitle title="Add Client" subTitle="Clients" />
      <Row className="mb-3">
        <Col>
          <Link href="/clients" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Clients
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="Client Details">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} md="6" controlId="name">
                  <Form.Label>Contact Person Name</Form.Label>
                  <Form.Control required type="text" name="name" placeholder="John Doe" />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="companyName">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control type="text" name="companyName" placeholder="Acme Inc." />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="6" controlId="email">
                  <Form.Label>Email (used for login)</Form.Label>
                  <Form.Control required type="email" name="email" placeholder="john@example.com" />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="phone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="text" name="phone" placeholder="+1234567890" />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="12" controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" placeholder="123 Street Name, City, Country" />
                </Form.Group>
              </Row>

              <Row className="mb-4">
                <Form.Group as={Col} md="6" controlId="password">
                  <Form.Label>Initial Password</Form.Label>
                  <Form.Control required type="password" name="password" placeholder="Enter password" />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="12" controlId="notes">
                  <Form.Label>Internal Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} name="notes" placeholder="Any internal notes about this client..." />
                </Form.Group>
              </Row>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Client'}
                </Button>
              </div>
            </Form>
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default AddClientPage;
