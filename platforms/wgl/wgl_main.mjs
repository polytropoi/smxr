	import * as THREE from 'three';

	import { LoadPrimaryAudioHowl, PlayTriggerWithTag, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
	import { userData } from '../../../connect/connect.js';

	import { InitPathfinding, agents } from './wgl_nav.js';

	import { ShowPopup, popup, StartPopup, ThreeDeeText, lookAtCameraObjects } from './wgl_ui.js';

	import { world, InitRapier, physicsIsReady, dynamicBodies, rapierDebugRenderer, 
		eventQueue, kinematicBodies, npcKinematicBodies, worldIsReady, InitStaticObjex, 
		InitAtoms, atomicBodies, getPlayerBody, initHandColliderGroup, handColliderGroup, colliders,
		LoadKinematicAgentMeshes, } from './wgl_physics.js';

	import { InitEnvMap, InitSky, InitFog, InitGrid, InitGround } from './wgl_environment.js';

	import { equippedRigidbody } from './wgl_actions.js';


	import { lightMods, modLights, InitSceneLights } from './wgl_lights.js';

	import { InitSurface, instancedModels, InstanceOnSurface, surface, InstanceWithPattern, physicsInstancedMeshes, physicsInstancedBodies } from './wgl_instance.js';

	import { InitLocations, navmesh, groundObjex, locations, animationMixers, staticObjex, activeObjex, dynamicObjex, locationData, movingMeshes } from './wgl_locations.js';

	import Stats from './ui/stats.js';
	
	import { SetControls, onKeyDown, onKeyUp, onMouseDown, onMouseMove, onMouseUp, onMouseWheel, player, camera, cameraIsReady, UpdateControls, cameraWorldPosition, cameraAtZero } from './wgl_controls.js';
	
	import { InitAudioGroups, InitPictureGroups, ambientAudioController, InitSceneText } from './wgl_media.js';
	
	import { LoadSceneInventory } from './wgl_inventory.js';
	
	import { splatsLoaded, splatObjex, initSplats, InitSpark } from './wgl_splats.js';
import { PlayPauseMedia } from '../../connect/dialogs.js';



	export let scene;

	let stats, pivot;
	// let mixer, objects;
	export let water;// waterLayer0, waterLayer1;
	export let clock;
	export let renderer;
	// let model, floor, floorPosition;
	let postProcessing;
	let renderPipeline;
	export let showDebug = false;
	// export let controls;

	export let selectedObjects = [];

	let physicsInstances;
	let doPostProcessing = false; //only wgpu fn
	
	
	// export let activeObjex = []; //raycastable

	// export let staticObjex = []; //physics
	// export let dynamicObjex = []; //""

	let navmeshObjex = [];
	let surfaceObjex = [];

	export let cameraMode = "Orbit"; //default
	let cameraFOV = 75;

	// export let groundObjex = [];

	export let animatedSprites = [];

	export let playerPosition;
	
	let speed = 0.0;
	
	let video, videomesh, handLandmarker, useHandLandmarks;
	let instancedWithPhysics = [];	
	let instancedPosition = new THREE.Vector3();
	let instancedQuaternion = new THREE.Quaternion();
	let instancedMatrix = new THREE.Matrix4();
	

	let loadingString = "";

	export let loadingHeader = "";
	export let sceneIsReady = false;

	eventEl.addEventListener('ready-event', Start); //fired when settings are loaded..

	export function StartButton() {
		
		sceneIsReady = true;
		console.log("sceneIsReady " + sceneIsReady);
		PlayPauseMedia();
		popup.style.display = "none";
		
	}


	
	////////////// SCENE INIT FUNCTION 

	async function Start() {

		const three_canvas = document.getElementById("three_canvas");
		scene = new THREE.Scene();
		renderer = new THREE.WebGLRenderer({antialias:false, canvas: three_canvas});
		

		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Loading....<h4>";
		// ShowPopup(null, loadingString);

		loadingHeader = "<h2>" +settings.sceneTitle+ "</h2>";
		StartPopup(loadingHeader, 'Loading....', false);
		// renderer = new THREE.WebGPURenderer( { antialias: true } );
				// renderer.setPixelRatio( window.devicePixelRatio );
				// renderer.setSize( window.innerWidth, window.innerHeight );
				// renderer.setAnimationLoop( animate );
				// renderer.toneMapping = THREE.LinearToneMapping;
				// renderer.toneMappingExposure = 0.4;
		// await renderer.init(); //webgpu only!
		renderer.setPixelRatio( window.devicePixelRatio );
				// renderer.setPixelRatio( 2.0 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;
		// renderer.shadowMap.enabled = true;
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

		document.body.appendChild( renderer.domElement );

		renderer.setAnimationLoop( animate );
		// cameraMode = settings.sceneCameraMode;
		if (settings.sceneTags.includes("shadows")) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
		}
		if (settings.sceneCameraFOV) {
			cameraFOV = settings.sceneCameraFOV;
		}
		if (settings.sceneCameraMode) {
			cameraMode = settings.sceneCameraMode;
		}
		if (settings.sceneTags.includes("debug")) {
			showDebug = true;
		}
		
		// cameraMode = "Mouse Look";
		if (cameraMode == "First Person") {
			cameraMode = "Mouse Look";
		}

		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Controls....<h4>";
		// ShowPopup(null, loadingString);
		StartPopup(loadingHeader, 'Loading Controls...', false);
		SetControls(cameraMode, cameraFOV);
		
			


		StartPopup(loadingHeader, 'Loading Physics...', false);
		if (settings && settings.sceneTags && settings.sceneTags.includes("no gravity") ) {
					// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Physics....<h4>";
						
			const gravity = {x:0, y:0, z:0};
			await InitRapier(gravity); 
		} else if (settings && settings.sceneTags && settings.sceneTags.includes("low gravity") ) {
		// 	loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Physics....<h4>";
		// ShowPopup(null, loadingString);
			const gravity = {x:0, y:-0.25, z:0}; //"earthlike"
			await InitRapier(gravity); //gravityMode
		} else {
		// 	loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Physics....<h4>";
		// ShowPopup(null, loadingString);
			const gravity = {x:0, y:-9.81, z:0}; //"earthlike"
			await InitRapier(gravity); //gravityMode
		}
		

		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Locations....<h4>";
		// ShowPopup(null, loadingString);
		StartPopup(loadingHeader, 'Loading Locations...', false);
		await InitLocations(); //calls initSystems...

		// initSystems();
	}



	export async function InitSystems() { 


		if (navmesh && navmesh.geometry) {
			// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Navmesh....<h4>";
			// ShowPopup(null, loadingString);
			StartPopup(loadingHeader, 'Loading Navmesh...', false);
			await InitPathfinding(); //creates agents and scatters them on navmesh, then adds kinematic rigidbodies
			// AssignModelsToAgents();
		}


		// let notSurfaceInstanceModels = [];
		if (surface) { // => scattering instances
			// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Surfaces....<h4>";
			// ShowPopup(null, loadingString);
			StartPopup(loadingHeader, 'Loading Instances...', false);
			await InitSurface();
			console.log("instantiating on surface with models " + instancedModels.length);
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
				InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader, instancedModels[i].locationData);
						
			} 
		} 
		for (let i = 0; i < instancedModels.length; i++) { //loop again for physics or patterned instances..
			if (instancedModels[i].locationData.locationTags.includes("dynamic") || instancedModels[i].locationData.locationTags.includes("physics")) {
				
				// InstanceWithPattern(instancedModels[i].model, 50, 'sphere', 'dynamic', instancedModels[i].locationData);
				
			}
		}


		if (settings && settings.sceneTags.includes("webcam background")) {

			// Video Mesh
			// init video and MediaPipe

			// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Webcam....<h4>";
			// ShowPopup(null, loadingString);
					StartPopup(loadingHeader, 'Loading Webcam...', false);
			video = await getVideo();

			
			
			const texture = new THREE.VideoTexture(video);
			texture.colorSpace = THREE.SRGBColorSpace;
			const geometry = new THREE.PlaneGeometry(1	, 1);
			const material = new THREE.MeshBasicMaterial({
			map: texture,
			depthWrite: false,
			side: THREE.DoubleSide,
			});
			videomesh = new THREE.Mesh(geometry, material);
			videomesh.rotation.y = Math.PI;
			scene.add(videomesh);
		}
		if (settings.sceneTags.includes("hand")) {
				handLandmarker = await getHandLandmarker();
				useHandLandmarks = true;
				initHandColliderGroup();
		}
		
		if (settings && settings.sceneTags.includes("post processing")) {
			togglePostProcessing();
		}
			
		if (settings && settings.sceneTags.includes("atoms")) {
			const centerPosition = new THREE.Vector3(0,0,0);
			InitAtoms(centerPosition, 10, 1);
		}

		if (cameraMode == "Third Person") {
			// const playerBody = await getPlayerBody(player);
			// kinematicBodies.push(playerBody);
			const avatarName = userData.avatarName
			ThreeDeeText(avatarName, 1, player);
			// CreatePlayerAgent(player, player.position.clone());
		}
		//  await new Promise(r => setTimeout(r, 000)); //fudge
		InitEvents();

		// if (settings.audioGroups && settings.audioGroups.length) {
			InitAudioGroups();
		// }
		if (settings.pictureGroups && settings.pictureGroups.length) {
			InitPictureGroups();
		}
		InitSceneText();

		console.log("settings.sceneGroups " + JSON.stringify(settings.sceneGroups));
		
		
		clock = new THREE.Clock();

		if (settings && settings.sceneEnvironmentSettings) {
			console.log("sceneEnvironmentSettings " + JSON.stringify(settings.sceneEnvironmentSettings));
			if (settings.sceneEnvironmentSettings.sceneFloorplaneTexture == "grid") {
				InitGrid();
			}
			if (settings.sceneEnvironmentSettings.useFloorPlane && settings.sceneEnvironmentSettings.floorPlaneTexture && 
				settings.sceneEnvironmentSettings.floorPlaneTexture != "none" && settings.sceneEnvironmentSettings.floorPlaneTexture != "") {
				InitGround();
			}

		}

		if (settings && settings.sceneTags) {
			if (settings.sceneTags.includes("debug")) {
				// 
				stats = new Stats();
				stats.showPanel( 0,1,2,3 );
				// const statsContainer = document.createElement('div');
				// statsContainer.id = 'stats-container';
				// document.body.appendChild(statsContainer);
				document.body.appendChild( stats.dom );
				stats.dom.style.position = 'absolute';
				stats.dom.style.bottom = '20px';
				stats.dom.style.right = 'auto';
			}
		
			if (settings && settings.sceneWater && settings.sceneWater != 0 && settings.sceneWater.name != "") {
				
				console.log("water is " + water);
			}

			if (settings.sceneTags.includes("debug")) {
				showDebug = true;
			}
			if (settings.hasPrimaryAudio) {
				LoadPrimaryAudioHowl();
			}
			if (settings.sceneTags.includes("stars")) {
				Starfield(1000, 2, 100, null);
			}
			
		}
		
		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Scene Objects....<h4>";
		// ShowPopup(null, loadingString);
		StartPopup(loadingHeader, 'Loading SceneObjects...', false);

		await InitStaticObjex();  //creates default if none provided

		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Environment....<h4>";
		// ShowPopup(null, loadingString);

		StartPopup(loadingHeader, 'Loading Environment...', false);
		// InitEnvMap();
		InitEnvMap();
		InitSceneLights();
		InitSky();
		InitFog();

		// GetUserInventory();
		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Inventories....<h4>";
		// ShowPopup(null, loadingString);

		StartPopup(loadingHeader, 'Loading Inventories...', false);
		await LoadSceneInventory(); //both scene and user inventories

		if (water) { // set uwfx
			const waterLevel = parseFloat(settings.sceneWater.level);
			

		} else {
			
	
		}
		// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Agents....<h4>";
		// ShowPopup(null, loadingString);

		StartPopup(loadingHeader, 'Loading Agents...', false);
		await LoadKinematicAgentMeshes();


		if (splatObjex.length) {
			// if (splatObjex.length) {
				// loadingString = "<h1>" + loadingHeader + "</h1><br><h4>Spark Lib....<h4>";
				// ShowPopup(null, loadingString);
				StartPopup(loadingHeader, 'Loading SparkJS...', false);
				await InitSpark();
				// surface = surfaceObjex[0];
				StartPopup(loadingHeader, 'Loading Gaussian Splats', false);
				initSplats();
			// } 

		} else {
			StartPopup(loadingHeader, 'Ready!', true);	
			const startButton = startPop.querySelector("#startButton");
			if (startButton) {
				console.log("startButton found!");
				// const startButton = document.getElementById('popup_yesButton');
				startButton.addEventListener('pointerdown', StartButton);
					
			} else {
				console.log("startButton not found!");
			}
		}


		sceneIsReady = true;
	} //end init systems



	export function togglePostProcessing () { //call after physics is done, elsewise... :(

		doPostProcessing = !doPostProcessing;
		console.log("tryna toggle post processing " + doPostProcessing + " but on webgl!?");
	}


	function CollisionStart(h1, h2) {
		console.log("Collision started between colliders " + colliders[h1] + " and " + colliders[h2]);
		if (colliders[h1]) {
			if (!colliders[h2].includes("agent")) {
				console.log("player hit trigger " + JSON.stringify(locations[colliders[h2]]));
				// PlayTriggerWithTag('hit');
			}
			
		}
		PlayTriggerWithTag('hit');
	}
	function CollisionEnd(h1, h2) {
		console.log("Collision stopped between colliders " + colliders[h1] + " and " + colliders[h2]);
	}

