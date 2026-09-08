import { getTickets } from '@/app/actions/support';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Support Tickets',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'OPEN': return <Badge bg="primary">OPEN</Badge>;
    case 'ANSWERED': return <Badge bg="info">ANSWERED</Badge>;
    case 'CUSTOMER_REPLY': return <Badge bg="warning">CUSTOMER REPLY</Badge>;
    case 'CLOSED': return <Badge bg="success">CLOSED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (priority) => {
  switch(priority) {
    case 'HIGH': return <Badge bg="danger">HIGH</Badge>;
    case 'NORMAL': return <Badge bg="info">NORMAL</Badge>;
    case 'LOW': return <Badge bg="secondary">LOW</Badge>;
    default: return <Badge bg="secondary">{priority}</Badge>;
  }
};

const TicketsList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const status = searchParams?.status || '';
  
  const { data: tickets, error } = await getTickets(query, status);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="All Support Tickets" 
      description="Manage and respond to client support queries."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Client</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {(tickets || []).map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link href={`/support/${ticket.id}`} className="fw-bold text-primary">
                    {ticket.id.split('-')[0].toUpperCase()}
                  </Link>
                </td>
                <td>
                  <Link href={`/clients/${ticket.client.id}`} className="text-reset fw-medium">
                    {ticket.client.name}
                  </Link>
                </td>
                <td>
                  <Link href={`/support/${ticket.id}`} className="text-reset text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                    {ticket.subject}
                  </Link>
                </td>
                <td>{ticket.category}</td>
                <td>{getPriorityBadge(ticket.priority)}</td>
                <td>{getStatusBadge(ticket.status)}</td>
                <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                <td className="text-center">
                  <Link href={`/support/${ticket.id}`} className="btn btn-sm btn-outline-info">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {tickets?.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4">
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

const SupportPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Support Tickets" subTitle="Support" />
      <Row>
        <Col xs={12}>
          <TicketsList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default SupportPage;
