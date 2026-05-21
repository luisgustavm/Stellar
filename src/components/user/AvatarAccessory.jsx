export default function AvatarAccessory({ item, size = "compact" }) {
  if (!item?.id) return null;

  return (
    <span
      className={`avatar-accessory avatar-accessory-${item.id} avatar-accessory-${size}`}
      aria-hidden="true"
    >
      {item.image ? <img src={item.image} alt="" /> : <span />}
    </span>
  );
}
