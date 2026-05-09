
import * as THREE from 'three';

import RAPIER from 'rapier';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { scene, togglePostProcessing, water, cameraMode, showDebug } from './three_main.mjs';

import { staticObjex, activeObjex, kinematicAgentMeshes } from './three_locations.js';
import { player, camera } from './three_controls.js';
import { playerRigidbody } from './three_actions.js';
import { agentModels, agentParents, CreateAgent, randomNavmeshPoint } from './three_nav.js';
import { settings } from '../../../connect/settings.js';
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
export let atomicBodies = [];
export let staticBodies = [];
export let kinematicBodies = [];
export let npcKinematicBodies = [];
export let useDefaultCollider = false;
export let handColliderGroup;
export let colliders = {}


// export let equippedRigidbody;


export const agentCount = 0;
const dynamicObjectCount = 5;
let playerWorldPosition = new THREE.Vector3();
// export let playerRigidbody;        

let atomicParticlesCount = 300;
  const sceneMiddle = new THREE.Vector3(2, 0, 0);

export async function InitRapier (gravity) {
    console.log("tryna init rapier physics " + gravity);
		await RAPIER.init();	
    // if (!gravityMode) {
		//   gravity = { x: 0.0, y: -9.81, z: 0.0 };
    // } else {
      
    //   gravity = { x: 0.0, y: 0, z: 0.0 };
    // }
		world = await new RAPIER.World(gravity);
    // const framerate = 1/30;
    // world.timestep = framerate;

    // setTimeout( () => {
   
    // }, 3000);

    // await new Promise(r => setTimeout(r, 5000));

    // worldIsReady = true;

    eventQueue = new RAPIER.EventQueue(true); // `true` for generating contact force events

    if (showDebug) {
      rapierDebugRenderer = new RapierDebugRenderer(scene, world);
    }
}


import { getRainbowMaterial } from './tsl/rainbow.js'
import { DotNoiseMaterial } from './tsl/tsl_materials.js';

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


export function SetEquippedRigidbody(rbody) {
  equippedRigidbody = rbody;
}

export async function InitStaticObjex () { //e.g. ground, walls, etc.. - do first
    
  if (staticObjex.length) {
      for (let i = 0; i < staticObjex.length; i++) {
    
        console.log("tryna init staticObjex " + staticObjex[i].locationData.name + " hide " + staticObjex[i].isHidden);
      
        const pos = new THREE.Vector3(staticObjex[i].locationData.x, staticObjex[i].locationData.y, staticObjex[i].locationData.z);
      
        await createStaticCollider(staticObjex[i].mesh, pos);
          
      }
      WaitAndInit();
    } else if (useDefaultCollider) {
        let colliderDesc = RAPIER.ColliderDesc.cuboid(150,.1,150);
        const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0,-6.1,0);
        const staticBody = await world.createRigidBody(rbDesc);
        let collider = await world.createCollider(colliderDesc, staticBody);
        collider.setRestitution(.5);
        collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
        WaitAndInit();
    } else {
      WaitAndInit();
    }
  }
export async function createStaticCollider (model) { // may not be added to the scene if hidden?
    // console.log("tryna set static collider for model " + model.name +' at position ' + JSON.stringify(position));
   
    try { 
      
      const geometry = model.geometry; //sent as child mesh
      // const fixedGeometry = BufferGeometryUtils.mergeVertices(geometry);

      const vertices = geometry.attributes.position.array;
      // for (let i = 0; i < vertices.length; i++) {
      //   vertices[i] *= fixedGeometry.scale.x; // Example for uniform scale
      // }
      const indices = geometry.index.array;

      // 3. Create ColliderDesc (Example: Trimesh for complex shape)
      let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
      
      // let colliderDesc = RAPIER.ColliderDesc.convexHull(vertices);
          
      // colliderDesc.contactSkin(0.5); // ???
      const pos = new THREE.Vector3();
      model.getWorldPosition(pos);
      // const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(parseFloat(position.x),parseFloat(position.y),parseFloat(position.z));
                      const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);

      // model.position.set(position);
      const staticBody = await world.createRigidBody(rbDesc);
      let collider = await world.createCollider(colliderDesc, staticBody);
      collider.setRestitution(.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

      staticBodies.push(staticBody);
    } catch (e) {
        console.error("staticCollider error "+ e);
    } finally {

    }
    
}

