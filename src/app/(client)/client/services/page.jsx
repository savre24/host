import { getClientServices } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import Link from 'next/link';

export const metadata = {
  title: 'My Services',
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'ACTIVE': return <Badge bg="success">ACTIVE</Badge>;
    case 'SUSPENDED': return <Badge bg="warning">SUSPENDED</Badge>;
    case 'CANCELLED': return <Badge bg="danger">CANCELLED</Badge>;
    case 'EXPIRED': return <Badge bg="secondary">EXPIRED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const ClientServicesList = async () => {
  const session = await getServerSession(options);
  const { data: services, error } = await getClientServices(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!services || services.length === 0) {
    return (
      <ComponentContainerCard title="My Services">
        <div className="text-center py-4">
          You have no assigned services.
        </div>
      </ComponentContainerCard>
    );
  }

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.product.category || 'Other Services';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <ComponentContainerCard 
          key={category}
          title={category} 
          description={`Your active and past ${category.toLowerCase()} subscriptions.`}
          className="mb-4"
        >
          <div className="table-responsive">
            <Table className="mb-0 table-striped align-middle table-hover">
              <thead>
                <tr>
                  <th>Domain/Identifier</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Billing Cycle</th>
                  <th>Next Renewal</th>
                  <th>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                {categoryServices.map((service) => (
                  <tr key={service.id}>
                    <td className="fw-medium text-primary">
                      {category.toUpperCase() === 'DOMAIN' ? (
                        <Link href={`/client/services/${service.id}`} className="text-primary text-decoration-underline">
                          {service.customName || 'N/A'}
                        </Link>
                      ) : (
                        service.customName || 'N/A'
                      )}
                    </td>
                    <td>
                      <span className="fw-medium">{service.product.name}</span>
                      {service.product.isRenewable && (
                        <span className="badge bg-info-subtle text-info ms-2">Recurring</span>
                      )}
                    </td>
                    <td>{getStatusBadge(service.status)}</td>
                    <td className="text-capitalize">{service.billingCycle.toLowerCase()}</td>
                    <td>
                      {service.product.isRenewable && service.expiryDate
                        ? new Date(service.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{new Date(service.startDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </ComponentContainerCard>
      ))}
    </>
  );
};

const ClientServicesPage = () => {
  return (
    <>
      <PageTitle title="My Services" subTitle="Services" />
      <Row>
        <Col xs={12}>
          <ClientServicesList />
        </Col>
      </Row>
    </>
  );
};

export default ClientServicesPage;
