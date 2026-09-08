import { getTaxSetting, getBusinessSetting, getPaymentGatewaySetting } from '@/app/actions/settings';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import { Col, Row } from 'react-bootstrap';
import TaxSettingsForm from './TaxSettingsForm';
import BusinessSettingsForm from './BusinessSettingsForm';
import CashfreeSettingsForm from './CashfreeSettingsForm';

export const metadata = {
  title: 'Global Settings',
};

const SettingsPage = async () => {
  const { data: taxSetting } = await getTaxSetting();
  const { data: businessSetting } = await getBusinessSetting();
  const { data: paymentGatewaySetting } = await getPaymentGatewaySetting();

  return (
    <>
      <PageTitle title="Settings" subTitle="System" />
      <Row>
        <Col lg={6}>
          <ComponentContainerCard 
            title="Business Details" 
            description="Manage your primary company profile information."
            className="mb-4"
          >
            <BusinessSettingsForm initialData={businessSetting} />
          </ComponentContainerCard>
        </Col>
        
        <Col lg={6}>
          <ComponentContainerCard 
            title="Tax Configuration" 
            description="Configure global tax settings applied to all new and auto-generated invoices."
            className="mb-4"
          >
            <TaxSettingsForm initialData={taxSetting} />
          </ComponentContainerCard>
          
          <ComponentContainerCard 
            title="Cashfree Payment Gateway API" 
            description="Configure your Cashfree API keys to accept online payments."
          >
            <CashfreeSettingsForm initialData={paymentGatewaySetting} />
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default SettingsPage;
