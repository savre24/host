import { getClients } from '@/app/actions/client';
import { getActiveProducts } from '@/app/actions/product';
import { getTaxSetting, getPaymentGatewaySetting } from '@/app/actions/settings';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row } from 'react-bootstrap';
import InvoiceForm from './InvoiceForm';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Create Invoice',
};

const CreateInvoicePage = async () => {
  // Fetch all clients to populate the dropdown
  const { data: clients, error } = await getClients();
  // Fetch services/products
  const { data: products } = await getActiveProducts();
  
  // Fetch default tax setting
  const { data: taxSetting } = await getTaxSetting();
  const defaultTaxRate = taxSetting?.isEnabled ? taxSetting.percentage : 0;

  // Fetch gateway settings
  const { data: gatewaySetting } = await getPaymentGatewaySetting();
  const onlineChargeRate = gatewaySetting?.onlinePaymentCharge || 2.0;

  // Generate a random invoice number like INV-2026-XXXXX
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const autoInvoiceNumber = `INV-${new Date().getFullYear()}-${randomStr}`;

  return (
    <>
      <PageTitle title="Create New Invoice" subTitle="Billing" />
      <Row className="mb-3">
        <Col>
          <Link href="/invoices" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Invoices
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title="Invoice Details" description="Fill out the details below to generate a new invoice.">
            {error ? (
              <div className="alert alert-danger">Failed to load clients. Please try again.</div>
            ) : (
              <Col lg={10} className="mx-auto">
                <InvoiceForm 
                  clients={clients || []} 
                  products={products || []} 
                  defaultInvoiceNumber={autoInvoiceNumber} 
                  defaultTaxRate={defaultTaxRate}
                  onlineChargeRate={onlineChargeRate}
                />
              </Col>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default CreateInvoicePage;
