
import * as THREE from 'three';

import RAPIER from 'rapier';

// import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// import { scene, water, staticObjex, initModels } from './spark_main.mjs';

import { scene } from './spark_main.mjs';
import { agentParents, CreateAgent, randomNavmeshPoint } from './spark_nav.js';
// import {scene, world} from './three_main.mjs'


  
function getGeometry(size) {
  const randomGeo = geometries[Math.floor(Math.random() * geometries.length)];
  const geo = randomGeo.clone();
  geo.scale(size, size, size);
  return geo;
}	
export let world, gravity, eventQueue;
export let physicsIsReady = false;
export let worldIsReady = false;
// export let kinematicBodies = [];
export let dynamicBodies = [];
export let staticBodies = [];
export let kinematicBodies = [];

export const agentCount = 10;
const dynamicObjectCount = 20;


export async function initRapier () {
		await RAPIER.init();	
		// gravity = { x: 0.0, y: -9.81, z: 0.0 };
		// world = await new RAPIER.World(gravity);

    // // setTimeout( () => {
    rapierDebugRenderer = new RapierDebugRenderer(scene, world);
    // // }, 3000);

    // await new Promise(r => setTimeout(r, 1000));
    // await RAPIER.init();
    world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    // worldIsReady = true;

    // const cubeBodyDesc = new RAPIER.RigidBodyDesc()
    // .setTranslation(0, 0, 0); // Position in physics world (meters)
    // // .setLinDamping(0.1) // Optional: damping
    // // .setAngDamping(0.1);
    // const cubeBody = world.createRigidBody(cubeBodyDesc);

    // // 3. Create the Rapier Collider (Collision Shape)
    // // Note: cuboid(halfWidth, halfHeight, halfDepth)
    // const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(100, 0.5, 100) // Matches 1x1x1 mesh
    // .setTranslation(0, 0, 0)  
    // .setDensity(1)
    //   .setRestitution(0.5); // Bounciness
    // world.createCollider(cubeColliderDesc, cubeBody.handle);
    //   // initModels();
    //   // initDynamicObjex();
    //   WaitAndInit();

}
export function initDefaultStaticCollider () {
const cubeBodyDesc = new RAPIER.RigidBodyDesc()
    .setTranslation(0, 0, 0); // Position in physics world (meters)
    // .setLinDamping(0.1) // Optional: damping
    // .setAngDamping(0.1);
    const cubeBody = world.createRigidBody(cubeBodyDesc);

    // 3. Create the Rapier Collider (Collision Shape)
    // Note: cuboid(halfWidth, halfHeight, halfDepth)
    const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(100, 0.5, 100) // Matches 1x1x1 mesh
    .setTranslation(0, 0, 0)  
    .setDensity(1)
      .setRestitution(0.5); // Bounciness
    world.createCollider(cubeColliderDesc, cubeBody.handle);
      // initModels();
      // initDynamicObjex();
      WaitAndInit();
}
 
export let rapierDebugRenderer;

class RapierDebugRenderer {
  mesh
  world
  enabled = true

  constructor(scene, world) {

    this.world = world
    this.mesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true }))
    this.mesh.frustumCulled = false
    scene.add(this.mesh)
  }

  update() {
    if (this.enabled && this.world) {
      const { vertices, colors } = this.world.debugRender()
      this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      this.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
      this.mesh.visible = true
    } else {
      this.mesh.visible = false
    }
  }
}


// export function initDefaultCollider () { //
//   // Assuming RAPIER and THREE are loaded and initialized

//   // 1. Create the Three.js Mesh (Visual Representation)
//   // const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); // 1x1x1 unit cube
//   // const cubeMaterial = new THREE.MeshStandardMaterial({ color: 'hotpink' });
//   // const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
//   // cubeMesh.castShadow = true;
//   // scene.add(cubeMesh);

