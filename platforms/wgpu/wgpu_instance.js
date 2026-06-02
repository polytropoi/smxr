import * as THREE from 'three';



import { billboarding, floor, Fn, max, min, positionLocal, range, normalLocal, sub, time, vec3, vec4, uniform, sin, buffer, instanceIndex, cameraPosition, mat3, positionGeometry, instancedBufferAttribute } from 'three/tsl';

import { settings } from '../../../connect/settings.js'; 

import { scene } from './wgpu_main.mjs';

import { sceneTextController } from './wgpu_media.js';

// import { surface } from './three_locations.js';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { locationData, activeObjex } from './wgpu_locations.js';

import { GetInstancedRigidbody } from './wgpu_physics.js'
// import { uniform, sin, range } from 'three/tsl';

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
export async function InitSurface () {
    console.log("GOTSA SURFACE");
    await surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
}

export function SetSurface(mesh) { //if assigned to a mesh in locations
    surface = mesh;
}
export function createDefaultSurface() {
        const planeGeometry = new THREE.PlaneGeometry(50, 50, 10, 10); // 50 x 50
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 'green' });
        const surface = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(surface);
        surface.visible = false;
        surface.position.set(0,0,0);
        surface.rotation.x = Math.PI / 2;
        surface.updateMatrixWorld();
        SetSurface(surface);
}
    

