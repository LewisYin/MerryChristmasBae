import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import GestureController from './components/GestureController';
import Overlay from './components/UI/Overlay';

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
          <div>
            <p className="text-[#ffd700] text-xl mb-2">🎄 加载中遇到问题</p>
            <p className="text-sm opacity-60">{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [webglError, setWebglError] = useState<string | null>(null);

  // 检查 WebGL 支持
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setWebglError('您的浏览器不支持 WebGL');
    }
  }, []);

  if (webglError) {
    return (
      <div className="relative w-full h-screen bg-[#000502] flex items-center justify-center text-white">
        <div className="text-center p-4">
          <p className="text-[#ffd700] text-2xl mb-2">🎄 Merry Christmas</p>
          <p className="text-sm opacity-60">{webglError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#000502]">
      {/* 3D Canvas */}
      <ErrorBoundary fallback={<div>3D 渲染失败</div>}>
        <Canvas
          shadows={false}
          dpr={1}
          gl={{ 
            antialias: false, 
            toneMapping: 3,
            toneMappingExposure: 1.5,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: true
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000502');
          }}
        >
          <Scene />
        </Canvas>
      </ErrorBoundary>

      {/* Logic & UI Layers */}
      <GestureController />
      <Overlay />
    </div>
  );
};

export default App;
