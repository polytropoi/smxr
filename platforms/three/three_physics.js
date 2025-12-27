
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

export async function initRapier () {
		await RAPIER.init();	
		gravity = { x: 0.0, y: -9.81, z: 0.0 };
		world = await new RAPIER.World(gravity);
    // setTimeout( () => {
     
    // }, 3000);

    rapierDebugRenderer = new RapierDebugRenderer(scene, world);
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
    if (this.enabled) {
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
        // await new Promise(r => setTimeout(r, 1000));
        for (let i = 0; i < 50; i++) {
            // await new Promise(r => setTimeout(r, 1000)); //slow the fxk down
            const pos = randomNavmeshPoint();
            const agentIndex = i;
            CreateAgent(agentIndex, pos); //cook the navagent first
            
            // const rbody = await getKinematicBody(agentParent, agentIndex, pos);
            
            console.log("creating kinematic body for agent " + agentIndex);
            // kinematicBodies.push(rbody);
        }
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

export async function createStaticCollider (world, model, position) { //she's no move
    console.log("tryna set static collider for model " + model);
   
    try {
        // await model.traverse((child) => {
        //     if (child.isMesh) {
                
        //         const geometry = child.geometry;
        //         const vertices = geometry.attributes.position.array;
        //         const indices = geometry.index.array;

        //         // 3. Create ColliderDesc (Example: Trimesh for complex shape)
        //         let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                    
        //             // 4. Configure collider properties
        //         colliderDesc.setDensity(1.0);

        //         const rbDesc = RAPIER.RigidBodyDesc.fixed(); //.setTranslation({ x: 0, y: 0, z: 0 });
        //         const staticBody = world.createRigidBody(rbDesc);
        //         world.createCollider(colliderDesc, staticBody);
        //         staticBodies.push(staticBody);
                
                

        //     }


        // });
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
                    
                    // 4. Configure collider properties
                // colliderDesc.setDensity(.1);

                // colliderDesc.contactSkin(0.5);


                const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0,0,0);
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
      initObjects();
      
      // eventQueue = new RAPIER.EventQueue(true);
      physicsIsReady = true;
      togglePostProcessing();
  }

  export async function getKinematicAgentBodies () {
    try {
      for (let i = 0; i < agentParents.length; i++) {
        const body = await getKinematicBody(agentParents[i]);
        kinematicBodies.push(body);
      }
    } catch (e) {

    }
  }

export async function getKinematicBody(agentParent, agentIndex, position) {
    // await world;
    // if (world) {

                    const geometry = new THREE.CapsuleGeometry( .5, 1, 4, 8, 1 );
                // const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'orange' });
                const material = new THREE.MeshStandardNodeMaterial({ color: 'orange' });
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
    let size = 1;
    let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased(); //no, position based...
            // .setTranslation(position.x, position.y, position.z);
    let rigidbody = await world.createRigidBody(rigidBodyDesc);
    let kinematicCollider = RAPIER.ColliderDesc.capsule(.35, .35);
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

    let worldposition = new THREE.Vector3();
    // mesh.getWorldPosition(worldposition);
    // childmesh.scale.setScalar(size);

    function update () {

         rigidbody.resetForces(true); 
    //   rigidbody.setTranslation({ x: mesh.position.x, y: mesh.position.y + 1, z: mesh.position.z });
        mesh.getWorldPosition(worldposition);
        rigidbody.setTranslation(worldposition);
    //   let { x, y, z } = rigidbody.translation();
    //   mouseMesh.position.set(x, y, z);
    }

    return { rigidbody, update };
  // }
}
export async function getDynamicBody(model, position) {

    // console.log("tryna create dynamic rigidbody from model " + model );
    const size = 0.75;
    const colliderSize = size;
    const range = 30;
    const density = size  * .5;
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

    let colliderDesc = RAPIER.ColliderDesc.ball(colliderSize).setDensity(density);
    let collider = await world.createCollider(colliderDesc, rigidbody);

    collider.setRestitution(1.5);
    collider.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);


    const mesh = model.clone();
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    mesh.scale.setScalar(size);
    
    function update () {
    if (mesh && mesh.position && rigidbody) {
        // rigidbody.resetForces(true); 
        let pos = rigidbody.translation();
    //   if (mesh.position) {
        mesh.position.copy(pos);
        let q = rigidbody.rotation();
        let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
        mesh.rotation.setFromQuaternion(rote);
        if (pos.y < -10) {
            rigidbody.setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
            rigidbody.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
            rigidbody.setTranslation({ x: x, y: 10.0, z: z });
        }
    }
    }

    return { rigidbody, mesh, update };
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

  export async function initObjects () {
    // let count = 1
    //  const intervalID = setInterval(() => {
    //     count++;
    //     // // console.log(count);
    //     // const x = count % column;
    //     //   const y = count / column;

    //     //   const mesh = new THREE.Mesh( geometry, material );
    //     //   // mesh.position.set( x * scale + Math.random(), 10, y * scale * Math.random() );
    //     //   // mesh.rotation.set( Math.random(), Math.random(), Math.random() );
    //     //   // objects.add( mesh );
    //     //   // const body = getDynamicBody(RAPIER, world, mesh);
    //     //   const body = getDynamicBody(mesh);
    //     //   dynamicBodies.push(body);
    //     //   scene.add(body.mesh);
    //   initTestObjex(count);
    //   console.log("spawning test object " + count);
    //   if (count === 20) {
    //     clearInterval(intervalID);
    //     console.log("Stopped");
    //     togglePostProcessing();
    //   }
    // }, 500);
                worldIsReady = true;
    for (let i = 0; i < 50; i++) { // go easy
         await new Promise(r => setTimeout(r, 500));
      await initTestObjex(i);
    }

          // await new Promise(r => setTimeout(r, 1000));

  }


  export async function initTestObjex (count) {

		// const geometry = new THREE.IcosahedronGeometry( 1, 3 );
    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
//  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, opacity: .75, color: 'blue' });
  const material = new THREE.MeshStandardNodeMaterial({ color: 'blue' });

		// const material = getRainbowMaterial();
                material.roughness = 0.25;
            material.metalness = 0.5;
            material.envMap = scene.environment;
            material.envMapIntensity = 2;
		// material.colorNode = iceColorNode;

		// let count = 100;
		const scale = 10;
		const column = 50;

		// for ( let i = 0; i < count; i ++ ) {

			const x = count % column;
			const y = count / column;

			const mesh = new THREE.Mesh( geometry, material );
			// mesh.position.set( x * scale + Math.random(), 10, y * scale * Math.random() );
			// mesh.rotation.set( Math.random(), Math.random(), Math.random() );
			// objects.add( mesh );
			// const body = getDynamicBody(RAPIER, world, mesh);
      const body = await getDynamicBody(mesh.clone());
			dynamicBodies.push(body);
			scene.add(body.mesh);
      
		// }
    
//     // let count = 0;
// const intervalID = setInterval(() => {
//   count++;
//   // console.log(count);
//   	const x = count % column;
// 			const y = count / column;

// 			const mesh = new THREE.Mesh( geometry, material );
// 			// mesh.position.set( x * scale + Math.random(), 10, y * scale * Math.random() );
// 			// mesh.rotation.set( Math.random(), Math.random(), Math.random() );
// 			// objects.add( mesh );
// 			// const body = getDynamicBody(RAPIER, world, mesh);
//       const body = getDynamicBody(mesh);
// 			dynamicBodies.push(body);
// 			scene.add(body.mesh);
  
//   if (count === 120) {
//     clearInterval(intervalID);
//     console.log("Stopped");
//   }
// }, 500);

    // physicsIsReady = true;
    //     		// caustics
		// if (water && water.waterLayer0) {
		// 	const waterPosY = positionWorld.y.sub( water.position.y );

		// 	let transition = waterPosY.add( .1 ).saturate().oneMinus();
		// 	transition = waterPosY.lessThan( 0 ).select( transition, normalWorld.y.mix( transition, 0 ) ).toVar();
		// 	const colorNode = transition.mix( material.colorNode, material.colorNode.add( water.waterLayer0 ) );

		// 	material.colorNode = colorNode;
		// 	// floor.material.colorNode = colorNode;
		// }

  }