export async function InstanceOnSurface (model, count, scaleFactor, yMod, shader, locData, instanceTags) {

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count+ " mediaID " + locData.mediaID);

    let instanceTagData;
    if (locData.mediaID) {
        await sceneTextController.dataIsReady();
        instanceTagData = await sceneTextController.returnAllTextDataFromMediaID(locData.mediaID);
        console.log("instanceTagData is " + instanceTagData);
    }

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
            if (sampleGeos[i].name.includes("leaves") || sampleMats[i].name.includes("leaves") ||  sampleMats[i].name.includes("green") || shader == "wind" || shader == "grass") { //hrm, how to only wave the leaves
                // sampleMats[i].positionNode = Fn(() => { // :)
                // const pos = positionLocal;      // Original vertex position
                // const norm = normalLocal;        // Vertex normal direction
                
                // // Calculate displacement amount (changes over time and position)
                // const displacement = sin(time.mul(.75).add(pos.x.mul(0.25))).mul(0.05);
                
                // // Move vertex along its normal
                // return pos.add(norm.mul(displacement));
                // })();
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

        console.log("child count for model " + sampleGeos.length + " ymod" + yMod);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMeshes.push(instancedMesh);
        }
         
        if (instanceTags) {
            let tag = "";
            if (tagLength > 0) {
                if (tagIndex == tagLength - 1) {
                tagIndex = 0;
                } else {
                tagIndex++;
                }
                console.log("JSON DATA " + JSON.stringify(this.jsonData[tagIndex]));
                // tag = this.jsonData[tagIndex].key;
                tag = Object.keys(this.jsonData[tagIndex])[0]; // key of the key: value is the tag
                
                let stringkey = this.count.toString();
                console.log(stringkey + " tryna set instanced mesh tag " + tag + " on instanceID" + this.count); 
                this.instanceTags[stringkey] = tag;
            }
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

// export function Starfield(count, size, scale, animation) {

//     const geometry = new THREE.PlaneGeometry(size, size);
//     const material = new THREE.MeshBasicNodeMaterial({color: 0xff0066});
//     const mesh = new THREE.InstancedMesh(geometry, material, count);
//     const positionRange = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));
//     material.positionNode = positionLocal.add(positionRange);
//     // material.vertexNode = billboarding();
//     scene.add(mesh);

//     // material.positionNode = positionLocal.add(positionRange).Fn(({object: mesh}) => {
//     //     // 
//     //     const objectCenter = getMatrix().element(3).xyz;
//     //     const toCamera = cameraPosition.sub(objectCenter).toVar();
//     //     // set toCamera.y = 0 to only allow rotation around the y-axis (i.e. make it "cylindrical")
//     //     toCamera.assign(vec3(toCamera.x, 0, toCamera.z).normalize());
//     //     const up = vec3(0, 1, 0).toVar();
//     //     const right = up.cross(toCamera).normalize();
//     //     up.assign(toCamera.cross(right).normalize());
//     //     const rotationMatrix = mat3(right, up, toCamera);
//     //     return rotationMatrix.mul(positionGeometry);

//     //     function getMatrix() {
//     //         if (mesh.isInstancedMesh) {
//     //             // Can I use tsl.instance() to make this code cleaner?
//     //             // I tried using tsl.instance().instanceMatrixNode but it's always null.
//     //             // Leaving this line here but commented out.
//     //             // tsl.instance(mesh.count, mesh.instanceMatrix).toStack();
//     //             const attribute = mesh.instanceMatrix;
//     //             const matrices = attribute.array;
//     //             if (mesh.count <= 1000) {
//     //                 const bufferNode = buffer(matrices, 'mat4', Math.max(mesh.count, 1));
//     //                 return bufferNode.element(instanceIndex);
//     //             } else {
//     //                 const buffer = new three.InstancedInterleavedBuffer(matrices, 16, 1);
//     //                 let bufferFn = instancedBufferAttribute;
//     //                 if (attribute.usage === three.DynamicDrawUsage) {
//     //                     bufferFn = instancedDynamicBufferAttribute;
//     //                 }
//     //                 // F.Signature -> bufferAttribute( array, type, stride, offset )
//     //                 const b0 = bufferFn(buffer, 'vec4', 16, 0);
//     //                 const b1 = bufferFn(buffer, 'vec4', 16, 4);
//     //                 const b2 = bufferFn(buffer, 'vec4', 16, 8);
//     //                 const b3 = bufferFn(buffer, 'vec4', 16, 12);
//     //                 return mat4(b0, b1, b2, b3);
//     //             }
//     //         }
//     //         return modelWorldMatrix;
//     //     }
//     // })();

//         // material.positionNode = positionLocal.add(positionRange);
    

// }

// export function Sprites (count, size, scale, animation) {
//     const positions = [];

//         for ( let i = 0; i < count; i ++ ) {

//             positions.push( scale * Math.random() - scale/2, scale * Math.random() - scale/2, scale * Math.random() - scale/2 );

//         }

//         const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );

//         // texture

//         const url = document.getElementById("cloud1").src;
//         const map = new THREE.TextureLoader().load( url );
//         map.colorSpace = THREE.SRGBColorSpace;

//         // material

//         const material = new THREE.SpriteNodeMaterial( { 
//             sizeAttenuation: true,  
//             map: map, 
//             transparent: true, 
//             alphaToCoverage: true, 
//             alphaMap: map, 
//             // alphaTest: 0.1, 
//             depthWrite: false, 
//             // depthTest: false
//             } );
//         // material.color.setHSL( Math.random(), Math.random(), Math.random(), THREE.SRGBColorSpace );

//         // material.color.setHex( settings.sceneColor1Alt, THREE.SRGBColorSpace );
//         const color = new THREE.Color(settings.sceneColor2Alt);
//         material.color = color;

// // 1. Create a uniform node for the color
// // const spriteColorUniform = uniform(new THREE.Color(0xff0000)); // Start with red

// // 2. Assign the uniform node to colorNode
// // material.colorNode = spriteColorUniform;
//         // material.colorNode = new THREE.Color(settings.sceneColor2);
//         material.positionNode = instancedBufferAttribute( positionAttribute );
//         material.rotationNode = time.add( instanceIndex ).sin().mul(.1);
//         //   material.vertexNode = billboarding();
//         material.scaleNode = uniform( size );
//         // sprites

//         const particles = new THREE.Sprite( material );
//         particles.count = count;

//         return particles;
//         scene.add( partic/les );

// }
