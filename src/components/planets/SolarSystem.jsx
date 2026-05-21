// src/components/planets/SolarSystem.jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

function Planet({ position, size, color, onClick }) {
  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function SolarSystem() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} />

        {/* Sol */}
        <Sphere args={[1.5, 32, 32]}>
          <meshStandardMaterial emissive={"yellow"} />
        </Sphere>

        {/* Mercúrio */}
        <Planet
          position={[2, 0, 0]}
          size={0.3}
          color="gray"
          onClick={() => navigate("/planets/mercurio")}
        />

        {/* Vênus */}
        <Planet
          position={[3, 0, 0]}
          size={0.4}
          color="orange"
          onClick={() => navigate("/planets/venus")}
        />

        {/* Terra */}
        <Planet
          position={[4, 0, 0]}
          size={0.5}
          color="blue"
          onClick={() => navigate("/planets/terra")}
        />

        {/* Marte */}
        <Planet
          position={[5, 0, 0]}
          size={0.4}
          color="red"
          onClick={() => navigate("/planets/marte")}
        />

        {/* Júpiter */}
        <Planet
          position={[6.5, 0, 0]}
          size={0.9}
          color="orange"
          onClick={() => navigate("/planets/jupiter")}
        />

        {/* Saturno */}
        <Planet
          position={[8, 0, 0]}
          size={0.8}
          color="#d2b48c"
          onClick={() => navigate("/planets/saturno")}
        />

        {/* Urano */}
        <Planet
          position={[9.5, 0, 0]}
          size={0.6}
          color="lightblue"
          onClick={() => navigate("/planets/urano")}
        />

        {/* Netuno */}
        <Planet
          position={[11, 0, 0]}
          size={0.6}
          color="blue"
          onClick={() => navigate("/planets/netuno")}
        />

        <OrbitControls />
      </Canvas>
    </div>
  );
}