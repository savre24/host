'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Button, Spinner, Badge, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const DEFAULT_PRICES = {
  'com': '₹1850 / year',
  'in': '₹899 / year',
  'co.in': '₹899 / year',
  'net': '₹1799 / year',
  'org': '₹1850 / year',
  'online': '₹499 / 1st yr',
};

export default function DomainSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTlds, setSelectedTlds] = useState(['com', 'in', 'co.in', 'net', 'org', 'online']);

  // Registration Order Modal State
  const [orderModalDomain, setOrderModalDomain] = useState(null);
  const [orderYears, setOrderYears] = useState(1);
  const [useCustomNs, setUseCustomNs] = useState(false);
  const [customNs1, setCustomNs1] = useState('');
  const [customNs2, setCustomNs2] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanDomain = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (!cleanDomain) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/domains/search?domain=${encodeURIComponent(cleanDomain)}&tlds=${selectedTlds.join(',')}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search domain availability');
      }

      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTld = (tld) => {
    setSelectedTlds(prev => 
      prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld]
    );
  };

  const handleOpenOrderModal = (item) => {
    setOrderModalDomain(item);
    setOrderYears(1);
    setUseCustomNs(false);
    setCustomNs1('');
    setCustomNs2('');
    setOrderError(null);
  };

  const handleConfirmOrder = async () => {
    if (!orderModalDomain) return;

    if (useCustomNs && (!customNs1.trim() || !customNs2.trim())) {
      setOrderError('Please enter both Nameserver 1 and Nameserver 2.');
      return;
    }

    setOrdering(true);
    setOrderError(null);

    try {
      const nameservers = useCustomNs
        ? [customNs1.trim(), customNs2.trim()]
        : ['ns1.hostingspaceindia.com', 'ns2.hostingspaceindia.com'];

      const res = await fetch('/api/client/domains/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: orderModalDomain.domain,
          years: orderYears,
          nameservers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate order');
      }

      // Redirect client directly to the payment checkout page
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push(`/client/invoices/${data.invoiceId}`);
      }
    } catch (err) {
      setOrderError(err.message);
      setOrdering(false);
    }
  };

  return (
    <div>
      {/* Search Header Banner */}
      <Card className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
        <CardBody className="p-4 p-lg-5 text-center">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-primary bg-opacity-25 text-primary mb-3">
            <IconifyIcon icon="tabler:world" className="fs-36" />
          </div>
          <h2 className="fw-bold text-white mb-2">Search & Register New Domains</h2>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '600px' }}>
            Check real-time availability across top TLDs and connect instantly with your hosting.
          </p>

          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            <Form onSubmit={handleSearch}>
              <InputGroup size="lg" className="shadow-lg rounded-pill overflow-hidden bg-white p-1">
                <InputGroup.Text className="bg-transparent border-0 ps-3">
                  <IconifyIcon icon="tabler:search" className="fs-22 text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter your desired domain name (e.g. sasikala)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 shadow-none fs-16 py-2"
                  autoFocus
                />
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || !query.trim()}
                  className="rounded-pill px-4 fw-medium d-flex align-items-center"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Search <IconifyIcon icon="tabler:arrow-right" className="ms-1" />
                    </>
                  )}
                </Button>
              </InputGroup>
            </Form>

            {/* Popular TLD quick filters */}
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-3">
              <span className="text-white-50 fs-13 me-1">Popular extensions:</span>
              {['com', 'in', 'co.in', 'net', 'org', 'online'].map((tld) => {
                const active = selectedTlds.includes(tld);
                return (
                  <button
                    key={tld}
                    type="button"
                    onClick={() => toggleTld(tld)}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${active ? 'btn-primary' : 'btn-outline-light border-opacity-25 text-white-50'}`}
                    style={{ fontSize: '12px' }}
                  >
                    .{tld}
                  </button>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <IconifyIcon icon="tabler:alert-triangle" className="me-2" />
          {error}
        </Alert>
      )}

      {/* Results Section */}
      {results && results.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <CardBody className="p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <IconifyIcon icon="tabler:list-check" className="text-primary me-2" />
              Availability Results for &ldquo;{query}&rdquo;
            </h5>

            <div className="list-group list-group-flush">
              {results.map((item) => {
                const isAvailable = item.status === 'available';
                const displayPrice = item.sellingPrice 
                  ? `₹${item.sellingPrice} / year` 
                  : (DEFAULT_PRICES[item.tld] || 'Contact for price');

                return (
                  <div
                    key={item.domain}
                    className="list-group-item px-0 py-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2"
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        className={`rounded-circle p-2 me-3 d-flex align-items-center justify-content-center ${
                          isAvailable ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'
                        }`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        <IconifyIcon 
                          icon={isAvailable ? 'tabler:check' : 'tabler:x'} 
                          className="fs-20" 
                        />
                      </div>
                      <div>
                        <div className="fw-bold fs-16 text-body">
                          {item.domain}
                        </div>
                        <div className="text-muted fs-13">
                          {isAvailable ? 'Ready for instant registration' : 'Already registered by someone else'}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 w-100 w-md-auto justify-content-between justify-content-md-end">
                      <div className="text-end">
                        <div className="fw-bold fs-15 text-primary">
                          {displayPrice}
                        </div>
                        {isAvailable && item.renewalPrice && (
                          <div className="text-muted fs-11">
                            Renews at ₹{item.renewalPrice}/yr
                          </div>
                        )}
                        <Badge bg={isAvailable ? 'success' : 'secondary'} className="px-2 py-1 mt-1">
                          {isAvailable ? 'AVAILABLE' : 'TAKEN'}
                        </Badge>
                      </div>

                      {isAvailable ? (
                        <Button
                          variant="success"
                          size="sm"
                          className="px-3 py-2 fw-medium d-flex align-items-center"
                          onClick={() => handleOpenOrderModal(item)}
                        >
                          <IconifyIcon icon="tabler:shopping-cart-plus" className="me-1" />
                          Register
                        </Button>
                      ) : (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled
                          className="px-3 py-2"
                        >
                          Unavailable
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Feature perks */}
      <div className="row g-3">
        <div className="col-md-4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="p-3 d-flex align-items-center">
              <div className="avatar-md bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fs-24">
                <IconifyIcon icon="tabler:shield-check" />
              </div>
              <div>
                <h6 className="fw-bold mb-1">WHOIS Privacy Protected</h6>
                <p className="text-muted mb-0 fs-13">Keep your personal contact details safe from spam.</p>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="p-3 d-flex align-items-center">
              <div className="avatar-md bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center me-3 fs-24">
                <IconifyIcon icon="tabler:server-2" />
              </div>
              <div>
                <h6 className="fw-bold mb-1">CyberPanel Auto-Connect</h6>
                <p className="text-muted mb-0 fs-13">Direct 1-click nameserver link to your hosting server.</p>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="p-3 d-flex align-items-center">
              <div className="avatar-md bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center me-3 fs-24">
                <IconifyIcon icon="tabler:refresh" />
              </div>
              <div>
                <h6 className="fw-bold mb-1">Easy Renewal & Transfer</h6>
                <p className="text-muted mb-0 fs-13">Automatic renewal reminders and zero lock-in contracts.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      {orderModalDomain && (
        <Modal show={!!orderModalDomain} onHide={() => !ordering && setOrderModalDomain(null)} centered size="lg">
          <Modal.Header closeButton={!ordering}>
            <Modal.Title className="d-flex align-items-center fs-18">
              <IconifyIcon icon="tabler:world" className="text-primary me-2 fs-22" />
              Register Domain: <span className="text-primary ms-1">{orderModalDomain.domain}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {orderError && (
              <Alert variant="danger" dismissible onClose={() => setOrderError(null)} className="mb-3">
                <IconifyIcon icon="tabler:alert-triangle" className="me-2" />
                {orderError}
              </Alert>
            )}

            <div className="bg-light rounded p-3 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-1 fs-16">{orderModalDomain.domain}</h6>
                  <span className="text-muted fs-13">Ready for instant registration & hosting connect</span>
                </div>
                <div className="text-end">
                  <div className="fw-bold fs-18 text-primary">₹{orderModalDomain.sellingPrice || 1799} / yr</div>
                  {orderModalDomain.renewalPrice && (
                    <div className="text-muted fs-12">Renews at ₹{orderModalDomain.renewalPrice}/yr</div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Duration */}
            <div className="mb-4">
              <label className="form-label fw-bold">Registration Period</label>
              <div className="row g-2">
                {[1, 2, 3].map((yr) => {
                  const price = (orderModalDomain.sellingPrice || 1799) * yr;
                  const isSelected = orderYears === yr;
                  return (
                    <div className="col-4" key={yr}>
                      <div
                        onClick={() => !ordering && setOrderYears(yr)}
                        className={`p-3 rounded border text-center transition-all ${
                          isSelected ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'bg-white'
                        }`}
                        style={{ cursor: ordering ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="fw-bold fs-15">{yr} {yr === 1 ? 'Year' : 'Years'}</div>
                        <div className="fs-13 fw-semibold mt-1">₹{price}</div>
                        {yr > 1 && <span className="badge bg-success-subtle text-success fs-10 mt-1">Save hassle</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nameservers Configuration */}
            <div className="mb-4">
              <label className="form-label fw-bold mb-2">Nameserver Configuration</label>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="nsType"
                  id="nsDefault"
                  checked={!useCustomNs}
                  onChange={() => setUseCustomNs(false)}
                  disabled={ordering}
                />
                <label className="form-check-label" htmlFor="nsDefault">
                  <strong>Use Hosting Space India Nameservers (Recommended)</strong>
                  <div className="text-muted fs-12">
                    Default: <code>ns1.hostingspaceindia.com</code>, <code>ns2.hostingspaceindia.com</code>
                  </div>
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="nsType"
                  id="nsCustom"
                  checked={useCustomNs}
                  onChange={() => setUseCustomNs(true)}
                  disabled={ordering}
                />
                <label className="form-check-label" htmlFor="nsCustom">
                  <strong>Use Custom Nameservers</strong>
                </label>
              </div>

              {useCustomNs && (
                <div className="row g-2 mt-2 ps-4">
                  <div className="col-sm-6">
                    <Form.Control
                      type="text"
                      placeholder="Nameserver 1 (e.g. ns1.example.com)"
                      value={customNs1}
                      onChange={(e) => setCustomNs1(e.target.value)}
                      disabled={ordering}
                    />
                  </div>
                  <div className="col-sm-6">
                    <Form.Control
                      type="text"
                      placeholder="Nameserver 2 (e.g. ns2.example.com)"
                      value={customNs2}
                      onChange={(e) => setCustomNs2(e.target.value)}
                      disabled={ordering}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between mb-2 fs-14">
                <span>Domain Registration ({orderYears} {orderYears === 1 ? 'year' : 'years'})</span>
                <span className="fw-semibold">₹{(orderModalDomain.sellingPrice || 1799) * orderYears}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 fs-14 text-muted">
                <span>Estimated GST (18%)</span>
                <span>+₹{(((orderModalDomain.sellingPrice || 1799) * orderYears * 0.18)).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                <span className="fw-bold fs-16">Estimated Total</span>
                <span className="fw-bold fs-18 text-primary">
                  ₹{(((orderModalDomain.sellingPrice || 1799) * orderYears * 1.18)).toFixed(2)}
                </span>
              </div>
              <p className="text-muted fs-11 mt-1 mb-0">
                * An official invoice will be generated. You can pay securely with UPI, Credit/Debit Cards, or Netbanking via Cashfree.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setOrderModalDomain(null)} disabled={ordering}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmOrder}
              disabled={ordering}
              className="d-flex align-items-center"
            >
              {ordering ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Generating Invoice & Checkout...
                </>
              ) : (
                <>
                  <IconifyIcon icon="tabler:credit-card" className="me-1" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
