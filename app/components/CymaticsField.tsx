"use client";

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  basePosition: THREE.Vector3;
  phase: number;
  amplitude: number;
  frequency: number;
}

interface CymaticsFieldProps {
  beatIntensity: number;
  currentStep: number;
  isPlaying: boolean;
  kickPattern: number[];
}

function ParticleSystem({ beatIntensity, currentStep, isPlaying, kickPattern }: CymaticsFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  const particleCount = 2000;
  const fieldSize = 4;
  
  // Create particles in a cymatics-inspired grid pattern
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particles: Particle[] = [];
    
    // Create particle grid with some randomness (like sand on a cymatics plate)
    const gridSize = Math.sqrt(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const x = ((i % gridSize) / gridSize - 0.5) * fieldSize + (Math.random() - 0.5) * 0.1;
      const z = (Math.floor(i / gridSize) / gridSize - 0.5) * fieldSize + (Math.random() - 0.5) * 0.1;
      const y = 0;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Blue-to-white color based on distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const colorIntensity = Math.max(0, 1 - distanceFromCenter / (fieldSize * 0.5));
      colors[i * 3] = 0.2 + colorIntensity * 0.6; // R
      colors[i * 3 + 1] = 0.4 + colorIntensity * 0.6; // G
      colors[i * 3 + 2] = 1.0; // B
      
      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(0, 0, 0),
        basePosition: new THREE.Vector3(x, y, z),
        phase: Math.random() * Math.PI * 2,
        amplitude: Math.random() * 0.5 + 0.5,
        frequency: Math.random() * 2 + 1
      });
    }
    
    particlesRef.current = particles;
    return { positions, colors };
  }, []);
  
  // Check if current step is a kick
  const isKick = kickPattern.includes(currentStep);
  
  useFrame((state) => {
    if (!meshRef.current || !isPlaying) return;
    
    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const colors = meshRef.current.geometry.attributes.color.array as Float32Array;
    
    // Create cymatics wave patterns
    const waveFrequency = isKick ? 8 + beatIntensity * 12 : 4; // Higher frequency on kick
    const waveAmplitude = beatIntensity * 0.3 + 0.05;
    const damping = 0.98;
    
    particlesRef.current.forEach((particle, i) => {
      const { basePosition, phase, amplitude, frequency } = particle;
      
      // Distance from center for radial wave patterns
      const distanceFromCenter = Math.sqrt(
        basePosition.x * basePosition.x + basePosition.z * basePosition.z
      );
      
      // Create multiple wave interference patterns (like real cymatics)
      const radialWave = Math.sin(distanceFromCenter * waveFrequency - time * 10 + phase);
      const standingWaveX = Math.sin(basePosition.x * waveFrequency + time * 8);
      const standingWaveZ = Math.sin(basePosition.z * waveFrequency + time * 6);
      
      // Combine wave patterns for complex interference
      const waveHeight = (
        radialWave * 0.6 +
        standingWaveX * 0.3 +
        standingWaveZ * 0.3
      ) * waveAmplitude * amplitude;
      
      // Additional kick-based displacement
      let kickDisplacement = 0;
      if (isKick && beatIntensity > 0) {
        const kickWave = Math.sin(distanceFromCenter * 15 - time * 50) * beatIntensity * 0.4;
        kickDisplacement = kickWave * Math.exp(-distanceFromCenter * 2); // Localized impact
      }
      
      // Apply physics-based movement
      const targetY = waveHeight + kickDisplacement;
      const springForce = (targetY - particle.position.y) * 0.1;
      particle.velocity.y += springForce;
      particle.velocity.y *= damping; // Damping
      particle.position.y += particle.velocity.y;
      
      // Update positions
      positions[i * 3 + 1] = particle.position.y;
      
      // Dynamic color based on height and beat intensity
      const colorIntensity = Math.abs(particle.position.y) * 3 + beatIntensity * 0.5;
      colors[i * 3] = Math.min(1, 0.2 + colorIntensity); // R
      colors[i * 3 + 1] = Math.min(1, 0.4 + colorIntensity * 0.8); // G
      colors[i * 3 + 2] = 1.0; // B (always blue-tinted)
    });
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });
  
  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

export default function CymaticsField({ beatIntensity, currentStep, isPlaying, kickPattern }: CymaticsFieldProps) {
  return (
    <Canvas
      camera={{ position: [0, 3, 3], fov: 60 }}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#4FC3F7" />
      <ParticleSystem 
        beatIntensity={beatIntensity} 
        currentStep={currentStep} 
        isPlaying={isPlaying}
        kickPattern={kickPattern}
      />
    </Canvas>
  );
}