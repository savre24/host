'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { createClientTicket } from '@/app/actions/client-portal';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const CreateTicketForm = ({ userId, services }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'OTHER',
    priority: 'NORMAL',
    clientServiceId: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createClientTicket(userId, formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push('/client/support');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control 
              type="text" 
              name="subject" 
              placeholder="Brief summary of your issue" 
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Related Service (Optional)</Form.Label>
            <Form.Select name="clientServiceId" value={formData.clientServiceId} onChange={handleChange}>
              <option value="">None</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.customName || service.product?.name} ({service.product?.name})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select name="category" value={formData.category} onChange={handleChange} required>
              <option value="DOMAIN">Domain</option>
              <option value="HOSTING">Hosting</option>
              <option value="WEBSITE">Website</option>
              <option value="SOFTWARE">Software</option>
              <option value="APP">App Development</option>
              <option value="MARKETING">Marketing</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="OTHER">Other / General</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select name="priority" value={formData.priority} onChange={handleChange} required>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={6} 
              name="message" 
              placeholder="Describe your issue in detail..." 
              value={formData.message}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button 
          variant="secondary" 
          onClick={() => router.push('/client/support')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            <>
              <IconifyIcon icon="tabler:send" className="me-1" />
              Submit Ticket
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default CreateTicketForm;
