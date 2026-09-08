'use client';

import { useState, useTransition } from 'react';
import { Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { updateWhatsAppSettings, createWhatsAppInstance, checkWhatsAppStatus } from '@/app/actions/whatsapp';
import { toast } from 'react-toastify';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const WhatsAppSettingsForm = ({ initialData }) => {
  const [formData, setFormData] = useState({
    serverUrl: initialData?.serverUrl || 'https://chat.hostingspaceindia.com',
    apiKey: initialData?.apiKey || '',
    templateRenewal: initialData?.templateRenewal || 'Hi {{CLIENT_NAME}}, your service {{SERVICE_NAME}} is due for renewal on {{DATE}}. Amount: {{AMOUNT}}. Please renew to avoid interruption.',
    templateNewService: initialData?.templateNewService || 'Hi {{CLIENT_NAME}}, we have successfully assigned a new service to your account: {{SERVICE_NAME}}. Thank you for choosing us!',
    templatePaymentReminder: initialData?.templatePaymentReminder || 'Hi {{CLIENT_NAME}}, this is a reminder for Invoice {{INVOICE_NUMBER}}. Total: {{AMOUNT}}, Due: {{DUE_DATE}}. Please make the payment at your earliest convenience.',
    templatePaymentReceived: initialData?.templatePaymentReceived || 'Hi {{CLIENT_NAME}}, we have received your payment of {{AMOUNT}} for Invoice {{INVOICE_NUMBER}}. Thank you for your business!'
  });
  
  const [isActive, setIsActive] = useState(initialData?.isActive || false);
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWhatsAppSettings(formData.serverUrl, formData.apiKey, {
        templateRenewal: formData.templateRenewal,
        templateNewService: formData.templateNewService,
        templatePaymentReminder: formData.templatePaymentReminder,
        templatePaymentReceived: formData.templatePaymentReceived
      });
      if (result.success) {
        toast.success('WhatsApp connection settings saved!');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setQrCodeBase64('');
    
    // Check status first to see if it's already connected or just needs a QR refresh
    const statusRes = await checkWhatsAppStatus();
    if (statusRes.success && statusRes.data?.instance?.state === 'open') {
      setIsActive(true);
      toast.success('WhatsApp is already connected!');
      setIsConnecting(false);
      return;
    }

    // Connect and get QR
    const result = await createWhatsAppInstance();
    setIsConnecting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.data?.base64) {
        setQrCodeBase64(result.data.base64);
        toast.info('Please scan the QR code with your WhatsApp app.');
      } else if (result.data?.instance?.state === 'open') {
        setIsActive(true);
        toast.success('WhatsApp connected successfully!');
      } else {
        toast.warning('Check connection status or refresh.');
      }
    }
  };

  const handleCheckStatus = async () => {
    setIsConnecting(true);
    const result = await checkWhatsAppStatus();
    setIsConnecting(false);

    if (result.success) {
      if (result.data?.instance?.state === 'open') {
        setIsActive(true);
        setQrCodeBase64('');
        toast.success('WhatsApp connection is ACTIVE!');
      } else {
        setIsActive(false);
        toast.warning(`Connection State: ${result.data?.instance?.state || 'Disconnected'}`);
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="mb-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-1">Connection Status</h5>
          <span className="text-muted fs-13">Current state of your WhatsApp Gateway</span>
        </div>
        <div>
          {isActive ? (
            <Badge bg="success" className="fs-14 px-3 py-2"><IconifyIcon icon="tabler:check" className="me-1"/> Connected</Badge>
          ) : (
            <Badge bg="danger" className="fs-14 px-3 py-2"><IconifyIcon icon="tabler:x" className="me-1"/> Disconnected</Badge>
          )}
        </div>
      </div>

      <Form onSubmit={handleSaveSettings} className="mb-5">
        <Row className="mb-3">
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Evolution API Server URL</Form.Label>
              <Form.Control
                type="url"
                name="serverUrl"
                value={formData.serverUrl}
                onChange={handleChange}
                placeholder="https://chat.hostingspaceindia.com"
                required
              />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Global API Key</Form.Label>
              <Form.Control
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="Enter the API Key configured on your server"
                required
              />
              <Form.Text className="text-muted">
                This is the `AUTHENTICATION_API_KEY` set in your docker-compose file.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <h5 className="mt-4 mb-3">Message Templates</h5>
        <p className="text-muted fs-13 mb-3">Use placeholders like <code>{'{{CLIENT_NAME}}'}</code>, <code>{'{{SERVICE_NAME}}'}</code>, <code>{'{{AMOUNT}}'}</code>, <code>{'{{DATE}}'}</code> to customize automated messages.</p>
        
        <Row className="mb-3">
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>New Service / Product Added</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="templateNewService"
                value={formData.templateNewService}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">Placeholders: {'{{CLIENT_NAME}}, {{SERVICE_NAME}}, {{PRICE}}'}</Form.Text>
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Renewal Reminder</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="templateRenewal"
                value={formData.templateRenewal}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">Placeholders: {'{{CLIENT_NAME}}, {{SERVICE_NAME}}, {{DATE}}, {{AMOUNT}}'}</Form.Text>
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Payment Reminder / Invoice Created</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="templatePaymentReminder"
                value={formData.templatePaymentReminder}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">Placeholders: {'{{CLIENT_NAME}}, {{INVOICE_NUMBER}}, {{AMOUNT}}, {{DUE_DATE}}'}</Form.Text>
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Payment Received</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="templatePaymentReceived"
                value={formData.templatePaymentReceived}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">Placeholders: {'{{CLIENT_NAME}}, {{INVOICE_NUMBER}}, {{AMOUNT}}'}</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </Form>

      <div className="border rounded bg-light-subtle p-4 text-center">
        <h5 className="mb-3">Link Your WhatsApp</h5>
        <p className="text-muted mb-4">
          Save your API settings above, then click 'Connect' to generate a QR code. Scan the code using WhatsApp on your phone (Linked Devices).
        </p>
        
        <div className="mb-4">
          <Button variant="success" className="me-2" onClick={handleConnect} disabled={isConnecting || !formData.apiKey}>
            {isConnecting ? <Spinner size="sm" className="me-1"/> : <IconifyIcon icon="tabler:qrcode" className="me-1"/>}
            Connect / Get QR Code
          </Button>
          <Button variant="outline-secondary" onClick={handleCheckStatus} disabled={isConnecting || !formData.apiKey}>
            <IconifyIcon icon="tabler:refresh" className="me-1"/> Check Status
          </Button>
        </div>

        {qrCodeBase64 && (
          <div className="mt-4 p-3 bg-white border rounded d-inline-block shadow-sm">
            <h6 className="mb-3 text-primary">Scan QR Code</h6>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeBase64} alt="WhatsApp QR Code" style={{ width: 250, height: 250 }} />
            <p className="text-muted mt-3 fs-13 mb-0">Code expires in a few seconds.<br/>Click Connect again if it times out.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default WhatsAppSettingsForm;
