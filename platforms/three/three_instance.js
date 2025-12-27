import * as THREE from 'three';

import {scene, surface} from './three_main.mjs';

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
                        
        const dummy = new THREE.Object3D();
        let position = new THREE.Vector3();
   
        for (let i = 0; i < count; i++) {
            
                await sampler.sample(position);

                dummy.position.set(position.x, position.y, position.z);
                // console.log("instance positon " + JSON.stringify(position));
                // Optional: Add some random rotation
                dummy.rotation.y = Math.random() * Math.PI * 2;
                const scale = Math.random() * scaleFactor;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix(); // Update matrix based on position/rotation
                for (let m = 0; m < instancedMeshes.length; m++) {
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                    // console.log("instance count " + i);
                    instancedMeshes[m].instanceMatrix.needsUpdate = true;
                
                }
            
        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            scene.add(instancedMeshes[s]);
        }
        
            

               
        // }

    // const instanceMesh = new THREE.InstancedMesh(model.geometry, model.material, count);
    // const dummy = new THREE.Object3D();
    // for (let i = 0; i < count; i++) {
    //     sampler.sample(dummy.position); // Get a point
    //     // Optional: Add some random rotation
    //     dummy.rotation.y = Math.random() * Math.PI * 2;
    //     dummy.updateMatrix(); // Update matrix based on position/rotation
    //     instanceMesh.setMatrixAt(i, dummy.matrix);
    // }
    // instanceMesh.instanceMatrix.needsUpdate = true; // Tell Three.js to update the buffer
    // // const count = 1000; // Number of trees
    // const instancedMesh = new THREE.InstancedMesh(model.geometry, model.material, count);
    // const matrix = new THREE.Matrix4();
    // const dummyQuaternion = new THREE.Quaternion();

    // sampler.setWeightAttribute('position'); // Or other attributes

    // for (let i = 0; i < count; i++) {
    //     sampler.sample((position, normal) => {
    //         const index = Math.floor(Math.random() * count); // Get a random index for placing

    //         matrix.setPosition(position);
    //         // Align to surface normal
    //         dummyQuaternion.setFromNormalAndAxis(normal, new THREE.Vector3(0, 1, 0)); // Align to world Y up
    //         matrix.setRotationFromQuaternion(dummyQuaternion);

    //         instancedMesh.setMatrixAt(index, matrix);
    //     });
    // }


    // Add to scene
    // scene.add(instancedMesh);
    
    } else {
        console.log("NO SURFACE");
    }
}