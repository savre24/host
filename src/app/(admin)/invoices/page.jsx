import { getInvoices } from '@/app/actions/billing';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import InvoiceSearch from './InvoiceSearch';
import InvoiceActions from './InvoiceActions';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Invoices',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'PAID': return <Badge bg="success">PAID</Badge>;
    case 'UNPAID': return <Badge bg="warning">UNPAID</Badge>;
    case 'OVERDUE': return <Badge bg="danger">OVERDUE</Badge>;
    case 'CANCELLED': return <Badge bg="secondary">CANCELLED</Badge>;
    default: return <Badge bg="info">DRAFT</Badge>;
  }
};

const InvoicesList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: invoices, error } = await getInvoices(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="All Invoices" 
      description="Manage all your client invoices here."
      action={
        <Link href="/invoices/create" className="btn btn-sm btn-primary">
          <IconifyIcon icon="tabler:plus" className="me-1" /> Create Invoice
        </Link>
      }
    >
      <InvoiceSearch />
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle">
          <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {(invoices || []).map((inv) => (
            <tr key={inv.id}>
              <td>
                <Link href={`/invoices/${inv.id}`} className="fw-bold text-primary">
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td>
                <Link href={`/clients/${inv.client.user.id}`} className="text-reset fw-medium">
                  {inv.client.user.name || inv.client.companyName}
                </Link>
              </td>
              <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
              <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
              <td className="fw-medium">₹{inv.total.toFixed(2)}</td>
              <td>{getStatusBadge(inv.status)}</td>
              <InvoiceActions invoiceId={inv.id} status={inv.status} />
            </tr>
          ))}
          {invoices?.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No invoices found. Create your first invoice!
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      </div>
    </ComponentContainerCard>
  );
};

const InvoicesPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Invoices" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <InvoicesList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default InvoicesPage;