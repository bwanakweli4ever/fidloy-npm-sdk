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

## Publish to npm

```bash
npm login
npm publish --access public
```
