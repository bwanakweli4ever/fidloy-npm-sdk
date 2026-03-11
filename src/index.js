const DEFAULT_BASE_URL = "https://api.fidloy.com/api";

class Fidloy {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL } = {}) {
    if (!apiKey) {
      throw new Error("apiKey is required");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, { method = "GET", query, body } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url, {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const detail = data?.detail || response.statusText || "Request failed";
      throw new Error(`[${response.status}] ${detail}`);
    }

    return data;
  }

  listTransactions({ businessId, limit = 100, skip = 0, customerId } = {}) {
    return this.request("/customer/transactions/", {
      query: {
        business_id: businessId,
        limit,
        skip,
        customer_id: customerId
      }
    });
  }

  listCustomers({ businessId, limit = 100, skip = 0 } = {}) {
    return this.request("/customer/", {
      query: {
        business_id: businessId,
        limit,
        skip
      }
    });
  }
}

export { Fidloy };
export default Fidloy;
