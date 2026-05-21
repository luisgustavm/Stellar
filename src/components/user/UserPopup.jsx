// src/components/user/UserPopup.jsx
import Modal from "../ui/Modal";

export default function UserPopup({ open, user, onClose }) {
  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-white">
        <h2 className="text-xl font-bold mb-2">Perfil</h2>

        <p>Nome: {user.name}</p>
        <p>Email: {user.email}</p>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="mt-4 w-full bg-red-600 py-2 rounded-lg"
        >
          Sair
        </button>
      </div>
    </Modal>
  );
}