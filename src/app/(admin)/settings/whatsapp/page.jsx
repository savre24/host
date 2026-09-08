import PageTitle from '@/components/PageTitle';
import { Col, Row, Card, CardBody, CardHeader } from 'react-bootstrap';
import WhatsAppSettingsForm from './WhatsAppSettingsForm';
import { getAdminWhatsAppSettings } from '@/app/actions/whatsapp';

export const metadata = { title: 'WhatsApp Settings' };

const WhatsAppSettingsPage = async () => {
  const { data: settings } = await getAdminWhatsAppSettings();

  return (
    <>
      <PageTitle title='WhatsApp Integration' subTitle='Settings' />
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <CardHeader>
              <h4 className="header-title">Evolution API Settings</h4>
              <p className="text-muted mb-0">
                Configure your connection to the Evolution API gateway to enable automated WhatsApp notifications for your clients.
              </p>
            </CardHeader>
            <CardBody>
              <WhatsAppSettingsForm initialData={settings} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default WhatsAppSettingsPage;
