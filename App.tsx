import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import GestureController from './components/GestureController';
import Overlay from './components/UI/Overlay';

const App: React.FC = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  return (
    <div className="relative w-full h-screen bg-[#000502]">
      {/* 3D Canvas */}
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{ 
          antialias: false, 
          toneMapping: 3,
          toneMappingExposure: 1.5,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true
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
    </div>
  );
};

export default App;