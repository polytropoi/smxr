
import * as THREE from 'three';

import { scene } from './three_main.mjs';

import { settings } from '../../../connect/settings.js';

export let lightMods = [];

export function createLight(locationData) {
    console.log("tryna create light ");
    const light = new THREE.PointLight( 0xff0000, 5, 50 );
    light.position.set(locationData.x, locationData.y, locationData.z);
    scene.add(light);
    lightMods.push(light);
}

export function modLights (time) {
    for (let i = 0; i < lightMods.length; i++) {
        // lightMods[i].intensity = Math.sin(time * .01) * (200 * Math.random());
        if (Math.random() > .75) {
        lightMods[i].intensity = Math.random() * 200;
        }
        // lightMods[i].intensity = Math.sin(time * 2);
    }
}