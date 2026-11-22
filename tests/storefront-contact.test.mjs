import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_STOREFRONT_CONTACT,
  PHONE_COUNTRIES,
  formatStorefrontPhone,
  getNationalPhoneInput,
  getTelephoneHref,
  getWhatsAppHref,
  normalizeStorefrontContact,
  parseStorefrontContactPayload,
  storefrontContactSettingsErrorMessage,
} from "../src/lib/storefront-contact.ts";

test("provides searchable dialing information for a broad set of countries with Nigeria first", () => {
  assert.ok(PHONE_COUNTRIES.length >= 198);
  assert.equal(PHONE_COUNTRIES[0].countryCode, "NG");
  assert.equal(PHONE_COUNTRIES[0].callingCode, "+234");
});

test("normalizes the default Nigerian WhatsApp number and exposes display and link formats", () => {
  const contact = normalizeStorefrontContact("0802 904 1081", "NG");
  assert.deepEqual(contact, DEFAULT_STOREFRONT_CONTACT);
  assert.equal(formatStorefrontPhone(contact.phoneNumber), "+234 802 904 1081");
  assert.equal(getNationalPhoneInput(contact.phoneNumber, "NG"), "0802 904 1081");
  assert.equal(getWhatsAppHref(contact.phoneNumber), "https://wa.me/2348029041081");
  assert.equal(getTelephoneHref(contact.phoneNumber), "tel:+2348029041081");
});

test("rejects incomplete numbers and numbers that conflict with the selected country", () => {
  assert.throws(() => normalizeStorefrontContact("12345", "NG"), /valid phone number/i);
  assert.throws(
    () => normalizeStorefrontContact("+1 202 555 0199", "NG"),
    /does not match the selected country/i,
  );
  assert.throws(() => normalizeStorefrontContact("0802 904 1081", "XX"), /supported country/i);
});

test("validates public contact settings before use", () => {
  assert.deepEqual(
    parseStorefrontContactPayload({
      countryCode: "NG",
      phoneNumber: "+2348029041081",
    }),
    DEFAULT_STOREFRONT_CONTACT,
  );
  assert.throws(
    () => parseStorefrontContactPayload({ countryCode: "NG", phoneNumber: "bad" }),
    /valid phone number/i,
  );
});

test("preserves Supabase contact errors and explains missing settings", () => {
  assert.equal(
    storefrontContactSettingsErrorMessage({ code: "XX001", message: "Database unavailable." }),
    "Database unavailable.",
  );
  assert.match(
    storefrontContactSettingsErrorMessage({ code: "PGRST116", message: "No rows returned." }),
    /row is missing/i,
  );
  assert.match(
    storefrontContactSettingsErrorMessage({ code: "PGRST205", message: "Table missing." }),
    /apply the storefront WhatsApp number migration/i,
  );
});