function WaitAndInit () {
          
  // eventQueue = new RAPIER.EventQueue(true);
  physicsIsReady = true;
  worldIsReady = true;
 
    initDynamicObjex();
  


}

  export async function getKinematicAgentBodies () {
    try {
      for (let i = 0; i < agentParents.length; i++) {
         await new Promise(r => setTimeout(r, 1000));
        const body = await getKinematicBody(agentParents[i], i); //pass the index too
        kinematicBodies.push(body);
        // await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.log("error looping kinematic bodies " + e );
    } finally {      
      if (player) {
      //  const body = await getKinematicBody(player, -1); //pass the index too

        
        // playerRigidbody = await getPlayerBody(player); 
        // kinematicBodies.push(playerRigidbody);
        // playerRigidbody = body
      // getPlayerBody(player);
      }
      if (npcKinematicBodies.length) {
        console.log("adding npcKinematicBodies " + npcKinematicBodies.length);
        // for (let k = 0; k < npcKinematicBodies.length; k++) {
         
        //   kinematicBodies.push(npcKinematicBodies[k]);
        // }
        // kinematicBodies.concat(npcKinematicBodies);
      }
    }
  }

  export async function getTriggerBody(triggerObject, locationData) { //

      // if (player) {
    
        // const mesh = player;
        await new Promise(r => setTimeout(r, 1000));
        const colliderSize = locationData.xscale;
        // let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased() //no, position based...
        let rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(parseFloat(locationData.x), parseFloat(locationData.y), parseFloat(locationData.z));
        let rigidbody = await world.createRigidBody(rigidBodyDesc);
        colliders[rigidbody.handle] = locationData.timestamp;
        // let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 2);
        let colliderDesc = RAPIER.ColliderDesc.ball(colliderSize);
        let collider = await world.createCollider(colliderDesc, rigidbody);
        // collider.setRestitution(1.5);
        // collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
        collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        collider.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);
        let worldposition = new THREE.Vector3();
        // triggerObject.getWorldPosition(worldposition);

        // function update () {
        //   if (triggerObject && rigidbody) {
        //     // triggerObject.getWorldPosition(worldposition);
        //     // rigidbody.setTranslation(worldposition);
        //   }
        // }
        console.log("created rigidbody for player!");
        // player.userData.update = update;
        // kinematicBodies.push(player);
        return { rigidbody };
 
  }

  export async function getPlayerBody(player) { //

      // if (player) {
    
        // const mesh = player;
        let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased() //no, position based...
                .setTranslation(player.position.x, player.position.y, player.position.z);
        let rigidbody = await world.createRigidBody(rigidBodyDesc);
        colliders[rigidbody.handle] = "player";
        let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 2);
        let collider = await world.createCollider(kinematicCollider, rigidbody);
        collider.setRestitution(1.5);
        collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
        collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        collider.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);

        player.getWorldPosition(playerWorldPosition);

        function update () {
          if (player && rigidbody && playerWorldPosition) {
            // player.updateMatrixWorld();
            player.getWorldPosition(playerWorldPosition);
            rigidbody.setTranslation(playerWorldPosition);
          }
        }

        function enable () {
          rigidbody.setEnabled(true);
          console.log("playerbody enabled!");
        }

        function disable () {
          // rigidbody.setEnabled(false);
          console.log("playerbody disabled!");
          collider.setSensor(true);
        }
        console.log("created rigidbody for player!");
        // player.userData.update = update;
        // kinematicBodies.push(player);
        return { rigidbody, update, enable, disable };
 
  }


  export async function LoadKinematicAgentMeshes () {
    for (let i = 0; i < kinematicAgentMeshes.length; i++) {
      // await new Promise(r => setTimeout(r, 300));
      const body = await getModelKinematicBody(kinematicAgentMeshes[i], kinematicAgentMeshes[i].userData.locationData, kinematicAgentMeshes[i].userData.objectData); //pass the index too
      kinematicBodies.push(body);
    }
  }
  export async function getModelKinematicBody(mesh, locData, objData) { 

      await world;
      // let worldposition = new THREE.Vector3();
      // mesh.getWorldPosition(worldposition);
      // const geometry = new THREE.CapsuleGeometry( .5, 2, 4, 8, 1 );
      // const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: .25, wireframe: true, color: 'orange' });
      // const material = new THREE.MeshStandardMaterial({ color: 'orange' });
      // material.roughness = 0.1;
      // material.metalness = 0.3;
      // material.envMap = scene.environment;
      // material.envMapIntensity = 2;
      // const material = returnMaterial('brain');
    
      // const mesh = new THREE.Mesh( geometry, material );
      // parent.add(mesh);
      // mesh.position.y += 1.5;

      // mesh.visible = false;
      mesh.userData.locationData = locData;
      mesh.userData.objectData = objData;
      // activeObjex.push(mesh);
      let size = 2;
      let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();//no, position based...
              // .setTranslation(worldposition.x, worldposition.y, worldposition.z)
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      colliders[rigidbody.handle] = "agent_";
      let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 2);
      let collider = await world.createCollider(kinematicCollider, rigidbody);
      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
      collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
      

    function update () {

      if (mesh && rigidbody) {
        
        //  rigidbody.resetForces(true); 
          rigidbody.setTranslation({ x: mesh.parent.position.x, y: mesh.parent.position.y + 1, z: mesh.parent.position.z });
        // mesh.getWorldPosition(worldposition);
        // rigidbody.setTranslation(worldposition.x, worldposition.y, worldposition.z);
        // console.log("worldposition " + JSON.stringify(worldposition));
        //   let { x, y, z } = rigidbody.translation();
        //   mouseMesh.position.set(x, y, z);
      }
    }

  
  // } catch (e) {
  //   console.log("error creating model kinematic rigidbody " + e);
  // } finally {
      return { rigidbody, update };
  // }

}

  export async function getKinematicBody(agentParent, agentIndex, position) { //test objex

    try {
      await new Promise(r => setTimeout(r, 0));
      const geometry = new THREE.CapsuleGeometry( 1, 2, 4, 8, 1 );
      const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: .25, wireframe: true, color: 'orange' });
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
      agentParent.add(mesh);

      if (agentModels.length) {
        const index = Math.floor(Math.random() * agentModels.length);

        agentParent.add(agentModels[index]);
        agentModels[index].position.set(0,0,0);
      }
      // scene.add(mesh)

      mesh.position.set(0,2,0);
      let worldposition = new THREE.Vector3();
      mesh.getWorldPosition(worldposition);

      let size = 2;
      let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased() //no, position based...
              .setTranslation(worldposition.x, worldposition.y, worldposition.z);
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      colliders[rigidbody.handle] = "agent_" + agentIndex;
      let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 1);
      let collider = await world.createCollider(kinematicCollider, rigidbody);
      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
      collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
      
      activeObjex.push(mesh);

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
    console.log("error creating dynamic rigidbody " + e);
  }
}


