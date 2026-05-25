const Razorpay = require('razorpay');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const razorpay = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
  key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
});

const testOrderId = 'order_St8Ld5G01LBFiA'; // The last successful order ID from your logs

console.log(`Checking if Key ID ${process.env.RAZORPAY_KEY_ID} can access Order ${testOrderId}...`);

razorpay.orders.fetch(testOrderId).then(order => {
  console.log('✅ TRUTH: Credentials are PERFECT. They can access the order.');
  console.log('Order status:', order.status);
  process.exit(0);
}).catch(err => {
  console.error('❌ TRUTH: Credentials MISMATCH!');
  console.error('The Key Secret in your .env does NOT match your Key ID.');
  console.error('Error:', JSON.stringify(err, null, 2));
  process.exit(1);
});
