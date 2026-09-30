import {
  FidloyAPIError,
  FidloyAuthError,
  FidloyError,
  FidloyNetworkError,
  FidloyNotFoundError,
  FidloyRateLimitError
} from './errors.js';

export const DEFAULT_BASE_URL = 'https://api.fidloy.com/api';

async function parseAuthResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const detail = data?.detail || response.statusText || 'Request failed';
    if (response.status === 401 || response.status === 403) {
      throw new FidloyAuthError(response.status, detail, data);
    }
    if (response.status === 404) throw new FidloyNotFoundError(detail, data);
    throw new FidloyAPIError(response.status, detail, data);
  }
  return data;
}

/**
 * Staff login & token refresh (same as Fidloy Business app).
 * Paths: POST /auth/login, POST /auth/refresh-token
 */
export class AuthModule {
  constructor(client) {
    this._c = client;
  }

  /**
   * Login with email, phone, or username + password.
   * Updates the parent client bearer token (and stored refresh token).
   */
  async login({ email, phone, username, password }) {
    const body = { password };
    if (email) body.email = email;
    else if (phone) body.phone = phone;
    else if (username) body.username = username;
    else {
      throw new FidloyError('Provide email, phone, or username');
    }

    const session = await loginWithPassword({
      email,
      phone,
      username,
      password,
      baseUrl: this._c.baseUrl
    });
    this._c._applySession(session);
    return session;
  }

  /** Refresh access token using refresh token (Bearer). */
  async refresh(refreshToken = this._c._refreshToken) {
    if (!refreshToken) {
      throw new FidloyError('Refresh token is required');
    }
    const session = await refreshAccessToken(refreshToken, { baseUrl: this._c.baseUrl });
    this._c._applySession(session);
    return session;
  }
}

export async function loginWithPassword({
  email,
  phone,
  username,
  password,
  baseUrl = DEFAULT_BASE_URL
}) {
  const body = { password };
  if (email) body.email = email;
  else if (phone) body.phone = phone;
  else if (username) body.username = username;
  else throw new FidloyError('Provide email, phone, or username');

  const url = `${baseUrl.replace(/\/$/, '')}/auth/login`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new FidloyNetworkError(err.message, err);
  }

  const data = await parseAuthResponse(response);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    raw: data
  };
}

export async function refreshAccessToken(refreshToken, { baseUrl = DEFAULT_BASE_URL } = {}) {
  const url = `${baseUrl.replace(/\/$/, '')}/auth/refresh-token`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${refreshToken}`
      }
    });
  } catch (err) {
    throw new FidloyNetworkError(err.message, err);
  }

  const data = await parseAuthResponse(response);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    raw: data
  };
}
