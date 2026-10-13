'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Table, Button, Form, InputGroup, Badge, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export default function AdminDomainsClient({ initialClientServices = [] }) {
  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Pricing state
  const [pricing, setPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [savingTld, setSavingTld] = useState(null);
  const [pricingSuccess, setPricingSuccess] = useState(null);

  // Domain search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Client renewals state
  const [clientServices, setClientServices] = useState(initialClientServices);
  const [renewingId, setRenewingId] = useState(null);
  const [renewMessage, setRenewMessage] = useState(null);

  // Load wallet balance
  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const res = await fetch('/api/resellerclub/balance');
      const data = await res.json();
      if (data.success) {
        setWallet(data);
      }
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  // Load pricing
  const fetchPricing = async () => {
    setPricingLoading(true);
    try {
      const res = await fetch('/api/admin/domains/pricing');
      const data = await res.json();
      if (data.success) {
        setPricing(data.pricing);
      }
    } catch (err) {
      console.error('Failed to load domain pricing:', err);
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchPricing();
  }, []);

  // Update a price field locally
  const handlePriceChange = (tld, field, value) => {
    setPricing(prev => prev.map(item => {
      if (item.tld === tld) {
        const numVal = parseFloat(value) || 0;
        const updated = { ...item, [field]: numVal };
        if (field === 'sellingPrice' && item.wholesaleRegister) {
          updated.registerProfit = numVal - item.wholesaleRegister;
        }
        if (field === 'renewalPrice' && item.wholesaleRenew) {
          updated.renewalProfit = numVal - item.wholesaleRenew;
        }
        return updated;
      }
      return item;
    }));
  };

  // Save price to API/Database
  const handleSavePrice = async (item) => {
    setSavingTld(item.tld);
    setPricingSuccess(null);
    try {
      const res = await fetch('/api/admin/domains/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tld: item.tld,
          sellingPrice: item.sellingPrice,
          renewalPrice: item.renewalPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price');

      setPricingSuccess(`Saved prices for .${item.tld} successfully!`);
      setTimeout(() => setPricingSuccess(null), 4000);
    } catch (err) {
      alert(`Error saving price: ${err.message}`);
    } finally {
      setSavingTld(null);
    }
  };

  // Search domain availability
  const handleSearchDomain = async (e) => {
    e?.preventDefault();
    const clean = searchQuery.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    if (!clean) return;

    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/admin/domains/check?domain=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Domain check failed');
      setSearchResults(data.results);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // Renew client domain
  const handleRenewDomain = async (service) => {
    const domain = service.customName || service.domainDetail?.domainOwnership;
    if (!domain) {
      alert('No domain name associated with this service.');
      return;
    }

    if (!confirm(`Are you sure you want to renew ${domain} via ResellerClub for 1 year? ResellerClub wholesale fee will be deducted from your account balance.`)) {
      return;
    }

    setRenewingId(service.id);
    setRenewMessage(null);

    try {
      const res = await fetch('/api/admin/domains/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: domain,
          clientServiceId: service.id,
          years: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Renewal failed');

      setRenewMessage({ type: 'success', text: `Successfully renewed ${domain}! ${data.message}` });
      fetchWallet(); // refresh balance
    } catch (err) {
      setRenewMessage({ type: 'danger', text: `Failed to renew ${domain}: ${err.message}` });
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div>
      {/* Top Stats Overview */}
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="d-flex align-items-center justify-content-between p-3">
              <div>
                <span className="text-muted fs-13 text-uppercase fw-semibold">ResellerClub Balance</span>
                <h3 className="mb-0 fw-bold mt-1 text-primary">
                  {wallet ? `₹${parseFloat(wallet.balance).toFixed(2)}` : '₹--.--'}
                </h3>
                <span className="fs-12 text-muted">Available wallet funds</span>
              </div>
              <div className="text-end">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={fetchWallet} 
                  disabled={walletLoading}
                  className="rounded-circle p-2"
                >
                  <IconifyIcon icon={walletLoading ? 'tabler:loader' : 'tabler:refresh'} className={walletLoading ? 'spin' : ''} />
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md={4} className="mb-3 mb-md-0">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="d-flex align-items-center justify-content-between p-3">
              <div>
                <span className="text-muted fs-13 text-uppercase fw-semibold">API Connection</span>
                <h4 className="mb-0 fw-bold mt-1 text-success d-flex align-items-center">
                  <IconifyIcon icon="tabler:circle-check-filled" className="me-2" /> Connected
                </h4>
                <span className="fs-12 text-muted">Reseller ID: {wallet?.resellerId || '1154026'}</span>
              </div>
              <div className="avatar-md bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center fs-24">
                <IconifyIcon icon="tabler:plug-connected" />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="d-flex align-items-center justify-content-between p-3">
              <div>
                <span className="text-muted fs-13 text-uppercase fw-semibold">Supported TLDs</span>
                <h4 className="mb-0 fw-bold mt-1 text-body">
                  .com, .in, .co.in, .org
                </h4>
                <span className="fs-12 text-muted">Ready for live registration & renewal</span>
              </div>
              <div className="avatar-md bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fs-24">
                <IconifyIcon icon="tabler:world" />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tab.Container defaultActiveKey="pricing">
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom pt-3 px-4">
            <Nav variant="pills" className="nav-custom gap-2">
              <Nav.Item>
                <Nav.Link eventKey="pricing" className="d-flex align-items-center py-2 px-3">
                  <IconifyIcon icon="tabler:currency-rupee" className="me-1 fs-18" />
                  Wholesale Cost & Renewal Pricing
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="availability" className="d-flex align-items-center py-2 px-3">
                  <IconifyIcon icon="tabler:search" className="me-1 fs-18" />
                  Check Domain Availability
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="renewals" className="d-flex align-items-center py-2 px-3">
                  <IconifyIcon icon="tabler:repeat" className="me-1 fs-18" />
                  Client Domain Renewals ({clientServices.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <CardBody className="p-4">
            <Tab.Content>
              {/* TAB 1: PRICING & MARGINS */}
              <Tab.Pane eventKey="pricing">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">Set Retail & Renewal Pricing</h5>
                    <p className="text-muted fs-13 mb-0">
                      ResellerClub wholesale costs are fetched in real-time. You can fix your selling and renewal prices below.
                    </p>
                  </div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={fetchPricing} 
                    disabled={pricingLoading}
                    className="d-flex align-items-center"
                  >
                    <IconifyIcon icon="tabler:refresh" className={`me-1 ${pricingLoading ? 'spin' : ''}`} />
                    Refresh Costs
                  </Button>
                </div>

                {pricingSuccess && (
                  <Alert variant="success" className="py-2 mb-3">
                    <IconifyIcon icon="tabler:check" className="me-1" /> {pricingSuccess}
                  </Alert>
                )}

                {pricingLoading && pricing.length === 0 ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading wholesale prices from ResellerClub...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Extension</th>
                          <th>ResellerClub Wholesale (Reg / Renew)</th>
                          <th style={{ width: '180px' }}>Your Selling Price (₹)</th>
                          <th style={{ width: '180px' }}>Your Renewal Price (₹)</th>
                          <th>Expected Margin (Reg / Renew)</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing.map((item) => (
                          <tr key={item.tld}>
                            <td>
                              <span className="badge bg-primary fs-14 px-2 py-1">.{item.tld}</span>
                              <div className="fs-12 text-muted mt-1">{item.name}</div>
                            </td>
                            <td>
                              <div className="fw-semibold text-danger">
                                Reg: ₹{item.wholesaleRegister ? item.wholesaleRegister.toFixed(2) : '--'}
                              </div>
                              <div className="fw-semibold text-danger fs-12">
                                Renew: ₹{item.wholesaleRenew ? item.wholesaleRenew.toFixed(2) : '--'}
                              </div>
                            </td>
                            <td>
                              <InputGroup size="sm">
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  value={item.sellingPrice}
                                  onChange={(e) => handlePriceChange(item.tld, 'sellingPrice', e.target.value)}
                                />
                              </InputGroup>
                            </td>
                            <td>
                              <InputGroup size="sm">
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  value={item.renewalPrice}
                                  onChange={(e) => handlePriceChange(item.tld, 'renewalPrice', e.target.value)}
                                  className="border-primary"
                                />
                              </InputGroup>
                            </td>
                            <td>
                              <div className="fw-semibold text-success">
                                Reg: +₹{item.registerProfit !== null ? item.registerProfit.toFixed(2) : '--'}
                              </div>
                              <div className="fw-semibold text-success fs-12">
                                Renew: +₹{item.renewalProfit !== null ? item.renewalProfit.toFixed(2) : '--'}
                              </div>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={savingTld === item.tld}
                                onClick={() => handleSavePrice(item)}
                                className="px-3"
                              >
                                {savingTld === item.tld ? <Spinner size="sm" /> : 'Save Price'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              {/* TAB 2: DOMAIN AVAILABILITY LOOKUP */}
              <Tab.Pane eventKey="availability">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Check Domain Availability for Client</h5>
                  <p className="text-muted fs-13 mb-3">
                    Check if a domain is available and see the live ResellerClub wholesale cost vs client price.
                  </p>

                  <Form onSubmit={handleSearchDomain} style={{ maxWidth: '650px' }}>
                    <InputGroup size="lg">
                      <InputGroup.Text className="bg-light">
                        <IconifyIcon icon="tabler:search" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Enter domain name without extension (e.g. hostingspace)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button variant="primary" type="submit" disabled={searching || !searchQuery.trim()}>
                        {searching ? <Spinner size="sm" /> : 'Check Availability'}
                      </Button>
                    </InputGroup>
                  </Form>
                </div>

                {searchError && (
                  <Alert variant="danger" className="py-2">
                    <IconifyIcon icon="tabler:alert-circle" className="me-1" /> {searchError}
                  </Alert>
                )}

                {searchResults && (
                  <div className="table-responsive mt-3">
                    <Table className="align-middle table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Domain Name</th>
                          <th>Status</th>
                          <th>Wholesale Cost</th>
                          <th>Selling Price</th>
                          <th>Renewal Price</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((r) => {
                          const isAvail = r.status === 'available';
                          return (
                            <tr key={r.domain}>
                              <td className="fw-bold fs-15">{r.domain}</td>
                              <td>
                                <Badge bg={isAvail ? 'success' : 'secondary'} className="px-2 py-1">
                                  {isAvail ? 'AVAILABLE' : 'TAKEN'}
                                </Badge>
                              </td>
                              <td className="text-danger fw-semibold">
                                ₹{r.wholesaleRegister ? r.wholesaleRegister.toFixed(2) : '--'}
                              </td>
                              <td className="text-primary fw-semibold">
                                ₹{r.sellingPrice ? r.sellingPrice.toFixed(2) : '--'}
                              </td>
                              <td className="fw-semibold">
                                ₹{r.renewalPrice ? r.renewalPrice.toFixed(2) : '--'}
                              </td>
                              <td>
                                {isAvail ? (
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => alert(`Domain ${r.domain} is ready to register. Wholesale cost: ₹${r.wholesaleRegister}.`)}
                                  >
                                    <IconifyIcon icon="tabler:plus" className="me-1" /> Register for Client
                                  </Button>
                                ) : (
                                  <span className="text-muted fs-13">Not Available</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              {/* TAB 3: CLIENT DOMAIN RENEWALS */}
              <Tab.Pane eventKey="renewals">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">Client Domain Renewals</h5>
                    <p className="text-muted fs-13 mb-0">
                      Manage client domains, view fixed renewal amounts, and renew domains through ResellerClub.
                    </p>
                  </div>
                </div>

                {renewMessage && (
                  <Alert variant={renewMessage.type} dismissible onClose={() => setRenewMessage(null)}>
                    {renewMessage.text}
                  </Alert>
                )}

                {clientServices.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <IconifyIcon icon="tabler:inbox" className="fs-36 mb-2" />
                    <div>No active domain services found for clients.</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Domain Name</th>
                          <th>Client</th>
                          <th>Status</th>
                          <th>Expiry Date</th>
                          <th>Fixed Renewal Price</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientServices.map((service) => {
                          const domain = service.customName || service.domainDetail?.domainOwnership || 'N/A';
                          const clientName = service.client?.user?.name || service.client?.companyName || 'Unknown';
                          const expiryDate = service.expiryDate ? new Date(service.expiryDate).toLocaleDateString() : 'N/A';
                          const renewalPrice = service.renewalPrice || service.product?.renewalPrice || 0;

                          return (
                            <tr key={service.id}>
                              <td>
                                <strong className="text-primary">{domain}</strong>
                                <div className="fs-12 text-muted">{service.product?.name}</div>
                              </td>
                              <td>{clientName}</td>
                              <td>
                                <Badge bg={service.status === 'ACTIVE' ? 'success' : 'warning'}>
                                  {service.status}
                                </Badge>
                              </td>
                              <td>{expiryDate}</td>
                              <td className="fw-bold text-success">
                                ₹{renewalPrice.toFixed(2)}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={renewingId === service.id}
                                  onClick={() => handleRenewDomain(service)}
                                  className="d-inline-flex align-items-center"
                                >
                                  {renewingId === service.id ? (
                                    <>
                                      <Spinner size="sm" className="me-1" /> Renewing...
                                    </>
                                  ) : (
                                    <>
                                      <IconifyIcon icon="tabler:repeat" className="me-1" /> Renew (1 Yr)
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </CardBody>
        </Card>
      </Tab.Container>
    </div>
  );
}