export async function InitAtoms (centerPosition, nucleusCount, particleSize) {
  console.log("tryna init atoms");
  const atomCenter = new THREE.Object3D();
  // const center = new THREE.Vector3(0,0,0);
  // atomCenter.position.set(0,0,0);
  atomCenter.position.copy(centerPosition);
  scene.add(atomCenter);
  const light = new THREE.PointLight( 'orange', 100, 100 );

  atomCenter.add(light);
  light.position.copy(centerPosition);

  try {
      for (let i = 0; i < nucleusCount; i++) {
        //  await new Promise(r => setTimeout(r, 0));
        let particleType = "neutron";
        if (Math.random() > .5) {
          particleType = "proton";
        }
        const body = await getAtomicBody(atomCenter, particleType, particleSize); //spawns a mesh too
        
			  atomicBodies.push(body);
        
      }
    } catch (e) { 
      console.error("error init atoms " + e);
    } finally {
      physicsIsReady = true;
      worldIsReady = true;
    }
} 





async function getAtomicBody(atomCenter, particleType, particleSize) {

  const size = particleSize;
  const range = 10;
  const density = size * .01;
  const geometry = new THREE.SphereGeometry( particleSize, 16, 8 );

  let x = Math.random() * range - range;
  let y = Math.random() * range - range;
  let z = Math.random() * range - range;
  // physics
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setLinearDamping(1.0)
    .setAngularDamping(2.0)
    .setTranslation(x, y, z, false)
    // .setCcdEnabled(true);
  let rigidbody = await world.createRigidBody(rigidBodyDesc);
  // rigid.setGravityScale(16.0, true);
  let points = geometry.attributes.position.array;
  let colliderDesc = await RAPIER.ColliderDesc.convexHull(points).setDensity(density);
  const collider = world.createCollider(colliderDesc, rigidbody);
  
      // collider.setRestitution(1.5);
      // collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);


  console.log("tryna cook a particle " + particleType);
  let material = new THREE.MeshPhysicalMaterial({ color: 'green', transparent: true, opacity: .75 });
  if (particleType == "proton") {
    material = new THREE.MeshPhysicalMaterial({ color: 'red', transparent: true, opacity: .75 });
  } 
      material.roughness = 0.5;
      material.metalness = 0.15;
      material.envMap = scene.environment;
      material.envMapIntensity = 2;
      material.emissive = 'green';
      material.emissiveIntensity = 2;
      material.transmission = .5;
      material.thickness = 1.5;
      material.reflectivity = .9;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(size);

  // atomicBodies.push(rigidbody);

  // if (atomicBodies.length == 1) {
  //   scene.add(mesh);
  // } else {
  //   atomicBodies[0].add(mesh);
  // }
  atomCenter.add(mesh);
  // scene.add(mesh);
  let enabled = true;
  let distance;



  // const wireMat = new LineMaterial({
  //   color: 0x000000,
  //   linewidth: 7, // in pixels
  // });

  // const wireGeo = new WireframeGeometry2(geometry);
  // const wireframe = new Wireframe(wireGeo, wireMat);
  // wireframe.computeLineDistances();
  // wireframe.scale.set(1, 1, 1);
  // mesh.add(wireframe);

  function update() {
    // if (enabled) {
    if (rigidbody.isMoving) {
    rigidbody.resetForces(true);
    let { x, y, z } = rigidbody.translation(true);
    mesh.position.set(x, y, z);
    let pos = new THREE.Vector3(x, y, z);
    distance = pos.clone().distanceTo(atomCenter.position.clone());
    // if (distance > 1) {
      let dir = pos.clone().sub(atomCenter.position.clone()).normalize();

      let q = rigidbody.rotation();
      let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      mesh.rotation.setFromQuaternion(rote);

      
      rigidbody.addForce(dir.multiplyScalar(distance * -.1), false);
      
    }
    // }
    // if (distance < 1) {
    //   enabled = false;
    // }
      
    // }
  }
  return { mesh, rigidbody, update };
}


