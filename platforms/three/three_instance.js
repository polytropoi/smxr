import * as THREE from 'three';



import { billboarding, floor, Fn, max, min, positionLocal, range, normalLocal, sub, time, vec3, vec4, uniform, sin, buffer, instanceIndex, cameraPosition, mat3, positionGeometry, instancedBufferAttribute } from 'three/tsl';

import { settings } from '../../../connect/settings.js'; 

import { scene } from './three_main.mjs';

// import { surface } from './three_locations.js';

import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { locationData, activeObjex } from './three_locations.js';


// import { uniform, sin, range } from 'three/tsl';

let sampler;
export let surface;


export let instancedModels = [];
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
        const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'green' });
        surface = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(surface);
}
    

export async function InstanceOnSurface (model, count, scaleFactor, yMod, shader, locData) {

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

            if (sampleMats[i].name.includes("green") || shader == "wind" || shader == "grass") { //hrm, how to only wave the leaves
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
            activeObjex.push(instancedMeshes[s]);
            instancedMeshes[s].userData.locationData = locData;
            scene.add(instancedMeshes[s]);
        }
    
    } else {
        console.log("NO SURFACE");
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