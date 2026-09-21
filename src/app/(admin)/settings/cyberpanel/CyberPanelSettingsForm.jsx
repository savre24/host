'use client';

import { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function CyberPanelSettingsForm({ initialData, onSuccess, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const isEditing = !!initialData;
      const url = isEditing ? `/api/cyberpanel/servers/${initialData.id}` : '/api/cyberpanel/servers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(isEditing ? 'Server updated successfully' : 'Server added successfully');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message || 'Failed to save server');
      }
    } catch (err) {
      toast.error('Network error while saving server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Server Name (e.g. CP-01, Main Server)</Form.Label>
        <Form.Control 
          type="text" 
          name="name" 
          defaultValue={initialData?.name || ''} 
          placeholder="CP-01"
          required 
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Panel URL</Form.Label>
        <Form.Control 
          type="url" 
          name="url" 
          defaultValue={initialData?.url || ''} 
          placeholder="https://panel.example.com:8090"
          required 
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Admin Username</Form.Label>
        <Form.Control 
          type="text" 
          name="username" 
          defaultValue={initialData?.username || ''} 
          placeholder="admin"
          required 
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>
          Admin Password
          {initialData && <span className="text-muted ms-2 fw-normal">(Leave blank to keep existing password)</span>}
        </Form.Label>
        <Form.Control 
          type="password" 
          name="password" 
          placeholder={initialData ? "••••••••" : "Enter password"}
          required={!initialData} 
        />
        {/* NEVER render passwordEnc or initial plaintext password here! */}
      </Form.Group>

      {/* Pass isActive along during edit if needed, though toggle is on main page */}
      {initialData && (
        <input type="hidden" name="isActive" value={initialData.isActive} />
      )}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="light" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="me-2" /> : null}
          {initialData ? 'Update Server' : 'Add Server'}
        </Button>
      </div>
    </Form>
  );
}