export async function initDynamicObjex () {

  try {
     if (settings && settings.sceneTags && settings.sceneTags.includes("test")) {
      for (let i = 0; i < dynamicObjectCount; i++) { // go easy
        // 
        // await initTestObjex(i);
          await new Promise(r => setTimeout(r, 1000));
        const body = await getDynamicBody(); //spawns a mesh too
        
        dynamicBodies.push(body);
        
      }
    }
  } catch (e) { 
    console.log("error init dynamic objex " + e);
  } finally {
    await new Promise(r => setTimeout(r, 2000));
    // worldIsReady = true;
    await getKinematicAgentBodies();
  }

}


export function GetInstancedRigidbody(position, scale) {

    // try {

      // console.log("tryna create dynamic rigidbody from model " + model );
      // await new Promise(r => setTimeout(r, 0));
      let size = 2;
      if (scale) {
        size = scale;
      }
    //   const geometry = new THREE.SphereGeometry( size / 2, 32, 16 );
    // //  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'blue' });
    //   // const material = new THREE.MeshStandardMaterial({transparent: true, opacity: .75, color: 'blue' });

    //   const material = getRainbowMaterial();
    //     // const material = DotNoiseMaterial()
    //     material.roughness = 0.25;
    //     material.metalness = 0.5;
    //     material.envMap = scene.environment;
    //     material.envMapIntensity = 2;


		// 	const mesh = new THREE.Mesh( geometry, material );
      

      const colliderSize = size;// * 1.25;
      const range = 30;
      // const density = size  * .5;
      let x = Math.random() * range - range * 0.5;
      let y = Math.random() * range - range * 0.5 + 10;
      let z = Math.random() * range - range * 0.5;

      // RIGID BODY
      let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
              .setTranslation(position.x, position.y, position.z);
              //  .setGravityScale(0.5);
              // .setCcdEnabled(false);
      let rigidbody = world.createRigidBody(rigidBodyDesc);
      // let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density);
      console.log("rigidbody created with handle " + rigidbody.handle);
      let colliderDesc = RAPIER.ColliderDesc.ball(colliderSize); //.setDensity(density);
      let collider = world.createCollider(colliderDesc, rigidbody);

      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

      // // mesh.scale.setScalar(size);
      // // scene.add(mesh);
      // // mesh.name = "dynamic";
      // let position = new THREE.Vector3();
      // position = rigidbody.translation();
      // mesh.position.copy(position);



      return rigidbody;
    // } catch (e) {
    //   console.log("error instancedrigidbody body " + e);
    // }
  }

