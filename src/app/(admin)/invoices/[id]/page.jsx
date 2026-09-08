import { getInvoiceById } from '@/app/actions/billing';
import { getBusinessSetting } from '@/app/actions/settings';
import Image from 'next/image';
import React from 'react';
import logoDark from '@/assets/images/logo-dark.png';
import signature from '@/assets/images/png/signature.png';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import PageTitle from '@/components/PageTitle';
import PrintButton from '@/app/(admin)/invoices/view-invoice/PrintButton';
import { Button, Card, CardBody, Col, Row, Badge } from 'react-bootstrap';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PaymentModal from './PaymentModal';

export const metadata = {
  title: 'View Invoice'
};

const ViewInvoicePage = async ({ params }) => {
  const { id } = params;
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
          <Link href="/invoices" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Invoices
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
                              <span className="fw-medium">{item.description}</span>
                              {invoice.renewal?.clientService?.product?.category && (
                                <p className="text-muted mb-0 fs-12 mt-1">Category: {invoice.renewal.clientService.product.category}</p>
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
                {invoice.status !== 'PAID' && (
                  <PaymentModal invoiceId={invoice.id} balanceDue={balanceDue} />
                )}
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

export default ViewInvoicePage;
