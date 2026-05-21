// src/components/ui/Loader.jsx
export default function Loader() {
  return (
    <div className="w-full flex items-center justify-center p-10 text-white">
      <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
    </div>
  );
}