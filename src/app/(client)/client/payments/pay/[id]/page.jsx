import { getInvoiceById } from '@/app/actions/billing';
import { getBusinessSetting } from '@/app/actions/settings';
import { notFound } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import CashfreePaymentButton from './CashfreePaymentButton';

export const metadata = {
  title: 'Secure Payment Checkout',
};

const PaymentCheckoutPage = async ({ params }) => {
  const { id } = await params;
  const { data: invoice, error } = await getInvoiceById(id);
  const { data: business } = await getBusinessSetting();

  if (error || !invoice) {
    notFound();
  }

  const isPaid = invoice.status === 'PAID';

  return (
    <>
      <PageTitle title="Payment Checkout" subTitle={`Invoice ${invoice.invoiceNumber}`} />
      
      <div className="row justify-content-center mt-4">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center py-4">
              <h4 className="mb-0 text-white">Payment Checkout</h4>
              <p className="mb-0 mt-2 text-white-50">{business?.companyName || 'Our Company'}</p>
            </div>
            <div className="card-body p-4">
              
              {isPaid ? (
                <div className="text-center py-4">
                  <div className="display-4 text-success mb-3">
                    <i className="ti ti-circle-check-filled"></i>
                  </div>
                  <h4>Payment Successful</h4>
                  <p className="text-muted">This invoice has already been paid.</p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                      <h6 className="text-muted mb-1">Invoice Number</h6>
                      <strong>{invoice.invoiceNumber}</strong>
                    </div>
                    <div className="text-end">
                      <h6 className="text-muted mb-1">Due Date</h6>
                      <strong>{new Date(invoice.dueDate).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>₹{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.taxAmount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tax</span>
                        <span>₹{invoice.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Total Due</h5>
                      <h4 className="mb-0 text-primary">₹{invoice.total.toFixed(2)}</h4>
                    </div>
                  </div>

                  <CashfreePaymentButton invoice={invoice} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCheckoutPage;
