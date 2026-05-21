import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { AuthContext } from "./AuthContext";
import { db } from "../services/firebase";

const STARTING_COINS = 100;
const STORE_STORAGE_PREFIX = "stellar-store:";

export const CoinsContext = createContext({
  coins: 0,
  setCoins: () => {},
  loadingCoins: true,
});

function getLocalStoreKey(uid) {
  return `${STORE_STORAGE_PREFIX}${uid}`;
}

function readLocalStore(uid) {
  if (!uid) return null;

  try {
    const stored = localStorage.getItem(getLocalStoreKey(uid));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Erro ao ler moedas locais:", error);
    return null;
  }
}

function readLocalCoins(uid) {
  const localStore = readLocalStore(uid);
  const localCoins = Number(localStore?.coins);

  return Number.isFinite(localCoins) ? localCoins : null;
}

function saveLocalCoins(uid, nextCoins) {
  if (!uid) return;

  try {
    const current = readLocalStore(uid) || {};
    localStorage.setItem(
      getLocalStoreKey(uid),
      JSON.stringify({
        ...current,
        coins: nextCoins,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Erro ao salvar moedas locais:", error);
  }
}

export function CoinsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [coins, setCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setCoins(0);
      setLoadingCoins(false);
      return undefined;
    }

    setLoadingCoins(true);
    const cachedCoins = readLocalCoins(user.uid);
    setCoins(cachedCoins ?? STARTING_COINS);
    setLoadingCoins(false);

    const ref = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      ref,
      async (snap) => {
        const localCoins = readLocalCoins(user.uid);

        if (!snap.exists()) {
          const nextCoins = localCoins ?? STARTING_COINS;
          setCoins(nextCoins);
          saveLocalCoins(user.uid, nextCoins);
          setLoadingCoins(false);
          return;
        }

        const data = snap.data();
        const shouldGrantInitialCoins = !data.initialCoinsGranted;
        const remoteCoins = shouldGrantInitialCoins
          ? Math.max(Number(data.coins || 0), STARTING_COINS)
          : Number(data.coins || 0);
        const nextCoins = localCoins ?? remoteCoins;

        setCoins(nextCoins);
        if (localCoins === null) {
          saveLocalCoins(user.uid, nextCoins);
        }
        setLoadingCoins(false);

        if (shouldGrantInitialCoins) {
          try {
            await setDoc(
              ref,
              {
                coins: nextCoins,
                initialCoinsGranted: true,
                quizReward: data.quizReward || {
                  date: null,
                  amount: 0,
                },
              },
              { merge: true }
            );
          } catch (error) {
            console.error("Erro ao aplicar moedas iniciais:", error);
          }
        }
      },
      (error) => {
        console.error("Erro ao sincronizar moedas:", error);
        setLoadingCoins(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <CoinsContext.Provider value={{ coins, setCoins, loadingCoins }}>
      {children}
    </CoinsContext.Provider>
  );
}
