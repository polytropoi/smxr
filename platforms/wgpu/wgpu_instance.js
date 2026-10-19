import * as THREE from 'three';



import { billboarding, floor, float, Fn, max, min, positionLocal, range, normalLocal, sub, time, vec3, vec4, uniform, sin, add, buffer, 
    instanceIndex, cameraPosition, mat3, positionGeometry, instancedBufferAttribute, instancedArray, texture, attribute } from 'three/tsl';

import { settings } from '../../../connect/settings.js'; 

import { scene } from './wgpu_main.mjs';

import { sceneTextController, convertGltfToNodeMaterial } from './wgpu_media.js';

// import { surface } from './three_locations.js';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { locationData, activeObjex, navmesh } from './wgpu_locations.js';

import { CreateNPCAgent, pathfinding } from './wgpu_nav.js';

import { GetInstancedRigidbody } from './wgpu_physics.js'
// import { uniform, sin, range } from 'three/tsl';

let sampler;
export let surface;
let surfaceType = "model";

// export let physicsInstances;
export let physicsInstancedBodies = [];
export let physicsInstancedMeshes = [];

export let instancedAgentMeshes = {};

// export function InitPhysicsInstances (model, count, pattern, physicsMode, locationData) {
//     return new InstanceWithPattern(model, count, pattern, physicsMode, locationData);
// }

export let instancedModels = [];
export let instanceTags = {};
let taggedInstances = {};


export async function InitSurface () {
   

    await surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
     console.log("GOTSA SURFACE");
}

export function SetSurface(mesh) { //if assigned to a mesh in locations
    surface = mesh;
        
}
export function SetGeneratedSurface(mesh, type) { //if assigned to a mesh in locations
        // const theSurface = mesh.geometry.clone();
        
    //     theSurface.material = theSurface.material.clone(); 

    // // (Optional) Disconnect the geometry if you plan to modify vertices
    //     scene.add(theSurface);
    //     theSurface.geometry = theSurface.geometry.clone(); 
    //     theSurface.position.set(0,0,0);
    


    // surface = theSurface;
        surface = mesh;
        // scene.add(surface);
        // surfaceType = "primitive";


    surfaceType = type;
        // await new Promise(r => setTimeout(r, 5000));
    InitSurface();
    InitInstanceModels();

}
// export function createDefaultSurface() {
//     const planeGeometry = new THREE.PlaneGeometry(50, 50, 10, 10); // 50 x 50
//     const planeMaterial = new THREE.MeshStandardMaterial({ color: 'green' });
//     const surface = new THREE.Mesh(planeGeometry, planeMaterial);
//     scene.add(surface);
//     surface.visible = false;
//     surface.position.set(0,0,0);
//     surface.rotation.x = Math.PI / 2;
//     surface.updateMatrixWorld();
//     SetSurface(surface);
// }

export function createDefaultSurface(locData) {
    console.log("tryna create default surface " + locData.xscale + " " + locData.yscale + " " +locData.zscale);
    const planeGeometry = new THREE.PlaneGeometry(locData.xscale, locData.zscale, 10, 10); //
    const planeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'red' });
    const surfaceObject = new THREE.Mesh(planeGeometry, planeMaterial);
    
    scene.add(surfaceObject);
    surfaceObject.position.set(locData.x,locData.y,locData.z);
    surfaceObject.rotateX(-Math.PI / 2);

    if (locData.locationTags && locData.locationTags.includes("hide")) {
        surfaceObject.visible = false;
    }
    surface = surfaceObject;
    surfaceType = "primitive";
    
}
    
