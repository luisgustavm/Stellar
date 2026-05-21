// src/components/user/UserProfileCard.jsx
export default function UserProfileCard({ user }) {
  const photo = user?.avatarUrl || user?.photoURL || "/images/avatars/default.svg";
  const name = user?.name || user?.username || "Usuario";

  return (
    <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-white max-w-md">
      <div className="flex items-center gap-3">
        <img
          src={photo}
          alt={name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div>
          <h2 className="font-bold">{name}</h2>
          <p className="text-sm text-white/60">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}
