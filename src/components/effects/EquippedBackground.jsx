import { useContext, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { StoreContext } from "../../context/StoreContext";
import { UserContext } from "../../context/UserContext";
import { storeItems } from "../../data/storeItems";

const STORE_STORAGE_PREFIX = "stellar-store:";

function readLocalStore(uid) {
  if (!uid) return {};

  try {
    const stored = localStorage.getItem(`${STORE_STORAGE_PREFIX}${uid}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function getItemId(item) {
  if (!item) return null;
  return typeof item === "object" ? item.id : item;
}

export default function EquippedBackground() {
  const { user } = useAuth();
  const { userData } = useContext(UserContext);
  const { equipped: sessionEquipped } = useContext(StoreContext);

  const backgroundItem = useMemo(() => {
    const localStore = readLocalStore(user?.uid);
    const equippedBackground =
      sessionEquipped?.background ||
      userData?.equipped?.background ||
      localStore?.equipped?.background;
    const backgroundId = getItemId(equippedBackground);

    return storeItems.find(
      (item) => item.type === "background" && String(item.id) === String(backgroundId)
    );
  }, [sessionEquipped?.background, user?.uid, userData?.equipped?.background]);

  if (!backgroundItem?.gifClass) return null;

  return (
    <div
      className={`equipped-space-background ${backgroundItem.gifClass}`}
      aria-hidden="true"
    />
  );
}
