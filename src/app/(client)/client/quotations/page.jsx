import { getClientQuotations } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'My Quotations',
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'ACCEPTED': return <Badge bg="success">ACCEPTED</Badge>;
    case 'PENDING': return <Badge bg="warning">PENDING</Badge>;
    case 'REJECTED': return <Badge bg="danger">REJECTED</Badge>;
    default: return <Badge bg="info">DRAFT</Badge>;
  }
};

const ClientQuotationsList = async () => {
  const session = await getServerSession(options);
  const { data: quotations, error } = await getClientQuotations(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Filter out DRAFT quotations
  const visibleQuotations = (quotations || []).filter(q => q.status !== 'DRAFT');

  return (
    <ComponentContainerCard 
      title="My Quotations" 
      description="View your requested estimates and quotes."
    >
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <Table className="mb-0 table-striped align-middle table-hover">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleQuotations.map((quote) => (
              <tr key={quote.id}>
                <td>
                  <Link href={`/client/quotations/${quote.id}`} className="fw-bold text-primary">
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td>{new Date(quote.date).toLocaleDateString()}</td>
                <td>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}</td>
                <td className="fw-medium">₹{quote.total.toFixed(2)}</td>
                <td>{getStatusBadge(quote.status)}</td>
                <td className="text-center">
                   <Link href={`/client/quotations/${quote.id}`} className="btn btn-sm btn-outline-info">
                     View details
                   </Link>
                </td>
              </tr>
            ))}
            {visibleQuotations.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientQuotationsPage = () => {
  return (
    <>
      <PageTitle title="My Quotations" subTitle="Billing" />
      <Row>
        <Col xs={12}>
          <ClientQuotationsList />
        </Col>
      </Row>
    </>
  );
};

export default ClientQuotationsPage;
