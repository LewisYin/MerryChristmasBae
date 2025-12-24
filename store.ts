import { create } from 'zustand';

interface AppState {
  // 0 = Tree Shape, 1 = Scattered
  morphProgress: number; 
  targetMorphState: number;
  
  // Camera control influence (-1 to 1)
  handX: number;
  handY: number;
  
  isHandDetected: boolean;
  isPinching: boolean; // New state for grabbing photos
  permissionGranted: boolean;

  setMorphState: (val: number) => void;
  updateHandTracking: (x: number, y: number, isDetected: boolean, isOpen: boolean, isPinching: boolean) => void;
  setPermissionGranted: (val: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  morphProgress: 0,
  targetMorphState: 0,
  handX: 0,
  handY: 0,
  isHandDetected: false,
  isPinching: false,
  permissionGranted: false,

  setMorphState: (val) => set({ targetMorphState: val }),
  
  updateHandTracking: (x, y, isDetected, isOpen, isPinching) => set((state) => ({
    handX: x, 
    handY: y,
    isHandDetected: isDetected,
    isPinching: isPinching,
    // If pinching, we don't change the morph state (keep current background state)
    // Otherwise: Open = Scatter (1), Closed = Assemble (0)
    targetMorphState: isPinching ? state.targetMorphState : (isOpen ? 1 : 0)
  })),

  setPermissionGranted: (val) => set({ permissionGranted: val }),
}));