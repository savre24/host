import { Cashfree, CFEnvironment } from 'cashfree-pg';

console.log("Cashfree keys:", Object.keys(Cashfree));
console.log("Cashfree prototype keys:", Object.keys(Cashfree.prototype || {}));
console.log("PGCreateOrder on Cashfree:", typeof Cashfree.PGCreateOrder);
console.log("PGCreateOrder on prototype:", typeof Cashfree.prototype?.PGCreateOrder);

try {
  Cashfree.XClientId = 'test';
  console.log("XClientId:", Cashfree.XClientId);
} catch (e) {
  console.log("Error setting XClientId", e);
}
