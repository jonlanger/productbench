/**
 * Account auth is on when Clerk publishable key is present (Marketplace /
 * Hobby). Client and server can both read NEXT_PUBLIC_* values.
 */
export function isAuthEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}
