'use client';

import { useState, useTransition } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { requestDomainAction } from '@/app/actions/clientRequests';

export default function DomainActionsClient({ serviceId, domainName }) {
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'TRANSFER' or 'DNS_UPDATE'
  const [isPending, startTransition] = useTransition();

  const handleShow = (type) => {
    setActionType(type);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const details = formData.get('details');

    startTransition(async () => {
      const result = await requestDomainAction(serviceId, actionType, details);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          actionType === 'TRANSFER' 
            ? 'Transfer request submitted successfully. A support ticket has been created.'
            : 'DNS update request submitted successfully. A support ticket has been created.'
        );
        setShowModal(false);
      }
    });
  };

  return (
    <div className="d-flex flex-wrap gap-2 mt-4">
      <Button variant="warning" onClick={() => handleShow('TRANSFER')}>
        Request Domain Transfer
      </Button>
      <Button variant="info" onClick={() => handleShow('DNS_UPDATE')}>
        Request DNS Record Update
      </Button>

      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'TRANSFER' ? 'Domain Transfer Request' : 'DNS Update Request'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <p>
              You are requesting a {actionType === 'TRANSFER' ? 'transfer' : 'DNS update'} for <strong>{domainName}</strong>. 
              This will open a support ticket with our team.
            </p>
            <Form.Group controlId="details">
              <Form.Label>Please provide additional details or requirements:</Form.Label>
              <Form.Control as="textarea" rows={4} name="details" required placeholder={
                actionType === 'TRANSFER' 
                  ? "Enter details such as the new registrar or transfer authorization codes if applicable." 
                  : "Enter the new DNS records (e.g., A record, MX records, Nameservers) you wish to set."
              } />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
