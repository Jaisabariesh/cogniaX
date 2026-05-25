const Razorpay = require('razorpay');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '.env');
console.log('Checking .env at:', envPath);
if (fs.existsSync(envPath)) {
  console.log('.env file exists');
} else {
  console.log('.env file DOES NOT exist');
}

require('dotenv').config({ path: envPath });

console.log('ID:', process.env.RAZORPAY_KEY_ID);
console.log('Secret:', process.env.RAZORPAY_KEY_SECRET ? 'EXISTS (Length: ' + process.env.RAZORPAY_KEY_SECRET.length + ')' : 'MISSING');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('Initiating Razorpay order creation...');
razorpay.orders.create({
  amount: 100, // 1 INR
  currency: 'INR',
  receipt: 'test_receipt'
}).then(order => {
  console.log('✅ Success! Order ID:', order.id);
  process.exit(0);
}).catch(err => {
  console.error('❌ Failed!');
  console.error('Error:', JSON.stringify(err, null, 2));
  process.exit(1);
});

