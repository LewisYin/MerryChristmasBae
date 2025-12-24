import React, { useState, useRef } from 'react';
import { useStore } from '../../store';

const Overlay: React.FC = () => {
  const isHandDetected = useStore(state => state.isHandDetected);
  const targetMorphState = useStore(state => state.targetMorphState);
  const isPinching = useStore(state => state.isPinching);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-8 z-10">
      
      {/* 背景音乐 */}
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}儿歌-铃儿响叮当 (英语).ogg`} loop />
      
      {/* 音乐播放按钮 */}
      <button
        onClick={toggleMusic}
        className="pointer-events-auto absolute bottom-32 left-8 w-12 h-12 rounded-full border border-[#ffd700]/50 bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-[#ffd700]/20 transition-all duration-300 z-20"
      >
        <span className="text-[#ffd700] text-xl">
          {isPlaying ? '⏸' : '🎵'}
        </span>
      </button>

      {/* Header (Top Left) */}
      <div className="flex flex-col items-start">
        <h1 className="font-['Cinzel'] text-4xl md:text-5xl text-[#ffd700] tracking-widest drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
          Merry Christmas
        </h1>
        <h2 className="font-['Playfair_Display'] italic text-white/90 text-2xl md:text-3xl tracking-wide mt-1 pl-1 flex items-center gap-2">
          <span className="text-red-400 animate-pulse">♥</span>
          致我最爱的文玥
          <span className="text-red-400 animate-pulse">♥</span>
        </h2>
      </div>

      {/* Status Indicators (Top Right) */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-3">
        <div className={`transition-all duration-700 ease-out border px-4 py-1.5 rounded-full backdrop-blur-md ${isHandDetected ? 'border-[#ffd700] bg-[#ffd700]/10' : 'border-white/10 bg-black/20'}`}>
          <span className={`font-['Cinzel'] text-xs tracking-widest ${isHandDetected ? 'text-[#ffd700]' : 'text-white/30'}`}>
            {isHandDetected ? "传感器已激活" : "等待手势指令"}
          </span>
        </div>

        <div className="text-right space-y-0.5 opacity-80">
          <p className="font-sans text-[10px] text-white/40 uppercase tracking-widest">
            当前状态
          </p>
          <p className="font-['Playfair_Display'] text-lg text-[#50c878] transition-all duration-500">
            {isPinching ? "回忆时刻" : (targetMorphState === 0 ? "聚合" : "绽放")}
          </p>
        </div>
      </div>

      {/* Footer Instructions (Smaller & Left Aligned) */}
      <div className="flex justify-between items-end text-white/30 font-sans text-[10px] tracking-wider">
        <div className="max-w-[200px]">
          <p className="uppercase opacity-50 mb-1">操作指南:</p>
          <ul className="list-disc pl-3 space-y-0.5">
            <li><span className="text-[#ffd700]/80">张开手掌:</span> 漫天飞舞</li>
            <li><span className="text-[#ffd700]/80">握紧拳头:</span> 聚合成树</li>
            <li><span className="text-[#ffd700]/80">捏合拇指食指:</span> 唤起照片</li>
            <li><span className="text-[#ffd700]/80">移动手势:</span> 旋转视角</li>
          </ul>
        </div>
        <div className="text-right opacity-40">
          <p>♥ 献给我最爱的文玥 ♥</p>
          <p>愿我们的爱如星辰永恒</p>
          <p className="mt-1">2024年圣诞</p>
        </div>
      </div>
    </div>
  );
};

export default Overlay;