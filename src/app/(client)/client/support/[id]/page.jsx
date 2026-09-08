import { getTicketById } from '@/app/actions/support';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Card, CardBody, Badge } from 'react-bootstrap';
import { notFound } from 'next/navigation';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import ClientTicketThread from './ClientTicketThread';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

export const metadata = {
  title: 'View Support Ticket'
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

const ClientViewTicketPage = async ({ params }) => {
  const { id } = await params;
  const session = await getServerSession(options);
  
  const { data: ticket, error } = await getTicketById(id);

  if (error || !ticket || ticket.clientId !== session?.user?.id) {
    notFound();
  }

  return (
    <>
      <PageTitle title={`Ticket #${ticket.id.split('-')[0].toUpperCase()}`} subTitle='Support' />
      
      <Row className="mb-3">
        <Col>
          <Link href="/client/support" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to My Tickets
          </Link>
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          <Card>
            <CardBody>
              <h5 className="mb-4">Ticket Details</h5>

              <div className="mb-3">
                <p className="text-muted mb-1 fs-12 text-uppercase">Subject</p>
                <h6 className="mb-0">{ticket.subject}</h6>
              </div>

              <div className="mb-3">
                <p className="text-muted mb-1 fs-12 text-uppercase">Category</p>
                <h6 className="mb-0">{ticket.category}</h6>
              </div>

              <div className="mb-3">
                <p className="text-muted mb-1 fs-12 text-uppercase">Priority</p>
                <h6 className="mb-0">{getPriorityBadge(ticket.priority)}</h6>
              </div>

              <div className="mb-3">
                <p className="text-muted mb-1 fs-12 text-uppercase">Status</p>
                <h6 className="mb-0">{getStatusBadge(ticket.status)}</h6>
              </div>

              <div className="mb-3">
                <p className="text-muted mb-1 fs-12 text-uppercase">Created At</p>
                <h6 className="mb-0">{new Date(ticket.createdAt).toLocaleString()}</h6>
              </div>

              <div className="mb-0">
                <p className="text-muted mb-1 fs-12 text-uppercase">Last Updated</p>
                <h6 className="mb-0">{new Date(ticket.updatedAt).toLocaleString()}</h6>
              </div>
            </CardBody>
          </Card>
        </Col>
        
        <Col lg={8}>
          <ClientTicketThread ticket={ticket} />
        </Col>
      </Row>
    </>
  );
};

export default ClientViewTicketPage;
