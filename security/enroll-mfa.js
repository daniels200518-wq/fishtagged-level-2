import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  TotpMultiFactorGenerator,
  getAuth,
  inMemoryPersistence,
  multiFactor,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const settings = window.FISHTAGGED_SECURITY || {};
const config = settings.firebaseConfig || {};
const required = ["apiKey", "authDomain", "projectId", "appId"];
const ready = required.every(key =>
  typeof config[key] === "string" &&
  config[key].length > 3 &&
  !config[key].includes("REPLACE_")
);

const signin = document.querySelector("#signin");
const setup = document.querySelector("#setup");
const verify = document.querySelector("#verify");
const message = document.querySelector("#msg");
let auth = null;
let secret = null;

function show(text, ok = false) {
  message.textContent = text;
  message.classList.toggle("ok", ok);
}

if (ready) {
  auth = getAuth(initializeApp(config));
  await setPersistence(auth, inMemoryPersistence);
} else {
  show("The Google Identity Platform settings have not been added yet.");
  signin.querySelector("button").disabled = true;
}

signin.addEventListener("submit", async event => {
  event.preventDefault();
  const button = signin.querySelector("button");
  button.disabled = true;
  show("Checking account…");
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      document.querySelector("#email").value.trim(),
      document.querySelector("#password").value
    );
    if (!credential.user.emailVerified) {
      throw new Error("Verify this account's email before setting up a security code.");
    }
    const token = await credential.user.getIdTokenResult(true);
    if (token.claims.admin !== true) {
      await signOut(auth);
      throw new Error("Only a Level 3 administrator can set up this security code.");
    }
    const session = await multiFactor(credential.user).getSession();
    secret = await TotpMultiFactorGenerator.generateSecret(session);
    document.querySelector("#secret").textContent = secret.secretKey;
    document.querySelector("#openApp").href =
      secret.generateQrCodeUrl(credential.user.email || "Fishtagged user", "Fishtagged");
    signin.hidden = true;
    setup.hidden = false;
    show("");
    document.querySelector("#code").focus();
  } catch (error) {
    if (auth?.currentUser) {
      try {
        await signOut(auth);
      } catch {}
    }
    show(error?.message?.startsWith("Verify ") || error?.message?.startsWith("Only ")
      ? error.message
      : "Sign-in failed. Check your information and try again.");
  } finally {
    button.disabled = false;
  }
});

verify.addEventListener("submit", async event => {
  event.preventDefault();
  const button = verify.querySelector("button");
  button.disabled = true;
  show("Finishing setup…");
  try {
    const code = document.querySelector("#code").value.replace(/\s/g, "");
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
    await multiFactor(auth.currentUser).enroll(assertion, "Authenticator app");
    await signOut(auth);
    setup.hidden = true;
    show("Security code added. Return to the map and sign in again.", true);
  } catch {
    show("That code was not accepted. Use the newest code shown in your app.");
  } finally {
    button.disabled = false;
  }
});
