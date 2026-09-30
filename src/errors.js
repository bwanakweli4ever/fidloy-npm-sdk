export class FidloyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FidloyError';
  }
}

export class FidloyAPIError extends FidloyError {
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
  constructor(retryAfter = null) {
    const msg =
      retryAfter != null
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
