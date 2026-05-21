import { storeItems } from "../data/storeItems";

export const storeSlotLabels = {
  aura: "Aura",
  badge: "Insignia",
  face: "Rosto",
  frame: "Moldura",
  head: "Cabeca",
  orbit: "Orbita",
};

export function getStoreItemId(item) {
  if (!item) return null;
  return typeof item === "object" ? item.id : item;
}

export function resolveStoreItem(item) {
  const itemId = getStoreItemId(item);
  if (!itemId) return null;

  const catalogItem = storeItems.find(
    (storeItem) => String(storeItem.id) === String(itemId)
  );

  return catalogItem && typeof item === "object"
    ? { ...item, ...catalogItem }
    : catalogItem || (typeof item === "object" ? item : null);
}

export function getAvatarSlot(item) {
  const resolvedItem = resolveStoreItem(item) || item;
  return resolvedItem?.slot || getStoreItemId(resolvedItem);
}

export function getStoreSlotLabel(item) {
  const slot = item?.slot;
  return item?.slotLabel || storeSlotLabels[slot] || slot;
}

export function getEquippedAvatarSlots(equipped = {}) {
  const slots = {};
  const rawSlots =
    equipped?.avatarSlots && typeof equipped.avatarSlots === "object"
      ? equipped.avatarSlots
      : {};

  Object.entries(rawSlots).forEach(([slot, item]) => {
    const resolvedItem = resolveStoreItem(item);
    if (resolvedItem?.id) {
      slots[slot || getAvatarSlot(resolvedItem)] = resolvedItem;
    }
  });

  const legacyAvatar = resolveStoreItem(equipped?.avatar);

  if (
    legacyAvatar?.id &&
    !Object.values(slots).some(
      (item) => String(getStoreItemId(item)) === String(legacyAvatar.id)
    )
  ) {
    slots[getAvatarSlot(legacyAvatar)] = legacyAvatar;
  }

  return slots;
}

export function getEquippedAvatarItems(equipped = {}) {
  const itemsById = new Map();

  Object.values(getEquippedAvatarSlots(equipped)).forEach((item) => {
    if (item?.id && !itemsById.has(item.id)) {
      itemsById.set(item.id, item);
    }
  });

  return [...itemsById.values()];
}

export function isStoreItemEquipped(equipped = {}, item) {
  if (!item?.id) return false;

  if (item.type === "avatar") {
    const slotItem = getEquippedAvatarSlots(equipped)[getAvatarSlot(item)];
    return String(getStoreItemId(slotItem)) === String(item.id);
  }

  return String(getStoreItemId(equipped?.[item.type])) === String(item.id);
}

export function equipStoreItem(equipped = {}, item) {
  if (!item?.id) return equipped;

  if (item.type !== "avatar") {
    return {
      ...equipped,
      [item.type]: item,
    };
  }

  const slot = getAvatarSlot(item);
  const avatarSlots = {
    ...(equipped.avatarSlots || {}),
    [slot]: item,
  };

  return {
    ...equipped,
    avatar: item,
    avatarSlots,
  };
}

export function unequipStoreItem(equipped = {}, item) {
  if (!item?.id) return equipped;

  if (item.type !== "avatar") {
    return {
      ...equipped,
      [item.type]: null,
    };
  }

  const slot = getAvatarSlot(item);
  const avatarSlots = { ...(equipped.avatarSlots || {}) };
  delete avatarSlots[slot];

  const legacyAvatarId = getStoreItemId(equipped.avatar);
  const remainingAvatar = Object.values(avatarSlots).find(Boolean) || null;

  return {
    ...equipped,
    avatar: String(legacyAvatarId) === String(item.id) ? remainingAvatar : equipped.avatar || null,
    avatarSlots,
  };
}
