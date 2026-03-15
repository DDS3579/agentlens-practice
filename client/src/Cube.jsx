// Cube.jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const RubiksCube = ({ color = '#d8c4f0' }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA', '#FF8B94'];

  return (
    <group ref={meshRef}>
      {/* Front Face - Red */}
      <mesh position={[0, 0, 1.01]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[0]} />
      </mesh>
      {/* Back Face - Cyan */}
      <mesh position={[0, 0, -1.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[1]} />
      </mesh>
      {/* Right Face - Yellow */}
      <mesh position={[1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[2]} />
      </mesh>
      {/* Left Face - Mint Green */}
      <mesh position={[-1.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[3]} />
      </mesh>
      {/* Top Face - Light Purple */}
      <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[4]} />
      </mesh>
      {/* Bottom Face - Pink */}
      <mesh position={[0, -1.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color={colors[5]} />
      </mesh>

      {/* Core cube for structure */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

const Cube = ({ width = '100%', height = '100%' }) => {
  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas camera={{ position: [2.5, 2.5, 2.5] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        <RubiksCube />
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={4}
          enableZoom={true}
          enablePan={true}
        />
      </Canvas>
    </div>
  );
};

export default Cube;

