'use client';

import { updateTaxSetting } from '@/app/actions/settings';
import { useTransition, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

const TaxSettingsForm = ({ initialData }) => {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(initialData?.isEnabled ?? true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse boolean manually since checkbox omitted means false
    data.isEnabled = e.target.isEnabled.checked;

    startTransition(async () => {
      const result = await updateTaxSetting(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tax settings updated successfully!');
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-4">
        <Form.Check 
          type="switch"
          id="tax-enabled"
          name="isEnabled"
          label="Enable Global Tax Calculation"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        <Form.Text className="text-muted">
          If turned off, no tax will be applied to newly generated invoices.
        </Form.Text>
      </Form.Group>

      {isEnabled && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Tax Name</Form.Label>
            <Form.Control 
              type="text" 
              name="taxName" 
              defaultValue={initialData?.taxName || 'GST'} 
              placeholder="e.g. GST, VAT, Sales Tax"
              required 
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Tax Percentage (%)</Form.Label>
            <Form.Control 
              type="number" 
              name="percentage" 
              step="0.01" 
              min="0"
              defaultValue={initialData?.percentage || 18.0} 
              required 
            />
          </Form.Group>
        </>
      )}

      <div className="d-flex justify-content-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? <Spinner size="sm" className="me-2" /> : null}
          Save Settings
        </Button>
      </div>
    </Form>
  );
};

export default TaxSettingsForm;
