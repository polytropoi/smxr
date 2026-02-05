
import * as THREE from 'three';

import { scene } from './three_main.mjs';

import { settings } from '../../../connect/settings.js';

export let lightMods = [];

export function createLight(locationData) {
    console.log("tryna create light ");
    const light = new THREE.PointLight( 0xff0000, 5, 200 );
    light.position.set(locationData.x, locationData.y, locationData.z);
    scene.add(light);
    lightMods.push(light);
}