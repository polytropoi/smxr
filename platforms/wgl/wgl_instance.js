import * as THREE from 'three';


import { settings } from '../../../connect/settings.js'; 

import { scene } from './wgl_main.mjs';

// import { surface } from './wgl_locations.js';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { locationData, activeObjex } from './wgl_locations.js';

import { GetInstancedRigidbody } from './wgl_physics.js'


import { sceneTextController } from './wgl_media.js';


let sampler;
export let surface;

// export let physicsInstances;
export let physicsInstancedBodies = [];
export let physicsInstancedMeshes = [];

// export function InitPhysicsInstances (model, count, pattern, physicsMode, locationData) {
//     return new InstanceWithPattern(model, count, pattern, physicsMode, locationData);
// }

export let instancedModels = [];
export let instanceTags = {};
let taggedInstances = {};

export async function InitSurface () {
    console.log("GOTSA SURFACE");
    await surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
}

export function SetSurface(mesh) { //if assigned to a mesh in locations
    surface = mesh;
}
export function createDefaultSurface(locData) {
    console.log("tryna create default surface " + locData.xscale + " " + locData.yscale + " " +locData.zscale);
        const planeGeometry = new THREE.PlaneGeometry(locData.xscale, locData.zscale, 10, 10); 
        const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'green' });
        surface = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(surface);
        surface.rotation.x = -Math.PI / 2;
         if (locData.locationTags && locData.locationTags.includes("hide")) {
                surface.visible = false;
            }
        // surface.visible = false;
        // SetSurface(surface);
}
    

export async function TagsToInstances (locID, instanceID) {
    if (taggedInstances) { //populated when instances are created (e.g. InstanceOnSurface() below), if there's an attached mediaID
        const instanceData = taggedInstances[locID];

        if (instanceData) {
            let textData;
            let jsonData;
            if (instanceData && !instanceData.isTagged) {
                instanceData.iTags = [];

                textData = await sceneTextController.returnAllTextDataFromMediaID(instanceData.mediaID);
                if (textData) {
                    let textindex = 0;
                        jsonData = JSON.parse(textData.textstring);
                    for (let i = 0; i < instanceData.count; i++) {
                        let iTag = {};
                        
                        
                        if (textindex < jsonData.length) {
                            textindex++;
                        } else {
                        textindex = 0;                   
                        }
                        iTag[i] = jsonData[textindex];

                        // console.log(JSON.stringify(iTag));
                        instanceData.iTags.push(iTag);
                        // if (textData.textstring && textData.textstring.length) {
                        //     for (let i = 0; i < textData.textstring.length; i++) {

                        //     }
                        // }
                        instanceData.isTagged = true;
                    }
                    // console.log(JSON.stringify(tag));
                    const tag = Object.values(instanceData.iTags[instanceID])[0];
                    console.log(JSON.stringify(tag));
                    return tag;
                }
            } else {
                // console.log(JSON.stringify(instanceData.iTags[instanceID]));
                //  return instanceData.iTags[instanceID][0];
                const tag = Object.values(instanceData.iTags[instanceID])[0];
                // console.log(JSON.stringify(tag));
                return tag;
            }
        }
    }
}


