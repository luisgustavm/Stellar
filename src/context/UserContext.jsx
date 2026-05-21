import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { AuthContext } from "./AuthContext";
import { db } from "../services/firebase";

export const UserContext = createContext({
  userData: null,
  setUserData: () => {},
});

const PROFILE_STORAGE_PREFIX = "stellar-local-profile:";
const STORE_STORAGE_PREFIX = "stellar-store:";

function isOfflineError(error) {
  return error?.code === "unavailable" || /offline|timeout/i.test(error?.message || "");
}

function readLocalJson(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function readLocalUserData(uid) {
  if (!uid) return null;

  const profile = readLocalJson(`${PROFILE_STORAGE_PREFIX}${uid}`);
  const store = readLocalJson(`${STORE_STORAGE_PREFIX}${uid}`);

  return {
    ...store,
    ...profile,
  };
}

export function UserProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setUserData(null);
      return undefined;
    }

    const localData = readLocalUserData(user.uid);
    setUserData(Object.keys(localData || {}).length ? localData : null);

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const remoteData = snap.exists() ? snap.data() : {};
        const freshLocalData = readLocalUserData(user.uid);
        setUserData({
          ...remoteData,
          ...freshLocalData,
        });
      },
      (error) => {
        if (!isOfflineError(error)) {
          console.warn("Não foi possível acompanhar o perfil do usuário:", error);
        }

        const freshLocalData = readLocalUserData(user.uid);
        setUserData(Object.keys(freshLocalData || {}).length ? freshLocalData : null);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
}
