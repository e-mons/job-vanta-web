import DodoPayments from 'dodopayments';

if (!process.env.DODO_PAYMENTS_API_KEY) {
  throw new Error('DODO_PAYMENTS_API_KEY is not defined in environment variables');
}

const getEnvironment = () => {
  if (process.env.DODO_PAYMENTS_ENVIRONMENT) {
    return process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode';
  }
  
  const key = process.env.DODO_PAYMENTS_API_KEY || '';
  if (key.startsWith('live_') || key.startsWith('xOESD')) {
    return 'live_mode';
  }
  
  return process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode';
};

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: getEnvironment(),
});
