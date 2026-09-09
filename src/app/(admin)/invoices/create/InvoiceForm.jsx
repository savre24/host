'use client';

import { createInvoice, updateInvoice } from '@/app/actions/billing';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Button, Col, Form, Row, Table, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const InvoiceForm = ({ clients, products, defaultInvoiceNumber, defaultTaxRate = 18, onlineChargeRate = 2.0, initialData = null }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  // Default Line Item
  const emptyItem = { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: defaultTaxRate, total: 0 };
  
  const [items, setItems] = useState(initialData?.items && initialData.items.length > 0 ? initialData.items : [{ ...emptyItem }]);
  
  // Totals
  const [totals, setTotals] = useState({ 
    subtotal: initialData?.subtotal || 0, 
    taxAmount: initialData?.taxAmount || 0, 
    discountAmount: initialData?.discount || 0, 
    onlinePaymentCharge: initialData?.onlinePaymentCharge || 0,
    grandTotal: initialData?.total || 0 
  });

  const [applyOnlineCharge, setApplyOnlineCharge] = useState(
    initialData ? (initialData.onlinePaymentCharge > 0) : true
  );

  // Calculate totals whenever items change
  useEffect(() => {
    let sub = 0;
    let tax = 0;
    let disc = 0;

    items.forEach(item => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      const d = parseFloat(item.discount) || 0;
      const tRate = parseFloat(item.taxRate) || 0;

      const basePrice = q * p;
      const rowTotalAfterDiscount = basePrice - d;
      const rowTax = (rowTotalAfterDiscount * tRate) / 100;

      sub += basePrice;
      disc += d;
      tax += rowTax;
    });

    const subTotalWithTax = sub - disc + tax;
    const onlineCharge = applyOnlineCharge ? (subTotalWithTax * onlineChargeRate) / 100 : 0;

    setTotals({
      subtotal: sub,
      discountAmount: disc,
      taxAmount: tax,
      onlinePaymentCharge: onlineCharge,
      grandTotal: subTotalWithTax + onlineCharge
    });
  }, [items, applyOnlineCharge, onlineChargeRate]);

  const handleAddItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleProductSelect = (index, productId) => {
    const newItems = [...items];
    if (productId) {
      const selectedProduct = products.find(p => p.id === productId);
      if (selectedProduct) {
        newItems[index].description = selectedProduct.name;
        newItems[index].unitPrice = selectedProduct.basePrice;
      }
    } else {
      newItems[index].description = '';
      newItems[index].unitPrice = 0;
    }
    setItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.subtotal = totals.subtotal;
    data.discount = totals.discountAmount;
    data.taxAmount = totals.taxAmount;
    data.onlinePaymentCharge = totals.onlinePaymentCharge;
    data.total = totals.grandTotal;

    const validItems = items.filter(item => item.description.trim() !== '').map(item => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      const d = parseFloat(item.discount) || 0;
      const tRate = parseFloat(item.taxRate) || 0;

      const basePrice = q * p;
      const rowTotalAfterDiscount = basePrice - d;
      const rowTax = (rowTotalAfterDiscount * tRate) / 100;
      const finalRowTotal = rowTotalAfterDiscount + rowTax;
      
      return { ...item, total: finalRowTotal };
    });
    
    if (validItems.length === 0) {
      toast.error('Please add at least one item to the invoice.');
      return;
    }

    startTransition(async () => {
      setError(null);
      let result;
      if (initialData?.id) {
        result = await updateInvoice(initialData.id, data, validItems);
      } else {
        result = await createInvoice(data, validItems);
      }
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success(initialData?.id ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        router.push(`/invoices/${result.data.id}`);
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group className="mb-3" controlId="clientId">
            <Form.Label>Select Client</Form.Label>
            <select name="clientId" className="form-select" required data-choices="false" defaultValue={initialData?.clientId || ''}>
              <option value="">-- Select Client --</option>
              {clients.map(c => (
                <option key={c.clientProfile.id} value={c.clientProfile.id}>
                  {c.name} {c.clientProfile.companyName ? `(${c.clientProfile.companyName})` : ''}
                </option>
              ))}
            </select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="invoiceNumber">
            <Form.Label>Invoice Number</Form.Label>
            <Form.Control required type="text" name="invoiceNumber" defaultValue={initialData?.invoiceNumber || defaultInvoiceNumber} />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3" controlId="invoiceDate">
            <Form.Label>Invoice Date</Form.Label>
            <Form.Control required type="date" name="invoiceDate" defaultValue={initialData?.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="dueDate">
            <Form.Label>Due Date</Form.Label>
            <Form.Control required type="date" name="dueDate" defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
          </Form.Group>
        </Col>
      </Row>

      {/* LINE ITEMS */}
      <Card className="mb-4 shadow-sm border-0 bg-light-subtle">
        <Card.Body>
          <h5 className="mb-3">Line Items</h5>
          <div className="table-responsive" style={{ overflow: 'visible' }}>
            <Table bordered hover size="sm" className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '15%' }}>Unit Price (₹)</th>
                  <th style={{ width: '10%' }}>Discount (₹)</th>
                  <th style={{ width: '10%' }}>Tax (%)</th>
                  <th style={{ width: '15%' }}>Total (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <select 
                          className="form-select form-select-sm" 
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          data-choices="false"
                        >
                          <option value="">-- Custom Description --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          required 
                          placeholder="Service description" 
                          value={item.description} 
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                        />
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        required 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        required 
                        min="0" 
                        step="0.01" 
                        value={item.unitPrice} 
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        min="0" 
                        step="0.01" 
                        value={item.discount} 
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        min="0" 
                        max="100" 
                        step="0.1" 
                        value={item.taxRate} 
                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)} 
                      />
                    </td>
                    <td className="align-middle fw-medium text-end">
                      ₹{(((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) - (parseFloat(item.discount) || 0)) * (1 + (parseFloat(item.taxRate) || 0) / 100)).toFixed(2)}
                    </td>
                    <td className="align-middle text-center">
                      <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveItem(index)}>
                        <IconifyIcon icon="tabler:trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="mt-3">
            <Button variant="outline-primary" size="sm" onClick={handleAddItem}>
              <IconifyIcon icon="tabler:plus" className="me-1" /> Add Line Item
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group controlId="notes">
            <Form.Label>Notes / Terms</Form.Label>
            <Form.Control as="textarea" rows={4} name="notes" placeholder="Thank you for your business!" defaultValue={initialData?.notes || ''} />
          </Form.Group>
          <Form.Group className="mt-4">
            <Form.Label className="d-block mb-2">Initial Status</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check type="radio" id="status-draft" name="status" label="Draft" value="DRAFT" defaultChecked={!initialData || initialData.status === 'DRAFT'} />
              <Form.Check type="radio" id="status-pending" name="status" label="Pending (Sent)" value="PENDING" defaultChecked={initialData?.status === 'PENDING'} />
              <Form.Check type="radio" id="status-paid" name="status" label="Paid" value="PAID" defaultChecked={initialData?.status === 'PAID'} />
            </div>
          </Form.Group>
          <Form.Group className="mt-4">
            <Form.Check 
              type="checkbox" 
              id="applyOnlineCharge" 
              label={`Apply Online Payment Charge (${onlineChargeRate}%)`} 
              checked={applyOnlineCharge} 
              onChange={(e) => setApplyOnlineCharge(e.target.checked)} 
            />
            <small className="text-muted d-block mt-1">
              Waived if the customer pays offline (e.g. Bank Transfer).
            </small>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Card className="border-0 bg-light-subtle">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal:</span>
                <span className="fw-medium">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Discount:</span>
                <span className="text-success">- ₹{totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tax Amount:</span>
                <span>₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              {totals.onlinePaymentCharge > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Online Payment Charge ({onlineChargeRate}%):</span>
                  <span>₹{totals.onlinePaymentCharge.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Grand Total:</h5>
                <h4 className="mb-0 text-primary">₹{totals.grandTotal.toFixed(2)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
        <Button variant="outline-secondary" type="button" onClick={() => router.push('/invoices')}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </div>
    </Form>
  );
};

export default InvoiceForm;
