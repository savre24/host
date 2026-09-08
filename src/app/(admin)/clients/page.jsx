import { getClients } from '@/app/actions/client';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { Col, Row } from 'react-bootstrap';
import ClientActions from './ClientActions';
import ClientSearch from './ClientSearch';

export const metadata = {
  title: 'Clients Management',
};

const ClientsList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: clients, error } = await getClients(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="All Clients" 
      description="Manage all clients, their services, and billing information."
    >
      <ClientSearch />
      <div className="table-responsive-sm">
        <table className="table table-striped mb-0">
          <thead>
            <tr>
              <th>Name / Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((client, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{client.name}</strong>
                  {client.clientProfile?.companyName && (
                    <div className="text-muted fs-12">{client.clientProfile.companyName}</div>
                  )}
                </td>
                <td>{client.email}</td>
                <td>{client.clientProfile?.phone || '-'}</td>
                <td>
                  {client.clientProfile?.loginStatus ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-danger">Disabled</span>
                  )}
                </td>
                <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                <ClientActions clientId={client.id} />
              </tr>
            ))}
            {clients?.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ComponentContainerCard>
  );
};

const ClientsPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Clients" subTitle="Management" />
      <Row className="mb-3">
        <Col className="text-end">
          <Link href="/clients/add" className="btn btn-primary">
            <IconifyIcon icon="tabler:plus" width={18} height={18} className="me-1" /> Add New Client
          </Link>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <ClientsList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default ClientsPage;
