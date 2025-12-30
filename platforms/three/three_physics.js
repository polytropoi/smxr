
import * as THREE from 'three';

import RAPIER from 'rapier';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { scene, togglePostProcessing, water } from './three_main.mjs';
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
export let staticBodies = [];
    export let kinematicBodies = [];

const agentCount = 20;
const dynamicObjectCount = 20;


export async function initRapier () {
		await RAPIER.init();	
		gravity = { x: 0.0, y: -9.81, z: 0.0 };
		world = await new RAPIER.World(gravity);


    // setTimeout( () => {
    rapierDebugRenderer = new RapierDebugRenderer(scene, world);
    // }, 3000);

    // await new Promise(r => setTimeout(r, 5000));

    //    worldIsReady = true;
}


import { getRainbowMaterial } from './tsl/rainbow.js'

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

  export async function WaitAndInitAgents () {
        // 
        for (let i = 0; i < agentCount; i++) {
            // await new Promise(r => setTimeout(r, 500)); //slow the fxk down
            const pos = randomNavmeshPoint();
            const agentIndex = i;
            CreateAgent(agentIndex, pos); //cook the navagent first
            
            // const rbody = await getKinematicBody(agentParent, agentIndex, pos);
            
            console.log("creating kinematic body for agent " + agentIndex);
            // kinematicBodies.push(rbody);
        }
        await new Promise(r => setTimeout(r, 1000)); //slow the fxk down
        await getKinematicAgentBodies();

        // setTimeout( () => {
        // if (agentMeshes) {
            
        //     for (let i = 0; i < agentMeshes.length; i++) {
        //         const rbody = getKinematicBody(agentMeshes);
        //         kinematicBodies.push(rbody);
        //     }
        // }
        // }, 3000);
        

    }

export async function createStaticCollider (model, position) { // may not actually be added to the scene if hidden
    console.log("tryna set static collider for model " + model);
   
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


                const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(parseFloat(position.x),parseFloat(position.y),parseFloat(position.z));
                const staticBody = await world.createRigidBody(rbDesc);
                let collider = await world.createCollider(colliderDesc, staticBody);
                collider.setRestitution(.5);
                collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

                staticBodies.push(staticBody);
    } catch (e) {
        console.error("staticCollider error "+ e);
    } finally {
        WaitAndInit();
    }
    
}


    


function WaitAndInit () {
      
      
      // eventQueue = new RAPIER.EventQueue(true);
      physicsIsReady = true;
      togglePostProcessing();
      
    }

  export async function getKinematicAgentBodies () {
    try {
      
      for (let i = 0; i < agentParents.length; i++) {
        const body = await getKinematicBody(agentParents[i], i); //pass the index too
        kinematicBodies.push(body);
        // await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.log("error looping kinematic bodies " + e );
    } finally {
            worldIsReady = true;
      await new Promise(r => setTimeout(r, 5000));    
      
      //  await new Promise(r => setTimeout(r, 4000));
      initDynamicObjex();
    }
  }

export async function getKinematicBody(agentParent, agentIndex, position) {
    // await world;
    // if (world) {

    try {
              await new Promise(r => setTimeout(r, 200));
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
                mesh.position.set(0,1,0);
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


    // // const mesh = model.clone();
    // let childmesh;
    // // let meshPosition = new THREE.Vector3();
    // // meshPosition.get
    
    // // const modelClone = model.clone();
    // model.traverse((child) => {    
    //   if (child.isMesh) {
    //     child.castShadow = true;
    //     childmesh = child;
    //   }
    // });
    // mesh.scale.setScalar(size);


    // mesh.getWorldPosition(worldposition);
    // childmesh.scale.setScalar(size);

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
export async function getDynamicBody(model, position) {

    try {

      // console.log("tryna create dynamic rigidbody from model " + model );

            await new Promise(r => setTimeout(r, 100));
        const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    //  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'blue' });
      const material = new THREE.MeshStandardMaterial({transparent: true, opacity: .75, color: 'blue' });

		// const material = getRainbowMaterial();
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
      let y = Math.random() * range - range * 0.5 + 3;
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


      // const mesh = model.clone();
      // mesh.traverse((child) => {
      //   if (child.isMesh) {
      //     child.castShadow = true;
      //   }
      // });
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
         await new Promise(r => setTimeout(r, 500));
        const body = await getDynamicBody(); //spawns a mesh too
       
			  dynamicBodies.push(body);
        
      }
    } catch (e) { 
      console.log("error init dynamic objex " + e);
    } finally {
      // await new Promise(r => setTimeout(r, 3000));
      // worldIsReady = true;
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
