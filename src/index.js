// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class FidloyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FidloyError';
  }
}

export class FidloyAPIError extends FidloyError {
  /** @param {number} status @param {string} message @param {any} body */
  constructor(status, message, body = null) {
    super(`[${status}] ${message}`);
    this.name = 'FidloyAPIError';
    this.status = status;
    this.body = body;
  }
}

export class FidloyAuthError extends FidloyAPIError {
  constructor(status, message, body) {
    super(status, message, body);
    this.name = 'FidloyAuthError';
  }
}

export class FidloyNotFoundError extends FidloyAPIError {
  constructor(message, body) {
    super(404, message, body);
    this.name = 'FidloyNotFoundError';
  }
}

export class FidloyRateLimitError extends FidloyAPIError {
  /** @param {number|null} retryAfter seconds to wait */
  constructor(retryAfter = null) {
    const msg = retryAfter != null
      ? `Rate limit exceeded. Retry after ${retryAfter}s`
      : 'Rate limit exceeded';
    super(429, msg);
    this.name = 'FidloyRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class FidloyNetworkError extends FidloyError {
  constructor(message, cause) {
    super(message);
    this.name = 'FidloyNetworkError';
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Structured API modules
// ---------------------------------------------------------------------------

class TransactionsModule {
  constructor(client) { this._c = client; }

  /**
   * List transactions (one page).
   * @param {{ businessId: number, limit?: number, skip?: number, customerId?: number }} opts
   */
  list({ businessId, limit = 100, skip = 0, customerId } = {}) {
    return this._c.request('/customer/transactions/', {
      query: { business_id: businessId, limit, skip, customer_id: customerId }
    });
  }

  /**
   * Async generator — yields every transaction across all pages automatically.
   * @example
   * for await (const txn of client.transactions.paginate({ businessId: 2 })) {
   *   console.log(txn.amount);
   * }
   */
  async *paginate({ businessId, pageSize = 100, customerId } = {}) {
    let skip = 0;
    while (true) {
      const page = await this.list({ businessId, limit: pageSize, skip, customerId });
      if (!page.length) break;
      yield* page;
      if (page.length < pageSize) break;
      skip += pageSize;
    }
  }

  /** Create a transaction. */
  create({ customerId, businessId, amount, storeName, transactionDate }) {
    return this._c.request('/customer/transactions/', {
      method: 'POST',
      body: {
        customer_id: customerId,
        business_id: businessId,
        amount,
        store_name: storeName,
        transaction_date: transactionDate
      }
    });
  }
}

class CustomersModule {
  constructor(client) { this._c = client; }

  /**
   * List customers (one page).
   * @param {{ businessId: number, limit?: number, skip?: number }} opts
   */
  list({ businessId, limit = 100, skip = 0 } = {}) {
    return this._c.request('/customer/', {
      query: { business_id: businessId, limit, skip }
    });
  }

  /**
   * Async generator — yields every customer across all pages automatically.
   * @example
   * for await (const customer of client.customers.paginate({ businessId: 2 })) {
   *   console.log(customer.phone);
   * }
   */
  async *paginate({ businessId, pageSize = 100 } = {}) {
    let skip = 0;
    while (true) {
      const page = await this.list({ businessId, limit: pageSize, skip });
      if (!page.length) break;
      yield* page;
      if (page.length < pageSize) break;
      skip += pageSize;
    }
  }

  /** Create a customer. */
  create({ firstName, lastName, businessId, email, phone }) {
    return this._c.request('/customer/', {
      method: 'POST',
      body: { first_name: firstName, last_name: lastName, business_id: businessId, email, phone }
    });
  }
}

class LoyaltyModule {
  constructor(client) { this._c = client; }

  redeemPoints({ businessId, points, customerId, phone, email, description }) {
    return this._c.request('/loyalty/points/redeem', {
      method: 'POST',
      body: { business_id: businessId, points, customer_id: customerId, phone, email, description }
    });
  }

  redeemCoupon({ couponCode, businessId, customerId, phone, email, transactionId }) {
    return this._c.request('/loyalty/coupons/redeem', {
      method: 'POST',
      body: {
        coupon_code: couponCode,
        business_id: businessId,
        customer_id: customerId,
        phone, email,
        transaction_id: transactionId
      }
    });
  }

  getRewardsHistory({ businessId, customerId, eventType = 'reward_redeemed', page = 1, pageSize = 20 } = {}) {
    return this._c.request(`/loyalty/accounts/${businessId}/rewards-history`, {
      query: { customer_id: customerId, event_type: eventType, page, page_size: pageSize }
    });
  }
}

class ReceiptsModule {
  constructor(client) { this._c = client; }

  create({ customerId, businessId, storeName, totalAmount, date, receiptNumber }) {
    return this._c.request('/receipt/create', {
      method: 'POST',
      body: {
        customer_id: customerId,
        business_id: businessId,
        store_name: storeName,
        total_amount: totalAmount,
        date,
        receipt_number: receiptNumber
      }
    });
  }
}

class WebhooksModule {
  constructor(client) { this._c = client; }

  create({ businessId, targetUrl, events, isActive = true }) {
    return this._c.request('/webhooks', {
      method: 'POST',
      body: { business_id: businessId, target_url: targetUrl, events, is_active: isActive }
    });
  }
}

// ---------------------------------------------------------------------------
// Core client
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.fidloy.com/api';

export class Fidloy {
  /**
   * @param {object} opts
   * @param {string} [opts.apiKey]       Business API key (X-API-Key header)
   * @param {string} [opts.bearerToken]  JWT bearer token (alternative to apiKey)
   * @param {string} [opts.baseUrl]      Override the API base URL
   * @param {number} [opts.timeout]      Request timeout in ms (default 30000)
   * @param {number} [opts.maxRetries]   Retries on network/5xx/429 (default 3)
   * @param {number} [opts.retryDelay]   Initial back-off ms, doubles each retry (default 500)
   */
  constructor({
    apiKey,
    bearerToken,
    baseUrl = DEFAULT_BASE_URL,
    timeout = 30_000,
    maxRetries = 3,
    retryDelay = 500
  } = {}) {
    if (!apiKey && !bearerToken) {
      throw new FidloyError('Either apiKey or bearerToken is required');
    }
    this._apiKey = apiKey;
    this._bearerToken = bearerToken;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this._timeout = timeout;
    this._maxRetries = maxRetries;
    this._retryDelay = retryDelay;

    // Structured API modules
    this.transactions = new TransactionsModule(this);
    this.customers    = new CustomersModule(this);
    this.loyalty      = new LoyaltyModule(this);
    this.receipts     = new ReceiptsModule(this);
    this.webhooks     = new WebhooksModule(this);
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  _buildHeaders() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (this._apiKey)      h['X-API-Key']     = this._apiKey;
    if (this._bearerToken) h['Authorization'] = `Bearer ${this._bearerToken}`;
    return h;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  // ------------------------------------------------------------------
  // Core request (with retry + structured errors)
  // ------------------------------------------------------------------

  /**
   * Make an authenticated API request with automatic retry.
   *
   * Retries on:
   *  - Network / timeout errors
   *  - HTTP 429  (respects Retry-After header)
   *  - HTTP 5xx  (exponential back-off)
   *
   * @param {string} path   API path, e.g. '/customer/'
   * @param {{ method?: string, query?: object, body?: object }} [opts]
   * @returns {Promise<any>}
   */
  async request(path, { method = 'GET', query, body } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }

    let lastError;
    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        const response = await this._fetchWithTimeout(url.toString(), {
          method,
          headers: this._buildHeaders(),
          body: body ? JSON.stringify(body) : undefined
        });

        // ── Rate limit (429) ────────────────────────────────────────────
        if (response.status === 429) {
          const rawRA = response.headers.get('Retry-After');
          const retryAfter = rawRA != null ? parseFloat(rawRA) : (this._retryDelay * (2 ** attempt)) / 1000;
          if (attempt < this._maxRetries) {
            await this._sleep(retryAfter * 1000);
            continue;
          }
          throw new FidloyRateLimitError(retryAfter);
        }

        // ── Server errors (5xx) — retry ─────────────────────────────────
        if (response.status >= 500 && attempt < this._maxRetries) {
          await this._sleep(this._retryDelay * (2 ** attempt));
          continue;
        }

        // ── Parse body ──────────────────────────────────────────────────
        const text = await response.text();
        let data;
        try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

        // ── Client / server errors — raise ──────────────────────────────
        if (!response.ok) {
          const detail = data?.detail || response.statusText || 'Request failed';
          if (response.status === 401 || response.status === 403)
            throw new FidloyAuthError(response.status, detail, data);
          if (response.status === 404)
            throw new FidloyNotFoundError(detail, data);
          throw new FidloyAPIError(response.status, detail, data);
        }

        return data;

      } catch (err) {
        // Re-throw structured errors immediately — don't retry on 4xx
        if (err instanceof FidloyAPIError) throw err;
        lastError = new FidloyNetworkError(err.message, err);
        if (attempt < this._maxRetries) {
          await this._sleep(this._retryDelay * (2 ** attempt));
          continue;
        }
      }
    }
    throw lastError;
  }

  // ------------------------------------------------------------------
  // Flat shortcut methods (backward compatible)
  // ------------------------------------------------------------------

  /** List transactions. Use `transactions.paginate()` to stream all pages. */
  listTransactions({ businessId, limit = 100, skip = 0, customerId } = {}) {
    return this.transactions.list({ businessId, limit, skip, customerId });
  }

  /** List customers. Use `customers.paginate()` to stream all pages. */
  listCustomers({ businessId, limit = 100, skip = 0 } = {}) {
    return this.customers.list({ businessId, limit, skip });
  }
}

export default Fidloy;
