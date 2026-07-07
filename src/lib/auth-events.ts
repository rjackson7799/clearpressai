// One-shot flag so the auth listener can tell an intentional sign-out (the
// logout button) apart from an involuntary one (expired/failed refresh) and
// only surface the "session expired" toast for the latter.
let intentional = false;

export function markIntentionalSignOut() {
  intentional = true;
}

export function consumeIntentionalSignOut(): boolean {
  const v = intentional;
  intentional = false;
  return v;
}
