import * as THREE from 'three';

import { settings } from '../../../connect/settings.js'; 

import {scene, surface, water} from './three_main.mjs';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

let sampler;

export let instancedModels = [];
export async function InitSurface () {
    console.log("GOTSA SURFACE");
    await surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
}

export async function InstanceOnSurface (model, count, scaleFactor) {

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count);
    // Assuming 'terrainMesh' is your loaded terrain and 'treeGeometry'/'treeMaterial' are defined
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
                sampleGeometry = node.geometry;
                sampleGeos.push(sampleGeometry);
                sampleMaterial = node.material;
                sampleMats.push(sampleMaterial);
                
            }
        });

        console.log("child count for model " + sampleGeos.length);
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
            // 
            // if (parseFloat(position.y) < waterLevel)  {
            //     // await sampler.sample(position);
            //     position.y = -100;
            // }
            if (position.y < waterLevel)  {
                // await sampler.sample(position);
                position.y = -100;
            }
                console.log("mesh position " + position.y);
            dummy.position.set(position.x, position.y, position.z);
            // console.log("instance positon " + JSON.stringify(position));
            // Optional: Add some random rotation
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const scale = Math.random() * scaleFactor;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < instancedMeshes.length; m++) {
                
                // console.log("instance count " + i);
                if (position.y > waterLevel)  {
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                    instancedMeshes[m].instanceMatrix.needsUpdate = true;
                } else {
                    dummy.scale.setScalar(0);
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                }
            }

        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            scene.add(instancedMeshes[s]);
        }
    
    } else {
        console.log("NO SURFACE");
    }
}