	import * as THREE from 'three/webgpu';

	import { color, objectPosition, screenUV, 
		uniform, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, time } from 'three/tsl';
	
	import { outline } from 'three/addons/tsl/display/OutlineNode.js';
	// import { PostProcessing } from 'three/addons/nodes/PostProcessing.js';

	import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

	import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';

	import { bloom } from 'three/addons/tsl/display/BloomNode.js';


	import { LoadPrimaryAudioHowl, PlayTriggerWithTag, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
	import { userData } from '../../../connect/connect.js';

	import { InitPathfinding, agents } from './wgpu_nav.js';

	import { getRainbowMaterial } from './tsl/rainbow.js'

	// import { InitSurface, InstanceOnSurface, instancedModels } from './three_instance.js';

	import { Starfield, CreateSprites, } from './wgpu_fx.js';

	import { ThreeDeeText, lookAtCameraObjects, SetUIMode, interactionManagers } from './wgpu_ui.js';

	import { world, InitRapier, physicsIsReady, dynamicBodies, rapierDebugRenderer, 
		eventQueue, kinematicBodies, npcKinematicBodies, worldIsReady, InitStaticObjex, 
		InitAtoms, atomicBodies, getPlayerBody, initHandColliderGroup, handColliderGroup, colliders,
		LoadKinematicAgentMeshes, } from './wgpu_physics.js';

	import { InitEnvMap, InitSky, InitFog, InitGrid, InitGround } from './wgpu_environment.js';

		import { equippedRigidbody } from './wgpu_actions.js';

	import { getVideo, getHandLandmarker } from './wgpu_vision.js';

	import { lightMods, modLights, InitSceneLights } from './wgpu_lights.js';

	import { InitSurface, instancedModels, InstanceOnSurface, surface, InstanceWithPattern, physicsInstancedMeshes, physicsInstancedBodies } from './wgpu_instance.js';

	import { InitLocations, LoadLocationObjex, navmesh, groundObjex, locations, animationMixers, staticObjex, activeObjex, dynamicObjex, locationData, movingMeshes } from './wgpu_locations.js';

	import Stats from './ui/stats.js';
	
	import { SetControls, onKeyDown, onKeyUp, onMouseDown, onMouseMove, onMouseUp, onMouseWheel, player, camera, isReady, UpdateControls, cameraWorldPosition, cameraAtZero } from './wgpu_controls.js';
	
	import { InitAudioGroups, InitPictureGroups, ambientAudioController, InitSceneText } from './wgpu_media.js';
	
	import { equippedObjectOnLoad, LoadSceneInventory } from './wgpu_inventory.js';
	


	export let scene;


	// let raycastHitAgent;
	// let isDragging = false;
	// let previousMousePosition = {
	// 	x: 0,
	// 	y: 0
	// };
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
	let doPostProcessing = false;
	
	
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
	export let sceneIsReady = false;
	
	eventEl.addEventListener('ready-event', Start); //fired when settings are loaded..




	////////////// SCENE INIT FUNCTION 

	async function Start() {

		const three_canvas = document.getElementById("three_canvas");
		scene = new THREE.Scene();
		// renderer = new THREE.WebGPURenderer({antialias:true, canvas: three_canvas});
		renderer = new THREE.WebGPURenderer({antialias:true, canvas: three_canvas});
		// renderer = new THREE.WebGPURenderer( { antialias: true } );
				// renderer.setPixelRatio( window.devicePixelRatio );
				// renderer.setSize( window.innerWidth, window.innerHeight );
				// renderer.setAnimationLoop( animate );
				// renderer.toneMapping = THREE.LinearToneMapping;
				// renderer.toneMappingExposure = 0.4;
		await renderer.init(); 
		renderer.setPixelRatio( window.devicePixelRatio );
				// renderer.setPixelRatio( 2.0 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;
		
			renderer.setAnimationLoop( animate );
		document.body.appendChild( renderer.domElement );

		// cameraMode = settings.sceneCameraMode;
		if (settings.sceneCameraFOV) {
			cameraFOV = settings.sceneCameraFOV;
		}
		if (settings.sceneCameraMode) {
			cameraMode = settings.sceneCameraMode;
		}
		if (settings.sceneTags.includes("debug")) {
			showDebug = true;
		}
		if (settings.sceneTags.includes("shadows")) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
		}
		
		// cameraMode = "Mouse Look";
		if (cameraMode == "First Person") {
			cameraMode = "Mouse Look";
		}

		SetControls(cameraMode, cameraFOV);
		
			
		InitEnvMap();

		if (settings && settings.sceneTags && settings.sceneTags.includes("no gravity") ) {
			const gravity = {x:0, y:0, z:0};
			await InitRapier(gravity); 
		} else if (settings && settings.sceneTags && settings.sceneTags.includes("low gravity") ) {
			const gravity = {x:0, y:-0.25, z:0}; //"earthlike"
			await InitRapier(gravity); //gravityMode
		} else {
			const gravity = {x:0, y:-9.81, z:0}; //"earthlike"
			await InitRapier(gravity); //gravityMode
		}
		
		await InitLocations(); //calls initSystems...


		sceneIsReady = true;
		if (equippedObjectOnLoad != "") {

			const eventDetails = {};
			eventDetails.objectID = equippedObjectOnLoad;
			eventDetails.onLoad = true;
			EquipInventoryCheck(eventDetails);
			// equip_inventory_object_event.details = eventDetails;
			// eventEl.dispatchEvent(equip_inventory_object_event);

		}
		// initSystems();
	}



	export async function InitSystems() { 

		// if (navmesh) {
		// 	await InitPathfinding(); //creates agents and scatters them on navmesh, then adds kinematic rigidbodies
		// 	// AssignModelsToAgents();
		// }


		await InitStaticObjex();  //creates default if none provided

		// let notSurfaceInstanceModels = [];
		if (surface) { // => scattering instances
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
				if (instancedModels[i].locationData.mediaID && instancedModels[i].locationData.mediaID != "" && instancedModels[i].locationData.mediaID != "none") {
					InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader, instancedModels[i].locationData);
				} else {
					InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader, instancedModels[i].locationData);
						
				}
				
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

		if (settings.sceneGroups) {
			console.log("settings.sceneGroups " + settings.sceneGroups.length);
		}
			// const texttest = "I have often wondered if the majority of mankind ever pause to reflect upon the occasionally titanic significance of dreams, and of the obscure world to which they belong. Whilst the greater number of our nocturnal visions are perhaps no more than faint and fantastic reflections of our waking experiences"
			// ThreeText(texttest);
		



		// console.log("settings " + JSON.stringify(settings));

		// scene.backgroundNode = normalWorld.y.mix( color( settings.sceneColor1 ), color( settings.sceneColor2 ) );


		


		clock = new THREE.Clock();

		if (settings.sceneTags.includes("hic")) {
			SetUIMode("hic");
		}

		if (settings && settings.sceneEnvironmentSettings) {
			console.log("sceneEnvironmentSettings " + JSON.stringify(settings.sceneEnvironmentSettings));
			if (settings.sceneEnvironmentSettings.sceneFloorplaneTexture == "grid") {
				InitGrid();
			}
			if (settings.sceneEnvironmentSettings.useFloorPlane && settings.sceneEnvironmentSettings.floorPlaneTexture && 
				settings.sceneEnvironmentSettings.floorPlaneTexture != "none" && settings.sceneEnvironmentSettings.floorPlaneTexture != "") {
				
				// if ()
				InitGround();
			}

		}

		if (settings && settings.sceneTags) {
			if (settings.sceneTags.includes("hic")) {
				SetUIMode("hic");
			}
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
			// document.body.appendChild(stats.domElement);
			// stats.domElement.style.right = 'auto';
			// statsContainer.domElement.style.left = '0px'; // Positioned at top-right
			// statsContainer.domElement.style.bottom = '20px';

			}
			if (settings && settings.sceneWater && settings.sceneWater != 0 && settings.sceneWater.name != "") {
				const waterModule = await import ('./tsl/tsl_water.js');
				if (settings.sceneWater.name == "water1") {
				
					// const waterModule = await import {Water} from './tsl/tsl_water.js'
					water = new waterModule.Water1();
				} else if (settings.sceneWater.name == "water2") {
					water = new waterModule.Water2();
				}
								// water = waterModule.water;
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
		

		// InitEnvMap();
		InitSceneLights();
		InitSky();
		InitFog();

		// GetUserInventory();
		LoadSceneInventory(); //both scene and user inventories

		if (doPostProcessing) {
			const scenePass = pass( scene, camera );
			const scenePassColor = scenePass.getTextureNode();
			const effectController = {
					focusDistance: uniform( 50 ),
					focalLength: uniform( 300 ),
					bokehScale: uniform( 2 )
				};

				// post processing

			renderPipeline = new THREE.RenderPipeline( renderer );


			const scenePassViewZ = scenePass.getViewZNode();

			const dofPass = dof( scenePassColor, scenePassViewZ, effectController.focusDistance, effectController.focalLength, effectController.bokehScale );
			// const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );
			// const selectedObjects = [ mesh ]; // Array of meshes to outline
			const edgeStrength = uniform( 3.0 );

			const edgeThickness = uniform( 1.0 );
			const visibleEdgeColor = uniform( new THREE.Color( 0xFF0000 ) );
			const hiddenEdgeColor = uniform( new THREE.Color( 0x000000 ) );

			// 4. Create the OutlineNode
			const outlinePass = outline( scene, camera, { 
				selectedObjects, 
				edgeThickness,
				// Add other properties as needed
			} );

			// 5. Compose the final output
			const { visibleEdge, hiddenEdge } = outlinePass;
			const outlineColor = visibleEdge
				.mul( visibleEdgeColor )
				.add( hiddenEdge.mul( hiddenEdgeColor ) )
				.mul( edgeStrength );
			
			let hasDOF = false;
			let hasBloom = false;
			let hasOutline = true;

			let emissivePass;
			let bloomPass;
			if ((settings && settings.sceneCameraDepthOfField) || (settings.sceneTags && settings.sceneTags.includes("DOF"))) {
				hasDOF = true;
				console.log("hasDOF is " + hasDOF);
			}
			if (settings && settings.sceneTags && settings.sceneTags.includes("bloom")) {
				hasBloom = true;
				bloomPass = bloom( scenePassColor );
				bloomPass.strength = .75;
			} 
			if (settings && settings.sceneTags && settings.sceneTags.includes("emissive bloom")) {//ouch
				hasBloom = true;
				// emissivePass = scenePass.getColorNode( 'emissive' ); //fragment error...
				// bloomPass = bloom( emissivePass, 2.5, .5 );
				bloomPass = bloom( scenePassColor );
				bloomPass.strength = .75;
			}
			
			// const bloomPass = bloom( emissivePass, 2.5, .5 );
			// scenePassColor.add( bloomPass );
			if (water) { // set uwfx
				const waterLevel = parseFloat(settings.sceneWater.level);
				

				// const scenePass = pass( scene, camera );
				// const scenePassColor = scenePass.getTextureNode();
				const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );

				// const waterMask = objectPosition( camera ).y.greaterThan( screenUV.y.sub( .5 ).mul( camera.near ) );
				const waterMask = objectPosition( camera ).y.greaterThan( waterLevel );
				const scenePassColorBlurred = gaussianBlur( scenePassColor );
				scenePassColorBlurred.directionNode = waterMask.select( scenePassDepth, scenePass.getLinearDepthNode().mul( 5 ) ).toInspector( 'Post-Processing / Blur Strength [ Depth ]', ( node ) => node.toFloat() );

				const vignette = screenUV.distance( .5 ).mul( 1.35 ).clamp().oneMinus().toInspector( 'Post-Processing / Vignette' );

				renderPipeline = new THREE.RenderPipeline( renderer );
					
				console.log('post processing with water level ' + waterLevel );
				// postProcessing.outputNode = scenePassColor.add( bloomPass );
				if (hasBloom) {
					console.log("bloom with waater");
					// postProcessing.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ).mul( vignette ) ).add( bloomPass );
					renderPipeline.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ).mul( bloomPass ));
				} else {
					renderPipeline.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ));
				}
				// renderPipeline.outputNode = scenePassColor.add( bloomPass );
			} else {
				// const waterMask = objectPosition( camera ).y.greaterThan( -10 );

				renderPipeline = new THREE.RenderPipeline( renderer );
				// const scenePass = pass( scene, camera );
				// const scenePassColor = scenePass.getTextureNode();
				// const scenePassColorBlurred = gaussianBlur( scenePassColor );

				// const vignette = screenUV.distance( .5 ).mul( 1.35 ).clamp().oneMinus();
				
				// scenePassColorBlurred.directionNode = scenePass.getLinearDepthNode().mul( 3 ); //just fake dof
				// renderPipeline = new THREE.renderPipeline( renderer );
				// renderPipeline.outputNode = scenePassColor.add( bloomPass );
				if (hasDOF) {
					// scenePassColorBlurred.directionNode = scenePass.getLinearDepthNode().mul( 3 );
				} else {
					
				}
				if (hasBloom) {
					// renderPipeline.outputNode = scenePassColorBlurred.add( bloomPass );
					renderPipeline.outputNode = outlineColor.add( scenePassColor.add( bloomPass ));
				} else if (hasOutline) {
					// renderPipeline.outputNode = distanceMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ) );
					if (hasDOF) {
					// renderPipeline.outputNode = outlineColor.add(scenePassColorBlurred);
					// renderPipeline.outputNode = distanceMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ) );
					renderPipeline.outputNode = outlineColor.add(dofPass);
					} else {
						const scenePass = pass( scene, camera );
						renderPipeline.outputNode = outlineColor.add(scenePass);
					}
				} else {
					console.log('post processing no water');
					if (hasDOF) {
					// renderPipeline.outputNode = scenePassColorBlurred;
					renderPipeline.outputNode = dofPass;
					} else {
						const scenePass = pass( scene, camera );
						renderPipeline.outputNode = scenePass;
					}
				}
			}
	
		}
		LoadKinematicAgentMeshes();

	} //end init systems

	// export function createDefaultNavmesh() {
	// 	const planeGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); // 50 x 50
	// //   planeGeometry.rotation.x = Math.PI / 2 * -1;
	// 	const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'hotpink' });
	// 	let navmeshObject = new THREE.Mesh(planeGeometry, planeMaterial);
		
	// 	// navmeshObject.position.set(0,0,0);
	// 	// navmeshObject.scale.set(1,1,1);
	// 	navmeshObject.rotation.x = Math.PI / 2;
	// 	navmeshObject.updateMatrixWorld();
	// 	navmesh = navmeshObject;
		
	// 	scene.add(navmeshObject);
	// }


	export function togglePostProcessing () { //call after physics is done, elsewise... :(

		doPostProcessing = !doPostProcessing;
				console.log("tryna toggle post processing " + doPostProcessing);
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
	if (clock && isReady) {
				

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
			interactionManagers.forEach(i => 
					i.update());

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

				if (movingMeshes.length) {
					movingMeshes.forEach(m => 
						m.update(time)
					)
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
			// if (!cameraAtZero) {
			// 	camera.lookAt(camera.parent);
			// }

			// if (playerNavAgent && playerReadyToNav) {
			// 	playerNavAgent.update();
			// }

			if (doPostProcessing) {
				if (renderPipeline) {
					renderPipeline.render();
				}
			} else {
				renderer.render(scene, camera);
			}

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




