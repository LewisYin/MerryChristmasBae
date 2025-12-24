import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const updateHandTracking = useStore(state => state.updateHandTracking);
  const setPermissionGranted = useStore(state => state.setPermissionGranted);
  
  const [loading, setLoading] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检测是否是移动设备
  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    // 桌面端自动初始化
    if (!mobile) {
      initMediaPipe();
    } else {
      setLoading(false);
    }
  }, []);

  const initMediaPipe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      // 尝试 GPU，失败则回退到 CPU
      try {
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
      } catch {
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
      }
      
      setLoading(false);
      await startWebcam();
    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      setError("AI初始化失败");
      setLoading(false);
    }
  };

  const startWebcam = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        setCameraStarted(true);
        setPermissionGranted(true);
        predictWebcam();
      };
    } catch (err) {
      console.error("Webcam access denied:", err);
      setError("摄像头访问被拒绝");
      setPermissionGranted(false);
    }
  };

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;
    
    const startTimeMs = performance.now();
    if (videoRef.current.videoWidth > 0) {
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        const wrist = landmarks[0];
        const centerX = wrist.x; 
        const centerY = wrist.y;

        const tips = [4, 8, 12, 16, 20]; 
        let totalDist = 0;
        tips.forEach(idx => {
          const tip = landmarks[idx];
          const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
          totalDist += dist;
        });
        const avgDist = totalDist / 5;
        const isOpen = avgDist > 0.25;

        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinchDist = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
        );
        const isPinching = pinchDist < 0.08;

        const normX = (1 - centerX) * 2 - 1; 
        const normY = -(centerY * 2 - 1); 

        updateHandTracking(normX, normY, true, isOpen, isPinching);
      } else {
        updateHandTracking(0, 0, false, false, false);
      }
    }
    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  // 移动端点击按钮启动
  const handleStartCamera = () => {
    initMediaPipe();
  };

  // 清理
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  // 移动端未启动时显示按钮
  if (isMobile && !cameraStarted && !loading) {
    return (
      <button
        onClick={handleStartCamera}
        className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border-2 border-[#d4af37] bg-black/80 text-[#d4af37] text-sm font-medium shadow-[0_0_15px_#d4af3755] active:bg-[#d4af37]/20"
      >
        {error || "📷 开启手势控制"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 border-[#d4af37] shadow-[0_0_15px_#d4af3755] bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-[#d4af37] text-xs">
          {isMobile ? "加载中..." : "Init AI..."}
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs p-2 text-center">
          {error}
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
    </div>
  );
};

export default GestureController;