//   // 2. Create the Rapier RigidBody (Physics Body)
//   const cubeBodyDesc = new RAPIER.RigidBodyDesc()
//     .setTranslation(0, 0, 0); // Position in physics world (meters)
//     // .setLinDamping(0.1) // Optional: damping
//     // .setAngDamping(0.1);
//   const cubeBody = world.createRigidBody(cubeBodyDesc);

//   // 3. Create the Rapier Collider (Collision Shape)
//   // Note: cuboid(halfWidth, halfHeight, halfDepth)
//   const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(100, 0.5, 100) // Matches 1x1x1 mesh
//     .setDensity(1)
//     .setRestitution(0.8); // Bounciness
//   world.createCollider(cubeColliderDesc, cubeBody.handle);

//   // Store references to sync them (e.g., in an array)
//   staticBodies.push(cubeBody);


// }

// export async function initStaticObjex () { //e.g. ground, walls, etc.. 
    
//     for (let i = 0; i < staticObjex.length; i++) {
  
//       console.log("tryna init staticObjex " + staticObjex[i].locationData.name + " hide " + staticObjex[i].isHidden);
     
//         const pos = new THREE.Vector3(staticObjex[i].locationData.x, staticObjex[i].locationData.y, staticObjex[i].locationData.z);
      
//         await createStaticCollider(staticObjex[i].mesh, pos);
        
//     }
//     WaitAndInit();
//   }


// export async function createStaticCollider (model, position) { // may not be added to the scene if hidden?
//     console.log("tryna set static collider for model " + model.name +' at position ' + JSON.stringify(position));
   
//     try {
//       const geometry = model.geometry; //sent as child mesh
//       // const fixedGeometry = BufferGeometryUtils.mergeVertices(geometry);

//       const vertices = geometry.attributes.position.array;
//       // for (let i = 0; i < vertices.length; i++) {
//       //   vertices[i] *= fixedGeometry.scale.x; // Example for uniform scale
//       // }
//       const indices = geometry.index.array;

//       // 3. Create ColliderDesc (Example: Trimesh for complex shape)
//       let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
      
//       // let colliderDesc = RAPIER.ColliderDesc.convexHull(vertices);
          
//       // colliderDesc.contactSkin(0.5); // ???
//       const pos = new THREE.Vector3();
//       model.getWorldPosition(pos);
//       // const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(parseFloat(position.x),parseFloat(position.y),parseFloat(position.z));
//                       const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);

//       // model.position.set(position);
//       const staticBody = await world.createRigidBody(rbDesc);
//       let collider = await world.createCollider(colliderDesc, staticBody);
//       collider.setRestitution(.5);
//       collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

//       staticBodies.push(staticBody);
//     } catch (e) {
//         console.error("staticCollider error "+ e);
//     } finally {

//     }
    
// }

