import PageTitle from '@/components/PageTitle';
import { Col, Row, Card, CardBody, Table, Badge, Button } from 'react-bootstrap';
import { getAdminDashboardStats, getRecentActivities } from '@/app/actions/dashboard';
import Link from 'next/link';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = { title: 'Admin Dashboard' };

const StatCard = ({ title, value, icon, bgClass, link }) => (
  <Card>
    <CardBody>
      <div className="d-flex align-items-center">
        <div className={`avatar-md flex-shrink-0 bg-${bgClass}-subtle text-${bgClass} rounded-3 fs-24 d-flex align-items-center justify-content-center me-3`}>
          <IconifyIcon icon={icon} />
        </div>
        <div className="flex-grow-1">
          <p className="text-muted fw-medium mb-1">{title}</p>
          <h3 className="mb-0">{value}</h3>
        </div>
        {link && (
          <div className="flex-shrink-0">
            <Link href={link} className="btn btn-sm btn-outline-secondary">
              View All
            </Link>
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

const getStatusBadge = (status) => {
  switch (status) {
    case 'OPEN': return <Badge bg="primary">OPEN</Badge>;
    case 'ANSWERED': return <Badge bg="info">ANSWERED</Badge>;
    case 'CUSTOMER_REPLY': return <Badge bg="warning">CUSTOMER REPLY</Badge>;
    case 'CLOSED': return <Badge bg="secondary">CLOSED</Badge>;
    default: return <Badge bg="secondary">{status}</Badge>;
  }
};

const getInvoiceBadge = (status) => {
  switch (status) {
    case 'PAID': return <Badge bg="success">PAID</Badge>;
    case 'PENDING': return <Badge bg="warning">PENDING</Badge>;
    case 'OVERDUE': return <Badge bg="danger">OVERDUE</Badge>;
    case 'DRAFT': return <Badge bg="secondary">DRAFT</Badge>;
    default: return <Badge bg="info">{status}</Badge>;
  }
};

const DashboardPage = async () => {
  const [{ data: stats }, { data: recent }] = await Promise.all([
    getAdminDashboardStats(),
    getRecentActivities()
  ]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <>
      <PageTitle title='Admin Dashboard' />
      
      <Row className="mb-4">
        <Col md={3}>
          <StatCard 
            title="Total Clients" 
            value={stats?.totalClients || 0} 
            icon="tabler:users" 
            bgClass="primary" 
            link="/clients"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Active Services" 
            value={stats?.activeServices || 0} 
            icon="tabler:server" 
            bgClass="success" 
            link="/services"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Pending Revenue" 
            value={formatCurrency(stats?.pendingRevenue || 0)} 
            icon="tabler:currency-rupee" 
            bgClass="warning" 
            link="/invoices"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            title="Open Tickets" 
            value={stats?.openTickets || 0} 
            icon="tabler:headset" 
            bgClass="danger" 
            link="/support"
          />
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="header-title mb-0">Recent Support Tickets</h4>
                <Link href="/support" className="btn btn-sm btn-light">View All</Link>
              </div>
              <div className="table-responsive">
                <Table className="table-centered table-nowrap mb-0 table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Ticket ID</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent?.recentTickets || []).length > 0 ? (
                      recent.recentTickets.map(ticket => (
                        <tr key={ticket.id}>
                          <td>
                            <Link href={`/support/${ticket.id}`} className="fw-medium text-primary">
                              #{ticket.id.substring(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td>
                            {ticket.client?.name}<br/>
                            <small className="text-muted">{ticket.client?.email}</small>
                          </td>
                          <td>{getStatusBadge(ticket.status)}</td>
                          <td>
                            <Link href={`/support/${ticket.id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-3 text-muted">No recent tickets</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="header-title mb-0">Recent Invoices</h4>
                <Link href="/invoices" className="btn btn-sm btn-light">View All</Link>
              </div>
              <div className="table-responsive">
                <Table className="table-centered table-nowrap mb-0 table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent?.recentInvoices || []).length > 0 ? (
                      recent.recentInvoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td>
                            <Link href={`/invoices/${invoice.id}`} className="fw-medium text-primary">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td>{invoice.client?.companyName || 'N/A'}</td>
                          <td className="fw-medium">{formatCurrency(invoice.total)}</td>
                          <td>{getInvoiceBadge(invoice.status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-3 text-muted">No recent invoices</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardPage;