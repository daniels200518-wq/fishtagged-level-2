# Fishtagged Level 2 and Level 3 security

The website now has a production login client and the project includes its own
Cloud Run access service in `secure-access-service`. Google Identity Platform
handles the password. The Fishtagged page and access service never receive or
store it.

## What happens when someone opens a protected level

1. The browser signs the person in through Google Identity Platform.
2. Identity Platform returns a short-lived signed ID token.
3. The browser sends that token to `POST /v1/access`.
4. The Cloud Run service verifies the signature, expiration, revocation status,
   verified email, assigned role, session age, and required MFA.
5. A Level 2 applicant can create an account with an email, password, and phone
   number. The page sends the standard verification email and stores the phone
   number in the private `user_profiles` collection. The number is an
   administrative contact field and is not SMS-verified.
6. The service writes the result to Firestore before granting entry.
7. Level 2 accepts `level2` and `admin`. Level 3 accepts only `admin`.

The log includes successful and denied access, account, role, requested level,
MFA status, time, user agent, hashed IP address, and a hashed session
correlation value. It never includes passwords or identity tokens.

The login dialog can create a Level 2 applicant account and send password-reset
or verification email. Registration does not grant map access. An administrator
must review the account and assign its `level2` role before it can enter.

Level 2 and Level 3 also include a signed-in feedback form with a required
one-to-five-star rating and optional comments. Level 3 administrators can
download current user, access, and feedback reports as CSV files. The service
generates each report from Identity Platform and Firestore at download time, so
new accounts, sign-ins, and feedback appear without maintaining a separate
server file.

## Inactivity behavior

Level 2 and Level 3 start a five-minute inactivity timer. A 60-second warning
then appears. Activity or **Stay signed in** resets the timer. If the warning
expires, the page records `idle_timeout`, signs out through Identity Platform,
clears the in-memory role, closes the protected map, and asks the person to sign
in again.

Closing the browser tab also ends the browser session. Administrator access
requires a current TOTP security code by default.

## Files to configure

The public website has:

- `security/auth-client.js` — Identity Platform sign-in and TOTP flow
- `security/enroll-mfa.html` — one-time authenticator setup page
- `security/auth-config.js` — public Firebase web settings and Cloud Run URL
- `index.html` — role gate, audit calls, inactivity warning, and sign-out

The private backend has:

- `secure-access-service/server.js` — verification, authorization, and logging
- Firestore `user_profiles` — private phone and profile records
- Firestore `access_users` — one current access summary per account
- Firestore `access_logs` — detailed access history
- Firestore `feedback` — signed-in ratings and comments
- `secure-access-service/scripts/set-role.js` — admin-only role assignment
- `secure-access-service/README.md` — deployment steps

Fill in `security/auth-config.js` after creating the Identity Platform web app:

```js
window.FISHTAGGED_SECURITY = Object.freeze({
  accessApi: "https://fishtagged-access-xxxxx.us-east4.run.app",
  firebaseConfig: Object.freeze({
    apiKey: "value from Firebase web app settings",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    appId: "value from Firebase web app settings"
  })
});
```

Firebase web configuration identifies the project; it is not a password or
private server key. Domain restrictions, Identity Platform settings, server
token verification, and role checks provide the protection.

Administrators visit `security/enroll-mfa.html` once to add the setup key to
their authenticator app. The page signs them out when enrollment is complete so
their next Level 3 login includes a fresh second-factor token.

Phone numbers are personally identifiable information. They remain behind the
Cloud Run administrator checks, are not returned by public tag search, and
should not be copied into the public website folder.

## Public and private data boundary

Use `fishtagged-secure-public-site` for GitHub Pages. It contains:

- the website and login client
- the river network used for distance calculations
- a harmless public count, bounds, and species summary

Level 1 asks Cloud Run for only the searched tag. Its response includes the
capture path and photo reference but omits hydro and weather fields. Level 2
asks Cloud Run for its summary and coarse 0.01-degree heat tiles after the
server verifies a Level 2/admin token. Those tiles do not contain tag numbers,
colors, photo filenames, or exact capture coordinates. Level 3 asks Cloud Run
for the full index and exact tiles after the server verifies an MFA-backed
administrator token.

Do not upload the Level 2 summary, either tile folder, or
`fish_index-20260701.json` to GitHub Pages. They belong in the private Cloud
Storage bucket described in `secure-access-service/README.md`.

The older demo folders still contain the complete dataset for offline testing.
They are not the production upload and must not be published as the secure site.

When the core data changes, run `gh-demo-upload-work/build_public_level2.py`
after rebuilding the full index and exact tiles. It regenerates the safe Level 2
summary and coarse vector tiles for private storage, plus the harmless public
metadata file.

Level 1 is intentionally public, so the coordinates and photo reference for a
tag become public when that number is searched. The one-tag endpoint and rate
limits prevent a single full-file download, but no public sequential-number
search can make automated enumeration impossible. Cloud Armor rate limiting and
monitoring reduce that risk. If FT needs stronger confidentiality, Level 1 must
also require an account or move to non-sequential public lookup codes.
