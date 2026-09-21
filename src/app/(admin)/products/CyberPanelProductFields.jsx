'use client';

import { useState, useEffect } from 'react';
import { Form, Col, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function CyberPanelProductFields({ defaultServerId = '', defaultPackage = '', defaultPhpVersion = 'PHP 8.1' }) {
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(true);
  
  const [packages, setPackages] = useState([]);
  const [phpVersions, setPhpVersions] = useState(['PHP 7.4', 'PHP 8.0', 'PHP 8.1', 'PHP 8.2', 'PHP 8.3', 'PHP 8.4', 'PHP 8.5']);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [serverId, setServerId] = useState(defaultServerId);
  const [packageName, setPackageName] = useState(defaultPackage);
  const [phpVersion, setPhpVersion] = useState(defaultPhpVersion);

  // Fetch servers on mount
  useEffect(() => {
    async function fetchServers() {
      try {
        const res = await fetch('/api/cyberpanel/servers');
        const json = await res.json();
        if (json.success) {
          const activeServers = json.data.filter(s => s.isActive);
          setServers(activeServers);
          if (activeServers.length > 0 && !serverId) {
            setServerId(activeServers[0].id);
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
    if (!serverId) return;
    
    async function fetchPackages() {
      setLoadingPackages(true);
      try {
        const res = await fetch(`/api/cyberpanel/servers/${serverId}/packages`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.packages && json.data.packages.length > 0) {
            const parsedPkgs = json.data.packages.map(p => typeof p === 'string' ? p : (p.package || 'Default'));
            setPackages(parsedPkgs);
            if (!parsedPkgs.includes(packageName)) {
              setPackageName(parsedPkgs[0]);
            }
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
  }, [serverId]);

  if (loadingServers) {
    return <div className="text-muted mb-3">Loading CyberPanel servers...</div>;
  }

  if (servers.length === 0) {
    return <div className="alert alert-warning mb-3">No active CyberPanel servers found. Please configure one in Settings.</div>;
  }

  return (
    <>
      <div className="mt-4 mb-3 border-top pt-3">
        <h5 className="mb-3">CyberPanel Provisioning Details</h5>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="cyberPanelServerId">
            <Form.Label>Target Server</Form.Label>
            <Form.Select 
              name="cyberPanelServerId" 
              value={serverId} 
              onChange={(e) => setServerId(e.target.value)}
              required
            >
              {servers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.url})</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="cyberPanelPackage">
            <Form.Label>Package</Form.Label>
            {loadingPackages ? (
              <div className="form-control bg-light text-muted">Loading...</div>
            ) : (
              <Form.Select 
                name="cyberPanelPackage" 
                value={packageName} 
                onChange={(e) => setPackageName(e.target.value)}
                required
              >
                {packages.length === 0 && <option value="">No packages found</option>}
                {packages.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="cyberPanelPhpVersion">
            <Form.Label>Default PHP Version</Form.Label>
            <Form.Select 
              name="cyberPanelPhpVersion" 
              value={phpVersion} 
              onChange={(e) => setPhpVersion(e.target.value)}
              required
            >
              {phpVersions.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Row>
      </div>
    </>
  );
}
