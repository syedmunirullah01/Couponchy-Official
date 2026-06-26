import { cookies, headers } from "next/headers";
import {
  COUNTRY_COOKIE_KEY,
  COUNTRY_HEADER_KEY,
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode,
} from "@/lib/countries";

export async function resolveRequestCountryCode() {
  const requestHeaders = await headers();
  const headerCountryCode = requestHeaders.get(COUNTRY_HEADER_KEY);

  if (headerCountryCode) {
    return normalizeCountryCode(headerCountryCode);
  }

  const cookieStore = await cookies();
  return normalizeCountryCode(cookieStore.get(COUNTRY_COOKIE_KEY)?.value || DEFAULT_COUNTRY_CODE);
}
