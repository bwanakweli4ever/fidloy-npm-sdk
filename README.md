# fidloy

Simple JavaScript SDK for Fidloy API.

## Install

```bash
npm install fidloy
```

## Very Simple Usage

```js
import { Fidloy } from "fidloy";

const client = new Fidloy({ apiKey: "YOUR_API_KEY" });

const customers = await client.listCustomers({ businessId: 2 });
console.log(customers);

const transactions = await client.listTransactions({ businessId: 2 });
console.log(transactions);
```

No base URL needed for basic use.

## Features

- API-key authenticated requests
- Point balance checking and point rules listing
- Coupon validation and code checking
- Customer and transaction management
- Reward history tracking
- Simple and intuitive async/await interface

## Examples

### Get point balance

```js
import { Fidloy } from "fidloy";

const client = new Fidloy({ apiKey: "YOUR_API_KEY" });

const balance = await client.getPointsBalance({ 
  businessId: 2, 
  customerId: 30 
});
console.log(`Balance: ${balance.points_balance} points`);
```

### Validate coupon

```js
import { Fidloy } from "fidloy";

const client = new Fidloy({ apiKey: "YOUR_API_KEY" });

const result = await client.validateCoupon({
  businessId: 2,
  code: "SUMMER20",
  amount: 10000,
  customerId: 30,
  phone: "+250788000000",
  email: "customer@example.com"
});

if (result.valid) {
  console.log(`Coupon valid! Discount: ${result.discount_amount}`);
} else {
  console.log(`Invalid coupon: ${result.error}`);
}
```

### List point rules

```js
import { Fidloy } from "fidloy";

const client = new Fidloy({ apiKey: "YOUR_API_KEY" });

const rules = await client.listPointRules({ businessId: 2 });
console.log(rules);

// Get rules categorized
const categorized = await client.listPointRulesCategorized({ businessId: 2 });
console.log(categorized);
```

## Retention engine (API v1)

Use a business **API key**. `businessId` is optional when the key is scoped to one merchant.

```js
import { Fidloy } from "fidloy";

const client = new Fidloy({ apiKey: process.env.FIDLOY_API_KEY });

await client.customers.upsert({
  externalCustomerId: "cus_123",
  firstName: "Alex",
  lastName: "Dev",
  email: "alex@example.com",
});

await client.events.track({
  externalCustomerId: "cus_123",
  eventType: "subscription_renewed",
  externalEventId: "evt_unique_1",
  occurredAt: "2026-09-30T12:00:00Z",
  amount: 49,
  properties: { plan: "pro" },
});

await client.transactions.createV1({
  externalCustomerId: "cus_123",
  amount: 12000,
  transactionDate: "2026-09-30T12:00:00Z",
  storeName: "Online",
});

await client.feedback.submit({
  externalCustomerId: "cus_123",
  rating: 4,
  comment: "Great service",
});

const snap = await client.customers.retention("cus_123");
console.log(snap.state, snap.score, snap.reasons);

const rules = await client.retentionRules.list();
await client.retentionRules.create({
  name: "At risk SMS",
  triggerKind: "customer_state",
  triggerConfig: { state: "AT_RISK" },
  actionKind: "send_sms",
  actionConfig: { message: "We miss you!" },
});
```

## Publish to npm

```bash
npm login
npm publish --access public
```