export async function InitInstanceModels () {

    // await new Promise(r => setTimeout(r, 100));
    for (let i = 0; i < instancedModels.length; i++) {
        let count = 33;
        let scale = 1;
        let yMod = 0;
        let shader = "";
        if (instancedModels[i].locationData.eventData.includes("~")) {
            let countSplit = instancedModels[i].locationData.eventData.split("~");
            count = countSplit[1];
        } else {
            if (instancedModels[i].locationData.eventData.includes("grass")) {
                count = 100;
            }
            if (instancedModels[i].locationData.eventData.includes("rocks")) {
                count = 100;
            }
        }	

        if (instancedModels[i].locationData.yscale) {
            scale = instancedModels[i].locationData.yscale;
        } else {
            scale = 1;
        }

        if (instancedModels[i].locationData.y != 0) {
            yMod = instancedModels[i].locationData.y;
        }
        
        if (instancedModels[i].locationData.locationTags.includes("wind")) {
            shader = "wind";
        } 
        // if (instancedModels[i].locationData.mediaID && instancedModels[i].locationData.mediaID != "" && instancedModels[i].locationData.mediaID != "none") {
        // 	InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader, instancedModels[i].locationData);
        // } else {
        if (!instancedModels[i].locationData.locationTags.includes("dynamic")) { //hrm, need to assign positions in InstanceWithPattern below...
            console.log("InitInstanceModels scale " + scale);
            InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader, instancedModels[i].locationData);
                
        }
        instancedModels[i].model.visible = false;
        instancedModels[i].model.position.set(0,-100,0);
        // await new Promise(r => setTimeout(r, 1000));
        
    } 
}
    
export async function TagsToInstances (locID, instanceID) {
    if (taggedInstances) { //populated when instances are created (e.g. InstanceOnSurface() below), if there's an attached mediaID
        const instanceData = taggedInstances[locID];

        if (instanceData) {
            let textData;
            let jsonData;
            if (instanceData && !instanceData.isTagged) {

                if (sceneTextController) {
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
                }
            } else {
                // console.log(JSON.stringify(instanceData.iTags[instanceID]));
                //  return instanceData.iTags[instanceID][0];
                const tag = Object.values(instanceData.iTags[instanceID])[0];
                console.log(JSON.stringify(tag));
                return tag;
            }
        }
    }
}

