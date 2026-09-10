import { Cashfree, CFEnvironment } from 'cashfree-pg';

const cashfree = new Cashfree(CFEnvironment.SANDBOX, "TEST1234", "SECRET1234");
// Wait, I don't have valid credentials for cashfree in this test script, so it will throw an authorization error.
// Instead, I will write a script to just print the type of OrderEntity from Cashfree.
