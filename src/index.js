export {
  FidloyError,
  FidloyAPIError,
  FidloyAuthError,
  FidloyNotFoundError,
  FidloyRateLimitError,
  FidloyNetworkError
} from './errors.js';

import {
  FidloyAPIError,
  FidloyAuthError,
  FidloyError,
  FidloyNetworkError,
  FidloyNotFoundError,
  FidloyRateLimitError
} from './errors.js';

import {
  AuthModule,
  DEFAULT_BASE_URL,
  loginWithPassword,
  refreshAccessToken
} from './auth-module.js';

import {
  BenefitsModule,
  ChurnRulesModule,
  OpportunitiesModule,
  ReferralsModule,
  extendCustomersModule,
  extendLoyaltyModule
} from './merchant-modules.js';

export { loginWithPassword, refreshAccessToken };

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

  /**
   * Record a purchase via POST /v1/transactions (external customer id).
   */
  createV1({
    externalCustomerId,
    amount,
    transactionDate,
    currency = 'RWF',
    storeName,
    description,
    receiptId,
    provider = 'default',
    businessId
  }) {
    const body = {
      external_customer_id: externalCustomerId,
      provider,
      amount,
      currency,
      transaction_date: transactionDate
    };
    if (businessId != null) body.business_id = businessId;
    if (storeName != null) body.store_name = storeName;
    if (description != null) body.description = description;
    if (receiptId != null) body.receipt_id = receiptId;
    return this._c.request('/v1/transactions', { method: 'POST', body });
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

  /** Upsert customer + external id mapping (POST /v1/customers). */
  upsert({
    externalCustomerId,
    firstName,
    lastName,
    businessId,
    email,
    phone,
    provider = 'default'
  }) {
    const body = {
      external_customer_id: externalCustomerId,
      provider,
      first_name: firstName,
      last_name: lastName
    };
    if (businessId != null) body.business_id = businessId;
    if (email != null) body.email = email;
    if (phone != null) body.phone = phone;
    return this._c.request('/v1/customers', { method: 'POST', body });
  }

  /** Retention snapshot for an external customer id. */
  retention(externalCustomerId, { provider = 'default', businessId } = {}) {
    const path = `/v1/customers/${encodeURIComponent(externalCustomerId)}/retention`;
    const query = { provider };
    if (businessId != null) query.business_id = businessId;
    return this._c.request(path, { query });
  }
}

class EventsModule {
  constructor(client) { this._c = client; }

  track({
    externalCustomerId,
    eventType,
    externalEventId,
    occurredAt,
    amount,
    currency,
    properties,
    provider = 'default',
    businessId
  }) {
    const body = {
      external_customer_id: externalCustomerId,
      provider,
      external_event_id: externalEventId,
      event_type: eventType,
      occurred_at: occurredAt
    };
    if (businessId != null) body.business_id = businessId;
    if (amount != null) body.amount = amount;
    if (currency != null) body.currency = currency;
    if (properties != null) body.properties = properties;
    return this._c.request('/v1/events', { method: 'POST', body });
  }
}

class FeedbackModule {
  constructor(client) { this._c = client; }

  submit({ externalCustomerId, rating, comment, provider = 'default', businessId }) {
    const body = {
      external_customer_id: externalCustomerId,
      provider,
      rating
    };
    if (businessId != null) body.business_id = businessId;
    if (comment != null) body.comment = comment;
    return this._c.request('/v1/feedback', { method: 'POST', body });
  }
}

class RetentionRulesModule {
  constructor(client) { this._c = client; }

  list({ businessId, includeInactive = false } = {}) {
    const query = { include_inactive: includeInactive };
    if (businessId != null) query.business_id = businessId;
    return this._c.request('/v1/retention/rules', { query });
  }

  create({
    name,
    triggerKind,
    actionKind,
    triggerConfig,
    actionConfig,
    isActive = true,
    businessId
  }) {
    const body = {
      name,
      trigger_kind: triggerKind,
      action_kind: actionKind,
      trigger_config: triggerConfig ?? {},
      action_config: actionConfig ?? {},
      is_active: isActive
    };
    if (businessId != null) body.business_id = businessId;
    return this._c.request('/v1/retention/rules', { method: 'POST', body });
  }

  get(ruleId, { businessId } = {}) {
    const query = {};
    if (businessId != null) query.business_id = businessId;
    return this._c.request(`/v1/retention/rules/${ruleId}`, { query });
  }

