import { Cashfree, CFEnvironment } from 'cashfree-pg';

const env = CFEnvironment.SANDBOX;
const appId = "TEST1234";
const secretKey = "SECRET1234";

const cashfree = new Cashfree(env, appId, secretKey);

console.log(typeof cashfree.PGOrderFetchPayments);
