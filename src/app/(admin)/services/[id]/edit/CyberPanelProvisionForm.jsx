'use client';

import { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export default function CyberPanelProvisionForm({ service }) {
  const router = useRouter();
  
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(true);
  
  const [packages, setPackages] = useState([]);
  const [phpVersions, setPhpVersions] = useState(['PHP 7.4', 'PHP 8.0', 'PHP 8.1', 'PHP 8.2', 'PHP 8.3']);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    serverId: '',
    domainName: '',
    packageName: '',
    phpVersion: 'PHP 8.1',
    sslEnabled: false
  });

  // If already provisioned, display read-only mode
  if (service.cyberPanelDetail) {
    const cp = service.cyberPanelDetail;
    return (
      <Card className="mb-4 border-success">
        <Card.Header className="bg-success-subtle text-success">
          <IconifyIcon icon="tabler:server" className="me-2" />
          CyberPanel Hosting is Provisioned
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Server:</strong> {cp.server?.name}</p>
              <p><strong>Domain:</strong> <a href={`http://${cp.domainName}`} target="_blank" rel="noreferrer">{cp.domainName}</a></p>
              <p><strong>Username:</strong> {cp.username}</p>
            </Col>
            <Col md={6}>
              <p><strong>Package:</strong> {cp.packageName}</p>
              <p><strong>PHP Version:</strong> {cp.phpVersion}</p>
              <p><strong>SSL Enabled:</strong> {cp.sslEnabled ? 'Yes' : 'No'}</p>
              <p><strong>Status:</strong> {cp.status}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  // Fetch servers on mount
  useEffect(() => {
    async function fetchServers() {
      try {
        const res = await fetch('/api/cyberpanel/servers');
        const json = await res.json();
        if (json.success) {
          const activeServers = json.data.filter(s => s.isActive);
          setServers(activeServers);
          if (activeServers.length > 0) {
            setFormData(prev => ({ ...prev, serverId: activeServers[0].id }));
          }
        }
      } catch (err) {
        toast.error('Failed to load CyberPanel servers');
      } finally {
        setLoadingServers(false);
      }
    }
    fetchServers();
  }, []);

  // Fetch packages when server changes
  useEffect(() => {
    if (!formData.serverId) return;
    
    async function fetchPackages() {
      setLoadingPackages(true);
      try {
        const res = await fetch(`/api/cyberpanel/servers/${formData.serverId}/packages`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.packages && json.data.packages.length > 0) {
            // Packages could be list of objects or strings, try to extract string names
            const parsedPkgs = json.data.packages.map(p => typeof p === 'string' ? p : (p.package || 'Default'));
            setPackages(parsedPkgs);
            setFormData(prev => ({ ...prev, packageName: parsedPkgs[0] }));
          }
          if (json.data.phpVersions) {
            setPhpVersions(json.data.phpVersions);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPackages(false);
      }
    }
    fetchPackages();
  }, [formData.serverId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    if (!formData.domainName || !formData.serverId || !formData.packageName || !formData.phpVersion) {
      setError('Please fill in all required fields.');
      return;
    }
    
    // Simple domain validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domainName)) {
      setError('Please enter a valid domain name (e.g. example.com)');
      return;
    }

    if (!window.confirm(`Are you sure you want to provision ${formData.domainName} on this CyberPanel server?`)) {
      return;
    }

    setIsProvisioning(true);
    setError(null);

    try {
      const res = await fetch('/api/cyberpanel/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientServiceId: service.id,
          serverId: formData.serverId,
          domainName: formData.domainName,
          packageName: formData.packageName,
          phpVersion: formData.phpVersion,
          sslEnabled: formData.sslEnabled
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Website provisioned successfully!');
        router.refresh();
      } else {
        setError(json.message || 'Provisioning failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProvisioning(false);
    }
  };

  if (loadingServers) {
    return <div>Loading CyberPanel servers...</div>;
  }

  if (servers.length === 0) {
    return (
      <Alert variant="warning">
        No active CyberPanel servers found. Please configure a server in CyberPanel Settings first.
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <IconifyIcon icon="tabler:server" className="me-2" />
        Provision CyberPanel Hosting
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleProvision}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Target Server *</Form.Label>
                <Form.Select 
                  name="serverId" 
                  value={formData.serverId} 
                  onChange={handleChange}
                  required
                >
                  {servers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.url})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Domain Name *</Form.Label>
                <Form.Control 
                  type="text" 
                  name="domainName"
                  placeholder="e.g. example.com"
                  value={formData.domainName}
                  onChange={handleChange}
                  required 
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Package *</Form.Label>
                {loadingPackages ? (
                  <div className="form-control bg-light text-muted">Loading packages...</div>
                ) : (
                  <Form.Select 
                    name="packageName" 
                    value={formData.packageName} 
                    onChange={handleChange}
                    required
                  >
                    {packages.length === 0 && <option value="">No packages found</option>}
                    {packages.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>PHP Version *</Form.Label>
                <Form.Select 
                  name="phpVersion" 
                  value={formData.phpVersion} 
                  onChange={handleChange}
                  required
                >
                  {phpVersions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col>
              <Form.Group className="mb-4">
                <Form.Check 
                  type="checkbox"
                  id="sslEnabled"
                  name="sslEnabled"
                  label="Issue Let's Encrypt SSL automatically (Domain must already point to server IP)"
                  checked={formData.sslEnabled}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isProvisioning || loadingPackages || !formData.serverId}
            >
              {isProvisioning ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Provisioning... (this may take a minute)
                </>
              ) : (
                'Provision Website'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
