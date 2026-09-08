'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const ClientSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Debounce the search or just trigger on Enter/Submit.
  // For simplicity, we'll search on form submit.
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    router.push(`/clients?${params.toString()}`);
  };

  return (
    <Form onSubmit={handleSearch} className="mb-3">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Search clients by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-secondary">
          <IconifyIcon icon="tabler:search" width={18} height={18} /> Search
        </button>
      </InputGroup>
    </Form>
  );
};

export default ClientSearch;
