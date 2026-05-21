import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const STARTING_COINS = 100;

function withTimeout(promise, timeout = 5500) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("timeout")), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function defaultUserData(user, extra = {}) {
  return {
    name: extra.name || user.displayName || "",
    email: extra.email || user.email || "",
    username: extra.username || user.email?.split("@")[0] || "",
    photoURL: user.photoURL || null,
    coins: STARTING_COINS,
    initialCoinsGranted: true,
    quizReward: {
      date: null,
      amount: 0,
    },
    inventory: [],
    equipped: {
      avatar: null,
      background: null,
    },
    createdAt: Date.now(),
  };
}

function isOfflineError(error) {
  return error?.code === "unavailable" || /offline/i.test(error?.message || "");
}

function normalizeExistingUserData(data = {}) {
  if (data.initialCoinsGranted) return data;

  return {
    ...data,
    coins: Math.max(Number(data.coins || 0), STARTING_COINS),
    initialCoinsGranted: true,
    quizReward: data.quizReward || {
      date: null,
      amount: 0,
    },
  };
}

export async function ensureUserDocument(user) {
  if (!user?.uid) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await withTimeout(getDoc(userRef));

    if (!snap.exists()) {
      const data = defaultUserData(user);
      await withTimeout(setDoc(userRef, data));
      return data;
    }

    const data = normalizeExistingUserData(snap.data());

    if (!snap.data().initialCoinsGranted) {
      await withTimeout(setDoc(userRef, data, { merge: true }));
    }

    return data;
  } catch (error) {
    if (!isOfflineError(error)) {
      console.warn("Não foi possível sincronizar o perfil do usuário:", error);
    }

    return null;
  }
}

export async function registerUser({ name, email, password, username }) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  try {
    await withTimeout(setDoc(doc(db, "users", user.uid), {
      ...defaultUserData(user, { name, email, username }),
    }));
  } catch (error) {
    if (!isOfflineError(error)) {
      console.warn("Usuário criado, mas não foi possível salvar o perfil:", error);
    }
  }

  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const userCredential = await signInWithPopup(auth, provider);
    ensureUserDocument(userCredential.user).catch((error) => {
      if (!isOfflineError(error)) {
        console.warn("Não foi possível preparar o perfil Google:", error);
      }
    });
    return userCredential.user;
  } catch (error) {
    if (
      error?.code === "auth/popup-blocked" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    throw error;
  }
}

export async function logoutUser() {
  return await signOut(auth);
}

export async function deactivateCurrentAccount() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw { code: "auth/no-current-user" };
  }

  await withTimeout(setDoc(
    doc(db, "users", currentUser.uid),
    {
      accountStatus: "disabled",
      disabledAt: Date.now(),
    },
    { merge: true }
  ));

  await signOut(auth);
}

export async function deleteCurrentAccount() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw { code: "auth/no-current-user" };
  }

  await deleteUser(currentUser);
}

export async function sendReset(email) {
  return await sendPasswordResetEmail(auth, email);
}

export async function getUserData(uid) {
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", uid)));
    return snap.exists() ? normalizeExistingUserData(snap.data()) : null;
  } catch (error) {
    if (!isOfflineError(error)) {
      console.warn("Não foi possível carregar dados extras do usuário:", error);
    }

    return null;
  }
}
