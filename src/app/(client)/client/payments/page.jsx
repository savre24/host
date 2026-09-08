import { getClientPayments } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';

export const metadata = {
  title: 'My Payments',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'COMPLETED': return <Badge bg="success">COMPLETED</Badge>;
    case 'PENDING': return <Badge bg="warning">PENDING</Badge>;
    case 'FAILED': return <Badge bg="danger">FAILED</Badge>;
    case 'REFUNDED': return <Badge bg="secondary">REFUNDED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const ClientPaymentsList = async () => {
  const session = await getServerSession(options);
  const { data: payments, error } = await getClientPayments(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="Payment History" 
      description="View all your past payments."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td>
                  <Link href={`/client/invoices/${payment.invoice.id}`} className="text-reset fw-medium text-decoration-underline">
                    {payment.invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="fw-bold text-success">₹{payment.amount.toFixed(2)}</td>
                <td>{payment.paymentMethod || 'Manual'}</td>
                <td>{payment.paymentReference || 'N/A'}</td>
                <td>{getStatusBadge(payment.status)}</td>
              </tr>
            ))}
            {payments?.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientPaymentsPage = () => {
  return (
    <>
      <PageTitle title="My Payments" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <ClientPaymentsList />
        </Col>
      </Row>
    </>
  );
};

export default ClientPaymentsPage;
