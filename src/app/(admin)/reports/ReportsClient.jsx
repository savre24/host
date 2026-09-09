'use client';

import { useState, useEffect } from 'react';
import { Card, Col, Row, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { getReceivedPaymentsReport, getPendingInvoicesReport, getUpcomingRenewalsReport } from '@/app/actions/reports';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';

export default function ReportsClient() {
  const [reportType, setReportType] = useState('received'); // 'received', 'pending', 'upcoming'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState(null);

  // Set default dates to current month on load
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    setData([]);
    setTotalAmount(0);

    try {
      let res;
      if (reportType === 'received') {
        res = await getReceivedPaymentsReport(startDate, endDate);
      } else if (reportType === 'pending') {
        res = await getPendingInvoicesReport(startDate, endDate);
      } else if (reportType === 'upcoming') {
        res = await getUpcomingRenewalsReport(startDate, endDate);
      }

      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setData(res.data);
        setTotalAmount(res.totalAmount);
      }
    } catch (err) {
      setError('An error occurred while generating the report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ComponentContainerCard title="Report Filters" className="mb-4">
        <Form onSubmit={handleGenerate}>
          <Row className="align-items-end">
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="received">Received Payments</option>
                  <option value="pending">Pending Invoices</option>
                  <option value="upcoming">Upcoming Renewals</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading ? <Spinner size="sm" /> : <><IconifyIcon icon="tabler:report" className="me-1" /> Generate Report</>}
              </Button>
            </Col>
          </Row>
        </Form>
      </ComponentContainerCard>

      {error && <div className="alert alert-danger">{error}</div>}

      {data && data.length >= 0 && !loading && (
        <ComponentContainerCard title="Report Results">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">
              {reportType === 'received' && 'Received Payments'}
              {reportType === 'pending' && 'Pending Invoices'}
              {reportType === 'upcoming' && 'Upcoming Renewals'}
            </h5>
            <div className="bg-primary-subtle text-primary px-3 py-2 rounded fw-bold fs-16">
              Total: ₹{totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="table-responsive">
            <Table className="mb-0 table-striped table-hover align-middle">
              <thead className="table-light">
                {reportType === 'received' && (
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Client</th>
                    <th>Invoice #</th>
                    <th>Method</th>
                    <th className="text-end">Amount</th>
                  </tr>
                )}
                {reportType === 'pending' && (
                  <tr>
                    <th>Due Date</th>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th className="text-end">Amount</th>
                  </tr>
                )}
                {reportType === 'upcoming' && (
                  <tr>
                    <th>Expiry Date</th>
                    <th>Service Name</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th className="text-end">Price</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No records found for this period.</td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id}>
                      {reportType === 'received' && (
                        <>
                          <td>{new Date(row.paymentDate).toLocaleDateString()}</td>
                          <td><span className="fw-medium text-body">{row.paymentReference || '-'}</span></td>
                          <td>
                            <Link href={`/clients/${row.invoice?.client?.user?.id}`} className="text-primary">
                              {row.invoice?.client?.user?.name || row.invoice?.client?.companyName}
                            </Link>
                          </td>
                          <td>
                            <Link href={`/invoices/${row.invoice?.id}`} className="text-reset">
                              {row.invoice?.invoiceNumber}
                            </Link>
                          </td>
                          <td>{row.paymentMethod ? row.paymentMethod.replace('_', ' ') : 'N/A'}</td>
                          <td className="text-end fw-bold text-success">₹{row.amount.toFixed(2)}</td>
                        </>
                      )}
                      
                      {reportType === 'pending' && (
                        <>
                          <td>{new Date(row.dueDate).toLocaleDateString()}</td>
                          <td>
                            <Link href={`/invoices/${row.id}`} className="fw-medium text-primary">
                              {row.invoiceNumber}
                            </Link>
                          </td>
                          <td>
                            <Link href={`/clients/${row.client?.user?.id}`} className="text-reset">
                              {row.client?.user?.name || row.client?.companyName}
                            </Link>
                          </td>
                          <td>
                            <Badge bg={row.status === 'OVERDUE' ? 'danger' : 'warning'}>{row.status}</Badge>
                          </td>
                          <td className="text-end fw-bold text-danger">₹{row.total.toFixed(2)}</td>
                        </>
                      )}

                      {reportType === 'upcoming' && (
                        <>
                          <td>{new Date(row.expiryDate).toLocaleDateString()}</td>
                          <td>
                            <span className="fw-medium text-body">{row.product?.name}</span>
                            {row.customName && <div className="text-muted small">{row.customName}</div>}
                          </td>
                          <td>
                            <Link href={`/clients/${row.client?.user?.id}`} className="text-reset">
                              {row.client?.user?.name || row.client?.companyName}
                            </Link>
                          </td>
                          <td>
                            <Badge bg={row.status === 'EXPIRING_SOON' ? 'warning' : 'success'}>{row.status}</Badge>
                          </td>
                          <td className="text-end fw-bold">₹{row.price.toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </ComponentContainerCard>
      )}
    </>
  );
}
