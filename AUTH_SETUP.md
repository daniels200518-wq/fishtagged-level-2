# Fishtagged Level 2 and Level 3 sign-in

Google Identity Platform handles account passwords. The browser sends a signed,
short-lived identity token to the Fishtagged Cloud Run service, which makes the
final access decision and retrieves protected data.

## Level 2 user path

1. Select **Level 2**.
2. Select **Create account**.
3. Enter an email address, a password of at least 12 characters, and a phone
   number with country code.
4. Open the Firebase verification email and verify the address.
5. Return to the site and sign in.
6. Level 2 opens immediately. Staff approval is not required.

The phone number is an administrative contact field. It is private, is not
displayed on the map, and is not SMS-verified in this release.

## Level 3 user path

1. The account must already have Level 3 access.
2. Sign in with the normal email and password.
3. If this browser is not currently trusted, the service emails a random
   six-digit code to the account address.
4. Enter that code within 10 minutes.
5. The browser stays trusted for 30 days.

Using a different browser, using private browsing, clearing site storage, or an
administrator changing the account role requires another code. The email code
is a trusted-browser check, not authenticator-app MFA.

## Managing accounts inside Level 3

Open **Tools**, then **Account records**. Search by email and choose one of:

- **Level 2** — the person can use Level 2 after email verification and phone setup
- **Level 3** — the person can use both protected levels and receives the email code
- **No access** — both protected levels are blocked

The current administrator cannot change their own access, and the last active
administrator cannot be removed. A role change signs the affected user out and
removes that user's trusted-browser records.

## Inactivity behavior

Level 2 and Level 3 start a five-minute inactivity timer. A 60-second warning
appears before sign-out. Moving the pointer, using the keyboard, or choosing
**Stay signed in** resets the timer. If the warning expires, the page records the
idle timeout, clears the protected view, and signs the user out.

## Reports and feedback

Level 2 and Level 3 include signed-in feedback with a required one-to-five-star
rating and optional comments. Level 3 can download:

- current account records
- access history
- feedback records

The service generates each CSV when it is requested. It does not keep a public
CSV file on the website.

## Public website files

Upload the contents of `fishtagged-secure-public-site` to GitHub Pages:

- `index.html` — map, sign-in, role gate, admin controls, and inactivity handling
- `security/auth-config.js` — public Firebase web configuration and Cloud Run URL
- `security/auth-client.js` — browser authentication client
- `security/enroll-mfa.html` — compatibility page explaining the new email-code flow
- `river/` — public river network used for distance calculations
- `public-meta-20260701.json` — harmless public count/bounds/species metadata

Firebase web configuration identifies the project; it is not a server password.
The Firebase browser key should still be restricted to the approved website
origins and only the Firebase APIs the site needs.

## Private data boundary

Do not upload these to GitHub Pages:

- the full fish index
- exact Level 3 vector tiles
- Level 2 heat-vector tiles
- the Level 2 protected summary
- server source, SMTP password, hash secret, or service-account keys

Those files belong in the private Cloud Storage bucket. Level 2 receives coarse
heat tiles after authentication. Level 3 receives exact fish points after the
administrator and trusted-browser checks. Level 1 receives only the one tag the
visitor searched for.

Both Level 2 and Level 3 now use the same capture-order and river-network route
solver. It evaluates several nearby river segments for each capture and chooses
a connected Capture 1 → Capture 2 → Capture 3 sequence instead of snapping each
point independently. Level 1 still omits river-mile values.

## Configuration

`security/auth-config.js` should contain the production service URL and Firebase
web-app values:

```js
window.FISHTAGGED_SECURITY = Object.freeze({
  accessApi: "https://fishtagged-access-962471250542.us-east4.run.app",
  firebaseConfig: Object.freeze({
    apiKey: "the Firebase web-app browser key",
    authDomain: "fishtagged-security.firebaseapp.com",
    projectId: "fishtagged-security",
    appId: "the Firebase web-app ID"
  })
});
```

Add both the production custom domain and the GitHub Pages domain to Firebase
Authentication's authorized domains during the transition. Add the exact HTTPS
origins to the Cloud Run `ALLOWED_ORIGINS` value as well.
