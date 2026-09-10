import { getInvoiceById } from '@/app/actions/billing';
import { getBusinessSetting } from '@/app/actions/settings';
import Image from 'next/image';
import React from 'react';
import logoDark from '@/assets/images/logo-dark.png';
import signature from '@/assets/images/png/signature.png';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import PageTitle from '@/components/PageTitle';
import PrintButton from '@/app/(admin)/invoices/view-invoice/PrintButton';
import DownloadPdfButton from '@/components/DownloadPdfButton';
import { Button, Card, CardBody, Col, Row, Badge } from 'react-bootstrap';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'View Invoice'
};

const ViewClientInvoicePage = async (props) => {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const autoDownload = searchParams?.download === 'true';
  const { data: invoice, error } = await getInvoiceById(id);

  if (error || !invoice) {
    notFound();
  }

  const client = invoice.client;
  const user = client.user;
  
  const { data: businessSetting } = await getBusinessSetting();
  
  const totalPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const balanceDue = invoice.total - totalPaid;

  return (
    <>
      <PageTitle title={`Invoice: ${invoice.invoiceNumber}`} subTitle='Billing' />
      
      <Row className="mb-3 d-print-none">
        <Col>
          <Link href="/client/invoices" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Invoices
          </Link>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card id="invoice-pdf-content" className="position-relative overflow-hidden">
            <CardBody>
              <div className="d-flex align-items-start justify-content-between mb-4">
                <div className="position-relative z-1">
                  {businessSetting?.logoUrl ? (
                    <img src={businessSetting.logoUrl} alt="Logo" style={{ height: 'auto', maxHeight: '60px', maxWidth: '250px', objectFit: 'contain' }} />
                  ) : (
                    <h3 className="m-0 fw-bolder fs-24">{businessSetting?.companyName || 'Company Name'}</h3>
                  )}
                </div>
                
                {/* Large watermark for printing / PDF */}
                <div 
                  className={`position-absolute top-0 end-0 mt-5 me-5 z-0 opacity-25 fw-bolder ${invoice.status === 'PAID' ? 'text-success' : 'text-danger'}`}
                  style={{ fontSize: '100px', transform: 'rotate(-15deg)', pointerEvents: 'none' }}
                >
                  {invoice.status === 'PAID' ? 'PAID' : (invoice.status === 'UNPAID' || invoice.status === 'OVERDUE' ? 'UNPAID' : '')}
                </div>

                <div className="text-end position-relative z-1">
                  {invoice.status === 'PAID' && <span className="badge bg-success-subtle text-success px-2 py-1 fs-12 mb-3">Paid</span>}
                  {invoice.status === 'UNPAID' && <span className="badge bg-warning-subtle text-warning px-2 py-1 fs-12 mb-3">Unpaid</span>}
                  {invoice.status === 'DRAFT' && <span className="badge bg-info-subtle text-info px-2 py-1 fs-12 mb-3">Draft</span>}
                  {invoice.status === 'OVERDUE' && <span className="badge bg-danger-subtle text-danger px-2 py-1 fs-12 mb-3">Overdue</span>}
                  {invoice.status === 'CANCELLED' && <span className="badge bg-secondary-subtle text-secondary px-2 py-1 fs-12 mb-3">Cancelled</span>}
                  <h3 className="m-0 fw-bolder fs-20">Invoice: {invoice.invoiceNumber}</h3>
                </div>
              </div>
              <Row>
                <Col xs={6}>
                  <div className="mb-4">
                    <h5 className="fw-bold pb-1 mb-2 fs-14"> Bill To : </h5>
                    <h6 className="fs-14 mb-2">{user.name}</h6>
                    {client.companyName && <h6 className="fs-14 text-muted mb-2 lh-base">{client.companyName}</h6>}
                    {client.address && <h6 className="fs-14 text-muted mb-2 lh-base">{client.address}</h6>}
                    <h6 className="fs-14 text-muted mb-0">Email: {user.email}</h6>
                    {client.phone && <h6 className="fs-14 text-muted mb-0 mt-1">Phone: {client.phone}</h6>}
                  </div>
                </Col>
                <Col xs={6} className="text-end">
                  <div className="mb-2">
                    <h5 className="fw-bold fs-14 d-inline me-2"> Invoice Date : </h5>
                    <h6 className="fs-14 text-muted d-inline">{new Date(invoice.invoiceDate).toLocaleDateString()}</h6>
                  </div>
                  <div>
                    <h5 className="fw-bold fs-14 d-inline me-2"> Due Date : </h5>
                    <h6 className="fs-14 text-muted d-inline">{new Date(invoice.dueDate).toLocaleDateString()}</h6>
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
                      <th className="text-start border-0" scope="col">Product / Service Description</th>
                      <th className="border-0" scope="col">Quantity</th>
                      <th className="border-0" scope="col">Unit price</th>
                      <th className="text-end border-0" scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id}>
                        <th scope="row">{(idx + 1).toString().padStart(2, '0')}</th>
                        <td className="text-start">
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              {item.product && (
                                <Badge bg="secondary" className="mb-1 me-2">{item.product.category}</Badge>
                              )}
                              {(!item.product && invoice.renewal?.clientService?.product?.category) && (
                                <Badge bg="secondary" className="mb-1 me-2">{invoice.renewal.clientService.product.category}</Badge>
                              )}
                              
                              <span className="fw-medium d-block">
                                {item.product 
                                  ? item.product.name 
                                  : (invoice.renewal?.clientService?.product?.name || item.description)}
                              </span>
                              
                              {(item.product || invoice.renewal?.clientService?.product) && item.description !== (item.product?.name || invoice.renewal?.clientService?.product?.name) && (
                                <span className="text-muted fs-13 d-block mt-1">{item.description}</span>
                              )}
                              
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
                      <td className="text-end">₹{invoice.subtotal.toFixed(2)}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr>
                        <td className="fw-medium">Discount</td>
                        <td className="text-end text-success">-₹{invoice.discount.toFixed(2)}</td>
                      </tr>
                    )}
                    {invoice.taxAmount > 0 && (
                      <tr>
                        <td className="fw-medium">Tax</td>
                        <td className="text-end">₹{invoice.taxAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    {invoice.onlinePaymentCharge > 0 && (
                      <tr>
                        <td className="fw-medium">Online Payment Charge</td>
                        <td className="text-end">₹{invoice.onlinePaymentCharge.toFixed(2)}
                          <div className="fs-10 text-muted">Applied to online payments only</div>
                        </td>
                      </tr>
                    )}
                    <tr className="border-top border-top-dashed fs-16 bg-light">
                      <td className="fw-bold">Total Amount</td>
                      <td className="fw-bold text-end text-primary">₹{invoice.total.toFixed(2)}</td>
                    </tr>
                    {totalPaid > 0 && (
                      <tr className="fs-15">
                        <td className="fw-medium">Total Paid</td>
                        <td className="fw-medium text-end text-success">-₹{totalPaid.toFixed(2)}</td>
                      </tr>
                    )}
                    {totalPaid > 0 && (
                      <tr className="fs-16 bg-light">
                        <td className="fw-bold">Balance Due</td>
                        <td className="fw-bold text-end text-danger">₹{balanceDue.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* PAYMENTS RECEIVED TABLE */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mt-5">
                <h5 className="mb-3">Payments Received</h5>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Transaction ID</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td>{payment.paymentMethod || 'N/A'}</td>
                          <td>{payment.paymentReference || 'N/A'}</td>
                          <td className="text-end text-success fw-medium">₹{payment.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <CardBody>
              <div className="bg-body p-3 rounded-2 mt-4 border border-dashed">
                <p className="mb-0">
                  <span className="fs-12 fw-bold text-uppercase">Notes & Terms : </span>
                  {invoice.notes || "Payment is due on or before the due date. Please ensure prompt payment to avoid service interruption."}
                </p>
              </div>
              <div className="mt-4 text-end">
                <p className="text-muted fs-12 mb-0">This is a computer generated bill and does not require a signature.</p>
              </div>
            </CardBody>
          </Card>
          
          <div className="d-print-none mb-5 mt-4">
            <div className="d-flex justify-content-end gap-2">
              <DownloadPdfButton targetId="invoice-pdf-content" filename={`Invoice_${invoice.invoiceNumber}.pdf`} autoDownload={autoDownload} />
              <PrintButton />
              {invoice.status !== 'PAID' && (
                <Button as={Link} href={`/client/payments/pay/${invoice.id}`} variant="primary"><IconifyIcon icon='tabler:credit-card' className="me-1" /> Pay Now (Cashfree)</Button>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default ViewClientInvoicePage;
