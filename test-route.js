import { Cashfree, CFEnvironment } from 'cashfree-pg';

const gatewaySetting = {
  appId: 'TEST10252119edda4e6f46142750eeb591125201',
  secretKey: 'cfsk_ma_test_d6da1752b978d3893bb39893d56d7870_dd4931a2',
  environment: 'SANDBOX'
};

Cashfree.XClientId = gatewaySetting.appId;
Cashfree.XClientSecret = gatewaySetting.secretKey;
Cashfree.XEnvironment = gatewaySetting.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

async function test() {
  try {
    const request = {
      order_amount: 1780.00,
      order_currency: 'INR',
      order_id: 'order_12345678_123456',
      customer_details: {
        customer_id: 'cust_12345',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '9999999999'
      },
      order_meta: {
        return_url: 'http://localhost:3000/verify'
      }
    };
    
    console.log("XClientId static:", Cashfree.XClientId);
    
    const cashfreeInstance = new Cashfree();
    const response = await cashfreeInstance.PGCreateOrder("2023-08-01", request);
    console.log("Success:", response.data);
  } catch (error) {
    const errorDetails = error?.response?.data || error?.message || error;
    console.error('Error Details:', JSON.stringify(errorDetails, null, 2));
  }
}
test();
