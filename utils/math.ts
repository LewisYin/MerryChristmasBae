import * as THREE from 'three';

// Generate points on a cone surface (spiral pattern)
export const generateTreePosition = (
  index: number,
  total: number,
  height: number = 10,
  radiusBase: number = 4
): THREE.Vector3 => {
  const y = (index / total) * height - height / 2; // Bottom to top
  const radiusAtY = ((height / 2 - y) / height) * radiusBase; // Cone tapers up
  const angle = index * 0.5; // Spiral density
  
  const x = Math.cos(angle) * radiusAtY;
  const z = Math.sin(angle) * radiusAtY;
  
  return new THREE.Vector3(x, y, z);
};

// Generate random points inside a sphere
export const generateScatterPosition = (radius: number = 15): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Helper for polaroids to face outward from center
export const getLookAtRotation = (position: THREE.Vector3, target: THREE.Vector3 = new THREE.Vector3(0,0,0)): THREE.Quaternion => {
  const dummy = new THREE.Object3D();
  dummy.position.copy(position);
  dummy.lookAt(target);
  return dummy.quaternion;
};