const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
    console.error('❌ RAZORPAY_KEY_SECRET not found in .env');
    process.exit(1);
}

function verifySignature(orderId, paymentId, signature) {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(text, "utf-8")
        .digest("hex");
    
    return generated === signature;
}

console.log('--- Razorpay Signature Logic Test ---');
const mockOrderId = 'order_abc123';
const mockPaymentId = 'pay_xyz789';

// Simulate what we expect
const expectedText = `${mockOrderId}|${mockPaymentId}`;
const mockSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(expectedText, "utf-8")
    .digest("hex");

const isValid = verifySignature(mockOrderId, mockPaymentId, mockSignature);

console.log(`Order ID: ${mockOrderId}`);
console.log(`Payment ID: ${mockPaymentId}`);
console.log(`Generated Signature: ${mockSignature}`);
console.log(`Verification Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

if (!isValid) {
    process.exit(1);
}
