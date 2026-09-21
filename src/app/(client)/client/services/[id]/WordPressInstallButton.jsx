'use client';

import { useState } from 'react';

export default function WordPressInstallButton({ serviceId, domainName, email }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInstall = async () => {
    if (!confirm(`Are you sure you want to install WordPress on ${domainName}? This will overwrite any existing files.`)) return;
    
    setLoading(true);
    setMessage('Installing WordPress... This may take a minute.');

    try {
      const res = await fetch(`/api/cyberpanel/services/${serviceId}/wordpress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainName,
          blogTitle: `${domainName} Blog`,
          adminUser: 'wpadmin',
          adminEmail: email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! WordPress installed. Username: wpadmin | Password: ${data.password}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('A network error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="mt-3">
      <button 
        className="btn btn-primary" 
        onClick={handleInstall} 
        disabled={loading}
      >
        {loading ? 'Installing...' : '1-Click Install WordPress'}
      </button>
      {message && <div className={`mt-2 alert ${message.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
    </div>
  );
}
