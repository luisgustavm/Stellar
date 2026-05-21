import { createContext, useState } from "react";

export const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({});

  return (
    <StoreContext.Provider value={{ inventory, setInventory, equipped, setEquipped }}>
      {children}
    </StoreContext.Provider>
  );
}