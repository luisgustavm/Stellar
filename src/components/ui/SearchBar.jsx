// src/components/ui/SearchBar.jsx
import Input from "./Input";
import Button from "./Button";
import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Buscar planeta..." />
      <Button onClick={() => onSearch?.(value)}>Buscar</Button>
    </div>
  );
}