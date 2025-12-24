import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { generateTreePosition, generateScatterPosition } from '../../utils/math';

interface PolaroidProps {
  count: number;
}

// 将你的照片放入 public/photos 文件夹，命名为 1.jpg, 2.jpg ... 15.jpg
const BASE_URL = import.meta.env.BASE_URL;
const images = [
  `${BASE_URL}photos/1.jpg`,
  `${BASE_URL}photos/2.jpg`,
  `${BASE_URL}photos/3.jpg`,
  `${BASE_URL}photos/4.jpg`,
  `${BASE_URL}photos/5.jpg`,
  `${BASE_URL}photos/6.jpg`,
  `${BASE_URL}photos/7.jpg`,
  `${BASE_URL}photos/8.jpg`,
  `${BASE_URL}photos/9.jpg`,
  `${BASE_URL}photos/10.jpg`,
  `${BASE_URL}photos/11.jpg`,
  `${BASE_URL}photos/12.jpg`,
  `${BASE_URL}photos/13.jpg`,
  `${BASE_URL}photos/14.jpg`,
  `${BASE_URL}photos/15.jpg`
];

const PolaroidPhoto: React.FC<{ url: string }> = ({ url }) => {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, 0.1, 0.02]}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};

const PolaroidPlaceholder: React.FC = () => {
  return (
    <mesh position={[0, 0.1, 0.02]}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial color="#222" toneMapped={false} />
    </mesh>
  );
};

const SinglePolaroid: React.FC<{ 
  positionTree: THREE.Vector3, 
  positionScatter: THREE.Vector3, 
  cameraOffset: THREE.Vector3, // Changed from focusPosition to cameraOffset
  imgUrl: string 
}> = ({ positionTree, positionScatter, cameraOffset, imgUrl }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Local lerping states
  const morphProgress = useRef(0);
  const pinchProgress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 1. Get current global states
    const { targetMorphState, isPinching } = useStore.getState();

    // 2. Smoothly interpolate control values
    morphProgress.current = THREE.MathUtils.damp(morphProgress.current, targetMorphState, 3, delta);
    // Use a slightly faster damp for the "summon" effect so it feels responsive
    pinchProgress.current = THREE.MathUtils.damp(pinchProgress.current, isPinching ? 1 : 0, 4, delta);

    // 3. Calculate Background Position (Tree vs Scatter)
    const basePos = new THREE.Vector3().copy(positionTree).lerp(positionScatter, morphProgress.current);
    
    // 4. Calculate Focus Position (Relative to Camera)
    // We transform the local offset (relative to camera) into World Space
    const camera = state.camera;
    const targetFocusPos = cameraOffset.clone().applyMatrix4(camera.matrixWorld);
    
    // 5. Final Position Lerp
    const finalPos = new THREE.Vector3().copy(basePos).lerp(targetFocusPos, pinchProgress.current);
    meshRef.current.position.copy(finalPos);

    // 6. Orientation Logic
    
    // A. Orientation when in background (Tree/Scatter)
    const dummy = new THREE.Object3D();
    dummy.position.copy(basePos);
    // Look away from center to face outward
    dummy.lookAt(basePos.x * 2, basePos.y, basePos.z * 2); 
    const treeRot = dummy.quaternion.clone();
    
    const time = state.clock.elapsedTime;
    const scatterRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(time * 0.5, time * 0.3, 0));
    const baseRot = new THREE.Quaternion().slerpQuaternions(treeRot, scatterRot, morphProgress.current);

    // B. Orientation when Focused (Always look at camera)
    dummy.position.copy(finalPos);
    dummy.lookAt(camera.position); 
    const focusRot = dummy.quaternion.clone();

    // Combine rotations
    meshRef.current.quaternion.slerpQuaternions(baseRot, focusRot, pinchProgress.current);
  });

  return (
    <group ref={meshRef}>
      {/* Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#fffff0" roughness={0.8} />
      </mesh>
      
      {imgUrl && imgUrl.trim() !== '' ? (
        <PolaroidPhoto url={imgUrl} />
      ) : (
        <PolaroidPlaceholder />
      )}
    </group>
  );
};

const PolaroidGallery: React.FC<PolaroidProps> = ({ count }) => {
  const items = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // 1. Tree Position
      const tPos = generateTreePosition(i, count, 10, 5); 
      tPos.multiplyScalar(1.2); 
      
      // 2. Scatter Position
      const sPos = generateScatterPosition(12);
      
      // 3. Camera Offset (Local Space relative to Camera)
      // Camera looks down -Z axis.
      // We want to arrange them in a grid ~10 units in front of the camera.
      const cols = 5;
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Calculate grid offsets
      // x: left to right
      // y: top to bottom
      const xOffset = (col - 2) * 1.6 + (Math.random() * 0.2); 
      const yOffset = -(row - 1.5) * 2.0 + (Math.random() * 0.2); // Invert Y so 0 is top
      const zOffset = -12 - Math.random() * 2; // In front of camera (Negative Z)

      const cameraOffset = new THREE.Vector3(xOffset, yOffset, zOffset);

      return {
        tPos,
        sPos,
        cameraOffset,
        img: images[i % images.length]
      };
    });
  }, [count]);

  return (
    <group>
      {items.map((item, i) => (
        <SinglePolaroid 
          key={i} 
          positionTree={item.tPos} 
          positionScatter={item.sPos} 
          cameraOffset={item.cameraOffset}
          imgUrl={item.img} 
        />
      ))}
    </group>
  );
};

export default PolaroidGallery;