import { useContext, useEffect, useMemo, useState } from "react";
import { doc, runTransaction, setDoc } from "firebase/firestore";
import Inventory from "../../components/store/Inventory";
import PurchaseModal from "../../components/store/PurchaseModal";
import StoreGrid from "../../components/store/StoreGrid";
import { useAuth } from "../../context/AuthContext";
import { CoinsContext } from "../../context/CoinsContext";
import { StoreContext } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { UserContext } from "../../context/UserContext";
import { unlockAchievement } from "../../data/achievements";
import { storeItems } from "../../data/storeItems";
import { db } from "../../services/firebase";
import { equipStoreItem, unequipStoreItem } from "../../utils/storeEquipment";
import "./Store.css";

const STARTING_COINS = 100;
const STORE_STORAGE_PREFIX = "stellar-store:";

const filters = [
  { value: "all", label: "Todos" },
  { value: "avatar", label: "Avatar" },
  { value: "background", label: "Fundos" },
];

const sortOptions = [
  { value: "featured", label: "Destaques" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "name", label: "Nome" },
];

function resolveInventoryItems(items = []) {
  return items
    .map((item) => {
      if (typeof item === "object") {
        const catalogItem = storeItems.find((storeItem) => String(storeItem.id) === String(item.id));
        return catalogItem ? { ...item, ...catalogItem } : item;
      }
      return storeItems.find((storeItem) => String(storeItem.id) === String(item));
    })
    .filter(Boolean);
}

function mergeInventoryItems(...sources) {
  const itemsById = new Map();

  sources
    .flatMap((source) => resolveInventoryItems(source || []))
    .forEach((item) => {
      if (item?.id && !itemsById.has(item.id)) {
        itemsById.set(item.id, item);
      }
    });

  return [...itemsById.values()];
}

function getEffectiveCoins(data = {}, contextCoins = 0) {
  const storedCoins = Number(data.coins ?? contextCoins ?? 0);
  return data.initialCoinsGranted ? storedCoins : Math.max(storedCoins, STARTING_COINS);
}

function getLocalStoreKey(uid) {
  return `${STORE_STORAGE_PREFIX}${uid}`;
}

function readLocalStore(uid) {
  if (!uid) {
    return {
      coins: null,
      inventory: [],
      equipped: {},
    };
  }

  try {
    const stored = localStorage.getItem(getLocalStoreKey(uid));
    if (!stored) {
      return {
        coins: null,
        inventory: [],
        equipped: {},
      };
    }

    const parsed = JSON.parse(stored);

    return {
      coins: Number.isFinite(Number(parsed.coins)) ? Number(parsed.coins) : null,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      equipped: parsed.equipped && typeof parsed.equipped === "object" ? parsed.equipped : {},
    };
  } catch (error) {
    console.warn("Não foi possível ler os dados locais da loja:", error);
    return {
      coins: null,
      inventory: [],
      equipped: {},
    };
  }
}