export async function getDynamicBody(model, position, scale) {

    try {

      // console.log("tryna create dynamic rigidbody from model " + model );
      await new Promise(r => setTimeout(r, 0));
      let size = 2;
      if (scale) {
        size = scale;
      }
      const geometry = new THREE.SphereGeometry( size / 2, 32, 16 );
    //  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'blue' });
      // const material = new THREE.MeshStandardMaterial({transparent: true, opacity: .75, color: 'blue' });

		const material = getRainbowMaterial();
      // const material = DotNoiseMaterial()
      material.roughness = 0.25;
      material.metalness = 0.5;
      material.envMap = scene.environment;
      material.envMapIntensity = 2;


			const mesh = new THREE.Mesh( geometry, material );
      

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
      // mesh.name = "dynamic";
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
          
          if (position.y < -100) {
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


export function AddForceToDynamicBody (rigidbody) {
    rigidbody.addImpulse({x:0, y: 0, z: 2}, true);
}

export async function AddDynamicBody(mesh, meshposition, scale, yFudge, isEquipped, parent) {

    try {

      // console.log("tryna create dynamic rigidbody from model " + model );
      await new Promise(r => setTimeout(r, 0));
      let size = .5;
      if (scale) {
        size = scale;
      }

      const colliderSize = size;// * 1.25;
      // const range = 30;
  

      let worldPosition = new THREE.Vector3();  
      // mesh.getWorldPosition(worldPosition);
      if (parent) {
        // worldPosition.copy(parent.position);
         parent.getWorldPosition(worldPosition); //if equipped or attached
      } else {
        mesh.getWorldPosition(worldPosition);
      }
      // console.log("worldposition " + JSON.stringify(worldPosition) + " vs " + JSON.stringify(meshposition));
      let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
          // .setEnabled(false)
          .setTranslation(worldPosition.x, worldPosition.y, worldPosition.z);  //match rigidbody to mesh/parent position - rotation?
              //  .setGravityScale(0.5);
              // .setCcdEnabled(false);
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      // let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density);
      console.log("rigidbody created with handle " + rigidbody.handle);
      let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize)
         .setDensity(2);
      let collider = await world.createCollider(colliderDesc, rigidbody);
      collider.setTranslation(0, yFudge, 0);
      collider.setRestitution(.25);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max);

      let direction = new THREE.Vector3();
      // mesh.scale.setScalar(size);
      // scene.add(mesh);
      // mesh.name = "dynamic";
      let position = new THREE.Vector3();
      rigidbody.setEnabled(false);
      // position = rigidbody.translation();
      // mesh.position.copy(position);

      function rbPosition () { //update position to match the mesh even if disabled
          // worldPosition = parent.position.copy();
          // mesh.getWorldPosition(worldPosition)
          parent.getWorldPosition(worldPosition);
          rigidbody.setTranslation({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
          // worldPosition = parent.position.copy();
      }
      function update () {

        // console.log(rigidbody.isEnabled());
        if (rigidbody.isEnabled() == false) {
          rbPosition();
        } else {

          //  if (rigidbody.isEnabled()) {

          // mesh.updateMatrixWorld(); 
            // rigidbody.resetForces(true); 
            position = rigidbody.translation();
          //   if (mesh.position) {
          // console.log("equippedRigidbody position " + JSON.stringify(position));
            // 
            // mesh.worldToLocal(position);
            mesh.position.copy(position);
            let q = rigidbody.rotation();
            let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
            mesh.rotation.setFromQuaternion(rote);
            
            // if (position.y < -100) {
            //     rigidbody.setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
            //     rigidbody.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
            //     // rigidbody.setTranslation({ x: x, y: 10.0, z: z });
            // }
        // }

      }
    }

      function addForce (worldPos, force) {
        console.log("adding force!");
        rigidbody.setEnabled(true);
        // rigidbody.setTranslation(worldPos.x, worldPos.y, worldPos.z);
      //   rigidbody.resetForces(true);
      //   let { x, y, z } = rigidbody.translation(true);
      //   mesh.position.set(x, y, z);
      //   let pos = new THREE.Vector3(x, y, z);
      // //  let distance = pos.clone().distanceTo(atomCenter.position.clone());
      // // if (distance > 1) {
      //   let dir = pos.clone().sub(atomCenter.position.clone()).normalize();

      //   let q = rigidbody.rotation();
      //   let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      //   mesh.rotation.setFromQuaternion(rote);

        camera.getWorldDirection(direction);
        
        // rigidbody.addForce(dir.multiplyScalar(100), false);
        
        console.log("rigidbody isEnabled " + rigidbody.isEnabled() + " adding force " + force);
        // rigidbody.applyImpulse({x:0.0, y: 10000000.0, z: 0.0}, true);
      // rigidbody.setLinvel({ x: 0.0, y: 0.0, z: 10.0 }, true);
        rigidbody.setLinvel({ x: direction.x * 10 * force, y: direction.y * 10 * force, z: direction.z * 10 * force }, true);
        rigidbody.setAngvel({ x: 0.0, y: 10.0, z: 0.0 }, true);
      }

      // if (isEquipped) {
      //   equippedRigidbody = this;
      // }
      return { rigidbody, update, addForce };
    } catch (e) {
      console.log("error dynamic body " + e);
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


  function getCollider() {
    const mouseSize = 0.075;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 4);
    const material = new THREE.MeshBasicMaterial({});
    const mouseMesh = new THREE.Mesh(geometry, material);
    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 10.0);
    world.createCollider(dynamicCollider, mouseRigid);
      dynamicCollider.setRestitution(5);
      dynamicCollider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
    function update(pos) {
      // console.log("collider update " + JSON.stringify(pos));
      mouseRigid.setTranslation({ x: pos.x, y: pos.y, z: 0.2 });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    mouseMesh.userData.update = update;
        // kinematicBodies.push();
    return mouseMesh;
  }
  export function initHandColliderGroup () {

  // hand-tracking colliders
  handColliderGroup = new THREE.Group();
  scene.add(handColliderGroup);
  const numBalls = 21;
  for (let i = 0; i < numBalls; i++) {
    const mesh = getCollider();
    handColliderGroup.add(mesh);  

  }
  
}