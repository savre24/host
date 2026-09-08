import { getAllClientServices } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table } from 'react-bootstrap';
import ServiceSearch from './ServiceSearch';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Client Services',
};

const ClientServicesList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: services, error } = await getAllClientServices(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="All Client Services" 
      description="A master list of all active, expiring, and suspended services assigned to your clients."
    >
      <ServiceSearch />
      <Table responsive className="mb-0 table-striped">
        <thead>
          <tr>
            <th>Client</th>
            <th>Service / Product</th>
            <th>Custom Name</th>
            <th>Price</th>
            <th>Billing</th>
            <th>Status</th>
            <th>Next Renewal</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {(services || []).map((svc) => (
            <tr key={svc.id}>
              <td>
                <Link href={`/clients/${svc.client.user.id}`} className="text-primary fw-medium">
                  {svc.client.user.name || svc.client.companyName}
                </Link>
                {svc.client.companyName && svc.client.user.name && (
                  <div className="text-muted fs-12">{svc.client.companyName}</div>
                )}
              </td>
              <td>{svc.product?.name || 'Unknown'}</td>
              <td>{svc.customName || '-'}</td>
              <td>₹{svc.price.toFixed(2)}</td>
              <td>{svc.billingCycle}</td>
              <td>
                <span className={`badge ${svc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                  {svc.status}
                </span>
              </td>
              <td>{svc.expiryDate ? new Date(svc.expiryDate).toLocaleDateString() : 'N/A'}</td>
              <td className="text-center">
                <Link href={`/clients/${svc.client.user.id}`} className="btn btn-sm btn-outline-primary" title="View Client">
                  <IconifyIcon icon="tabler:arrow-right" width={16} height={16} />
                </Link>
              </td>
            </tr>
          ))}
          {services?.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center py-4">
                No client services found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </ComponentContainerCard>
  );
};

const ServicesPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Client Services" subTitle="Dashboard" />
      <Row>
        <Col xs={12}>
          <ClientServicesList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default ServicesPage;
