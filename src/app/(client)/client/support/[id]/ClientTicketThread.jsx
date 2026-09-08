'use client';

import { useState, useTransition } from 'react';
import { Card, CardBody, CardHeader, Form, Button } from 'react-bootstrap';
import { replyToTicket } from '@/app/actions/support';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

const ClientTicketThread = ({ ticket }) => {
  const { data: session } = useSession();
  const [replyMessage, setReplyMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    const senderId = session?.user?.id;
    if (!senderId) {
      toast.error('You must be logged in to reply.');
      return;
    }

    startTransition(async () => {
      const result = await replyToTicket(ticket.id, senderId, replyMessage);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Reply sent successfully!');
        setReplyMessage('');
      }
    });
  };

  return (
    <Card className="h-100">
      <CardHeader className="d-flex justify-content-between align-items-center bg-light-subtle">
        <h5 className="mb-0">Conversation</h5>
      </CardHeader>

      <CardBody className="d-flex flex-column" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <div className="flex-grow-1 mb-4">
          {ticket.messages.length === 0 ? (
            <div className="text-center text-muted my-5">
              No messages in this thread yet.
            </div>
          ) : (
            ticket.messages.map((msg) => {
              // Check if the message is from the client who opened the ticket
              const isClient = msg.senderId === ticket.clientId;
              
              return (
                <div key={msg.id} className={`d-flex mb-4 ${!isClient ? 'justify-content-start' : 'justify-content-end'}`}>
                  <div className={`p-3 rounded-3 ${isClient ? 'bg-primary-subtle text-dark border border-primary-subtle' : 'bg-light border'}`} style={{ maxWidth: '80%' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold fs-14">
                        {isClient ? 'You' : `${msg.sender.name} (Support)`}
                      </span>
                      <span className="fs-12 text-muted ms-3">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {ticket.status !== 'CLOSED' ? (
          <div className="mt-auto border-top pt-3">
            <Form onSubmit={handleReply}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={isPending}
                  required
                />
              </Form.Group>
              <div className="text-end">
                <Button type="submit" variant="primary" disabled={isPending || !replyMessage.trim()}>
                  {isPending ? 'Sending...' : 'Send Reply'}
                  <IconifyIcon icon="tabler:send" className="ms-2" />
                </Button>
              </div>
            </Form>
          </div>
        ) : (
          <div className="mt-auto border-top pt-3 text-center text-muted">
            This ticket is closed. If you have further issues, please open a new ticket.
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ClientTicketThread;
