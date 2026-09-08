import { getClientServiceById } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row } from 'react-bootstrap';
import EditClientServiceForm from './EditClientServiceForm';

export const metadata = {
  title: 'Edit Assigned Service',
};

const EditClientServicePage = async ({ params }) => {
  const { id } = params;
  const { data: service, error } = await getClientServiceById(id);

  if (error || !service) {
    notFound();
  }

  const clientName = service.client?.user?.name || service.client?.companyName || 'Client';

  return (
    <>
      <PageTitle title={`Edit Service for ${clientName}`} subTitle="Client Services" />
      <Row className="mb-3">
        <Col>
          {/* We use a standard link back to the client profile */}
          <Link href={`/clients/${service.client?.userId || ''}`} className="btn btn-outline-secondary me-2">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Profile
          </Link>
          <Link href="/services" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:device-imac" width={18} height={18} className="me-1" /> All Services
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="Update Service Details">
            <EditClientServiceForm service={service} />
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default EditClientServicePage;
