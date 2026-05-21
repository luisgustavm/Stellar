import { useContext } from "react";
import { CoinsContext } from "../../context/CoinsContext";

export default function CoinsDisplay({ coins }) {
  const { coins: contextCoins, loadingCoins } = useContext(CoinsContext);
  const balance = coins ?? contextCoins ?? 0;

  return (
    <div
      className="coins-display"
      aria-label={loadingCoins ? "Carregando saldo de moedas" : `Saldo: ${balance} moedas`}
      title={loadingCoins ? "Carregando moedas" : `${balance} moedas`}
    >
      <span className="coins-display-icon" aria-hidden="true" />
      <span>{loadingCoins ? "..." : balance}</span>
    </div>
  );
}