export async function InstanceOnSurface (model, count, scaleFactor, yMod, shader, locData, instanceTags) { //hrm, should be a class?

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count+ " mediaID " + locData.mediaID + " yMod " + yMod);

    let instanceTagData;
    let usedPositions = [];

    if (sampler) {

        // count = count * 2; //bc weighted in aframe, etc
        if (!count) {
            count = 10;
        }
        scaleFactor = locData.yscale;

        console.log("gotsa SURFACE for " + model.name + " count " + count);

        let sampleGeometry, sampleMaterial;
            let sampleGeos = [];
            let sampleMats = [];
            let instancedMeshes = [];
            let instancedMesh;
            // let childCount = 0;
            
            model.traverse(node => {
            if (node.isMesh && node.material) {
                // childCount++;

                console.log("node material name " + node.material.name);
                sampleGeometry = node.geometry;

                sampleGeos.push(sampleGeometry);
                sampleMaterial = node.material;
                sampleMaterial.envMap = scene.environment;
                // sampleMaterial.envMapIntensity = 2;
                // sampleMaterial.environmentNode = scene.environmentNode;

                // sampleMaterial = convertGltfToNodeMaterial(node.material);
                // sampleMaterial.transparent = true;
                // if (locData.locationTags && locData.locationTags.includes("random color")) {
                //     // Create a staggered rising offset based on instance index and time
                //     sampleMaterial.colorNode = range(new THREE.Color(0x000000), new THREE.Color(0xffffff)).add(.1).mul(.5);
                // // sampleMaterial.colorNode = color(0xffffff);
                //     sampleMaterial.roughnessNode = float(.1);
                //     sampleMaterial.metalnessNode = float(.5);
                    
                //     sampleMaterial.opacity = .75;
                //     // sampleMaterial.depthWrite = false;
                // }
                // sampleMaterial.depthWrite = false;
                // sampleMaterial.envMap = scene.environment;
                // sampleMaterial.envNode = scene.environmentNode;

                if (locData.locationTags && locData.locationTags.includes("rise")) {

                    const riseOffset = sin(add(time.mul(.1), instanceIndex.toFloat().mul(0.2))).mul(5.0);

                    // Apply to the material's position node (rising along the Y axis)
                    sampleMaterial.positionNode = add(positionLocal, vec3(0.0, riseOffset, 0.0));
                }
                sampleMats.push(sampleMaterial);
                
            }
        });

        // model.visible = false;
        
        for (let i = 0; i < sampleMats.length; i++) {

            console.log("SampleGEo " + i + " name " + sampleGeos[i].name);
            if (sampleGeos[i].name.includes("leaves") || sampleMats[i].name.includes("leaves") ||  sampleMats[i].name.includes("green") || shader == "wind" || shader == "grass") { 
            
                const windStrength = 0.01;
                const speed = 2.0;

                // Calculate displacement: sway based on height (y) and time
                const sway = sin(time.mul(speed).add(positionLocal.y)).mul(positionLocal.y.mul(windStrength));

                // Apply displacement to X-axis
                const windPosition = vec3(
                positionLocal.x.add(sway),
                positionLocal.y,
                positionLocal.z
                );

                // const material = new MeshStandardNodeMaterial();
                sampleMats[i].positionNode = windPosition; 
            }
        }

        console.log("child count for " + model.name + " : " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMesh.castShadow = true;
            instancedMeshes.push(instancedMesh);
            
        }
         
    
        const waterLevel = (settings && settings.sceneWater && settings.sceneWater.level) ? parseFloat(settings.sceneWater.level) : 0;
        const dummy = new THREE.Object3D();
        const minDistance = 5;
        let position = new THREE.Vector3();
        let theCount = 0;
        let scale = 1;
        const center = new THREE.Vector3(0,0,0);
        // await new Promise(r => setTimeout(r, 1000));
        for (let i = 0; i < count; i++) {        
            // if (i == 16) {
            //     continue;
            // }     
             
            sampler.sample(position);
            //   sampler.sample(position);
            // await new Promise(r => setTimeout(r, 1000));
            const distance = position.distanceTo(center); 
            const skyFactor = settings.sceneSkyRadius * .05;
            console.log("mesh position " + JSON.stringify(position) + " distance " + distance + " skyFactor " + skyFactor + " surfaceTYpe " + surfaceType +  " yMod " + locData.y);
           



            if (surfaceType == "primitive") {
                // locData.y = -1;

                // dummy.position.set(position.x, position.y, position.z);
                dummy.position.set(position.x, position.z + locData.y, position.y); //fsr the primitive plane returns x,y values with z as zero //bc its 2d! need to test for other geos
            } else {
                if (position.y < waterLevel)  {
                    position.y = -100;       
                }
                const ypos = (parseFloat(position.y) + parseFloat(locData.y));
                dummy.position.set(position.x, ypos, position.z);
            }
        
            if (locData.locationTags && locData.locationTags.includes("no scale")) {
                // const scale = Math.random() * scaleFactor * .75;
                dummy.scale.set(1, 1, 1);

            } else {
                const iScale = ((Math.random()) * scaleFactor);
                // const scale = 2;
                // const iScale = scaleFactor;
                dummy.scale.set(iScale, iScale, iScale);
                console.log("scaleFactor " + scaleFactor + " dummys cale is " +iScale);
            }
            dummy.rotation.y = Math.random() * Math.PI * 2;
          
            if (distance < skyFactor) {
                console.log("too close to center distance " + distance +  " vs " + skyFactor);
                dummy.position.set(position.x, -1000, position.z);
            }

            if (locData.markerType == "character") {
                // const placeholder = new THREE.Object3D();
                const sceneObjectID = locData.timestamp + "_" + i;
                const animations = [];
                // const z = 1;
                await navmesh != null;
                await pathfinding != null;
                await CreateNPCAgent(true, null, animations, i.toString(), locData, locData.objectData, sceneObjectID, scale);
               
                // kinematicAgentMeshes.push(physicsColliderMesh); //load later after settledown
            }
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < instancedMeshes.length; m++) {
                
                if (surfaceType != "primitive") {
                    // console.log("instance count " + i);
                    if (position.y > waterLevel)  {
                        instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                        instancedMeshes[m].instanceMatrix.needsUpdate = true;
                    } else {
                        // dummy.scale.setScalar(0);
                        dummy.scale.set(0,0,0);
                        instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                         instancedMeshes[m].instanceMatrix.needsUpdate = true;
                    }
                } else {
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                     instancedMeshes[m].instanceMatrix.needsUpdate = true;
                }
            }

        }
       
        for (let s = 0; s < instancedMeshes.length; s++) {
          
            
            if (locData.locationTags && locData.locationTags.includes("active")) {
                activeObjex.push(instancedMeshes[s]);
                instancedMeshes[s].userData.locationData = locData;
                instancedMeshes[s].userData.name = locData.name;

            }
            if (locData.locationTags && locData.locationTags.includes("random color")) {
                
                for (let i = 0; i < count; i++) {
                    
                 let randomColor = new THREE.Color();
                
                // randomColor.setHex( Math.random() * 0xffffff );
                // const r = Math.random();
                // const g = Math.random();
                // const b = Math.random();

                // randomColor.setRGB(r, g, b);
                //  const hue = i / count;
                // randomColor.setHSL(hue, 1.0, 0.5);
                // randomColor.setHex(Math.random() * 0xffffff);
                // instancedMeshes[s].setColorAt( i, randomColor.setHex( Math.random() * 0xffffff ));
                // instancedMeshes[s].setColorAt( i, randomColor);
                
                randomColor.setHex( Math.random() * 0xffffff );
                instancedMeshes[s].setColorAt( i, randomColor);
                instancedMeshes[s].instanceColor.needsUpdate = true;
                instancedMeshes[s].material.needsUpdate = true;
                instancedMeshes[s].material.envMap = scene.environment;
                instancedMeshes[s].material.envNode = scene.environmentNode;
                
                }
                // instancedMeshes[s].instanceColor.needsUpdate = true;
            }

            if (locData.mediaID) {
                const tm = {};
                tm.mediaID = locData.mediaID;
                tm.timestamp = locData.timestamp;
                tm.count = count;
                taggedInstances[locData.timestamp] = tm;
             
            }
            if (locData.markerType == "character") {
                instancedMeshes[s].instanceMatrix.needsUpdate = true;
                instancedAgentMeshes[locData.timestamp] = instancedMeshes[s];
            }
            // console.log("instancedAgentMeshes " + JSON.stringify(instancedAgentMeshes));
            instancedMeshes[s].frustumCulled = false;
            instancedMeshes[s].instanceMatrix.needsUpdate = true;
            // activeObjex.push(instancedMeshes[s]);
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
                sampleMaterial = node.material;
                sampleMaterial.roughness = .1;
                 sampleMaterial.metalness = .6;
                sampleMaterial.envMap = scene.environment;
                  sampleMaterial.envMapIntensity = 2;
                // node.material.environmentNode = sc
                // ene.environmentNode;
                // console.log("node material name " + node.material.name);
                

                sampleGeometry = node.geometry;

                sampleGeos.push(sampleGeometry);
                // sampleMaterial = convertGltfToNodeMaterial(node.material);
                sampleMaterial.envNode = scene.environmentNode;
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
            const y = randRange(10, 30);
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
                const rb = GetInstancedRigidbody(t, scale, i);
                physicsInstancedBodies.push(rb);
            }

        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            instancedMeshes[s].castShadow = true;
            instancedMeshes[s].receiveShadow = true;
            
            if (locationData && locationData.locationTags && locationData.locationTags.includes("active")) {
                activeObjex.push(instancedMeshes[s]);
                instancedMeshes[s].userData.locationData = locationData;
            }
            // if (locationData && locationData.locationTags && locationData.locationTags.includes("random color")) {
                let randomColor = new THREE.Color();
                for (let i = 0; i < count; i++) {
                // this.color = this.highlightColor.setHex( Math.random() * 0xffffff );
                randomColor.setHex( Math.random() * 0xffffff );
                instancedMeshes[s].setColorAt( i, randomColor);
                instancedMeshes[s].instanceColor.needsUpdate = true;
                }
                // this.iMesh.setColorAt( this.instanceId, this.highlightColor.setHex( Math.random() * 0xffffff ) );
                // this.iMesh.instanceColor.needsUpdate = true;
            // }
            instancedMeshes[s].frustumCulled = false;
            scene.add(instancedMeshes[s]);
            // physicsInstances = this.instancedMeshes[s];
        }
}

