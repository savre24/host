import { getClientById } from '@/app/actions/client';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row } from 'react-bootstrap';
import EditClientForm from './EditClientForm';

export const metadata = {
  title: 'Edit Client',
};

const EditClientPage = async ({ params }) => {
  const { id } = params;
  const { data: client, error } = await getClientById(id);

  if (error || !client) {
    notFound();
  }

  return (
    <>
      <PageTitle title="Edit Client" subTitle="Clients" />
      <Row className="mb-3">
        <Col>
          <Link href="/clients" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Clients
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="Update Client Details">
            <EditClientForm client={client} />
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default EditClientPage;
