

import * as THREE from 'three';


import { settings } from '../../../connect/settings.js';

import { closestNavmeshPoint } from './three_nav.js';

import { scene, navmesh, cameraMode, activeObjex, renderer, clock, groundObjex } from './three_main.mjs';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { FlyControls } from 'three/addons/controls/FlyControls.js';

import { InitReticle } from './three_ui.js';
export let camera, controls, player;
export let isReady = false;
export let followDistance = 20;

let mousecaster, centercaster, playcaster, downcaster, goal, arrowHelper, lastRaycastHitPosition, lastRaycastHitObject;

export let dir = new THREE.Vector3;
export let playerDirection = new THREE.Vector3();
export var playerVector = new THREE.Vector3;
export var goalVector = new THREE.Vector3;
// var followDistance = 20;
export let fVelocity = 0.0;
export let speed = 0.0;
export let cameraWorldPosition = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let playerSpeed = 5;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let raycastHitAgent;
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let pointerGizmo;
let reticle;
let mouseIsDown = false;
const mouse = new THREE.Vector2();


export function SetControls(cameraMode) {

    if (cameraMode == "Fixed") {

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 5;
        
        
        isReady = true;
    } else if (cameraMode == "Fly") {
        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .01, 1000);
        camera.position.set( 0, 0, 5 );
            camera.lookAt( 0, 1, 0 );
        controls = new FlyControls( camera, renderer.domElement );
        controls.dragToLook = true;
        controls.movementSpeed = 1;
        controls.rollSpeed = Math.PI / 24;
        controls.autoForward = false;
        console.log("tryna set fly controls");
        isReady = true;
    } else if (cameraMode == "Orbit") {
                                    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
            camera.position.set( 0, 5, 15 );
            camera.lookAt( 0, 1, 0 );
        controls = new OrbitControls( camera, renderer.domElement );
        controls.minDistance = 1;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI * 0.5;

        // controls.autoRotate = true;
        // controls.autoRotateSpeed = 1;
        controls.target.set( 0, .2, 0 );
        controls.update();
        isReady = true;


        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        // camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
        // camera.position.set( 10, 50, 10 );
        // camera.lookAt( 0, 1, 0 );
        mousecaster = new THREE.Raycaster();
    } else if (cameraMode == "Third Person") {
        
        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
        // camera.position.set( 0, followDistance, -followDistance );
        camera.position.set( 0, 10, -followDistance );
            camera.lookAt( 0, 1, 0 );

            
            // controls.enabled = false;
        // controls.autoRotate = true;
        // controls.autoRotateSpeed = 1;
        

        mousecaster = new THREE.Raycaster();	
        downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
        playcaster = new THREE.Raycaster();
        var geometry = new THREE.CapsuleGeometry( 1, 2, 4, 8, 1 );
        var material = new THREE.MeshBasicMaterial({"wireframe": true});

        player = new THREE.Mesh( geometry, material );
        player.userData.name = "player";
        activeObjex.push(player);

        goal = new THREE.Object3D;
        // follow = new THREE.Object3D;

        goal.position.z = -followDistance;
        goal.add( camera );

        controls = new OrbitControls( camera, renderer.domElement );
            controls.minDistance = 1;
            controls.maxDistance = 150;
            controls.maxPolarAngle = Math.PI * .4;
                                controls.minPolarAngle = Math.PI * .25;

        // pivot = new THREE.Object3D();
        // scene.add(pivot);
        // pivot.position.copy(camera.position); // Initialize the pivot at the camera's starting position

        // Optional: offset the camera slightly from the pivot point
        camera.position.z = 1; // Position the camera slightly behind the pivot
        // pivot.add(camera);

        scene.add( player );
        // console.log("ADDING PLAYER FOR THIRD PERSON");
        // keys = {
        // 	a: false,
        // 	s: false,
        // 	d: false,
        // 	w: false
        // };
        fVelocity = 0.0;
        camera.lookAt(player.position);
        // controls.target.set(player.position);
        const dir = new THREE.Vector3(); // Direction (will be updated)
        const origin = new THREE.Vector3(); // Origin (will be updated)
        const length = 10; // Length of the arrow
        const hex = 0xff0000; // Color (e.g., red)

        arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
        scene.add(arrowHelper);


        isReady = true;
    } else { //first persosn
        // camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
            camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
            camera.position.set(0,10,0);
        controls = new PointerLockControls( camera, document.body ); //use regular fp controls if has navmesh
        downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
    
        centercaster = new THREE.Raycaster();
        // mousecaster = new THREE.Raycaster();

        reticle = InitReticle();
        reticle.position.z = -0.5;
        camera.add(reticle);

        controls.pointerSpeed = .25;

        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );
                        blocker.style.display = "block";
        instructions.style.display = "block";

        instructions.addEventListener( 'click', function () {

            controls.lock();

        } );

        controls.addEventListener( 'lock', function () {

            instructions.style.display = 'none';
            blocker.style.display = 'none';

        } );

        controls.addEventListener( 'unlock', function () {

            blocker.style.display = 'block';
            instructions.style.display = '';

        } );

        scene.add( controls.object );
        // controls.update();
        isReady = true;


    }
    const pointerGeo = new THREE.CapsuleGeometry(.2, 2, 4, 4);
    const pointerMat = new THREE.MeshBasicMaterial({color: 'blue'});
    pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
    pointerGizmo.up.set(0, 1, 0);
    scene.add(pointerGizmo);
}

