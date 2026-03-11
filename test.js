import { Fidloy } from "./src/index.js";

const sdk = new Fidloy({ apiKey: "demo-key" });

if (typeof sdk.listTransactions !== "function") {
  throw new Error("listTransactions method missing");
}

if (typeof sdk.listCustomers !== "function") {
  throw new Error("listCustomers method missing");
}

console.log("SDK basic test passed");
