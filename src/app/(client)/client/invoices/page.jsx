import { getClientInvoices } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'My Invoices',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'PAID': return <Badge bg="success">PAID</Badge>;
    case 'PENDING': return <Badge bg="warning">PENDING</Badge>;
    case 'OVERDUE': return <Badge bg="danger">OVERDUE</Badge>;
    case 'CANCELLED': return <Badge bg="secondary">CANCELLED</Badge>;
    default: return <Badge bg="info">DRAFT</Badge>;
  }
};

const ClientInvoicesList = async () => {
  const session = await getServerSession(options);
  const { data: invoices, error } = await getClientInvoices(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Filter out DRAFT invoices so clients don't see them
  const visibleInvoices = (invoices || []).filter(inv => inv.status !== 'DRAFT');

  return (
    <ComponentContainerCard 
      title="My Invoices" 
      description="View and pay your invoices."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <Link href={`/client/invoices/${inv.id}`} className="fw-bold text-primary">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="fw-medium">₹{inv.total.toFixed(2)}</td>
                <td>{getStatusBadge(inv.status)}</td>
                <td className="text-center">
                   <Link href={`/client/invoices/${inv.id}`} className="btn btn-sm btn-outline-info me-2">
                     View
                   </Link>
                   <Link href={`/client/invoices/${inv.id}?download=true`} className="btn btn-sm btn-outline-secondary me-2" title="Download PDF">
                     <IconifyIcon icon="tabler:download" />
                   </Link>
                   {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                     <Link href={`/client/payments/pay/${inv.id}`} className="btn btn-sm btn-primary">
                       Pay Now
                     </Link>
                   )}
                </td>
              </tr>
            ))}
            {visibleInvoices.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientInvoicesPage = () => {
  return (
    <>
      <PageTitle title="My Invoices" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <ClientInvoicesList />
        </Col>
      </Row>
    </>
  );
};

export default ClientInvoicesPage;
