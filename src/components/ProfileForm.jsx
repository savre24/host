'use client';

import { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { updateUserProfile } from '@/app/actions/profile';
import { useSession } from 'next-auth/react';

export default function ProfileForm({ initialData }) {
  const { update } = useSession();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    image: initialData?.image || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await updateUserProfile({
      name: formData.name,
      image: formData.image,
      password: formData.password
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      // Tell NextAuth to fetch new session to update navbar name/image
      update();
    } else {
      setMessage({ type: 'danger', text: res.error });
    }
    setLoading(false);
  };

  return (
    <Card>
      <Card.Body>
        <h4 className="header-title mb-3">My Account</h4>
        {message && <Alert variant={message.type} className="mb-3">{message.text}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Profile Image</Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <div className="border p-1 rounded bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '50%' }}>
                    {formData.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <span className="text-muted small">No image</span>
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
                            setFormData(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Form.Text className="text-muted mt-2 d-block">Upload a square image for your avatar.</Form.Text>
                  </div>
                </div>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address (Read-only)</Form.Label>
                <Form.Control
                  type="email"
                  value={initialData?.email || ''}
                  readOnly
                  disabled
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
