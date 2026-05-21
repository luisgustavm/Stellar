// src/components/user/UserAvatar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEquippedAvatarItems } from "../../hooks/useEquippedAvatarItem";
import AvatarAccessory from "./AvatarAccessory";

const AVATAR_STORAGE_PREFIX = "stellar-local-avatar:";

export default function UserAvatar() {
  const { user } = useAuth();
  const equippedAvatarItems = useEquippedAvatarItems();
  const name = user?.name || user?.username || user?.email || "Perfil";
  const localAvatar = user?.uid ? localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${user.uid}`) : "";
  const photo = user?.avatarUrl || localAvatar || user?.photoURL;

  return (
    <Link className="user-avatar" to="/profile" title="Abrir perfil">
      {photo ? <img src={photo} alt={name} /> : name.charAt(0).toUpperCase()}
      {equippedAvatarItems.map((item) => (
        <AvatarAccessory key={item.id} item={item} />
      ))}
    </Link>
  );
}