// export class InstanceWithPattern_ { //um...nope
//     constructor(model, count, pattern, physicsMode, locationData) {

//         (async()=> { 
//         let sampleGeometry, sampleMaterial;
//             let sampleGeos = [];
//             let sampleMats = [];
//             this.instancedMeshes = [];
//             // let childCount = 0;
//             model.traverse(node => {
//             if (node.isMesh && node.material) {
//                 // childCount++;

//                 console.log("node material name " + node.material.name);
//                 sampleGeometry = node.geometry;

//                 sampleGeos.push(sampleGeometry);
//                 sampleMaterial = node.material;
//                 sampleMats.push(sampleMaterial);
                
//                 }
//             });
//             for (let i = 0; i < sampleMats.length; i++) {
//             }

         
//         this.instancedBodies = [];
//         // console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
//         for (let c = 0; c < sampleGeos.length; c++) {
//             const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
//             this.instancedMeshes.push(instancedMesh);
//         }
//         const dummy = new THREE.Object3D();
//         let position = new THREE.Vector3();
//         let theCount = 0;
//         for (let i = 0; i < count; i++) {            
//             const scale = 1.2;

//             const x = randRange(-10, 10);
//             const y = randRange(-10, 10);
//             const z = randRange(-10, 10);
//             // const rangedPosition = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));
//             // console.log("ranged position " + JSON.stringify(rangedPosition));
//             dummy.position.set(x, y, z);
          
