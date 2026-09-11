import { getClientDashboardStats } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import PageTitle from '@/components/PageTitle';
import { Col, Row, Card, CardBody } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';

export const metadata = {
  title: 'Client Dashboard'
};

const StatCard = ({ title, value, icon, link, colorClass }) => (
  <Card>
    <CardBody>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h4 className="fw-medium text-muted mb-2">{title}</h4>
          <h2 className="mb-0 fw-bold">{value}</h2>
        </div>
        <div className={`avatar-md bg-${colorClass}-subtle text-${colorClass} rounded d-flex align-items-center justify-content-center fs-24`}>
          <IconifyIcon icon={icon} />
        </div>
      </div>
      <div className="mt-4">
        <Link href={link} className="text-primary fw-medium fs-14">
          View details <IconifyIcon icon="tabler:arrow-right" className="ms-1 fs-16" />
        </Link>
      </div>
    </CardBody>
  </Card>
);

const ClientDashboard = async () => {
  const session = await getServerSession(options);
  const { data: stats, error } = await getClientDashboardStats(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <>
      <PageTitle title={`Welcome back, ${session?.user?.name?.split(' ')[0] || 'Client'}!`} subTitle='Dashboard' />
      
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <StatCard 
            title="Active Services" 
            value={stats.activeServices} 
            icon="tabler:device-imac" 
            link="/client/services" 
            colorClass="primary" 
          />
        </Col>
        <Col md={4} className="mb-3 mb-md-0">
          <StatCard 
            title="Pending Balance" 
            value={`₹${stats.pendingBalance.toFixed(2)}`} 
            icon="tabler:file-invoice" 
            link="/client/invoices" 
            colorClass="danger" 
          />
        </Col>
        <Col md={4}>
          <StatCard 
            title="Open Support Tickets" 
            value={stats.openTickets} 
            icon="tabler:headset" 
            link="/client/support" 
            colorClass="warning" 
          />
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          <Card>
            <CardBody>
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex flex-column gap-2">
                <Link href="/client/support/create" className="btn btn-primary text-start">
                  <IconifyIcon icon="tabler:headset" className="me-2" /> Open a Support Ticket
                </Link>
                <Link href="/client/invoices" className="btn btn-outline-secondary text-start">
                  <IconifyIcon icon="tabler:file-invoice" className="me-2" /> View Billing History
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Pending Bills & Renewals</h5>
                <Link href="/client/invoices" className="text-primary fw-medium fs-14">View All</Link>
              </div>

              {stats.pendingInvoicesList && stats.pendingInvoicesList.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-centered table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Due Date</th>
                        <th>Amount Due</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pendingInvoicesList.map((invoice) => (
                        <tr key={invoice.id}>
                          <td><Link href={`/client/invoices/${invoice.id}`} className="text-body fw-bold">#{invoice.invoiceNumber}</Link></td>
                          <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                          <td>₹{(invoice.total - (invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0)).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'PENDING' ? 'bg-warning' : 
                              invoice.status === 'OVERDUE' ? 'bg-danger' : 'bg-info'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <Link href={`/client/payments/pay/${invoice.id}`} className="btn btn-sm btn-primary">Pay Now</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-success bg-success text-white border-0" role="alert">
                  You have no pending bills. Great job!
                </div>
              )}

              {stats.upcomingRenewals && stats.upcomingRenewals.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3">Upcoming Renewals (Next 30 Days)</h5>
                  <div className="table-responsive">
                    <table className="table table-centered table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Service</th>
                          <th>Expiry Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.upcomingRenewals.map((service) => (
                          <tr key={service.id}>
                            <td>
                              <Link href={`/client/services/${service.id}`} className="text-body fw-bold">
                                {service.customName || service.product?.name}
                              </Link>
                            </td>
                            <td>{new Date(service.expiryDate).toLocaleDateString()}</td>
                            <td><span className="badge bg-warning">Expiring Soon</span></td>
                            <td>
                              <Link href={`/client/renewals`} className="btn btn-sm btn-outline-primary">Manage</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ClientDashboard;
