'use client';

import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { updateBusinessSetting } from '@/app/actions/settings';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const BusinessSettingsForm = ({ initialData }) => {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    gstNumber: initialData?.gstNumber || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateBusinessSetting(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Business settings updated successfully!' });
    } else {
      setMessage({ type: 'danger', text: result.error || 'Failed to update settings.' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {message && <Alert variant={message.type} className="mb-3">{message.text}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Company Logo</Form.Label>
            <div className="d-flex align-items-start gap-3">
              <div className="border p-1 rounded bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                {formData.logoUrl || initialData?.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formData.logoUrl || initialData?.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span className="text-muted small">No logo</span>
                )}
              </div>
              <div className="flex-grow-1">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Form.Text className="text-muted mt-2 d-block">Upload a logo to display on invoices and client portal.</Form.Text>
              </div>
            </div>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Small Icon (Sidebar collapsed)</Form.Label>
            <div className="d-flex align-items-start gap-3">
              <div className="border p-1 rounded bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                {formData.iconUrl || initialData?.iconUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formData.iconUrl || initialData?.iconUrl} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span className="text-muted small">No icon</span>
                )}
              </div>
              <div className="flex-grow-1">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, iconUrl: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Form.Text className="text-muted mt-2 d-block">Square icon to display when sidebar is collapsed.</Form.Text>
              </div>
            </div>
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Company Name</Form.Label>
            <Form.Control
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Business Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>GST Number (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
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
          Save Business Details
        </Button>
      </div>
    </Form>
  );
};

export default BusinessSettingsForm;