export default function Store() {
  const { user } = useAuth();
  const { coins, setCoins, loadingCoins } = useContext(CoinsContext);
  const { userData, setUserData } = useContext(UserContext);
  const {
    inventory: sessionInventory,
    setInventory,
    equipped: sessionEquipped,
    setEquipped,
  } = useContext(StoreContext);
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedItem, setSelectedItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [localStore, setLocalStore] = useState(() => readLocalStore(user?.uid));

  useEffect(() => {
    setLocalStore(readLocalStore(user?.uid));
  }, [user?.uid]);

  function persistLocalStore(nextData) {
    if (!user?.uid) return;

    const nextLocalStore = {
      ...localStore,
      ...nextData,
      updatedAt: Date.now(),
    };

    localStorage.setItem(getLocalStoreKey(user.uid), JSON.stringify(nextLocalStore));
    setLocalStore(nextLocalStore);
  }

  const displayedCoins =
    localStore.coins !== null ? localStore.coins : getEffectiveCoins(userData || {}, coins);

  const inventory = useMemo(
    () => mergeInventoryItems(userData?.inventory, sessionInventory, localStore.inventory),
    [localStore.inventory, sessionInventory, userData?.inventory]
  );

  const equipped = useMemo(
    () => ({
      ...(sessionEquipped || {}),
      ...(userData?.equipped || {}),
      ...(localStore.equipped || {}),
    }),
    [localStore.equipped, sessionEquipped, userData?.equipped]
  );
  const ownedIds = useMemo(() => new Set(inventory.map((item) => item.id)), [inventory]);

  const visibleItems = useMemo(() => {
    const filteredItems =
      activeFilter === "all"
        ? [...storeItems]
        : storeItems.filter((item) => item.type === activeFilter);

    return filteredItems.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name, "pt-BR");

      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.price - b.price;
    });
  }, [activeFilter, sortBy]);

  async function handlePurchase(item) {
    if (!user?.uid) {
      showToast("Faça login para comprar itens.", "error");
      return;
    }

    if (ownedIds.has(item.id)) {
      showToast("Você já possui este item.", "info");
      setSelectedItem(null);
      return;
    }

    setProcessingId(item.id);

    try {
      const userRef = doc(db, "users", user.uid);
      let nextCoins = displayedCoins;
      let nextInventory = inventory;

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        const data = snap.exists() ? snap.data() : {};
        const currentCoins = getEffectiveCoins(data, displayedCoins);
        const currentInventory = Array.isArray(data.inventory) ? data.inventory : [];
        const alreadyOwned = currentInventory.some((owned) => {
          const ownedId = typeof owned === "object" ? owned.id : owned;
          return String(ownedId) === String(item.id);
        });

        if (alreadyOwned) {
          throw new Error("already-owned");
        }

        if (currentCoins < item.price) {
          throw new Error("insufficient-coins");
        }

        nextCoins = currentCoins - item.price;
        nextInventory = mergeInventoryItems(currentInventory, inventory, [item]);

        transaction.set(
          userRef,
          {
            coins: nextCoins,
            initialCoinsGranted: true,
            inventory: nextInventory,
          },
          { merge: true }
        );
      });

      setCoins(nextCoins);
      setInventory(nextInventory);
      persistLocalStore({
        coins: nextCoins,
        inventory: nextInventory,
        equipped,
      });
      setUserData?.((current) => ({
        ...current,
        coins: nextCoins,
        initialCoinsGranted: true,
        inventory: nextInventory,
      }));

      const nextAchievements = {
        ...unlockAchievement(user.uid, "first_purchase", { itemId: item.id }),
      };

      if (nextInventory.length >= 5) {
        Object.assign(
          nextAchievements,
          unlockAchievement(user.uid, "collector", { items: nextInventory.length })
        );
      }

      setDoc(
        doc(db, "users", user.uid),
        {
          achievements: nextAchievements,
        },
        { merge: true }
      ).catch((error) => {
        console.warn("Conquistas da loja salvas localmente:", error);
      });

      setSelectedItem(null);
      showToast(`${item.name} comprado com sucesso.`, "success");
    } catch (error) {
      if (error.message === "already-owned") {
        showToast("Você já possui este item.", "info");
        setSelectedItem(null);
      } else if (displayedCoins >= item.price) {
        console.warn("Compra salva localmente porque o Firebase recusou a operação:", error);

        const nextCoins = displayedCoins - item.price;
        const nextInventory = mergeInventoryItems(inventory, [item]);

        setCoins(nextCoins);
        setInventory(nextInventory);
        persistLocalStore({
          coins: nextCoins,
          inventory: nextInventory,
          equipped,
        });
        setUserData?.((current) => ({
          ...current,
          coins: nextCoins,
          initialCoinsGranted: true,
          inventory: nextInventory,
          achievements: {
            ...(current?.achievements || {}),
            ...unlockAchievement(user.uid, "first_purchase", { itemId: item.id }),
            ...(nextInventory.length >= 5
              ? unlockAchievement(user.uid, "collector", { items: nextInventory.length })
              : {}),
          },
        }));
        setSelectedItem(null);
        showToast(`${item.name} comprado. Salvamos no seu navegador enquanto o Firebase está indisponível.`, "success");
      } else if (error.message === "insufficient-coins") {
        showToast("Você ainda não tem moedas suficientes.", "error");
      } else {
        console.error(error);
        showToast("Não foi possível concluir a compra agora.", "error");
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function handleEquip(item) {
    if (!ownedIds.has(item.id)) return;

    const nextEquipped = equipStoreItem(equipped, item);

    setEquipped(nextEquipped);
    persistLocalStore({
      coins: displayedCoins,
      inventory,
      equipped: nextEquipped,
    });
    setUserData?.((current) => ({ ...current, equipped: nextEquipped }));

    if (user?.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            equipped: nextEquipped,
          },
          { merge: true }
        );
      } catch (error) {
        console.warn("Item equipado localmente porque o Firebase recusou a operação:", error);
        showToast(`${item.name} equipado neste navegador.`, "success");
        return;
      }
    }

    showToast(`${item.name} equipado.`, "success");
  }

  async function handleUnequip(item) {
    const nextEquipped = unequipStoreItem(equipped, item);

    setEquipped(nextEquipped);
    persistLocalStore({
      coins: displayedCoins,
      inventory,
      equipped: nextEquipped,
    });
    setUserData?.((current) => ({ ...current, equipped: nextEquipped }));

    if (user?.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            equipped: nextEquipped,
          },
          { merge: true }
        );
      } catch (error) {
        console.warn("Item removido localmente porque o Firebase recusou a operação:", error);
        showToast(`${item.name} removido neste navegador.`, "success");
        return;
      }
    }

    showToast(`${item.name} removido.`, "success");
  }

  return (
    <div className="store-page">
      <header className="store-hero">
        <div>
          <p className="page-kicker">Mercado estelar</p>
          <h1>Loja</h1>
          <p>
            Compre itens visuais, equipe acessórios e personalize sua presença
            no Stellar Interaction.
          </p>
        </div>

        <aside className="store-wallet" aria-label="Saldo da conta">
          <span>Seu saldo</span>
          <strong>{loadingCoins ? "..." : displayedCoins}</strong>
          <small>moedas disponíveis</small>
        </aside>
      </header>

      <section className="store-toolbar" aria-label="Filtros da loja">
        <div className="store-filter-group" role="group" aria-label="Categoria">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={activeFilter === filter.value ? "is-active" : ""}
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={activeFilter === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="store-sort">
          <span>Ordenar</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="store-section" aria-labelledby="catalog-title">
        <div className="store-section-heading">
          <div>
            <p className="page-kicker">Catálogo</p>
            <h2 id="catalog-title">Itens disponíveis</h2>
          </div>
          <p>
            {visibleItems.length} produtos encontrados. Você começa com 100
            moedas e pode ganhar mais uma recompensa diária no quiz.
          </p>
        </div>

        <StoreGrid
          items={visibleItems}
          ownedIds={ownedIds}
          balance={displayedCoins}
          equipped={equipped}
          onSelect={setSelectedItem}
          onEquip={handleEquip}
        />
      </section>

      <section className="inventory-panel" aria-labelledby="inventory-title">
        <div className="store-section-heading">
          <div>
            <p className="page-kicker">Sua coleção</p>
            <h2 id="inventory-title">Inventário</h2>
          </div>
          <p>{inventory.length} itens comprados.</p>
        </div>

        <Inventory
          items={inventory}
          equipped={equipped}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </section>

      <PurchaseModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        balance={displayedCoins}
        owned={selectedItem ? ownedIds.has(selectedItem.id) : false}
        busy={Boolean(processingId)}
        onConfirm={handlePurchase}
        onClose={() => (processingId ? null : setSelectedItem(null))}
      />
    </div>
  );
}