//             dummy.updateMatrix(); // Update matrix based on position/rotation
//             for (let m = 0; m < this.instancedMeshes.length; m++) {
                
//                 this.instancedMeshes[m].setMatrixAt(i, dummy.matrix);
//             }
//             const t = new THREE.Vector3(x,y,z);
//             // // this.instancedBodies = 
//             if (physicsMode == "dynamic") {
//                 const rb = await GetInstancedRigidbody(t, scale);
//                 this.instancedBodies.push(rb);
//             }

//         }
//         for (let s = 0; s < this.instancedMeshes.length; s++) {
//             this.instancedMeshes[s].castShadow = true;
//             this.instancedMeshes[s].receiveShadow = true;
            
//             if (locationData && locationData.locationTags && locationData.locationTags.includes("active")) {
//                 activeObjex.push(this.instancedMeshes[s]);
//                 this.instancedMeshes[s].userData.locationData = locationData;
//             }
//             // if (locationData && locationData.locationTags && locationData.locationTags.includes("random color")) {
//                 let randomColor = new THREE.Color();
//                 for (let i = 0; i < count; i++) {
//                 // this.color = this.highlightColor.setHex( Math.random() * 0xffffff );
//                 this.instancedMeshes[s].setColorAt( i, randomColor.setHex( Math.random() * 0xffffff ));
//                 this.instancedMeshes[s].instanceColor.needsUpdate = true;
//                 }
//                 // this.iMesh.setColorAt( this.instanceId, this.highlightColor.setHex( Math.random() * 0xffffff ) );
//                 // this.iMesh.instanceColor.needsUpdate = true;
//             // }
            
//             scene.add(this.instancedMeshes[s]);
//             // physicsInstances = this.instancedMeshes[s];
//         }
      
//         return this;
//     })();
//     this.dummy = new THREE.Object3D();

//     this.position = new THREE.Vector3();
//     this.quaternion = new THREE.Quaternion();
//     this.matrix = new THREE.Matrix4();
//     }
//     async updatePhysics() {
//         // console.log("tryna update physics...");
        
//         // const matrix = new THREE.Matrix4();
//         for (let i = 0; i < this.instancedBodies.length; i++) {
//                         await new Promise(r => setTimeout(r, 0));
//             const body = this.instancedBodies[i];
//             if (body) {
//                 const pos = body.translation();
//                 const rot = body.rotation();
                
//                 // Update dummy object with physics data
//                 if (pos.y < -20) {
//                     body.setTranslation(pos.x, 20, pos.z);
//                 } else {
//                 // this.dummy.position.set(pos.x, pos.y, pos.z);
//                 // this.dummy.quaternion.set(rot.x, rot.y, rot.z, rot.w);
//                 // this.dummy.updateMatrix();
//                 this.position.set(pos.x, pos.y, pos.z);
//                 this.quaternion.set(rot.x, rot.y, rot.z, rot.w);
//                 // this.dummy.updateMatrix();
//                 this.matrix.compose(this.position, this.quaternion, new THREE.Vector3(1, 1, 1));
//                 // this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
//                 this.instancedMeshes[0].setMatrixAt(i, this.matrix);
//                 await new Promise(r => setTimeout(r, 0));
//             }
//             // Apply to instanced mesh
//             //  matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
//             // // this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
//             // this.instancedMeshes[0].setMatrixAt(i, matrix);
//              await new Promise(r => setTimeout(r, 0));
//             }

//                 // }
//         }
    
//         this.instancedMeshes[0].instanceMatrix.needsUpdate = true; // Essential!
//     }
// }
