import cashfreePkg from 'cashfree-pg';
const { Cashfree, CFEnvironment } = cashfreePkg;

Cashfree.XClientId = 'TEST10252119edda4e6f46142750eeb591125201';
Cashfree.XClientSecret = 'cfsk_ma_test_d6da1752b978d3893bb39893d56d7870_dd4931a2';
Cashfree.XEnvironment = CFEnvironment.SANDBOX;

async function test() {
  try {
    const cf = new Cashfree();
    const request = {
      order_amount: 1780.00,
      order_currency: 'INR',
      order_id: 'order_12345678_123456',
      customer_details: {
        customer_id: 'cust_12345',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '9999999999'
      }
    };
    
    console.log("Creating order...");
    const response = await cf.PGCreateOrder("2023-08-01", request);
    console.log("Success:", response.data);
  } catch (error) {
    console.error('Error:', error?.response?.data || error.message || error);
  }
}
test();
