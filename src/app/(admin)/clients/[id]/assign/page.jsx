import { getClientById } from '@/app/actions/client';
import { getActiveProducts } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row } from 'react-bootstrap';
import AssignServiceForm from './AssignServiceForm';

export const metadata = {
  title: 'Assign Service to Client',
};

const AssignServicePage = async ({ params }) => {
  const { id } = params;
  
  // Fetch client details
  const { data: client, error: clientError } = await getClientById(id);
  
  if (clientError || !client) {
    notFound();
  }

  // Fetch active products
  const { data: products, error: productsError } = await getActiveProducts();

  return (
    <>
      <PageTitle title={`Assign Service: ${client.name}`} subTitle="Clients" />
      <Row className="mb-3">
        <Col>
          <Link href={`/clients/${id}`} className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Profile
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="New Service Assignment" description={`Assigning a new service to ${client.name} (${client.clientProfile.companyName})`}>
            {productsError ? (
              <div className="alert alert-danger">Failed to load services.</div>
            ) : (
              <AssignServiceForm 
                clientId={id} 
                clientProfileId={client.clientProfile.id} 
                products={products} 
              />
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default AssignServicePage;
