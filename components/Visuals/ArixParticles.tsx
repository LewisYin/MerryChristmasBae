import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { generateTreePosition, generateScatterPosition } from '../../utils/math';

interface ParticleSystemProps {
  count: number;
  color: string;
  size: number;
  type: 'gold' | 'emerald';
  shape?: 'box' | 'tetra';
}

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();
const targetPos = new THREE.Vector3();

const ArixParticles: React.FC<ParticleSystemProps> = ({ count, color, size, type, shape = 'box' }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const targetState = useStore(state => state.targetMorphState);
  
  // Store actual transition progress locally to smooth it out per frame
  const progress = useRef(0);

  // Pre-calculate positions for both states
  const { treePositions, scatterPositions } = useMemo(() => {
    const tPos: number[] = [];
    const sPos: number[] = [];
    
    for (let i = 0; i < count; i++) {
      // Tree Shape: Cone with slight variations
      // Gold tends to be ornaments (outer), Emerald is needles (inner volume)
      const radiusBase = type === 'gold' ? 4.5 : 4.0;
      const height = 12;
      
      // Add some noise to tree position so it's not a perfect line
      const noise = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      const treeP = generateTreePosition(i, count, height, radiusBase).add(noise);
      
      // Scatter Shape: Large sphere
      const scatterP = generateScatterPosition(20);

      tPos.push(treeP.x, treeP.y, treeP.z);
      sPos.push(scatterP.x, scatterP.y, scatterP.z);
    }
    return { 
      treePositions: new Float32Array(tPos), 
      scatterPositions: new Float32Array(sPos) 
    };
  }, [count, type]);

  // Initial Placement
  useLayoutEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        tempObject.position.set(treePositions[i*3], treePositions[i*3+1], treePositions[i*3+2]);
        tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        tempObject.scale.setScalar(size * (0.8 + Math.random() * 0.4));
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, treePositions, size]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth transition logic (Spring-like lerp)
    // Move 'progress' towards 'targetState' (0 or 1)
    const speed = 2.5;
    progress.current = THREE.MathUtils.damp(progress.current, targetState, 4, delta);

    for (let i = 0; i < count; i++) {
      // Get Start (Tree) and End (Scatter) positions
      const tx = treePositions[i*3];
      const ty = treePositions[i*3+1];
      const tz = treePositions[i*3+2];

      const sx = scatterPositions[i*3];
      const sy = scatterPositions[i*3+1];
      const sz = scatterPositions[i*3+2];

      // Lerp position
      tempPos.set(tx, ty, tz).lerp(targetPos.set(sx, sy, sz), progress.current);

      // Add a gentle floating motion when in tree state for "magical" feel
      const floatTime = state.clock.elapsedTime + i * 0.1;
      const floatY = Math.sin(floatTime) * 0.1 * (1 - progress.current); // Only float when tree
      
      // Rotation: Spin faster when scattered
      const rotationSpeed = (0.2 + progress.current * 2.0) * delta;
      
      tempObject.position.copy(tempPos);
      tempObject.position.y += floatY;
      
      // We need to read current matrix to apply rotation properly without resetting it every frame if we want continuous spin
      // But for simplicity/stability in thismorph, we re-calculate rotation based on time
      tempObject.rotation.set(
        floatTime * 0.2 + i, 
        floatTime * 0.1 + i, 
        floatTime * 0.1
      );
      
      tempObject.scale.setScalar(size * (0.8 + Math.random() * 0.2)); // Slight shimmer in size? No, keep constant to save perf
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {shape === 'box' ? <boxGeometry /> : <tetrahedronGeometry />}
      <meshStandardMaterial 
        color={color} 
        roughness={0.1} 
        metalness={0.9} 
        emissive={color}
        emissiveIntensity={type === 'gold' ? 0.5 : 0.1}
      />
    </instancedMesh>
  );
};

export default ArixParticles;