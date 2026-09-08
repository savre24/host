'use client';

import { useState, useTransition } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { recordPayment } from '@/app/actions/billing';
import { toast } from 'react-toastify';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const PaymentModal = ({ invoiceId, balanceDue }) => {
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    startTransition(async () => {
      setError(null);
      const result = await recordPayment(invoiceId, data);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Payment recorded successfully!');
        handleClose();
      }
    });
  };

  return (
    <>
      <Button variant="success" onClick={handleShow}>
        <IconifyIcon icon="tabler:currency-rupee" className="me-1" /> Record Payment
      </Button>

      <Modal show={show} onHide={handleClose} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Record Payment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <Form.Group className="mb-3" controlId="amount">
              <Form.Label>Amount Received (₹)</Form.Label>
              <Form.Control 
                type="number" 
                name="amount" 
                required 
                min="0.01" 
                step="0.01"
                max={balanceDue}
                defaultValue={balanceDue}
              />
              <Form.Text className="text-muted">
                Balance Due: ₹{balanceDue.toFixed(2)}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="paymentDate">
              <Form.Label>Payment Date</Form.Label>
              <Form.Control 
                type="date" 
                name="paymentDate" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="paymentMethod">
              <Form.Label>Payment Method</Form.Label>
              <select name="paymentMethod" className="form-select" required data-choices="false">
                <option value="">Select Method...</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Cashfree Gateway">Cashfree Gateway</option>
                <option value="Other">Other</option>
              </select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="paymentReference">
              <Form.Label>Transaction ID / Reference Number</Form.Label>
              <Form.Control 
                type="text" 
                name="paymentReference" 
                placeholder="e.g. UTR Number or UPI Ref"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Payment'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentModal;
