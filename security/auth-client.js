import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  TotpMultiFactorGenerator,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getMultiFactorResolver,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const settings = window.FISHTAGGED_SECURITY || {};
const config = settings.firebaseConfig || {};
const required = ["apiKey", "authDomain", "projectId", "appId"];
const configured = required.every(key =>
  typeof config[key] === "string" &&
  config[key].length > 3 &&
  !config[key].includes("REPLACE_")
);

let auth = null;
let resolver = null;

if (configured) {
  auth = getAuth(initializeApp(config));
  await setPersistence(auth, browserSessionPersistence);
}

function genericError() {
  return new Error("Sign-in failed. Check your information and try again.");
}

window.FT_AUTH = Object.freeze({
  configured,

  async signIn(email, password) {
    if (!auth) throw new Error("Account sign-in has not been configured.");
    resolver = null;
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { requiresMfa: false, user: credential.user };
    } catch (error) {
      if (error?.code !== "auth/multi-factor-auth-required") throw genericError();
      resolver = getMultiFactorResolver(auth, error);
      const factor = resolver.hints.find(hint => hint.factorId === "totp");
      if (!factor) throw new Error("This account's security method is not supported.");
      return { requiresMfa: true };
    }
  },

  async createAccount(email, password) {
    if (!auth) throw new Error("Account creation has not been configured.");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (error) {
      if (error?.code === "auth/weak-password") {
        throw new Error("Use a password with at least 12 characters.");
      }
      throw new Error("The account could not be created. Try signing in or resetting the password.");
    }
  },

  async finishMfa(code) {
    if (!resolver) throw genericError();
    const factor = resolver.hints.find(hint => hint.factorId === "totp");
    if (!factor) throw genericError();
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(factor.uid, code);
      const credential = await resolver.resolveSignIn(assertion);
      resolver = null;
      return { requiresMfa: false, user: credential.user };
    } catch {
      throw new Error("That security code was not accepted. Try the current code.");
    }
  },

  currentUser() {
    return auth?.currentUser || null;
  },

  async token() {
    if (!auth?.currentUser) throw new Error("Sign in again.");
    return auth.currentUser.getIdToken(true);
  },

  async sendVerificationEmail() {
    if (!auth?.currentUser) throw new Error("Sign in again first.");
    await sendEmailVerification(auth.currentUser);
  },

  async sendPasswordReset(email) {
    if (!auth) throw new Error("Account sign-in has not been configured.");
    await sendPasswordResetEmail(auth, email);
  },

  async signOut() {
    resolver = null;
    if (auth) await signOut(auth);
  },

  cancelMfa() {
    resolver = null;
  }
});

window.dispatchEvent(new Event("ft-auth-ready"));