  update(ruleId, {
    name,
    triggerKind,
    triggerConfig,
    actionKind,
    actionConfig,
    isActive,
    businessId
  } = {}) {
    const body = {};
    if (businessId != null) body.business_id = businessId;
    if (name != null) body.name = name;
    if (triggerKind != null) body.trigger_kind = triggerKind;
    if (triggerConfig != null) body.trigger_config = triggerConfig;
    if (actionKind != null) body.action_kind = actionKind;
    if (actionConfig != null) body.action_config = actionConfig;
    if (isActive != null) body.is_active = isActive;
    return this._c.request(`/v1/retention/rules/${ruleId}`, { method: 'PATCH', body });
  }

  deactivate(ruleId, { businessId } = {}) {
    const query = {};
    if (businessId != null) query.business_id = businessId;
    return this._c.request(`/v1/retention/rules/${ruleId}`, { method: 'DELETE', query });
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

  getPointsBalance({ businessId, customerId }) {
    return this._c.request(`/loyalty/points/business/${businessId}/customer/${customerId}/points`);
  }

  listPointRules({ businessId, ruleType } = {}) {
    return this._c.request('/loyalty/points/rules', {
      query: { business_id: businessId, rule_type: ruleType }
    });
  }

  listPointRulesCategorized({ businessId } = {}) {
    return this._c.request('/loyalty/points/rules/categorized', {
      query: { business_id: businessId }
    });
  }

  validateCoupon({ businessId, code, amount, customerId, phone, email }) {
    return this._c.request('/loyalty/coupons/validate', {
      method: 'POST',
      query: { business_id: businessId },
      body: {
        code,
        amount,
        customer_id: customerId,
        phone,
        email
      }
    });
  }

  checkCouponValidity({ businessId, code, amount, customerId, phone, email }) {
    return this.validateCoupon({ businessId, code, amount, customerId, phone, email });
  }
}

extendCustomersModule(CustomersModule);
extendLoyaltyModule(LoyaltyModule);

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
    this._refreshToken = undefined;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this._timeout = timeout;
    this._maxRetries = maxRetries;
    this._retryDelay = retryDelay;

    // Structured API modules
    this.auth            = new AuthModule(this);
    this.transactions    = new TransactionsModule(this);
    this.customers       = new CustomersModule(this);
    this.loyalty         = new LoyaltyModule(this);
    this.receipts        = new ReceiptsModule(this);
    this.webhooks        = new WebhooksModule(this);
    this.events          = new EventsModule(this);
    this.feedback        = new FeedbackModule(this);
    this.retentionRules  = new RetentionRulesModule(this);
    this.churnRules      = new ChurnRulesModule(this);
    this.opportunities   = new OpportunitiesModule(this);
    this.benefits        = new BenefitsModule(this);
    this.referrals       = new ReferralsModule(this);
  }

  _applySession(session) {
    this._bearerToken = session.accessToken;
    if (session.refreshToken != null) {
      this._refreshToken = session.refreshToken;
    }
  }

  /**
   * Staff login — returns a configured client plus tokens.
   * @example
   * const { client } = await Fidloy.login({ email: 'owner@café.com', password: '…' });
   * await client.opportunities.list({ businessId: 2 });
   */
  static async login({ email, phone, username, password, baseUrl = DEFAULT_BASE_URL }) {
    const session = await loginWithPassword({
      email,
      phone,
      username,
      password,
      baseUrl
    });
    const client = new Fidloy({ bearerToken: session.accessToken, baseUrl });
    client._refreshToken = session.refreshToken;
    return { client, ...session };
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

  /** Shortcut for `loyalty.getPointsBalance`. */
  getPointsBalance({ businessId, customerId } = {}) {
    return this.loyalty.getPointsBalance({ businessId, customerId });
  }

  /** Shortcut for `loyalty.listPointRules`. */
  listPointRules({ businessId, ruleType } = {}) {
    return this.loyalty.listPointRules({ businessId, ruleType });
  }

  /** Shortcut for `loyalty.listPointRulesCategorized`. */
  listPointRulesCategorized({ businessId } = {}) {
    return this.loyalty.listPointRulesCategorized({ businessId });
  }

  /** Shortcut for `loyalty.validateCoupon`. */
  validateCoupon({ businessId, code, amount, customerId, phone, email } = {}) {
    return this.loyalty.validateCoupon({ businessId, code, amount, customerId, phone, email });
  }

  /** Backward-friendly alias for validateCoupon. */
  checkCouponValidity({ businessId, code, amount, customerId, phone, email } = {}) {
    return this.loyalty.checkCouponValidity({ businessId, code, amount, customerId, phone, email });
  }
}

export default Fidloy;
