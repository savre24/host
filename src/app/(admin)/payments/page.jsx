import { getPayments } from '@/app/actions/payments';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Payments',
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

const PaymentsList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: payments, error } = await getPayments(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="Payment History" 
      description="View all recorded payments in the system."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
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
                  <Link href={`/clients/${payment.client.id}`} className="text-reset fw-medium">
                    {payment.client.user.name || payment.client.companyName}
                  </Link>
                </td>
                <td>
                  <Link href={`/invoices/${payment.invoice.id}`} className="text-reset fw-medium">
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
                <td colSpan="7" className="text-center py-4">
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

const PaymentsPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Payments" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <PaymentsList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default PaymentsPage;
