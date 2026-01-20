import * as THREE from 'three';

import { settings } from '../../../connect/settings.js'; 

import {scene, surface, water} from './three_main.mjs';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

let sampler;

import { floor, Fn, max, min, positionLocal, normalLocal, sub, time, vec3, vec4 } from 'three/tsl';

import { uniform, sin } from 'three/tsl';

export let instancedModels = [];
export async function InitSurface () {
    console.log("GOTSA SURFACE");
    await surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
}

export async function InstanceOnSurface (model, count, scaleFactor, yMod, shader) {

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count);

    if (sampler) {

        count = count * 3;

        // let scaleFactor = data.yscale;

        console.log("gotsa SURFACE for " + model.name + " count " + count);

        let sampleGeometry, sampleMaterial;
            let sampleGeos = [];
            let sampleMats = [];
            let instancedMeshes = [];
            // let childCount = 0;
            model.traverse(node => {
            if (node.isMesh && node.material) {
                // childCount++;

                console.log("node material name " + node.material.name);
                sampleGeometry = node.geometry;
                sampleGeos.push(sampleGeometry);
                sampleMaterial = node.material;
                sampleMats.push(sampleMaterial);
                
            }
        });

        
        for (let i = 0; i < sampleMats.length; i++) {

            if (sampleMats[i].name.includes("green") || shader == "wind" || shader == "grass") {
                sampleMats[i].positionNode = Fn(() => { // :)
                const pos = positionLocal;      // Original vertex position
                const norm = normalLocal;        // Vertex normal direction
                
                // Calculate displacement amount (changes over time and position)
                const displacement = sin(time.mul(.75).add(pos.z.mul(0.25))).mul(0.05);
                
                // Move vertex along its normal
                return pos.add(norm.mul(displacement));
                })();
            }
        }

        console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMeshes.push(instancedMesh);
        }
                        
        const waterLevel = parseFloat(settings.sceneWater.level);
        const dummy = new THREE.Object3D();
        let position = new THREE.Vector3();
        let theCount = 0;
        for (let i = 0; i < count; i++) {            
            await sampler.sample(position);
            
            if (position.y < waterLevel)  {
                // await sampler.sample(position);
                position.y = -100;
                // continue;
            }
            // position.y = position.y + yMod;
                // console.log("mesh position " + position.y);
                const ypos = parseFloat(position.y) + parseFloat(yMod);
                // console.log("mesh y position " + position.y + " mod " + ypos);
            dummy.position.set(position.x, ypos, position.z);
            // console.log("instance positon " + JSON.stringify(position));
            // Optional: Add some random rotation
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const scale = Math.random() * scaleFactor * .75;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < instancedMeshes.length; m++) {
                
                // console.log("instance count " + i);
                if (position.y > waterLevel)  {
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                    instancedMeshes[m].instanceMatrix.needsUpdate = true;
                } else {
                    // dummy.scale.setScalar(0);
                    dummy.scale.set(0,0,0);
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                }
            }

        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            instancedMeshes[s].castShadow = true;
            instancedMeshes[s].receiveShadow = true;
					
            scene.add(instancedMeshes[s]);
        }
    
    } else {
        console.log("NO SURFACE");
    }
}