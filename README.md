# fidloy-sdk-js

Simple JavaScript SDK for Fidloy API.

## Install

```bash
npm install fidloy-sdk-js
```

## Very Simple Usage

```js
import { Fidloy } from "fidloy-sdk-js";

const client = new Fidloy({ apiKey: "YOUR_API_KEY" });

const customers = await client.listCustomers({ businessId: 2 });
console.log(customers);

const transactions = await client.listTransactions({ businessId: 2 });
console.log(transactions);
```

No base URL needed for basic use.

## Publish to npm

```bash
npm login
npm publish --access public
```
# fidloy-npm-sdk
