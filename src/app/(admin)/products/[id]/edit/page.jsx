import { getProductById } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row } from 'react-bootstrap';
import EditProductForm from './EditProductForm';

export const metadata = {
  title: 'Edit Service',
};

const EditProductPage = async ({ params }) => {
  const { id } = params;
  const { data: product, error } = await getProductById(id);

  if (error || !product) {
    notFound();
  }

  return (
    <>
      <PageTitle title="Edit Service" subTitle="Catalog" />
      <Row className="mb-3">
        <Col>
          <Link href="/products" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Catalog
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <ComponentContainerCard title="Update Service Details">
            <EditProductForm product={product} />
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default EditProductPage;
