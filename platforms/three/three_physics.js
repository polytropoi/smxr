
import * as THREE from 'three';

import RAPIER from 'rapier';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { scene, togglePostProcessing, water, staticObjex, activeObjex, player } from './three_main.mjs';
import { agentParents, CreateAgent, randomNavmeshPoint } from './three_nav.js';
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

export const agentCount = 4;
const dynamicObjectCount = 20;

let atomicParticlesCount = 300;
  const sceneMiddle = new THREE.Vector3(2, 0, 0);

export async function initRapier (gravity) {
    console.log("tryna init rapier physics " + gravity);
		await RAPIER.init();	
    // if (!gravityMode) {
		//   gravity = { x: 0.0, y: -9.81, z: 0.0 };
    // } else {
      
    //   gravity = { x: 0.0, y: 0, z: 0.0 };
    // }
		world = await new RAPIER.World(gravity);

    // setTimeout( () => {
    rapierDebugRenderer = new RapierDebugRenderer(scene, world);
    // }, 3000);

    // await new Promise(r => setTimeout(r, 5000));

    // worldIsReady = true;
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




export async function initStaticObjex () { //e.g. ground, walls, etc.. 
    
  if (staticObjex.length) {
      for (let i = 0; i < staticObjex.length; i++) {
    
        console.log("tryna init staticObjex " + staticObjex[i].locationData.name + " hide " + staticObjex[i].isHidden);
      
        const pos = new THREE.Vector3(staticObjex[i].locationData.x, staticObjex[i].locationData.y, staticObjex[i].locationData.z);
      
        await createStaticCollider(staticObjex[i].mesh, pos);
          
      }
      WaitAndInit();
    } else {
      let colliderDesc = RAPIER.ColliderDesc.cuboid(150,.1,150);
      const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0,-6.1,0);
      const staticBody = await world.createRigidBody(rbDesc);
      let collider = await world.createCollider(colliderDesc, staticBody);
      collider.setRestitution(.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
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
   
    }
  }

  export async function getPlayerBody() {
    
      // const mesh = player;
       let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased() //no, position based...
              .setTranslation(player.position.x, player.position.y, player.position.z);
      let rigidbody = await world.createRigidBody(rigidBodyDesc);
      let kinematicCollider = RAPIER.ColliderDesc.capsule(1, 1);
      let collider = await world.createCollider(kinematicCollider, rigidbody);
      collider.setRestitution(1.5);
      collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

       let worldposition = new THREE.Vector3();
      player.getWorldPosition(worldposition);

      function update () {
          player.getWorldPosition(worldposition);
          rigidbody.setTranslation(worldposition);
      }
    
    return { rigidbody, update };
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


export async function initAtoms () {
  console.log("tryna init atoms");
  const atomCenter = new THREE.Object3D();
  const center = new THREE.Vector3(0,0,0);
  atomCenter.position.set(0,0,0);
  scene.add(atomCenter);
  const light = new THREE.PointLight( 'orange', 100, 100 );

  atomCenter.add(light);
  light.position.set(0,0,0);

  try {
      for (let i = 0; i < atomicParticlesCount; i++) {
        //  await new Promise(r => setTimeout(r, 0));
        let particleType = "neutron";
        if (Math.random() > .5) {
          particleType = "proton";
        }
        const body = await getAtomicBody(atomCenter, particleType); //spawns a mesh too
        
			  atomicBodies.push(body);
        
      }
    } catch (e) { 
      console.error("error init atoms " + e);
    } finally {
      physicsIsReady = true;
      worldIsReady = true;
    }
} 





async function getAtomicBody(atomCenter, particleType) {

  const size = 1;
  const range = 10;
  const density = size * .01;
  const geometry = new THREE.SphereGeometry( 1, 16, 8 );

  let x = Math.random() * range - range;
  let y = Math.random() * range - range;
  let z = Math.random() * range - range;
  // physics
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setLinearDamping(2.0)
    .setAngularDamping(4.0)
    .setTranslation(x, y, z, false)
    .setCcdEnabled(true);
  let rigidbody = await world.createRigidBody(rigidBodyDesc);
  // rigid.setGravityScale(16.0, true);
  let points = geometry.attributes.position.array;
  let colliderDesc = await RAPIER.ColliderDesc.convexHull(points).setDensity(density);
  world.createCollider(colliderDesc, rigidbody);

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
    let pos = new THREE.Vector3(x, y, z);
    distance = pos.clone().distanceTo(atomCenter.position.clone());
    // if (distance > 1) {
      let dir = pos.clone().sub(atomCenter.position.clone()).normalize();

      let q = rigidbody.rotation();
      let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      mesh.rotation.setFromQuaternion(rote);

      
      rigidbody.addForce(dir.multiplyScalar(distance * -.1), false);
      mesh.position.set(x, y, z);
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
    await new Promise(r => setTimeout(r, 4000));
    // worldIsReady = true;
    await getKinematicAgentBodies();
  }

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