////////////// MAIN LOOP FOR ALL THE THINGS ////////////////
	function animate() {
		const time = performance.now();
		// scene.updateMatrixWorld(true);
		if (clock && cameraIsReady) {
				

			UpdateControls();

			const delta = clock.getDelta();
			if (stats) {
				stats.update();
			}
			if (animatedSprites.length) {
				animatedSprites.forEach(a =>
					a.update(time));
			}
			if (animationMixers.length) {
				animationMixers.forEach(m => 
					m.update(delta));
			}
			if (agents.length) {
				agents.forEach(a =>
					a.update(delta, time));
			}
			if (rapierDebugRenderer && showDebug) {
				rapierDebugRenderer.update();
			}		
			if (world && physicsIsReady && worldIsReady && eventQueue) {

				world.step(eventQueue); 
				
				atomicBodies.forEach(a => 
					a.update());

				dynamicBodies.forEach(b => 
					b.update());

				// instancedWithPhysics.forEach(p =>
				// 	p.updatePhysics());
				// for (let i = 0; i < instancedWithPhysics.length; i++) {
				// 	instancedWithPhysics[i].updatePhysics();
				// }
				if (physicsInstancedMeshes && physicsInstancedBodies.length) { //this is a class instance// nope
					for (let i = 0; i < physicsInstancedBodies.length; i++) {
									// await new Promise(r => setTimeout(r, 0));
						// const body = physicsInstances.instancedBodies[i];
						// if (body) {
							const pos = physicsInstancedBodies[i].translation();
							const rot = physicsInstancedBodies[i].rotation();

							// Update dummy object with physics data
							// if (pos.y < -20) {
							// 	 physicsInstancedBodies[i].setTranslation(pos.x, 20, pos.z);
							// } else {
							// this.dummy.position.set(pos.x, pos.y, pos.z);
							// this.dummy.quaternion.set(rot.x, rot.y, rot.z, rot.w);
							// this.dummy.updateMatrix();
							instancedPosition.set(pos.x, pos.y, pos.z);
							instancedQuaternion.set(rot.x, rot.y, rot.z, rot.w);
							// this.dummy.updateMatrix();
							instancedMatrix.compose(instancedPosition, instancedQuaternion, new THREE.Vector3(1, 1, 1));
							// this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
							physicsInstancedMeshes.setMatrixAt(i, instancedMatrix);

							if (pos.y < -25) {
							physicsInstancedBodies[i].setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
							physicsInstancedBodies[i].setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
							physicsInstancedBodies[i].setTranslation({ x: pos.x, y: 20.0, z: pos.z });
							}
							// await new Promise(r => setTimeout(r, 0));
						}
								// Apply to instanced mesh
								//  matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
								// // this.instancedMeshes[0].setMatrixAt(i, this.dummy.matrix);
								// this.instancedMeshes[0].setMatrixAt(i, matrix);
								//  await new Promise(r => setTimeout(r, 0));
								// }
					
									// }
							// }
					// physicsInstances.instancedBodies;
				}
			
				if (kinematicBodies.length) {
					kinematicBodies.forEach(c => {
						// if (c.readyToNav) {
							c.update();
						// }
					});
				}

				if (equippedRigidbody) {

					equippedRigidbody.update();
				}


				world.step(eventQueue); 
				// npcKinematicBodies.forEach(k => 
				// 	k.update());

				// world.step();//!!! still wonky with lots of dynamic and kinematic

				// Pass eventQueue to collect events

				// Handle collision events
				eventQueue.drainCollisionEvents((handle1, handle2, started) => {
					if (started) {
						CollisionStart(handle1, handle2);
						
						// You can add logic here, e.g., change color of the collided objects
					} else {
						CollisionEnd(handle1, handle2);
						
					}
				});
			}

			if (lightMods.length) {
				// console.log("lightmods length " + lightMods.length);
				modLights(time);
				// light.intensity = Math.sin(time) * 5;
			}
			lookAtCameraObjects.forEach(l => 
				l.lookAt(cameraWorldPosition)
			)

			if (movingMeshes.length) {
				movingMeshes.forEach(m => 
					m.update(time)
				)
			}
			// if (!cameraAtZero) {
			// 	camera.lookAt(camera.parent);
			// }

			// if (playerNavAgent && playerReadyToNav) {
			// 	playerNavAgent.update();
			// }

			// if (doPostProcessing) {
			// 	if (renderPipeline) {
			// 		renderPipeline.render();
			// 	}
			// } else {
				renderer.render(scene, camera);
			// }

			if (video && videomesh) {
				if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
					if (handLandmarker && handColliderGroup) {
						const handResults = handLandmarker.detectForVideo(video, Date.now());

						if (handResults.landmarks.length > 0) {
						handResults.landmarks.forEach((landmarks) => {
							landmarks.forEach((landmark, j) => {
							const pos = {
								x: (landmark.x * videomesh.scale.x - videomesh.scale.x * 0.5) * -1,
								y: -landmark.y * videomesh.scale.y + videomesh.scale.y * 0.5,
								z: landmark.z,
							};
							const mesh = handColliderGroup.children[j];
							mesh.userData.update(pos);
							});
						});
						} else {
							// for (let i = 0; i < numBalls; i++) {
							// 	const mesh = colliderGroup.children[i];
							// 	mesh.position.set(0, 0, 10);
							// }
						}
					}
				}
				videomesh.scale.x = video.videoWidth * 0.016;
  				videomesh.scale.y = video.videoHeight * 0.016;
			}
			
			// if (ambientAudioController) {
			// 	ambientAudioController.modPosition(time);
			// }
		} //isReady

		// water.material.uniforms['time'].value += 1 / 60;
	}



////////// global events	

	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

	function InitEvents () {


		document.addEventListener( 'keydown', onKeyDown );
		document.addEventListener( 'keyup', onKeyUp );
		// document.addEventListener ('mousedown', onMouseDown );
		// document.addEventListener ('mouseup', onMouseUp );

		document.addEventListener ('pointerdown', onMouseDown );
		document.addEventListener ('pointerup', onMouseUp );
		document.addEventListener("wheel", onMouseWheel, false);
		// document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('pointermove', onMouseMove);

	} //end init events

	window.addEventListener( 'resize', onWindowResize );


	function toggleOrbitControl() {
		console.log("tryna toggle control " + control.enabled);
		// if (control) {
		// 	control.enabled = !control.enabled;
		// }
	}
	function onWindowResize() {
		if (camera) {
			console.log("window resize...");
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		}
	}




