'use client';

import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { updatePaymentGatewaySetting } from '@/app/actions/settings';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const CashfreeSettingsForm = ({ initialData }) => {
  const [formData, setFormData] = useState({
    appId: initialData?.appId || '',
    secretKey: initialData?.secretKey || '',
    environment: initialData?.environment || 'TEST',
    isActive: initialData?.isActive || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updatePaymentGatewaySetting(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Cashfree API settings updated successfully!' });
    } else {
      setMessage({ type: 'danger', text: result.error || 'Failed to update settings.' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {message && <Alert variant={message.type} className="mb-3">{message.text}</Alert>}

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Check 
              type="switch"
              id="cashfree-active-switch"
              name="isActive"
              label="Enable Cashfree Payment Gateway"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Environment</Form.Label>
            <Form.Select
              name="environment"
              value={formData.environment}
              onChange={handleChange}
            >
              <option value="TEST">Sandbox (Test Mode)</option>
              <option value="PRODUCTION">Production (Live Mode)</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>App ID</Form.Label>
            <Form.Control
              type="text"
              name="appId"
              value={formData.appId}
              onChange={handleChange}
              placeholder="e.g. TEST123456789"
              required={formData.isActive}
            />
          </Form.Group>
        </Col>
        
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Secret Key</Form.Label>
            <Form.Control
              type="password"
              name="secretKey"
              value={formData.secretKey}
              onChange={handleChange}
              placeholder="Your Secret API Key"
              required={formData.isActive}
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mt-3">
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : (
            <IconifyIcon icon="tabler:device-floppy" className="me-1" />
          )}
          Save API Keys
        </Button>
      </div>
    </Form>
  );
};

export default CashfreeSettingsForm;
