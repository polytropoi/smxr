// Important: Use `webgpu` version of Three.js
import * as THREE from 'three/webgpu';

// import * as tsltextures from './tsl-textures.js';
// Import your desired texture
import { polkaDots } from 'tsl-textures/polka-dot';




// Create material: Important: Use `Node` Material
const mat = new THREE.MeshStandardNodeMaterial({
    color: 0xCCCCCC,
    roughness: 0.5,
    metalness: 0.0,
});

// Apply texture to the material's `colorNode` property
mat.colorNode = polkaDots ( {
    count: 2,
    size: 0.6,
    blur: 0.22,
    color: new THREE.Color(0),
    background: new THREE.Color(16777215)
} );



export function getPolkadotMaterial() {
  return mat;
}


