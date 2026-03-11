import { Fidloy, FidloyError, FidloyAPIError, FidloyAuthError, FidloyRateLimitError, FidloyNetworkError, FidloyNotFoundError } from './src/index.js';

// ---- 1. Configuration error --------------------------------------------
try {
  new Fidloy({});
  throw new Error('Expected FidloyError for missing credentials');
} catch (e) {
  if (!(e instanceof FidloyError)) throw e;
}

// ---- 2. Auth construction (apiKey) -------------------------------------
const sdk = new Fidloy({ apiKey: 'demo-key' });

// ---- 3. Auth construction (bearerToken) --------------------------------
const sdkJwt = new Fidloy({ bearerToken: 'my.jwt.token' });

// ---- 4. Flat shortcut methods exist ------------------------------------
if (typeof sdk.listTransactions !== 'function') throw new Error('listTransactions missing');
if (typeof sdk.listCustomers    !== 'function') throw new Error('listCustomers missing');

// ---- 5. Structured modules exist ---------------------------------------
if (!sdk.transactions) throw new Error('transactions module missing');
if (!sdk.customers)    throw new Error('customers module missing');
if (!sdk.loyalty)      throw new Error('loyalty module missing');
if (!sdk.receipts)     throw new Error('receipts module missing');
if (!sdk.webhooks)     throw new Error('webhooks module missing');

// ---- 6. Module methods exist -------------------------------------------
if (typeof sdk.transactions.list     !== 'function') throw new Error('transactions.list missing');
if (typeof sdk.transactions.paginate !== 'function') throw new Error('transactions.paginate missing');
if (typeof sdk.transactions.create   !== 'function') throw new Error('transactions.create missing');
if (typeof sdk.customers.list        !== 'function') throw new Error('customers.list missing');
if (typeof sdk.customers.paginate    !== 'function') throw new Error('customers.paginate missing');
if (typeof sdk.customers.create      !== 'function') throw new Error('customers.create missing');
if (typeof sdk.loyalty.redeemPoints  !== 'function') throw new Error('loyalty.redeemPoints missing');
if (typeof sdk.loyalty.redeemCoupon  !== 'function') throw new Error('loyalty.redeemCoupon missing');

// ---- 7. Error class hierarchy ------------------------------------------
if (!(new FidloyAPIError(400, 'bad') instanceof FidloyError))       throw new Error('FidloyAPIError hierarchy');
if (!(new FidloyAuthError(401, 'auth') instanceof FidloyAPIError))  throw new Error('FidloyAuthError hierarchy');
if (!(new FidloyRateLimitError() instanceof FidloyAPIError))        throw new Error('FidloyRateLimitError hierarchy');
if (!(new FidloyNotFoundError('nf') instanceof FidloyAPIError))     throw new Error('FidloyNotFoundError hierarchy');
if (!(new FidloyNetworkError('net') instanceof FidloyError))        throw new Error('FidloyNetworkError hierarchy');

// ---- 8. RateLimitError retryAfter -------------------------------------
const rle = new FidloyRateLimitError(30);
if (rle.retryAfter !== 30) throw new Error('retryAfter not set');
if (rle.status !== 429)    throw new Error('status should be 429');

console.log('All SDK tests passed ✓');

