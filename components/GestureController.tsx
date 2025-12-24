import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const updateHandTracking = useStore(state => state.updateHandTracking);
  const setPermissionGranted = useStore(state => state.setPermissionGranted);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        // 尝试 GPU，失败则回退到 CPU
        try {
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
          });
        } catch {
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numHands: 1
          });
        }
        
        setLoading(false);
        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setPermissionGranted(true);
      } catch (err) {
        console.error("Webcam access denied:", err);
        // 即使摄像头失败，也让树正常显示
        setPermissionGranted(false);
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;
      
      const startTimeMs = performance.now();
      if (videoRef.current.videoWidth > 0) {
        const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // 1. Calculate centroid (Palm center approx)
          const wrist = landmarks[0];
          const centerX = wrist.x; 
          const centerY = wrist.y;

          // 2. Gesture Logic: Open vs Closed
          const tips = [4, 8, 12, 16, 20]; 
          let totalDist = 0;
          tips.forEach(idx => {
            const tip = landmarks[idx];
            const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
            totalDist += dist;
          });
          const avgDist = totalDist / 5;
          const isOpen = avgDist > 0.25;

          // 3. Pinch Logic: Thumb Tip (4) vs Index Tip (8)
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
          );
          
          // Revert to 0.08 - a balanced threshold
          const isPinching = pinchDist < 0.08;

          // Map x/y (0-1) to (-1 to 1) for camera control
          const normX = (1 - centerX) * 2 - 1; 
          const normY = -(centerY * 2 - 1); 

          updateHandTracking(normX, normY, true, isOpen, isPinching);
        } else {
          updateHandTracking(0, 0, false, false, false);
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (handLandmarker) handLandmarker.close();
    };
  }, [updateHandTracking, setPermissionGranted]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 border-[#d4af37] shadow-[0_0_15px_#d4af3755] bg-black">
      {loading && <div className="absolute inset-0 flex items-center justify-center text-[#d4af37] text-xs">Init AI...</div>}
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