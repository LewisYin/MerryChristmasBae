import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store';
import ArixParticles from './Visuals/ArixParticles';
import PolaroidGallery from './Visuals/PolaroidGallery';

const Scene: React.FC = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  
  useFrame((state, delta) => {
    // Read state directly without triggering re-render
    const { handX, handY, isHandDetected } = useStore.getState();

    if (controlsRef.current && isHandDetected) {
      // If hand is detected, influence the camera rotation
      // Map hand (-1 to 1) to azimuthal/polar angles
      
      // Reverted to original smooth values
      const targetAzimuth = handX * 1.5; // Rotate left/right
      const targetPolar = Math.PI / 2 - (handY * 0.5); // Look up/down
      
      controlsRef.current.setAzimuthalAngle(
        THREE.MathUtils.lerp(controlsRef.current.getAzimuthalAngle(), targetAzimuth, delta * 2)
      );
      
      controlsRef.current.setPolarAngle(
        THREE.MathUtils.lerp(controlsRef.current.getPolarAngle(), targetPolar, delta * 2)
      );
      
      controlsRef.current.update();
    } else if (controlsRef.current && !isHandDetected) {
      // Auto rotate slowly if no hand
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 25]} ref={cameraRef} fov={45} />
      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={40}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} color="#043927" /> {/* Deep Emerald Ambient */}
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#0f0" />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#fff" 
      />

      {/* Reflections - disabled on mobile */}
      {!isMobile && <Environment preset="city" />}

      {/* Background Ambience - reduced on mobile */}
      <Stars radius={100} depth={50} count={isMobile ? 1000 : 5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#000502', 10, 60]} />

      {/* Content */}
      {/* Position kept at 0.5 as requested previously */}
      <group position={[0, 0.5, 0]}>
        {/* Emerald Needles (Tetrahedrons for sharpness) */}
        <ArixParticles count={isMobile ? 500 : 2500} color="#004d33" size={0.15} type="emerald" shape="tetra" />
        
        {/* Gold Ornaments (Boxes/Cubes for glint) */}
        <ArixParticles count={isMobile ? 300 : 1500} color="#FFD700" size={0.12} type="gold" shape="box" />
        
        {/* Photos */}
        <React.Suspense fallback={null}>
          <PolaroidGallery count={15} />
        </React.Suspense>
      </group>

      {/* Post Processing - disabled on mobile for compatibility */}
      {!isMobile && (
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9} 
            intensity={1.5} 
            radius={0.6}
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <Noise opacity={0.05} />
        </EffectComposer>
      )}
    </>
  );
};

export default Scene;