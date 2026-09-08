import { getQuotationById } from '@/app/actions/quotations';
import { getBusinessSetting } from '@/app/actions/settings';
import Image from 'next/image';
import React from 'react';
import logoDark from '@/assets/images/logo-dark.png';
import signature from '@/assets/images/png/signature.png';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import PageTitle from '@/components/PageTitle';
import PrintButton from '@/app/(admin)/invoices/view-invoice/PrintButton';
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'View Quotation'
};

const ViewQuotationPage = async ({ params }) => {
  const { id } = params;
  const { data: quotation, error } = await getQuotationById(id);

  if (error || !quotation) {
    notFound();
  }

  const client = quotation.client;
  const user = client.user;
  
  const { data: businessSetting } = await getBusinessSetting();
  
  return (
    <>
      <PageTitle title={`Quotation: ${quotation.quoteNumber}`} subTitle='Quotations' />
      
      <Row className="mb-3 d-print-none">
        <Col>
          <Link href="/quotations" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Quotations
          </Link>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <div className="d-flex align-items-start justify-content-between mb-4">
                <div>
                  {businessSetting?.logoUrl ? (
                    <img src={businessSetting.logoUrl} alt="Logo" height={24} />
                  ) : (
                    <h3 className="m-0 fw-bolder fs-24">{businessSetting?.companyName || 'Company Name'}</h3>
                  )}
                </div>
                <div className="text-end">
                  {quotation.status === 'ACCEPTED' && <span className="badge bg-success-subtle text-success px-2 py-1 fs-12 mb-3">Accepted</span>}
                  {quotation.status === 'SENT' && <span className="badge bg-primary-subtle text-primary px-2 py-1 fs-12 mb-3">Sent</span>}
                  {quotation.status === 'DRAFT' && <span className="badge bg-secondary-subtle text-secondary px-2 py-1 fs-12 mb-3">Draft</span>}
                  {quotation.status === 'REJECTED' && <span className="badge bg-danger-subtle text-danger px-2 py-1 fs-12 mb-3">Rejected</span>}
                  {quotation.status === 'CONVERTED' && <span className="badge bg-info-subtle text-info px-2 py-1 fs-12 mb-3">Converted to Invoice</span>}
                  <h3 className="m-0 fw-bolder fs-20">Quotation: {quotation.quoteNumber}</h3>
                </div>
              </div>
              <Row>
                <Col xs={6}>
                  <div className="mb-4">
                    <h5 className="fw-bold pb-1 mb-2 fs-14"> Quote To : </h5>
                    <h6 className="fs-14 mb-2">{user.name}</h6>
                    {client.companyName && <h6 className="fs-14 text-muted mb-2 lh-base">{client.companyName}</h6>}
                    {client.address && <h6 className="fs-14 text-muted mb-2 lh-base">{client.address}</h6>}
                    <h6 className="fs-14 text-muted mb-0">Email: {user.email}</h6>
                    {client.phone && <h6 className="fs-14 text-muted mb-0 mt-1">Phone: {client.phone}</h6>}
                  </div>
                </Col>
                <Col xs={6} className="text-end">
                  <div className="mb-2">
                    <h5 className="fw-bold fs-14 d-inline me-2"> Date : </h5>
                    <h6 className="fs-14 text-muted d-inline">{new Date(quotation.date).toLocaleDateString()}</h6>
                  </div>
                  <div>
                    <h5 className="fw-bold fs-14 d-inline me-2"> Valid Until : </h5>
                    <h6 className="fs-14 text-muted d-inline">{new Date(quotation.validUntil).toLocaleDateString()}</h6>
                  </div>
                </Col>
              </Row>
            </CardBody>
            
            <div className="mt-4">
              <div className="table-responsive">
                <table className="table text-center table-nowrap align-middle mb-0">
                  <thead>
                    <tr className="bg-light bg-opacity-50">
                      <th className="border-0" scope="col" style={{ width: 50 }}>#</th>
                      <th className="text-start border-0" scope="col">Service Description</th>
                      <th className="border-0" scope="col">Quantity</th>
                      <th className="border-0" scope="col">Unit price</th>
                      <th className="text-end border-0" scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, idx) => (
                      <tr key={item.id}>
                        <th scope="row">{(idx + 1).toString().padStart(2, '0')}</th>
                        <td className="text-start">
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <span className="fw-medium">{item.description}</span>
                              {item.discount > 0 && <p className="text-muted mb-0 fs-12">(Discount applied: ₹{item.discount.toFixed(2)})</p>}
                              {item.taxRate > 0 && <p className="text-muted mb-0 fs-12">(Tax applied: {item.taxRate}%)</p>}
                            </div>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.unitPrice.toFixed(2)}</td>
                        <td className="text-end fw-medium">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <table className="table table-nowrap align-middle mb-0 ms-auto" style={{ width: 335 }}>
                  <tbody>
                    <tr>
                      <td className="fw-medium">Subtotal</td>
                      <td className="text-end">₹{quotation.subtotal.toFixed(2)}</td>
                    </tr>
                    {quotation.discount > 0 && (
                      <tr>
                        <td className="fw-medium">Discount</td>
                        <td className="text-end text-success">-₹{quotation.discount.toFixed(2)}</td>
                      </tr>
                    )}
                    {quotation.taxAmount > 0 && (
                      <tr>
                        <td className="fw-medium">Tax</td>
                        <td className="text-end">₹{quotation.taxAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-top border-top-dashed fs-16 bg-light">
                      <td className="fw-bold">Total Amount</td>
                      <td className="fw-bold text-end text-primary">₹{quotation.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <CardBody>
              <div className="bg-body p-3 rounded-2 mt-4 border border-dashed">
                <p className="mb-2">
                  <span className="fs-12 fw-bold text-uppercase">Notes : </span>
                  {quotation.notes || "None"}
                </p>
                <p className="mb-0">
                  <span className="fs-12 fw-bold text-uppercase">Terms & Conditions : </span>
                  {quotation.terms || "Standard terms apply. Quotation is valid until the 'Valid Until' date."}
                </p>
              </div>
              <div className="mt-4 text-end">
                <div className="d-inline-block text-center">
                  {businessSetting?.companyName ? (
                    <h4 className="mb-0 fs-18 fw-bolder" style={{ fontFamily: 'cursive' }}>{businessSetting.companyName}</h4>
                  ) : (
                    <Image src={signature} alt="signature" height={40} />
                  )}
                  <h5 className="mb-0 mt-2 fs-14">Authorized Signatory</h5>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <div className="d-print-none mb-5 mt-4">
            <div className="d-flex justify-content-between">
              <div>
                {/* Actions could go here */}
              </div>
              <div className="d-flex gap-2">
                <PrintButton />
                <Button variant="info"><IconifyIcon icon='tabler:send' className="me-1" /> Send to Client</Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default ViewQuotationPage;
