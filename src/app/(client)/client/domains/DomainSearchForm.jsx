'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Spinner, Badge, Alert, Form, InputGroup } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const DEFAULT_PRICES = {
  'com': '₹899 / year',
  'in': '₹499 / year',
  'co.in': '₹399 / year',
  'net': '₹999 / year',
  'org': '₹999 / year',
  'online': '₹199 / 1st yr',
  'info': '₹399 / 1st yr',
  'biz': '₹699 / year',
};

export default function DomainSearchForm() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTlds, setSelectedTlds] = useState(['com', 'in', 'co.in', 'net', 'org']);

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
            Check real-time availability across top TLDs and connect instantly with your CyberPanel hosting.
          </p>

          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            <Form onSubmit={handleSearch}>
              <InputGroup size="lg" className="shadow-lg rounded-pill overflow-hidden bg-white p-1">
                <InputGroup.Text className="bg-transparent border-0 ps-3">
                  <IconifyIcon icon="tabler:search" className="fs-22 text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter your desired domain name (e.g. myshop)"
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
                          onClick={() => alert(`Registration request for ${item.domain} initiated. Support team will connect or invoice generated.`)}
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
    </div>
  );
}
