import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import GestureController from './components/GestureController';
import Overlay from './components/UI/Overlay';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[#000502]">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ 
          antialias: false, 
          toneMapping: 3, // THREE.ReinhardToneMapping
          toneMappingExposure: 1.5,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000502');
        }}
      >
        <Scene />
      </Canvas>

      {/* Logic & UI Layers */}
      <GestureController />
      <Overlay />
      
      {/* Texture Preloader / Fallback Logic could go here */}
    </div>
  );
};

export default App;