export async function InstanceOnSurface (model, count, scaleFactor, yMod, shader, locData) {

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count + " mediaID " + locData.mediaID);

    if (sampler) {

        count = count * 2;

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

            console.log("SampleGEo " + i + " name " + sampleGeos[i].name);
            // TODO mod the wgl shader for wind and stuff...
            
            // if (sampleGeos[i].name.includes("leaves") || sampleMats[i].name.includes("leaves") ||  sampleMats[i].name.includes("green") || shader == "wind" || shader == "grass") { //hrm, how to only wave the leaves
             
            //     const windStrength = 0.01;
            //     const speed = 2.0;

            //     // Calculate displacement: sway based on height (y) and time
            //     const sway = sin(time.mul(speed).add(positionLocal.y)).mul(positionLocal.y.mul(windStrength));

            //     // Apply displacement to X-axis
            //     const windPosition = vec3(
            //     positionLocal.x.add(sway),
            //     positionLocal.y,
            //     positionLocal.z
            //     );

            //     // const material = new MeshStandardNodeMaterial();
            //     sampleMats[i].positionNode = windPosition; 
            // }
        }

        console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMesh.castShadow = true;
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
            
            if (locData.locationTags && locData.locationTags.includes("active")) {
                activeObjex.push(instancedMeshes[s]);
                instancedMeshes[s].userData.locationData = locData;
            }
            if (locData.locationTags && locData.locationTags.includes("random color")) {
                let randomColor = new THREE.Color();
                for (let i = 0; i < count; i++) {
                // this.color = this.highlightColor.setHex( Math.random() * 0xffffff );
                instancedMeshes[s].setColorAt( i, randomColor.setHex( Math.random() * 0xffffff ));
                instancedMeshes[s].instanceColor.needsUpdate = true;
                }
                // this.iMesh.setColorAt( this.instanceId, this.highlightColor.setHex( Math.random() * 0xffffff ) );
                // this.iMesh.instanceColor.needsUpdate = true;
            }
            if (locData.mediaID) {
                const tm = {};
                tm.mediaID = locData.mediaID;
                tm.timestamp = locData.timestamp;
                tm.count = count;
                taggedInstances[locData.timestamp] = tm;
                // AssignTagsToInstances(locData.mediaID, count, instancedMeshes[s]);
                // await sceneTextController.dataIsReady();
                // instanceTagData = await sceneTextController.returnAllTextDataFromMediaID(locData.mediaID);
                // console.log("instanceTagData is " + instanceTagData);
            }
            
            scene.add(instancedMeshes[s]);
        }
    
    } else {
        console.log("NO SURFACE");
    }
}

function randRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function InstanceWithPattern (model, count, pattern, physicsMode, locationData) {

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
            
            }

         
        // instancedBodies = [];
        // console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
           const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMeshes.push(instancedMesh);
            physicsInstancedMeshes = instancedMesh;
        }
        const dummy = new THREE.Object3D();
        let position = new THREE.Vector3();
        let theCount = 0;
        for (let i = 0; i < count; i++) {            
            const scale = 1.2;

            const x = randRange(-10, 10);
            const y = randRange(-10, 10);
            const z = randRange(-10, 10);
            // const rangedPosition = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));
            // console.log("ranged position " + JSON.stringify(rangedPosition));
            dummy.position.set(x, y, z);
          
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < instancedMeshes.length; m++) {
                
                instancedMeshes[m].setMatrixAt(i, dummy.matrix);
            }
            const t = new THREE.Vector3(x,y,z);
            // // this.instancedBodies = 
            if (physicsMode == "dynamic") {
                const rb = GetInstancedRigidbody(t, scale);
                physicsInstancedBodies.push(rb);
            }

        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            instancedMeshes[s].castShadow = true;
            instancedMeshes[s].receiveShadow = true;
            
            if (locationData && locationData.locationTags && locationData.locationTags.includes("active")) {
                activeObjex.push(this.instancedMeshes[s]);
                this.instancedMeshes[s].userData.locationData = locationData;
            }
            // if (locationData && locationData.locationTags && locationData.locationTags.includes("random color")) {
                let randomColor = new THREE.Color();
                for (let i = 0; i < count; i++) {
                // this.color = this.highlightColor.setHex( Math.random() * 0xffffff );
                instancedMeshes[s].setColorAt( i, randomColor.setHex( Math.random() * 0xffffff ));
                instancedMeshes[s].instanceColor.needsUpdate = true;
                }
                // this.iMesh.setColorAt( this.instanceId, this.highlightColor.setHex( Math.random() * 0xffffff ) );
                // this.iMesh.instanceColor.needsUpdate = true;
            // }
            
            scene.add(instancedMeshes[s]);
            // physicsInstances = this.instancedMeshes[s];
        }
}
export class InstanceWithPattern_ {
    constructor(model, count, pattern, physicsMode, locationData) {

        (async()=> { 
        let sampleGeometry, sampleMaterial;
            let sampleGeos = [];
            let sampleMats = [];
            this.instancedMeshes = [];
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
            }

         
        this.instancedBodies = [];
        // console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            this.instancedMeshes.push(instancedMesh);
        }
        const dummy = new THREE.Object3D();
        let position = new THREE.Vector3();
        let theCount = 0;
        for (let i = 0; i < count; i++) {            
            const scale = 1.2;

            const x = randRange(-10, 10);
            const y = randRange(-10, 10);
            const z = randRange(-10, 10);
            // const rangedPosition = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));
            // console.log("ranged position " + JSON.stringify(rangedPosition));
            dummy.position.set(x, y, z);
          
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < this.instancedMeshes.length; m++) {
                
                this.instancedMeshes[m].setMatrixAt(i, dummy.matrix);
            }
            const t = new THREE.Vector3(x,y,z);
            // // this.instancedBodies = 
            if (physicsMode == "dynamic") {
                const rb = await GetInstancedRigidbody(t, scale);
                this.instancedBodies.push(rb);
            }

        }
        for (let s = 0; s < this.instancedMeshes.length; s++) {
            this.instancedMeshes[s].castShadow = true;
            this.instancedMeshes[s].receiveShadow = true;
            
            if (locationData && locationData.locationTags && locationData.locationTags.includes("active")) {
                activeObjex.push(this.instancedMeshes[s]);
                this.instancedMeshes[s].userData.locationData = locationData;
            }
            // if (locationData && locationData.locationTags && locationData.locationTags.includes("random color")) {
                let randomColor = new THREE.Color();
                for (let i = 0; i < count; i++) {
                // this.color = this.highlightColor.setHex( Math.random() * 0xffffff );
                this.instancedMeshes[s].setColorAt( i, randomColor.setHex( Math.random() * 0xffffff ));
                this.instancedMeshes[s].instanceColor.needsUpdate = true;
                }
                // this.iMesh.setColorAt( this.instanceId, this.highlightColor.setHex( Math.random() * 0xffffff ) );
                // this.iMesh.instanceColor.needsUpdate = true;
            // }
            
            scene.add(this.instancedMeshes[s]);
            // physicsInstances = this.instancedMeshes[s];
        }
      
        return this;
    })();
    this.dummy = new THREE.Object3D();

    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.matrix = new THREE.Matrix4();
    }
    async updatePhysics() {
        // console.log("tryna update physics...");
        
        // const matrix = new THREE.Matrix4();
        for (let i = 0; i < this.instancedBodies.length; i++) {
                        await new Promise(r => setTimeout(r, 0));
            const body = this.instancedBodies[i];
            if (body) {
                const pos = body.translation();
                const rot = body.rotation();
                
                // Update dummy object with physics data
                if (pos.y < -20) {
                    body.setTranslation(pos.x, 20, pos.z);
                } else {
                // this.dummy.position.set(pos.x, pos.y, pos.z);
                // this.dummy.quaternion.set(rot.x, rot.y, rot.z, rot.w);
                // this.dummy.updateMatrix();
                this.position.set(pos.x, pos.y, pos.z);
                this.quaternion.set(rot.x, rot.y, rot.z, rot.w);
                // this.dummy.updateMatrix();
                this.matrix.compose(this.position, this.quaternion, new THREE.Vector3(1, 1, 1));
                // this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
                this.instancedMeshes[0].setMatrixAt(i, this.matrix);
                await new Promise(r => setTimeout(r, 0));
            }
            // Apply to instanced mesh
            //  matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
            // // this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
            // this.instancedMeshes[0].setMatrixAt(i, matrix);
             await new Promise(r => setTimeout(r, 0));
            }

                // }
        }
    
        this.instancedMeshes[0].instanceMatrix.needsUpdate = true; // Essential!
    }
}
