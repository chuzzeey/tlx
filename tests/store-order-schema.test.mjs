import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoreOrderResponseSchema,
  createStoreOrderSchema,
  customerDetailsSchema,
  updateStoreOrderStatusSchema,
  updateStoreOrderStatusResponseSchema,
} from "../src/lib/store-order-schema.ts";

const customer = {
  name: "Taylor",
  email: "",
  phone: "+234 802 904 1081",
  street: "12 Example Road",
  city: "Lagos",
  region: "Lagos",
  country: "Nigeria",
};

const order = {
  idempotencyKey: "a11b2233-4455-6677-8899-aabbccddeeff",
  receiptToken: "a".repeat(64),
  expectedTotalAmount: 12500,
  customer,
  items: [{ productId: "tlx-starlight-layered-long-sleeve", quantity: 1, size: "M" }],
};

test("allows checkout details without an email address", () => {
  assert.equal(customerDetailsSchema.parse(customer).email, "");
  const { email: _email, ...detailsWithoutEmail } = customer;
  assert.equal(customerDetailsSchema.parse(detailsWithoutEmail).email, undefined);
});

test("accepts a valid order request with an optional customer email", () => {
  assert.equal(createStoreOrderSchema.parse(order).items[0].quantity, 1);
  assert.equal(
    createStoreOrderSchema.parse({ ...order, customer: { ...customer, email: "buyer@example.com" } })
      .customer.email,
    "buyer@example.com",
  );
});

test("accepts a saved order while its store email is still sending", () => {
  const response = {
    orderId: "TLX-0123456789",
    receiptUrl: `https://example.com/order/${"a".repeat(64)}`,
    emailStatus: "sending",
  };
  assert.equal(createStoreOrderResponseSchema.parse(response).emailStatus, "sending");
});

test("allows only terminal admin status actions", () => {
  assert.equal(updateStoreOrderStatusSchema.parse({ status: "paid" }).status, "paid");
  assert.equal(updateStoreOrderStatusSchema.parse({ status: "cancelled" }).status, "cancelled");
  assert.equal(updateStoreOrderStatusSchema.safeParse({ status: "awaiting_verification" }).success, false);
  assert.equal(
    updateStoreOrderStatusResponseSchema.safeParse({
      orderId: "a11b2233-4455-6677-8899-aabbccddeeff",
      orderNumber: "TLX-0123456789",
      paymentStatus: "paid",
      updatedAt: "2026-11-25T10:00:00.000+00:00",
      paymentVerifiedAt: "2026-11-25T10:00:00.000Z",
    }).success,
    true,
  );
});

test("rejects malformed email, unsafe receipt tokens, invalid quantities, and duplicate cart lines", () => {
  assert.equal(
    customerDetailsSchema.safeParse({ ...customer, email: "not-an-email" }).success,
    false,
  );
  assert.equal(createStoreOrderSchema.safeParse({ ...order, receiptToken: "short" }).success, false);
  assert.equal(
    createStoreOrderSchema.safeParse({ ...order, items: [{ ...order.items[0], quantity: 0 }] }).success,
    false,
  );
  assert.equal(
    createStoreOrderSchema.safeParse({
      ...order,
      items: [...order.items, { ...order.items[0] }],
    }).success,
    false,
  );
});
