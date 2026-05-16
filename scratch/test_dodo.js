const DodoPayments = require('dodopayments').default;
require('dotenv').config({ path: 'c:/Users/PC/Desktop/jobvanta/web/.env.local' });

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  // We'll let the constructor auto-detect now, or explicitly set it
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'live_mode'
});

async function test() {
  console.log('Testing with key:', process.env.DODO_PAYMENTS_API_KEY.substring(0, 10) + '...');
  
  try {
    console.log('Fetching live products...');
    const products = await dodo.products.list({ limit: 10 });
    console.log('✅ Success! Raw Products Response:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('❌ Failed:', err.status, err.message, JSON.stringify(err.error || err, null, 2));
  }
}

test();
