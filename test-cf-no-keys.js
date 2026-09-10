import { Cashfree } from 'cashfree-pg';

async function test() {
  try {
    const cashfreeInstance = new Cashfree();
    const request = {
      order_amount: 1780.00,
      order_currency: 'INR',
      order_id: 'order_12345678_123456',
      customer_details: {
        customer_id: 'cust_12345',
        customer_phone: '9999999999'
      }
    };
    await cashfreeInstance.PGCreateOrder("2023-08-01", request);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
test();
