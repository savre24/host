import { getClientRenewals } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import { Col, Row, Table, Badge, Button } from 'react-bootstrap';
import Link from 'next/link';

export const metadata = {
  title: 'My Renewals',
};

const getStatusBadge = (status, invoice) => {
  if (invoice && invoice.status === 'DRAFT') {
    return <Badge bg="warning">PENDING</Badge>;
  }
  switch (status) {
    case 'INVOICED': return <Badge bg="info">INVOICED</Badge>;
    case 'PAID': return <Badge bg="success">PAID</Badge>;
    case 'PENDING': return <Badge bg="warning">PENDING</Badge>;
    case 'OVERDUE': return <Badge bg="danger">OVERDUE</Badge>;
    case 'CANCELLED': return <Badge bg="secondary">CANCELLED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const ClientRenewalsList = async () => {
  const session = await getServerSession(options);
  const { data: renewals, error } = await getClientRenewals(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="Upcoming & Overdue Renewals" 
      description="Track the renewal dates and statuses of your active subscriptions."
    >
      <div className="table-responsive">
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Service</th>
              <th>Renewal Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(renewals || []).map((renewal) => (
              <tr key={renewal.id}>
                <td>
                  <div className="fw-medium text-primary">
                    {renewal.clientService?.customName || renewal.clientService?.product?.name || 'N/A'}
                  </div>
                  <small className="text-muted">{renewal.clientService?.product?.name}</small>
                </td>
                <td>
                  <span className={new Date(renewal.renewalDate) < new Date() && renewal.status === 'PENDING' ? 'text-danger fw-medium' : ''}>
                    {new Date(renewal.renewalDate).toLocaleDateString()}
                  </span>
                </td>
                <td>₹{renewal.amount?.toFixed(2)}</td>
                <td>{getStatusBadge(renewal.status, renewal.invoice)}</td>
                <td>
                  {renewal.invoice && renewal.invoice.status !== 'DRAFT' ? (
                    <Link href={`/client/invoices/${renewal.invoiceId}`} className="text-primary text-decoration-underline">
                      {renewal.invoice.invoiceNumber || 'View Invoice'}
                    </Link>
                  ) : (
                    <span className="text-muted">Not Generated</span>
                  )}
                </td>
                <td>
                  {renewal.status === 'PENDING' && renewal.invoiceId && renewal.invoice?.status !== 'DRAFT' && (
                    <Link href={`/client/invoices/${renewal.invoiceId}`}>
                      <Button variant="primary" size="sm">Pay Now</Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {renewals?.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  You have no pending or upcoming renewals.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientRenewalsPage = () => {
  return (
    <>
      <PageTitle title="My Renewals" subTitle="Renewals" />
      <Row>
        <Col xs={12}>
          <ClientRenewalsList />
        </Col>
      </Row>
    </>
  );
};

export default ClientRenewalsPage;
