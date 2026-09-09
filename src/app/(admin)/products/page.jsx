import { getProducts } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { Col, Row } from 'react-bootstrap';
import ProductActions from './ProductActions';
import ProductSearch from './ProductSearch';

export const metadata = {
  title: 'Products & Services Catalog',
};

const ProductsList = async ({ searchParams }) => {
  const query = searchParams?.q || '';
  const { data: products, error } = await getProducts(query);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ComponentContainerCard 
      title="Service Catalog" 
      description="Manage the services and products you offer to your clients."
    >
      <ProductSearch />
      <div className="table-responsive-sm">
        <table className="table table-striped mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Initial Price</th>
              <th>Renewal Price</th>
              <th>Billing Cycle</th>
              <th>Renewable</th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((product, idx) => (
              <tr key={idx}>
                <td><strong>{product.name}</strong></td>
                <td><span className="badge bg-secondary-subtle text-secondary">{product.category}</span></td>
                <td>₹{product.defaultPrice.toFixed(2)}</td>
                <td>{product.renewalPrice ? `₹${product.renewalPrice.toFixed(2)}` : '-'}</td>
                <td>{product.billingCycle}</td>
                <td>{product.isRenewable ? 'Yes' : 'No'}</td>
                <td>
                  {product.isActive ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-danger">Inactive</span>
                  )}
                </td>
                <ProductActions productId={product.id} />
              </tr>
            ))}
            {products?.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No products or services found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ComponentContainerCard>
  );
};

const ProductsPage = ({ searchParams }) => {
  return (
    <>
      <PageTitle title="Products & Services" subTitle="Catalog" />
      <Row className="mb-3">
        <Col className="text-end">
          <Link href="/products/add" className="btn btn-primary">
            <IconifyIcon icon="tabler:plus" width={18} height={18} className="me-1" /> Add New Service
          </Link>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <ProductsList searchParams={searchParams} />
        </Col>
      </Row>
    </>
  );
};

export default ProductsPage;
