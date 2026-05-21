import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function Player() {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  );
}