function WaitAndInit () {
          
  // eventQueue = new RAPIER.EventQueue(true);
  physicsIsReady = true;
  worldIsReady = true;
  // togglePostProcessing();
  initDynamicObjex();
}

  export async function getKinematicAgentBodies () {
    try {
      for (let i = 0; i < agentParents.length; i++) {
         await new Promise(r => setTimeout(r, 2000));
        const body = await getKinematicBody(agentParents[i], i); //pass the index too
        kinematicBodies.push(body);
        // await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.log("error looping kinematic bodies " + e );
    } finally {
      console.log("kinematic agents are spawned!");
    }
  }

  export async function getKinematicBody(agentParent, agentIndex, position) {

    try {
      await new Promise(r => setTimeout(r, 0));
      const geometry = new THREE.CapsuleGeometry( 1, 2, 4, 8, 1 );
      const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: .75, color: 'orange' });
      // const material = new THREE.MeshStandardMaterial({ color: 'orange' });
      material.roughness = 0.1;
      material.metalness = 0.3;
      material.envMap = scene.environment;
      material.envMapIntensity = 2;
      // const material = returnMaterial('brain');
      const mesh = new THREE.Mesh( geometry, material );
      // const timeUniform = uniform(0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.name = "agent_" + agentIndex;

      
      // scene.add(mesh)
      agentParent.add(mesh);
      mesh.position.set(0,2,0);
      let worldposition = new THREE.Vector3();
      mesh.getWorldPosition(worldposition);

      let size = 2;
      let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased() //no, position based...
              .setTranslation(worldposition.x, worldposition.y, worldposition.z);
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 1);
      let collider = await world.createCollider(kinematicCollider, rigidbody);
      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

    function update () {

      if (mesh && rigidbody) {
        //  rigidbody.resetForces(true); 
    //   rigidbody.setTranslation({ x: mesh.position.x, y: mesh.position.y + 1, z: mesh.position.z });
        mesh.getWorldPosition(worldposition);
        rigidbody.setTranslation(worldposition);
    //   let { x, y, z } = rigidbody.translation();
    //   mouseMesh.position.set(x, y, z);
      }
    }

    return { rigidbody, update };
  } catch (e) {
    console.log("error creating kinematic rigidbody " + e);
  }
}
export async function getDynamicBody(model, position) {

    try {

      // console.log("tryna create dynamic rigidbody from model " + model );
      await new Promise(r => setTimeout(r, 0));
      const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    //  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'blue' });
      const material = new THREE.MeshStandardMaterial({transparent: true, opacity: .75, color: 'blue' });

      material.roughness = 0.25;
      material.metalness = 0.5;
      material.envMap = scene.environment;
      material.envMapIntensity = 2;


			const mesh = new THREE.Mesh( geometry, material );
      
      const size = 2;
      const colliderSize = size;// * 1.25;
      const range = 30;
      // const density = size  * .5;
      let x = Math.random() * range - range * 0.5;
      let y = Math.random() * range - range * 0.5 + 10;
      let z = Math.random() * range - range * 0.5;

      // RIGID BODY
      let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
              .setTranslation(x, y, z);
              //  .setGravityScale(0.5);
              // .setCcdEnabled(false);
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      // let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density);
      console.log("rigidbody created with handle " + rigidbody.handle);
      let colliderDesc = RAPIER.ColliderDesc.ball(colliderSize); //.setDensity(density);
      let collider = await world.createCollider(colliderDesc, rigidbody);

      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

      mesh.scale.setScalar(size);
      scene.add(mesh);
      
      let position = new THREE.Vector3();
      position = rigidbody.translation();
      mesh.position.copy(position);

      function update () {
      if (mesh && mesh.position && rigidbody && rigidbody.handle) {
          // rigidbody.resetForces(true); 
          position = rigidbody.translation();
      //   if (mesh.position) {
          mesh.position.copy(position);
          let q = rigidbody.rotation();
          let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
          mesh.rotation.setFromQuaternion(rote);
          if (position.y < -10) {
              rigidbody.setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
              rigidbody.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
              rigidbody.setTranslation({ x: x, y: 10.0, z: z });
          }
      }
      }

      return { rigidbody, update };
    } catch (e) {
      console.log("error dynamic body " + e);
    }
  }


  export async function initDynamicObjex () {

    try {
      for (let i = 0; i < dynamicObjectCount; i++) { // go easy
        // 
        // await initTestObjex(i);
         await new Promise(r => setTimeout(r, 0));
        const body = await getDynamicBody(); //spawns a mesh too
       
			  dynamicBodies.push(body);
        
      }
    } catch (e) { 
      console.log("error init dynamic objex " + e);
    } finally {
          physicsIsReady = true;
      await new Promise(r => setTimeout(r, 4000));
      // worldIsReady = true;
      await getKinematicAgentBodies();
    }

  }


    function getMouseBall (RAPIER, world) {
    const mouseSize = 0.5;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
    });
    const mouseLight = new THREE.PointLight(0xffffff, 1);
    const mouseMesh = new THREE.Mesh(geometry, material);
    mouseMesh.add(mouseLight);

    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 2.0);
    world.createCollider(dynamicCollider, mouseRigid);
    function update (mousePos) {
      mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y + 0.5, z: mousePos.z });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
  }

