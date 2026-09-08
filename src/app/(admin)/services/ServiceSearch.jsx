'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const ServiceSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    router.push(`/services?${params.toString()}`);
  };

  return (
    <Form onSubmit={handleSearch} className="mb-3">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Search by service name, client name, or custom identifier..."
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

export default ServiceSearch;
