import { getClients } from '@/app/actions/client';
import { getActiveProducts } from '@/app/actions/product';
import { getTaxSetting, getPaymentGatewaySetting } from '@/app/actions/settings';
import { getInvoiceById } from '@/app/actions/billing';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row } from 'react-bootstrap';
import InvoiceForm from '@/app/(admin)/invoices/create/InvoiceForm';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Edit Invoice',
};

const EditInvoicePage = async ({ params }) => {
  const { id } = params;
  
  // Fetch existing invoice data
  const { data: invoice, error: invoiceError } = await getInvoiceById(id);
  
  if (invoiceError || !invoice) {
    notFound();
  }

  // Fetch all clients to populate the dropdown
  const { data: clients, error: clientsError } = await getClients();
  // Fetch services/products
  const { data: products } = await getActiveProducts();
  
  // Fetch default tax setting
  const { data: taxSetting } = await getTaxSetting();
  const defaultTaxRate = taxSetting?.isEnabled ? taxSetting.percentage : 0;

  // Fetch gateway settings
  const { data: gatewaySetting } = await getPaymentGatewaySetting();
  const onlineChargeRate = gatewaySetting?.onlinePaymentCharge || 2.0;

  return (
    <>
      <PageTitle title={`Edit Invoice ${invoice.invoiceNumber}`} subTitle="Billing" />
      <Row className="mb-3">
        <Col>
          <Link href={`/invoices/${id}`} className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Invoice
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12}>
          <ComponentContainerCard title="Edit Details" description="Modify the details below to update the invoice.">
            {clientsError ? (
              <div className="alert alert-danger">Failed to load clients. Please try again.</div>
            ) : (
              <Col lg={10} className="mx-auto">
                <InvoiceForm 
                  clients={clients || []} 
                  products={products || []} 
                  defaultInvoiceNumber={invoice.invoiceNumber} 
                  defaultTaxRate={defaultTaxRate}
                  onlineChargeRate={onlineChargeRate}
                  initialData={invoice}
                />
              </Col>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default EditInvoicePage;