export function ControlsUpdate() {
    const time = performance.now();
    if (cameraMode == "Fixed") {
                if (useHandLandmarks) {
                    
                }
            } else if (settings && controls && cameraMode == "Fly") { //easy peasy
                // controls.update(time);
                            const delta = clock.getDelta();
                    
                    controls.update( delta );
            
            } else if (settings && controls && cameraMode == "Orbit") { //easy peasy
                controls.update();
                cameraWorldPosition.copy(camera.position);
            } else if (settings && player && cameraMode == "Third Person") { // kinda combines follow cam and orbit control
                speed = 0.0;
                
                // if (!playerReadyToNav) {
                    
                    
                    if ( moveForward ) {
                        // camera.lookAt( player.position );
                        // controls.target.set(player.position.x, player.position.z, player.position.z);
                        speed = .2;
                        // console.log("speed " + speed);		
                    } else if ( moveBackward ) {
                        // camera.lookAt( player.position );
                        // controls.target.set(player.position.x, player.position.z, player.position.z);
                        speed = -.2;
                    }
                            
                    fVelocity += ( speed - fVelocity ) * .5;
                    player.translateZ( fVelocity );
                    camera.getWorldPosition(cameraWorldPosition); //bc it's a child in this mode
                    camera.lookAt( player.position );
    
                    if ( moveLeft ) {
                        player.rotateY(0.025);
                    } else if ( moveRight ) {
                        player.rotateY(-0.025);
                    }
                        
                    playerVector.lerp(player.position, .5);
                    goalVector.copy(goal.position);
                    
                    dir.copy( playerVector ).sub( goalVector ).normalize();
                    const dis = playerVector.distanceTo( goalVector ) - followDistance;
                    goal.position.addScaledVector( dir, dis );
    
                    
                    // console.log("goal position " + JSON.stringify(goal.position));
                    //temp.setFromMatrixPosition(goal.matrixWorld);
                    
                    //camera.position.lerp(temp, 0.2);
                    
    
                    downcaster.ray.origin.copy( player.position );
                    downcaster.ray.origin.y += 10;
                    // console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
                    const intersections = downcaster.intersectObjects( groundObjex, false ); //groundObjex == navmesh
                    if (!intersections.length) {
                        //off the navmesh, get closest point and go back
                        // velocity.x = 0;
                        // velocity.y = 0;
                        // velocity.z = 0;
                        const goodSpot = closestNavmeshPoint(player.position);
                        if (goodSpot) {
                            player.position.set(goodSpot.x, goodSpot.y, goodSpot.z); 
                            console.log("back to goodSpot " + JSON.stringify(goodSpot));
                        }
                    } else {
                        // velocity.y = 0;
                        // intersections[0].point.x = 
                        player.position.y = intersections[0].point.y + 2; //needs offset var, player location y?
    
                     
                    // console.log("gotsa navmesh mousehit " + JSON.stringify(raycastHits[0].point));
                    // const localNormal = intersections[0].face.normal;
                    
                    // const worldNormal = localNormal.clone().transformDirection(intersections[0].object.matrixWorld);
                    
                    // player.lookAt(worldNormal);
                    // rotateObjectToNormal(player, worldNormal);
                    // player.rotateZ(worldNormal.z);
                        
                        canJump = true; //not really
                    }
    
                    
    
    
    
                    if (controls) { //toggle?
                        controls.update();
                    }
    
                // }
                const origin = player.position.clone();
                    player.getWorldDirection(playerDirection);
                    playcaster.set(origin, playerDirection);
                arrowHelper.setDirection(playcaster.ray.direction);
                arrowHelper.position.copy(playcaster.ray.origin);
                playerRaycast();
                        
    
            } else { //First personc cam w/ pointer lock and center cursor
                cameraWorldPosition.copy(camera.position);
                if ( navmesh && controls && controls.isLocked === true ) {
                                
                    downcaster.ray.origin.copy( controls.object.position );
                    downcaster.ray.origin.y += 10;
                    // console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
                    const intersections = downcaster.intersectObjects( groundObjex, false ); //groundObjex == navmesh
            
                    const onObject = intersections.length > 0;
                    if (onObject) {
                        // console.log(JSON.stringify(controls.object.position) + " pos " + groundObjex.length + " groundObjex with intersections " + intersections.length + " distance to 0th " + intersections[0].distance + " point.y " + intersections[0].point.y + " camera y " + controls.object.position.y);
                    }
            
                    const delta = ( time - prevTime ) / 1000;
            
                    velocity.x -= velocity.x * 12 * delta;
                    velocity.z -= velocity.z * 12 * delta;
            
                    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            
                    direction.z = Number( moveForward ) - Number( moveBackward );
                    direction.x = Number( moveRight ) - Number( moveLeft );
                    direction.normalize(); // this ensures consistent movements in all directions
            
                    if ( moveForward || moveBackward ) velocity.z -= direction.z * 20.0 * (playerSpeed) * delta;
                    if ( moveLeft || moveRight ) velocity.x -= direction.x * 20.0 * (playerSpeed) * delta;
            
                    if ( onObject === true ) {
            
                        velocity.y = Math.max( 0, velocity.y );
                        canJump = true;
            
                    }
            
                    // console.log("delta " + delta + " direction " + JSON.stringify(direction) + " velocity " + JSON.stringify(velocity));
                    controls.moveRight( - velocity.x * delta );
                    controls.moveForward( - velocity.z * delta );
            
                    controls.object.position.y += ( velocity.y * delta ); // new behavior
            
                    // if ( controls.object.position.y < - 10 ) {
            
                    // } else {
                        if (!intersections.length) {
                            //off the navmesh, get closest point and go back
                            velocity.x = 0;
                            velocity.y = 0;
                            velocity.z = 0;
                            const goodSpot = closestNavmeshPoint(controls.object.position);
                            if (goodSpot) {
                                controls.object.position.set(goodSpot.x, goodSpot.y, goodSpot.z); 
                                console.log("back to goodSpot " + JSON.stringify(goodSpot));
                            }
                        } else {
                            velocity.y = 0;
                            // intersections[0].point.x = 
                            controls.object.position.y = intersections[0].point.y + 4;
                            
                            canJump = true;
                        }
                centerRaycast();
            
                }
            }
                prevTime = time;
}


	export function mouseRaycast (e) {

		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		// console.log("mouse pos " + JSON.stringify(mouse));
		mousecaster.setFromCamera(mouse, camera);

		var raycastHits = mousecaster.intersectObjects(activeObjex, true);
		let selectColor = new THREE.Color(0xff3333);
		let stopColor = new THREE.Color(0x26de57);
		let goColor = new THREE.Color(0xff0000);
		if (raycastHits.length > 0) {
			
		// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
		// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
			if (raycastHits[0].object.userData.name == "navmesh") {
                
				lastRaycastHitObject = raycastHits[0].object; 
                console.log("hit the navmesh " + lastRaycastHitObject);
				// console.log("gotsa navmesh mousehit " + JSON.stringify(raycastHits[0].point));
				lastRaycastHitPosition = raycastHits[0].point;
				const localNormal = raycastHits[0].face.normal;
				
				const worldNormal = localNormal.clone().transformDirection(raycastHits[0].object.matrixWorld);
				// console.log("hit worldnormal " + JSON.stringify(worldNormal));
				pointerGizmo.position.set(raycastHits[0].point.x,raycastHits[0].point.y,raycastHits[0].point.z);
				// pointerGizmo.lookAt(worldNormal);
				rotateObjectToNormal(pointerGizmo, worldNormal);
			} else if (raycastHits[0].object.userData.name == "player") {

				lastRaycastHitPosition = raycastHits[0].point;
				lastRaycastHitObject = raycastHits[0].object; 
				// const distance = 5;
				// camera.position.sub(controls.target).setLength(distance).add(controls.target);
				// controls.update();
				// console.log("tryna reset controls");

			} else if (raycastHits[0].object.name.includes("agent")) {

				lastRaycastHitObject = raycastHits[0].object;
				if ( raycastHitAgent != raycastHits[ 0 ].object ) {
					console.log ("new mouse raycast hit on agent " + raycastHits[0].object.name);
					raycastHitAgent = raycastHits[ 0 ].object;	
					if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
						console.log("intersected material found!");
						raycastHitAgent.material.materialColor = goColor;
					} else if (raycastHitAgent && raycastHitAgent.material) {
						raycastHitAgent.material.color = goColor;
					
					}
					const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //can do this easier, but good to know
					if (navAgentInstance) {
						navAgentInstance.agentRaycastHit();
					}
				} else {
					// console.log("rehit agent " + raycastHits[0].object.name));
				}
			} else {
				if ( raycastHitAgent ) {
					if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
						// console.log("tryna reset agent colornode after no hit");
						raycastHitAgent.material.materialColor = stopColor;
						raycastHitAgent.material.needsUpdate = true;
						
					} else if (raycastHitAgent.material) {
						// console.log("tryna reset agent color after no hit");
						raycastHitAgent.material.color = stopColor;
					}
				}
				raycastHitAgent = null;
				lastRaycastHitObject = null;
			}
		} else {
			if (lastRaycastHitObject) {
				lastRaycastHitObject = null;
			}
			if ( raycastHitAgent ) {
			// 	{
				if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
					// console.log("tryna reset agent color after no hit");
					raycastHitAgent.material.materialColor = stopColor;
					raycastHitAgent.material.needsUpdate = true;
				} else if (raycastHitAgent.material) {
					// console.log("tryna reset agent color after no hit");
					raycastHitAgent.material.color = stopColor;
				}
			}
			raycastHitAgent = null;
		}
	}
	

	export function playerRaycast () {

		if (playcaster) {
			var raycastHits = playcaster.intersectObjects(activeObjex, true);
			let selectColor = new THREE.Color(0xff3333);
			let stopColor = new THREE.Color(0x26de57);
			let goColor = new THREE.Color(0xff0000);
			if (raycastHits.length > 0) {
				
			// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
			// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
				if (raycastHits[0].object.name.includes("agent")) {

					lastRaycastHitObject = raycastHits[0].object;
					if ( raycastHitAgent != raycastHits[ 0 ].object ) {
						console.log ("new player raycast hit on agent " + raycastHits[0].object.name);
						raycastHitAgent = raycastHits[ 0 ].object;	
						if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
							console.log("intersected material found!");
							raycastHitAgent.material.materialColor = goColor;
						} else if (raycastHitAgent && raycastHitAgent.material) {
							raycastHitAgent.material.color = goColor;
						
						}
						const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //can do this easier, but good to know
						if (navAgentInstance) {
							navAgentInstance.agentRaycastHit();
						}
					} else {
						// console.log("rehit agent " + raycastHits[0].object.name));
					}
				} else {
					if ( raycastHitAgent ) {
						if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
							// console.log("tryna reset agent colornode after no hit");
							raycastHitAgent.material.materialColor = stopColor;
							raycastHitAgent.material.needsUpdate = true;
							
						} else if (raycastHitAgent.material) {
							// console.log("tryna reset agent color after no hit");
							raycastHitAgent.material.color = stopColor;
						}
					}
					raycastHitAgent = null;
					// lastRaycastHitObject = null;
				}
			} else {
				if (lastRaycastHitObject) {
					// lastRaycastHitObject = null;
				}
				if ( raycastHitAgent ) {
				// 	{
					if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
						// console.log("tryna reset agent color after no hit");
						raycastHitAgent.material.materialColor = stopColor;
						raycastHitAgent.material.needsUpdate = true;
					} else if (raycastHitAgent.material) {
						// console.log("tryna reset agent color after no hit");
						raycastHitAgent.material.color = stopColor;
					}
				}
				raycastHitAgent = null;
			}
		}
	}
	
    export function centerRaycast () {
		if (scene && camera && centercaster && isReady) {

			centercaster.setFromCamera( new THREE.Vector2(0,0), camera );  
			const raycastHits = centercaster.intersectObjects(activeObjex, true);
			let lastHitObject;
			let selectColor = new THREE.Color(0xff3333);
			let stopColor = new THREE.Color(0x26de57);
			let goColor = new THREE.Color(0xff0000);
			if (raycastHits.length > 0) {
			// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
			// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
				
					if (raycastHits[0].object.userData.name == "navmesh") {
						console.log("navmesh Mousehit");
					}
					if (raycastHits[0].object.name.includes("agent")) {
					
					if ( raycastHitAgent != raycastHits[ 0 ].object ) {
						console.log ("new raycast hit on agent " + raycastHits[0].object.name);
						raycastHitAgent = raycastHits[ 0 ].object;	

							if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
						
								console.log("intersected material found!");
								raycastHitAgent.material.materialColor = goColor;

								
							} else if (raycastHitAgent && raycastHitAgent.material) {
								raycastHitAgent.material.color = goColor;
							
							}
							const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance;
							if (navAgentInstance) {
								navAgentInstance.agentRaycastHit();
							}
							
							
					} else {
						// console.log("rehit agent " + raycastHits[0].object.name));
					}
				} else {
					if ( raycastHitAgent ) {
						if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
							// console.log("tryna reset agent colornode after no hit");
							raycastHitAgent.material.materialColor = stopColor;
							raycastHitAgent.material.needsUpdate = true;
							
						} else if (raycastHitAgent.material) {
							// console.log("tryna reset agent color after no hit");
							raycastHitAgent.material.color = stopColor;
						}
					}
					raycastHitAgent = null;
				}
			} else {
				if ( raycastHitAgent ) {
				// 	{
					if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
						// console.log("tryna reset agent color after no hit");
						raycastHitAgent.material.materialColor = stopColor;
						raycastHitAgent.material.needsUpdate = true;
					} else if (raycastHitAgent.material) {
						// console.log("tryna reset agent color after no hit");
						raycastHitAgent.material.color = stopColor;
					}
				}
				raycastHitAgent = null;
			}
		}
	}

	export function onMouseDown(event) {
		// playerReadyToNav = true;
        console.log("mousedown "+ lastRaycastHitObject + " " + lastRaycastHitPosition );
		mouseIsDown = true;
		let lastHitObjectName;
		if (lastRaycastHitObject && lastRaycastHitPosition) {
			lastHitObjectName = lastRaycastHitObject.userData ? lastRaycastHitObject.userData.name : lastRaycastHitObject.name;
			console.log(JSON.stringify(lastRaycastHitPosition) + " named " + lastHitObjectName);
			
			if (lastHitObjectName == "player") {
				// controls.target.set(player.position);
				camera.lookAt(player.position);
				controls.target.set(0,0,0);
			} else if (lastHitObjectName == "navmesh") {
				// playerNavAgent.playerNavMode(true);
				const navAgentInstance = player.userData.NavAgentInstance; //can do this easier, but good to know
					if (navAgentInstance) {
						navAgentInstance.playerNav(true);
						// controls
						// player.position.set(closestNavmeshPoint(player.position.x, player.position.y, player.position.z ));
						navAgentInstance.newPath(lastRaycastHitPosition);
					}
				// controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);
			}

			// controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);

		}
		// isDragging = true;
		previousMousePosition = {
			x: event.clientX,
			y: event.clientY
		};


		// if ()
	}

	export function onMouseUp(e) {
		mouseIsDown = false;
		// playerReadyToNav = false;

	}


	export function onMouseMove(event) {
		// console.log("mouse move " +scene + mouse + camera + mousecaster + isReady);
		if (scene && mouse && camera && mousecaster && isReady) {
			mouseRaycast(event);
		}

		//  if (!mouseIsDown) return; //nope, orbit is better

		// 	const deltaX = event.clientX - previousMousePosition.x;
		// 	const deltaY = event.clientY - previousMousePosition.y;

		// 	// Adjust rotation speed with a sensitivity scale factor
		// 	const sensitivity = 0.003; 

		// 	// Apply rotation to the pivot
		// 	// Rotate around the Y-axis for horizontal movement (yaw)
		// 	goal.rotation.y += deltaX * sensitivity; 
		// 	// Rotate around the X-axis for vertical movement (pitch)
		// 	// You might want to limit the pitch rotation to prevent the camera from flipping upside down
		// 	goal.rotation.x += deltaY * sensitivity;

		// 	// Optional: clamp vertical rotation (e.g., between -PI/2 and PI/2)
		// 	goal.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, goal.rotation.x));


		// 	previousMousePosition = {
		// 		x: event.clientX,
		// 		y: event.clientY
		// 	};
	}


	export function onMouseWheel(e) {
		if (cameraMode == "Fixed") {

		} else if (!controls || (controls && !controls.enabled)) {
		// if (controls && (controls.getDistance() < 300)) {
 			const v = followDistance + e.deltaY * 0.005;
			// if (v >= 0 && v <= 100) {
				followDistance = v;
				console.log('v is ' + v);
				camera.position.y = v / 2;


			// }
			// return false;
		} else {
			if (cameraMode != "Orbit") {

			// const distanceFactor = controls.getDistance();
			// const polarAngle = controls.getPolarAngle();
			// const azimuthAngle = controls.getAzimuthalAngle();
			// if (distanceFactor < 20) {
			// 	controls.maxPolarAngle = Math.PI * .5;
			// } else if (distanceFactor < 30) {
			// 	controls.maxPolarAngle = Math.PI * .4;
			// } else if (distanceFactor < 50) {
			// 	controls.maxPolarAngle = Math.PI * .3;
			// }
			// console.log("distanceFactor " + distanceFactor + " polarAngle " + polarAngle +  " azimuth " + azimuthAngle);
			// controls.maxPolarAngle = Math.PI * distanceFactor;
			}
		}
		// }
	}

	export const onKeyDown = function ( event ) {
		// console.log("keydown " + event.code);
		switch ( event.code ) {

			case 'ArrowUp':
			case 'KeyW':
				moveForward = true;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true;
				break;

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true;
				break;

			case 'ArrowRight':
			case 'KeyD':
				moveRight = true;
				break;

			case 'Space':
				if ( canJump === true ) velocity.y += 350;
				canJump = false;
				break;
		
			case 'KeyO':

				toggleOrbitControl();
				break;
			}
		};

       export const onKeyUp = function ( event ) {
			// console.log("keyup " + event.code);	
            switch ( event.code ) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;

            }

        };


    function rotateObjectToNormal(object, targetNormal) {
		object.up.copy(targetNormal).normalize();
		const tempTarget = new THREE.Vector3(); 
		const newQuaternion = new THREE.Quaternion();
		const currentWorldUp = new THREE.Vector3();
		object.getWorldDirection(currentWorldUp); // actually gets the forward direction -Z
		
		const orientationMatrix = new THREE.Matrix4();

	
		object.up.copy(targetNormal);
		
		const direction = new THREE.Vector3(0, 0, -1); // Object's local forward direction (negative Z)
		
		object.up.copy(targetNormal);
		const upVector = new THREE.Vector3(0, 1, 0); // Default object 'up' direction in local space
		const quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(upVector, targetNormal.clone().normalize());
		
		// Apply the quaternion to the object
		object.setRotationFromQuaternion(quaternion);
	}