import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, ContactShadows, Line } from '@react-three/drei';
import * as THREE from 'three';

/* ── Single mini-cube with glossy purple material ── */
function MiniCube({ position, colorIndex, explode }) {
    const ref = useRef(null);
    const purples = useMemo(() => [
        '#7c3aed', '#8b5cf6', '#6d28d9', '#a855f7', '#9333ea',
        '#7e22ce', '#6b21a8', '#c084fc', '#9b59d6',
    ], []);

    const basePos = useMemo(() => new THREE.Vector3(...position), [position]);
    const direction = useMemo(() => basePos.clone().normalize(), [basePos]);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;

        if (explode) {
            // Explode outward — much bigger distance for full-page effect
            const target = basePos.clone().add(direction.clone().multiplyScalar(6));
            ref.current.position.lerp(target, 0.06);
            ref.current.rotation.x += 0.04;
            ref.current.rotation.y += 0.05;
        } else {
            // Reassemble smoothly
            ref.current.position.lerp(basePos, 0.06);
            ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.05);
            ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, 0, 0.05);
        }

        // Subtle breathing scale
        const s = 1 + Math.sin(t * 2 + colorIndex * 0.3) * 0.02;
        ref.current.scale.setScalar(s);
    });

    return (
        <mesh ref={ref} position={position} castShadow>
            <boxGeometry args={[0.58, 0.58, 0.58]} />
            <meshPhysicalMaterial
                color={purples[colorIndex % purples.length]}
                metalness={0.35}
                roughness={0.08}
                clearcoat={1}
                clearcoatRoughness={0.03}
                reflectivity={1}
                envMapIntensity={1.8}
            />
        </mesh>
    );
}

/* ── Full Rubik's Cube (3x3x3 grid) ── */
function RubiksCube({ explode }) {
    const groupRef = useRef(null);
    const { pointer } = useThree();

    const cubePositions = useMemo(() => {
        const positions = [];
        let idx = 0;
        const gap = 0.64;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    positions.push({ pos: [x * gap, y * gap, z * gap], idx: idx++ });
                }
            }
        }
        return positions;
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        groupRef.current.rotation.y = t * 0.3 + pointer.x * 0.5;
        groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.25 + 0.45 + pointer.y * 0.3;
        groupRef.current.rotation.z = Math.cos(t * 0.18) * 0.1;
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
    });

    return (
        <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
            <group ref={groupRef} scale={1.35}>
                {cubePositions.map((cube, i) => (
                    <MiniCube key={i} position={cube.pos} colorIndex={cube.idx} explode={explode} />
                ))}
            </group>
        </Float>
    );
}

/* ── Orbital Ring using drei Line (not SVG line) ── */
function OrbitalRing({ radius, tiltX, tiltZ, speed, color }) {
    const sphereRef = useRef(null);

    const ringPoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
        }
        return pts;
    }, [radius]);

    useFrame((state) => {
        if (!sphereRef.current) return;
        const t = state.clock.elapsedTime * speed;
        sphereRef.current.position.x = Math.cos(t) * radius;
        sphereRef.current.position.z = Math.sin(t) * radius;
    });

    return (
        <group rotation={[tiltX, 0, tiltZ]}>
            <Line points={ringPoints} color={color} lineWidth={1} transparent opacity={0.15} />
            <mesh ref={sphereRef}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} />
            </mesh>
        </group>
    );
}

export default function HeroCube() {
    const [explode, setExplode] = useState(false);
    const containerRef = useRef(null);
    const [cssScale, setCssScale] = useState(1);

    const handleToggle = () => {
        if (explode) return;

        // Calculate how much to scale the canvas container to cover the viewport
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const scaleX = window.innerWidth / rect.width;
            const scaleY = window.innerHeight / rect.height;
            setCssScale(Math.max(scaleX, scaleY) * 0.88); // reduced by 20%
        }

        setExplode(true);
        setTimeout(() => {
            setExplode(false);
            // Wait for cubes to reassemble, then scale back smoothly
            setTimeout(() => setCssScale(1), 800);
        }, 2000);
    };

    return (
        <div className="w-full h-full" style={{ position: 'relative' }}>
            <div
                ref={containerRef}
                onClick={handleToggle}
                style={{
                    position: 'absolute',
                    inset: 0,
                    cursor: explode ? 'default' : 'pointer',
                    transform: `scale(${cssScale})`,
                    transformOrigin: 'center center',
                    transition: cssScale > 1
                        ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        : 'transform 0.6s cubic-bezier(0.33, 0, 0.2, 1)',
                    zIndex: explode || cssScale > 1 ? 999 : 'auto',
                    pointerEvents: explode ? 'none' : 'auto',
                }}
            >
                <Canvas
                    camera={{ position: [0, 0.5, 5.5], fov: 50 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
                    style={{ background: 'transparent' }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1.4} color="#f0e6ff" castShadow />
                    <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#d946ef" />
                    <pointLight position={[0, -2, 3]} intensity={0.3} color="#8b5cf6" />
                    <spotLight position={[3, 5, 2]} angle={0.3} penumbra={0.5} intensity={0.6} color="#c084fc" />
                    <Environment preset="city" />
                    <RubiksCube explode={explode} />
                    <OrbitalRing radius={2.8} tiltX={0.5} tiltZ={0.3} speed={0.5} color="#a855f7" />
                    <OrbitalRing radius={3.3} tiltX={-0.3} tiltZ={0.7} speed={0.3} color="#d946ef" />
                    <ContactShadows position={[0, -2, 0]} opacity={0.12} scale={8} blur={2.5} far={4} color="#7c3aed" />
                </Canvas>
            </div>
        </div>
    );
}