/**
 * Merchant / staff operations — parity with Fidloy Business app & dashboard.
 * Use bearerToken (staff JWT) or apiKey where the backend allows business scope.
 */

function qBusiness(businessId) {
  return businessId != null ? { business_id: businessId } : {};
}

export class ChurnRulesModule {
  constructor(client) {
    this._c = client;
  }

  list({ businessId } = {}) {
    return this._c.request('/customer/churn/rules', { query: qBusiness(businessId) });
  }

  create(body, { businessId } = {}) {
    return this._c.request('/customer/churn/rules', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  update(ruleId, body, { businessId } = {}) {
    return this._c.request(`/customer/churn/rules/${ruleId}`, {
      method: 'PUT',
      query: qBusiness(businessId),
      body
    });
  }

  delete(ruleId, { businessId } = {}) {
    return this._c.request(`/customer/churn/rules/${ruleId}`, {
      method: 'DELETE',
      query: qBusiness(businessId)
    });
  }

  listChurnedCustomers({ businessId, ruleId, inactiveDays } = {}) {
    const query = { ...qBusiness(businessId) };
    if (ruleId != null) query.rule_id = ruleId;
    if (inactiveDays != null) query.inactive_days = inactiveDays;
    return this._c.request('/customer/churn/customers', { query });
  }

  notifyCustomer(body, { businessId } = {}) {
    return this._c.request('/customer/churn/notify', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  notifyAll({ businessId, ruleId } = {}) {
    const query = { ...qBusiness(businessId) };
    if (ruleId != null) query.rule_id = ruleId;
    return this._c.request('/customer/churn/notify-all', { method: 'POST', query });
  }
}

export class OpportunitiesModule {
  constructor(client) {
    this._c = client;
  }

  list({ businessId } = {}) {
    return this._c.request('/customer/opportunities', { query: qBusiness(businessId) });
  }

  get(opportunityId, { businessId, limit = 50, offset = 0, useAiRecommendation = false } = {}) {
    const id = encodeURIComponent(opportunityId);
    return this._c.request(`/customer/opportunities/${id}`, {
      query: {
        ...qBusiness(businessId),
        limit,
        offset,
        use_ai_recommendation: useAiRecommendation
      }
    });
  }

  getCustomerIntelligence(customerId, { businessId } = {}) {
    return this._c.request(`/customer/opportunities/customers/${customerId}/intelligence`, {
      query: qBusiness(businessId)
    });
  }

  notify(opportunityId, { smsText, businessId } = {}) {
    const id = encodeURIComponent(opportunityId);
    return this._c.request(`/customer/opportunities/${id}/notify`, {
      method: 'POST',
      query: qBusiness(businessId),
      body: { sms_text: smsText }
    });
  }

  runCouponCampaign(
    opportunityId,
    { opportunityTitle, discountPercentage, smsText, retry, businessId } = {}
  ) {
    const id = encodeURIComponent(opportunityId);
    const body = { opportunity_title: opportunityTitle, discount_percentage: discountPercentage };
    if (smsText != null) body.sms_text = smsText;
    if (retry != null) body.retry = retry;
    return this._c.request(`/customer/opportunities/${id}/coupon-campaign`, {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  runFeedbackCampaign(opportunityId, { smsText, businessId } = {}) {
    const id = encodeURIComponent(opportunityId);
    return this._c.request(`/customer/opportunities/${id}/feedback-campaign`, {
      method: 'POST',
      query: qBusiness(businessId),
      body: { sms_text: smsText }
    });
  }
}

export class BenefitsModule {
  constructor(client) {
    this._c = client;
  }

  listTypes({ businessId } = {}) {
    return this._c.request('/v1/benefits/types', { query: qBusiness(businessId) });
  }

  listTemplates({ businessId } = {}) {
    return this._c.request('/v1/benefits/templates', { query: qBusiness(businessId) });
  }

  createTemplate(body, { businessId } = {}) {
    return this._c.request('/v1/benefits/templates', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  updateTemplate(templateId, body, { businessId } = {}) {
    return this._c.request(`/v1/benefits/templates/${templateId}`, {
      method: 'PATCH',
      query: qBusiness(businessId),
      body
    });
  }

  listPackages({ businessId } = {}) {
    return this._c.request('/v1/benefits/packages', { query: qBusiness(businessId) });
  }

  assignPackage(packageId, body, { businessId } = {}) {
    return this._c.request(`/v1/benefits/packages/${packageId}/assign`, {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  assign(body, { businessId } = {}) {
    return this._c.request('/v1/benefits/assign', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  listForCustomer(customerId, { businessId } = {}) {
    return this._c.request(`/v1/benefits/customers/${customerId}`, {
      query: qBusiness(businessId)
    });
  }
}

export class ReferralsModule {
  constructor(client) {
    this._c = client;
  }

  getProgram({ businessId } = {}) {
    return this._c.request('/loyalty/referrals/program', { query: qBusiness(businessId) });
  }

  saveProgram(body, { businessId } = {}) {
    return this._c.request('/loyalty/referrals/program', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  }

  listMyReferrals({ businessId } = {}) {
    return this._c.request('/loyalty/referrals/my-referrals', { query: qBusiness(businessId) });
  }

  getEarnings({ businessId } = {}) {
    return this._c.request('/loyalty/referrals/earnings', { query: qBusiness(businessId) });
  }
}

/** Extend customer CRUD + NFC + manual points (dashboard directory actions). */
export function extendCustomersModule(CustomersModule) {
  CustomersModule.prototype.search = function ({
    businessId,
    q,
    limit = 100,
    skip = 0,
    ordering
  } = {}) {
    const query = { business_id: businessId, limit, skip };
    if (q) query.q = q;
    if (ordering) query.ordering = ordering;
    return this._c.request('/customer/', { query });
  };

  CustomersModule.prototype.get = function (customerId, { businessId } = {}) {
    return this._c.request(`/customer/${customerId}`, { query: qBusiness(businessId) });
  };

  CustomersModule.prototype.update = function (customerId, body, { businessId } = {}) {
    return this._c.request(`/customer/${customerId}`, {
      method: 'PUT',
      query: qBusiness(businessId),
      body
    });
  };

  CustomersModule.prototype.delete = function (customerId, { businessId } = {}) {
    return this._c.request(`/customer/${customerId}`, {
      method: 'DELETE',
      query: qBusiness(businessId)
    });
  };

  CustomersModule.prototype.getStats = function (customerId, { businessId } = {}) {
    return this._c.request(`/customer/${customerId}/stats`, { query: qBusiness(businessId) });
  };

  CustomersModule.prototype.addLoyaltyPoints = function (
    customerId,
    { points, password, businessId } = {}
  ) {
    const body = { points };
    if (password != null) body.password = password;
    return this._c.request(`/customer/${customerId}/loyalty-points/add`, {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  };

  CustomersModule.prototype.redeemLoyaltyPoints = function (
    customerId,
    { points, password, businessId } = {}
  ) {
    const body = { points };
    if (password != null) body.password = password;
    return this._c.request(`/customer/${customerId}/loyalty-points/redeem`, {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  };

  CustomersModule.prototype.getByNfc = function (nfcCardId, { businessId } = {}) {
    return this._c.request(`/customer/nfc/${encodeURIComponent(nfcCardId)}`, {
      query: qBusiness(businessId)
    });
  };

  CustomersModule.prototype.assignNfc = function (nfcCardId, { customerId, businessId } = {}) {
    return this._c.request(`/customer/nfc/${encodeURIComponent(nfcCardId)}/assign`, {
      method: 'PUT',
      query: qBusiness(businessId),
      body: { customer_id: customerId }
    });
  };

  CustomersModule.prototype.unassignNfc = function (nfcCardId, { businessId } = {}) {
    return this._c.request(`/customer/nfc/${encodeURIComponent(nfcCardId)}/unassign`, {
      method: 'DELETE',
      query: qBusiness(businessId)
    });
  };
}

/** Point rules CRUD + personal discounts (loyalty hub). */
export function extendLoyaltyModule(LoyaltyModule) {
  LoyaltyModule.prototype.createPointRule = function (body, { businessId } = {}) {
    return this._c.request('/loyalty/points/rules', {
      method: 'POST',
      query: qBusiness(businessId),
      body
    });
  };

  LoyaltyModule.prototype.updatePointRule = function (ruleId, body, { businessId } = {}) {
    return this._c.request(`/loyalty/points/rules/${ruleId}`, {
      method: 'PUT',
      query: qBusiness(businessId),
      body
    });
  };

  LoyaltyModule.prototype.deletePointRule = function (ruleId, { businessId } = {}) {
    return this._c.request(`/loyalty/points/rules/${ruleId}`, {
      method: 'DELETE',
      query: qBusiness(businessId)
    });
  };

  LoyaltyModule.prototype.calculatePoints = function ({ businessId, amount, customerId } = {}) {
    return this._c.request('/loyalty/points/calculate', {
      method: 'POST',
      query: qBusiness(businessId),
      body: { amount, customer_id: customerId }
    });
  };

  LoyaltyModule.prototype.computePointsFromHistory = function ({
    businessId,
    customerId
  } = {}) {
    return this._c.request(
      `/loyalty/points/business/${businessId}/customer/${customerId}/compute`
    );
  };

  LoyaltyModule.prototype.getPersonalDiscount = function (customerId, { businessId } = {}) {
    return this._c.request(`/loyalty/discounts/${customerId}`, {
      query: qBusiness(businessId)
    });
  };

  LoyaltyModule.prototype.setPersonalDiscount = function (
    customerId,
    body,
    { businessId } = {}
  ) {
    return this._c.request(`/loyalty/discounts/${customerId}`, {
      method: 'PUT',
      query: qBusiness(businessId),
      body
    });
  };

  LoyaltyModule.prototype.removePersonalDiscount = function (customerId, { businessId } = {}) {
    return this._c.request(`/loyalty/discounts/${customerId}`, {
      method: 'DELETE',
      query: qBusiness(businessId)
    });
  };
}
