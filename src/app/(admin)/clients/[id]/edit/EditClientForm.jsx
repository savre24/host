'use client';

import { updateClient } from '@/app/actions/client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

const EditClientForm = ({ client }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const profile = client.clientProfile || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse boolean for loginStatus
    data.loginStatus = data.loginStatus === 'on';

    startTransition(async () => {
      setError(null);
      const result = await updateClient(client.id, data);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Client updated successfully');
        router.push('/clients');
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="name">
          <Form.Label>Contact Person Name</Form.Label>
          <Form.Control required type="text" name="name" defaultValue={client.name} />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="companyName">
          <Form.Label>Company Name</Form.Label>
          <Form.Control type="text" name="companyName" defaultValue={profile.companyName} />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="email">
          <Form.Label>Email (Read-only)</Form.Label>
          <Form.Control type="email" name="email" defaultValue={client.email} readOnly disabled />
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="phone">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control type="text" name="phone" defaultValue={profile.phone} />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="12" controlId="address">
          <Form.Label>Address</Form.Label>
          <Form.Control as="textarea" rows={2} name="address" defaultValue={profile.address} />
        </Form.Group>
      </Row>

      <Row className="mb-4">
        <Form.Group as={Col} md="6" controlId="password">
          <Form.Label>Reset Password (leave blank to keep current)</Form.Label>
          <Form.Control type="password" name="password" placeholder="Enter new password" autoComplete="new-password" />
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Account Status</Form.Label>
          <div className="mt-2">
            <input 
              type="checkbox" 
              id="loginStatus" 
              name="loginStatus" 
              defaultChecked={profile.loginStatus} 
              data-switch="success" 
            />
            <label htmlFor="loginStatus" data-on-label="Yes" data-off-label="No" className="mb-0 d-block" />
          </div>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="12" controlId="notes">
          <Form.Label>Internal Notes</Form.Label>
          <Form.Control as="textarea" rows={3} name="notes" defaultValue={profile.notes} />
        </Form.Group>
      </Row>

      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Client'}
        </Button>
      </div>
    </Form>
  );
};

export default EditClientForm;
