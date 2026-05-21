import { useContext } from "react";
import { CoinsContext } from "../context/CoinsContext";

export default function useCoins() {
  const { coins } = useContext(CoinsContext);
  return coins;
}
