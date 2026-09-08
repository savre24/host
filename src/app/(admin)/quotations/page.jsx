import { getQuotations } from '@/app/actions/quotations';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import QuotationSearch from './QuotationSearch';
import QuotationActions from './QuotationActions';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Quotations',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'ACCEPTED': return <Badge bg="success">ACCEPTED</Badge>;
    case 'SENT': return <Badge bg="primary">SENT</Badge>;
    case 'REJECTED': return <Badge bg="danger">REJECTED</Badge>;
    case 'CONVERTED': return <Badge bg="info">CONVERTED</Badge>;
    default: return <Badge bg="secondary">DRAFT</Badge>;
  }
};

const QuotationsList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: quotations, error } = await getQuotations(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="All Quotations" 
      description="Manage all your client quotations here."
      action={
        <Link href="/quotations/create" className="btn btn-sm btn-primary">
          <IconifyIcon icon="tabler:plus" className="me-1" /> Create Quotation
        </Link>
      }
    >
      <QuotationSearch />
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle">
          <thead>
          <tr>
            <th>Quotation #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Valid Until</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {(quotations || []).map((inv) => (
            <tr key={inv.id}>
              <td>
                <Link href={`/quotations/${inv.id}`} className="fw-bold text-primary">
                  {inv.quotationNumber}
                </Link>
              </td>
              <td>
                <Link href={`/clients/${inv.client.user.id}`} className="text-reset fw-medium">
                  {inv.client.user.name || inv.client.companyName}
                </Link>
              </td>
              <td>{new Date(inv.date).toLocaleDateString()}</td>
              <td>{new Date(inv.validUntil).toLocaleDateString()}</td>
              <td className="fw-medium">₹{inv.total.toFixed(2)}</td>
              <td>{getStatusBadge(inv.status)}</td>
              <QuotationActions quotationId={inv.id} status={inv.status} />
            </tr>
          ))}
          {quotations?.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No quotations found. Create your first quotation!
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      </div>
    </ComponentContainerCard>
  );
};

const QuotationsPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Quotations" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <QuotationsList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default QuotationsPage;