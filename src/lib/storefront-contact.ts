import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_STOREFRONT_CONTACT = {
  countryCode: "NG" as CountryCode,
  phoneNumber: "+2348029041081",
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const supportedCountryCodes = new Set<string>(getCountries());

export const PHONE_COUNTRIES = getCountries()
  .map((countryCode) => ({
    countryCode,
    name: countryNames.of(countryCode) ?? countryCode,
    callingCode: `+${getCountryCallingCode(countryCode)}`,
  }))
  .sort((left, right) => {
    if (left.countryCode === "NG") return -1;
    if (right.countryCode === "NG") return 1;
    return left.name.localeCompare(right.name);
  });

export type StorefrontContactSettings = {
  countryCode: CountryCode;
  phoneNumber: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPhoneCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && supportedCountryCodes.has(value);
}

export function normalizeStorefrontContact(
  value: unknown,
  countryCodeValue: unknown,
): StorefrontContactSettings {
  if (!isPhoneCountryCode(countryCodeValue)) {
    throw new Error("Choose a supported country.");
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Enter a WhatsApp number.");
  }

  const parsed = parsePhoneNumberFromString(value.trim(), countryCodeValue);
  if (!parsed || !parsed.isValid()) {
    throw new Error("Enter a valid phone number for the selected country.");
  }
  if (parsed.country && parsed.country !== countryCodeValue) {
    throw new Error("The number does not match the selected country.");
  }

  return {
    countryCode: countryCodeValue,
    phoneNumber: parsed.number,
  };
}

export function parseStorefrontContactPayload(value: unknown): StorefrontContactSettings {
  if (!isRecord(value)) {
    throw new Error("The WhatsApp contact response was invalid.");
  }
  return normalizeStorefrontContact(value.phoneNumber, value.countryCode);
}

export function formatStorefrontPhone(value: string, countryCode?: CountryCode) {
  return parsePhoneNumberFromString(value, countryCode)?.formatInternational() ?? value;
}

export function getNationalPhoneInput(value: string, countryCode: CountryCode) {
  return parsePhoneNumberFromString(value, countryCode)?.formatNational() ?? "";
}

export function getWhatsAppHref(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) throw new Error("Cannot create a WhatsApp link without a phone number.");
  return `https://wa.me/${digits}`;
}

export function getTelephoneHref(value: string) {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) throw new Error("Cannot create a telephone link without a valid phone number.");
  return `tel:${parsed.number}`;
}
