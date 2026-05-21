import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  deactivateCurrentAccount,
  deleteCurrentAccount,
  ensureUserDocument,
  getUserData,
  loginUser,
  loginWithGoogle,
  registerUser,
} from "../services/authService";

export const AuthContext = createContext();

const AVATAR_STORAGE_PREFIX = "stellar-local-avatar:";
const PROFILE_STORAGE_PREFIX = "stellar-local-profile:";
const STORE_STORAGE_PREFIX = "stellar-store:";

function readLocalJson(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function getLocalProfile(uid) {
  if (!uid) return {};

  const profile = readLocalJson(`${PROFILE_STORAGE_PREFIX}${uid}`);
  const avatar = localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${uid}`) || "";

  return {
    ...profile,
    avatarUrl: profile.avatarUrl || avatar || null,
  };
}

function buildUser(firebaseUser, extraData = {}) {
  const localProfile = getLocalProfile(firebaseUser.uid);
  const localStore = readLocalJson(`${STORE_STORAGE_PREFIX}${firebaseUser.uid}`);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    name: firebaseUser.displayName || "",
    ...extraData,
    ...localStore,
    ...localProfile,
  };
}

function isBlockedAccount(data = {}) {
  const account = data || {};
  return account.accountStatus === "disabled" || account.accountStatus === "deleted";
}

function createDisabledAccountError() {
  return { code: "auth/user-disabled" };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function hydrateUserData(firebaseUser, isActive = () => true) {
    ensureUserDocument(firebaseUser)
      .then(() => getUserData(firebaseUser.uid))
      .then((extraData) => {
        if (!isActive() || !extraData) return;

        if (isBlockedAccount(extraData)) {
          signOut(auth);
          setUser(null);
          return;
        }

        setUser((current) => {
          if (current?.uid !== firebaseUser.uid) return current;
          return buildUser(firebaseUser, extraData);
        });
      })
      .catch((error) => {
        console.warn("Não foi possível hidratar os dados extras do usuário:", error);
      });
  }

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          if (!isMounted) return;

          setUser(buildUser(firebaseUser));
          setLoading(false);
          hydrateUserData(firebaseUser, () => isMounted);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setUser(null);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  async function login(email, password) {
    const firebaseUser = await loginUser(email, password);
    const extraData = await getUserData(firebaseUser.uid);

    if (isBlockedAccount(extraData)) {
      await signOut(auth);
      throw createDisabledAccountError();
    }

    setUser(buildUser(firebaseUser, extraData));
    hydrateUserData(firebaseUser);
    return firebaseUser;
  }

  async function register(name, email, password, username) {
    const firebaseUser = await registerUser({ name, email, password, username });

    setUser(buildUser(firebaseUser, { name, username, email }));
    hydrateUserData(firebaseUser);
    return firebaseUser;
  }

  async function signInWithGoogleAccount() {
    const firebaseUser = await loginWithGoogle();
    if (!firebaseUser) return null;

    const extraData = await getUserData(firebaseUser.uid);

    if (isBlockedAccount(extraData)) {
      await signOut(auth);
      throw createDisabledAccountError();
    }

    setUser(buildUser(firebaseUser, extraData));
    hydrateUserData(firebaseUser);

    return firebaseUser;
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  async function deactivateAccount() {
    await deactivateCurrentAccount();
    setUser(null);
  }

  async function deleteAccount() {
    await deleteCurrentAccount();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        deactivateAccount,
        deleteAccount,
        login,
        register,
        signInWithGoogle: signInWithGoogleAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
