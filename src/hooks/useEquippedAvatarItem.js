import { useContext, useMemo } from "react";
import { StoreContext } from "../context/StoreContext";
import { UserContext } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { getEquippedAvatarItems } from "../utils/storeEquipment";

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

export function useEquippedAvatarItems() {
  const { user } = useAuth();
  const { userData } = useContext(UserContext);
  const { equipped: sessionEquipped } = useContext(StoreContext);

  return useMemo(() => {
    const localStore = readLocalStore(user?.uid);
    const mergedEquipped = {
      ...(sessionEquipped || {}),
      ...(userData?.equipped || {}),
      ...(localStore?.equipped || {}),
    };

    return getEquippedAvatarItems(mergedEquipped);
  }, [sessionEquipped, user?.uid, userData?.equipped]);
}

export function useEquippedAvatarItem() {
  return useEquippedAvatarItems()[0] || null;
}
