const Razorpay = require('razorpay');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testOrder() {
  try {
    console.log('Testing Razorpay Order Creation...');
    const order = await razorpay.orders.create({
      amount: 5000, // ₹50
      currency: 'INR',
      receipt: 'test_receipt_123',
    });
    console.log('✅ Success! Order ID:', order.id);
  } catch (err) {
    console.error('❌ Failed!');
    console.error(err);
  }
}

testOrder();
