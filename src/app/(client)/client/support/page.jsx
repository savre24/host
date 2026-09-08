import { getClientTickets } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge, Button } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'My Support Tickets',
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'OPEN': return <Badge bg="primary">OPEN</Badge>;
    case 'IN_PROGRESS': return <Badge bg="warning">IN PROGRESS</Badge>;
    case 'RESOLVED': return <Badge bg="success">RESOLVED</Badge>;
    case 'CLOSED': return <Badge bg="secondary">CLOSED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'HIGH': return <Badge bg="danger">HIGH</Badge>;
    case 'NORMAL': return <Badge bg="info">NORMAL</Badge>;
    case 'LOW': return <Badge bg="secondary">LOW</Badge>;
    default: return <Badge bg="secondary">{priority}</Badge>;
  }
};

const ClientTicketsList = async () => {
  const session = await getServerSession(options);
  const { data: tickets, error } = await getClientTickets(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="Support Tickets" 
      description="View and track your support requests."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {(tickets || []).map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link href={`/client/support/${ticket.id}`} className="fw-medium text-primary">
                    #{ticket.id.substring(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="fw-medium text-wrap" style={{ maxWidth: '300px' }}>
                  {ticket.subject}
                </td>
                <td>{ticket.category}</td>
                <td>{getPriorityBadge(ticket.priority)}</td>
                <td>{getStatusBadge(ticket.status)}</td>
                <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {tickets?.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No support tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientSupportPage = () => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <PageTitle title="My Support Tickets" subTitle="Support" />
        <Link href="/client/support/create" className="btn btn-primary mt-3">
          <IconifyIcon icon="tabler:plus" className="me-1" /> Open New Ticket
        </Link>
      </div>
      <Row>
        <Col xs={12}>
          <ClientTicketsList />
        </Col>
      </Row>
    </>
  );
};

export default ClientSupportPage;
