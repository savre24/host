'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const DownloadPdfButton = ({ targetId, filename, autoDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Dynamically import html2pdf so it only loads on the client side
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById(targetId);
      
      if (!element) return;

      const opt = {
        margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
        filename:     filename || 'invoice.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Temporarily hide elements that shouldn't be in the PDF
      const noPrintElements = element.querySelectorAll('.d-print-none');
      const displayStates = [];
      noPrintElements.forEach(el => {
        displayStates.push(el.style.display);
        el.style.display = 'none';
      });

      // Force background colors to print by temporarily adding inline styles if needed
      // (html2pdf usually captures background colors fine with html2canvas)

      await html2pdf().set(opt).from(element).save();

      // Restore elements
      noPrintElements.forEach((el, index) => {
        el.style.display = displayStates[index];
      });
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        handleDownload();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, targetId, filename]);

  return (
    <Button variant="secondary" onClick={handleDownload} disabled={isDownloading}>
      <IconifyIcon icon="tabler:download" className="me-1" /> {isDownloading ? 'Generating...' : 'Download PDF'}
    </Button>
  );
};

export default DownloadPdfButton;
