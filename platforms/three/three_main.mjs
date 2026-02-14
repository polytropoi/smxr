	import * as THREE from 'three/webgpu';

	import { color, vec2, pass, objectPosition, screenUV, 
		time, uniform } from 'three/tsl';
	
	import { outline } from 'three/addons/tsl/display/OutlineNode.js';
	// import { PostProcessing } from 'three/addons/nodes/PostProcessing.js';

	import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

	import { bloom } from 'three/addons/tsl/display/BloomNode.js';

	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



	import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
	import { SetSceneLocations, userData } from '../../../connect/connect.js';

	import { CreatePlayerAgent, InitPathfinding, agentParents, agents, closestNavmeshPoint, playerNavAgent } from './three_nav.js';

	import { getRainbowMaterial } from './tsl/rainbow.js'

	import { InitSurface, InstanceOnSurface, instancedModels } from './three_instance.js';

	import { UpdateText, InitReticle, ThreeText, lookAtCameraObjects } from './three_ui.js';

	import { world, initRapier, physicsIsReady, dynamicBodies, rapierDebugRenderer, 
		eventQueue, kinematicBodies, worldIsReady, initStaticObjex, 
		initAtoms, atomicBodies, getPlayerBody, initHandColliderGroup, handColliderGroup} from './three_physics.js';

	import { InitEnvMap, InitSky, InitFog } from './three_sky.js';

	import { getVideo, getHandLandmarker } from './three_vision.js';

	import { lightMods, modLights } from './three_lights.js';


	import { controls, player, camera, isReady, UpdateControls, cameraWorldPosition, SetPlayerLocation } from './three_controls.js';

	import Stats from './ui/stats.js';
	
	import { SetControls, onKeyDown, onKeyUp, onMouseDown, onMouseMove, onMouseUp, onMouseWheel} from './three_controls.js';

	export let scene, navmesh, surface;

	let locationData;
	let modelsData;
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
	let showDebug = false;
	// export let controls;

	export let selectedObjects = [];

	let doPostProcessing = false;
	
	export let activeObjex = []; //raycastable

	export let staticObjex = []; //physics
	export let dynamicObjex = []; //""

	let navmeshObjex = [];
	let surfaceObjex = [];

	export let cameraMode = "Orbit"; //default

	export let groundObjex = [];


	let playerPosition;
	
	let speed = 0.0;
	
	let video, videomesh, handLandmarker, useHandLandmarks;
	
	eventEl.addEventListener('ready-event', init); //fired when settings are loaded..



	async function loadModel(url) {
		const loader = new GLTFLoader();
		try {
			const gltf = await loader.loadAsync(url);
			// scene.add(gltf.scene);
			return gltf.scene;
		} catch (error) {
			console.error('An error happened during model loading', error);
		}
	}

	////////////// SCENE INIT FUNCTION 

	async function init() {

		scene = new THREE.Scene();
		renderer = new THREE.WebGPURenderer({antialias: true});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setAnimationLoop( animate );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

		document.body.appendChild( renderer.domElement );

		cameraMode = settings.sceneCameraMode;

		SetControls(cameraMode);
		
			
		InitEnvMap();
	// 		const pmremGenerator = new THREE.PMREMGenerator(renderer);
	// scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;



		if (settings && settings.sceneTags && settings.sceneTags.includes("no gravity") ) {
			const gravity = {x:0, y:0, z:0};
			await initRapier(gravity); 
		} else {
			const gravity = {x:0, y:-9.81, z:0}; //"earthlike"
			await initRapier(gravity); //gravityMode
		}
		
		let modelsDataEl = document.getElementById('modelsData');
		if (modelsDataEl) {
			const theModelsData = modelsDataEl.getAttribute('data-models');
			modelsData = JSON.parse(atob(theModelsData));
			console.log("modelsData " + JSON.stringify(modelsData));
		}

		let locationDataEl = document.getElementById('locationData');
		if (locationDataEl) {
			const theLocationData = locationDataEl.getAttribute('data-locations');

			locationData = JSON.parse(atob(theLocationData));
			SetSceneLocations(locationData);
			console.log("locationData " + JSON.stringify(locationData));
			
			(async () => {
				try { 
					for (let i = 0; i < locationData.length; i++) {
						if (locationData[i].modelID && locationData[i].modelID != "none") {
							for (let m = 0; m < modelsData.length; m++) {
								if (locationData[i].modelID == modelsData[m]._id) {
									locationData[i].isHidden = false;
									console.log("gotsa location model! " +modelsData[m].modelURL);
									
									const model = await loadModel(modelsData[m].modelURL); //loaded but not added to scene - wait for navmesh, surfaces, physics etc.
																				
									console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
									
									if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
									
										locationData[i].isHidden = true;
										// console.log("tryna hide model " + child.name);
									}															
									
									// const transmat = new THREE.MeshBasicNodeMaterial( { transparent: true, opacity: 0, color: 0x111111, depthWrite :false});
									model.traverse(function (child) {
										
										if (child.isMesh){
											child.castShadow = true;
            								child.receiveShadow = true;
											console.log("loaded mesh with tags " + locationData[i].locationTags);
											if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
												// child.material = transmat;
												child.material.transparent = true;
												child.material.opacity = 0;
												// locationData[i].isHidden = true;
												console.log("tryna hide model " + child.name);
											} else {
												// if (child.material.envMap) {
												// child.castShadow = true;	
												// child.receiveShadow = true;
												// child.material.envMap = scene.environment;
												// }
												
												if (child.material) {
													console.log("setting scene.environment envmap " + scene.environment );
													// child.material.roughness = 0.5;
													child.material.envMap = scene.environment;
													child.envMapIntensity = 5;
													child.castShadow = true;	
													child.receiveShadow = true;
												}
												
											}
											
											if (locationData[i].markerType == "navmesh" ) {
												// if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh")) {
													navmesh = child;
													navmesh.userData.name = "navmesh";
													groundObjex.push(navmesh);
													activeObjex.push(navmesh);
													// child.material = transmat;
													// InitPathfinding(); //no
												// }
											} else if (locationData[i].markerType == "surface" ) {
												// if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {
													surface = child;
													// child.material = transmat;
													// InitSurface();
												// }
											}
											if (locationData[i].eventData.includes("static")) {

												
												let staticObject = {};
												staticObject.mesh = child;
												staticObject.locationData = locationData[i];
												staticObject.isHidden = locationData[i].locationTags && locationData[i].locationTags.includes("hide");
												console.log("gotsa static object ishidden " + staticObject.isHidden);
												staticObjex.push(staticObject);
											} else if  (locationData[i].eventData.includes("dynamic")) {
												dynamicObjex.push(model);

											} else {
												// child.mesh.layers.set(1);
												// child.mesh.userData = locationData[i];	
											}
													
										}
									});


									if (locationData[i].eventData && locationData[i].eventData.includes("instance") ) { //gonna make a bunch and get scattered
										console.log("tryna instance model " + locationData[i].name);
										let instancedModel = {};
										// const countsplit = locationData[i].eventData.split("~");
										// const count = countsplit[1];
										instancedModel.model = model;
										instancedModel.locationData = locationData[i];
										instancedModel.modelData = modelsData[m];
										instancedModel.scale = locationData[i].yscale ? locationData[i].yscale : 1;
										// instancedModel.count = count;
										instancedModels.push(instancedModel);
										console.log("instancedModels length " + instancedModels.length);
										model.visible = false;
										scene.remove(model);
									} else { // regular meshes
										console.log(locationData[i].name + " adding to scene at location " + locationData[i].x + locationData[i].y + locationData[i].z);
																				
										model.position.set(parseFloat(locationData[i].x),parseFloat(locationData[i].y),parseFloat(locationData[i].z));
										const xscale = locationData[i].xscale ? locationData[i].xscale : 1;
										const yscale = locationData[i].yscale ? locationData[i].yscale : 1;
										const zscale = locationData[i].zscale ? locationData[i].zscale : 1;

										model.scale.set(xscale,yscale,zscale);
										// model.layers.set(1);
										model.userData = locationData[i];
										model.name = "model_" + locationData[i].name;
										// model.castShadow = true;
										// model.receiveShadow = true;
										if (locationData[i].locationTags.includes("active")) {
											activeObjex.push(model);
										}
										
										
										scene.add(model);
										// activeObjex.push(model);
																			
									}
									break; //only match one model per location!?
								}
							}
						} else {
							if (locationData[i].markerType == "navmesh") {
								createDefaultNavmesh();
							}
							if (locationData[i].markerType == "surface") {
								createDefaultSurface();
							}
							if (locationData[i].markerType == "player") {
								console.log("playerposition " + JSON.stringify(locationData[i]));
								playerPosition = locationData[i];
								SetPlayerLocation(locationData[i]);
							}
							if (locationData[i].markerType == "light") {
								createLight(locationData[i]);
							}

			
						}
						// console.log("locationData " + i + " of "  + locationData.length);
					}
					// console.log("looking for Surface with models " + instancedModels.length);
					
				} catch (e) {
					console.error("ERROR LOADING GLTF! " + e);
				} finally {
					
					initSystems();
				}
			})();
			
		}

		async function initSystems() {
			// if (staticObjex.length) { //eg ground and stuff
				await initStaticObjex();  //creates default if none provided
			// }

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
					InstanceOnSurface(instancedModels[i].model, count, scale, yMod, shader);
							
				} 
			}

			if (navmesh) {
				await InitPathfinding(); //creates agents and scatters them on navmesh, then adds kinematic rigidbodies
				
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
				initAtoms(centerPosition, 10, 1);
			}

			if (cameraMode == "Third Person") {
				const playerBody = await getPlayerBody();
				kinematicBodies.push(playerBody);
				const avatarName = userData.avatarName
				ThreeText(avatarName, 10, player);
				// CreatePlayerAgent(player, player.position.clone());
			}
			//  await new Promise(r => setTimeout(r, 000)); //fudge
			initEvents();
			// const texttest = "I have often wondered if the majority of mankind ever pause to reflect upon the occasionally titanic significance of dreams, and of the obscure world to which they belong. Whilst the greater number of our nocturnal visions are perhaps no more than faint and fantastic reflections of our waking experiences"
			// 			ThreeText(texttest);
		}

		function createDefaultNavmesh() {
			const planeGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); // 50 x 50
		//   planeGeometry.rotation.x = Math.PI / 2 * -1;
			const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'hotpink' });
			let navmeshObject = new THREE.Mesh(planeGeometry, planeMaterial);
			
			// navmeshObject.position.set(0,0,0);
			// navmeshObject.scale.set(1,1,1);
			navmeshObject.rotation.x = Math.PI / 2;
			navmeshObject.updateMatrixWorld();
			navmesh = navmeshObject;
			
			scene.add(navmeshObject);
		}

		// console.log("settings " + JSON.stringify(settings));

		// scene.backgroundNode = normalWorld.y.mix( color( settings.sceneColor1 ), color( settings.sceneColor2 ) );


		
		const sunLight = new THREE.DirectionalLight( settings.sceneColor1, 2 );
		sunLight.castShadow = true;
		sunLight.shadow.camera.near = .5;
		sunLight.shadow.camera.far = 50;
		sunLight.shadow.camera.right = 2;
		sunLight.shadow.camera.left = - 2;
		sunLight.shadow.camera.top = 1;
		sunLight.shadow.camera.bottom = - 2;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.bias = - 0.001;
		sunLight.position.set( 1, 3, 1 );

		const waterAmbientLight = new THREE.HemisphereLight( settings.sceneColor3, settings.sceneColor4, .5 );
		const skyAmbientLight = new THREE.HemisphereLight( settings.sceneColor2, settings.sceneColor3, .5 );

		scene.add( sunLight );
		scene.add( skyAmbientLight );
		scene.add( waterAmbientLight );

		clock = new THREE.Clock();

		// animated model

		// const loader = new GLTFLoader();
		// loader.load( 'models/gltf/Michelle.glb', function ( gltf ) {

		// 	model = gltf.scene;
		// 	model.children[ 0 ].children[ 0 ].castShadow = true;

		// 	mixer = new THREE.AnimationMixer( model );

		// 	const action = mixer.clipAction( gltf.animations[ 0 ] );
		// 	action.play();

		// 	scene.add( model );

		// } );


		if (settings && settings.sceneTags) {
			// if (settings.sceneTags.includes("debug")) {
			// stats.showPanel( 0,1,2,3 );
					stats = new Stats();
					const statsContainer = document.createElement('div');
					statsContainer.id = 'stats-container';
					document.body.appendChild(statsContainer);
					statsContainer.appendChild(stats.dom);

			// document.body.appendChild(stats.domElement);
			// stats.domElement.style.right = 'auto';
			// stats.domElement.style.left = '0px'; // Positioned at top-right
			// stats.domElement.style.bottom = '20px';

			// }
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

			// }
		}
		

		// InitEnvMap();
		InitSky();
		InitFog();

		

		const scenePass = pass( scene, camera );
		const scenePassColor = scenePass.getTextureNode();
		const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );
		// const selectedObjects = [ mesh ]; // Array of meshes to outline
		const edgeStrength = uniform( 3.0 );

		const edgeThickness = uniform( 1.0 );
		const visibleEdgeColor = uniform( new THREE.Color( 0xffffff ) );
		const hiddenEdgeColor = uniform( new THREE.Color( 0x4e3636 ) );

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
		
		let hasBloom = false;
		let hasOutline = false;

		let emissivePass;
		let bloomPass;
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
			// const waterMask = objectPosition( camera ).y.greaterThan( screenUV.y.sub( .5 ).mul( camera.near ) ).toInspector( 'Post-Processing / Water Mask' );
			const waterMask = objectPosition( camera ).y.greaterThan( waterLevel );
			const scenePassColorBlurred = gaussianBlur( scenePassColor );
			scenePassColorBlurred.directionNode = waterMask.select( scenePassDepth, scenePass.getLinearDepthNode().mul( 5 ) ).toInspector( 'Post-Processing / Blur Strength [ Depth ]', ( node ) => node.toFloat() );
			const vignette = screenUV.distance( .5 ).mul( 1.35 ).clamp().oneMinus().toInspector( 'Post-Processing / Vignette' );

			postProcessing = new THREE.PostProcessing( renderer );
			// postProcessing.outputNode = scenePassColor.add( bloomPass );
			if (hasBloom) {
				console.log("bloom with waater");
				postProcessing.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ).mul( vignette ) ).add( bloomPass );
			} else {
				postProcessing.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ).mul( vignette ) );
			}
			// postProcessing.outputNode = scenePassColor.add( bloomPass );
		} else {
			// const waterMask = objectPosition( camera ).y.greaterThan( -10 );
			const scenePassColorBlurred = gaussianBlur( scenePassColor );
			
			scenePassColorBlurred.directionNode = scenePass.getLinearDepthNode().mul( 2 ) //just fake dof
			postProcessing = new THREE.PostProcessing( renderer );
			// postProcessing.outputNode = scenePassColor.add( bloomPass );
			if (hasBloom) {
				// postProcessing.outputNode = scenePassColorBlurred.add( bloomPass );
				postProcessing.outputNode = outlineColor.add( scenePassColorBlurred.add( bloomPass ));
			} else if (hasOutline) {
				// postProcessing.outputNode = distanceMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ) );
				postProcessing.outputNode = outlineColor.add(scenePassColorBlurred);
			} else {
				postProcessing.outputNode = scenePassColorBlurred;
			}
	
		}
		

	} //end init!

	function createLight(locationData) {
		console.log("tryna create light ");
		const light = new THREE.PointLight( 0xff0000, 25, 100 );
		light.position.set(locationData.x, locationData.y, locationData.z);
		scene.add(light);
		lightMods.push(light);
	}

	export function togglePostProcessing () { //call after physics is done, elsewise... :(

		doPostProcessing = !doPostProcessing;
				console.log("tryna toggle post processing " + doPostProcessing);
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

			if (agents.length) {
				agents.forEach(a =>
					a.update(delta));
			}
			if (rapierDebugRenderer && showDebug) {
				rapierDebugRenderer.update();
			}		
			if (world && physicsIsReady && worldIsReady) {
				
				atomicBodies.forEach(b => 
					b.update());

				dynamicBodies.forEach(b => 
					b.update());
			
				kinematicBodies.forEach(c => 
					c.update());

				world.step();//!!! still wonky with lots of dynamic and kinematic
			}

			if (lightMods.length) {
				// console.log("lightmods length " + lightMods.length);
				modLights(time);
				// light.intensity = Math.sin(time) * 5;
			}
			lookAtCameraObjects.forEach(l => 
				l.lookAt(cameraWorldPosition)
			)

			// if (playerNavAgent && playerReadyToNav) {
			// 	playerNavAgent.update();
			// }

			if (doPostProcessing) {
				postProcessing.render();
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
			
		} //isReady

		// water.material.uniforms['time'].value += 1 / 60;
	}


/////// events and listeners and handlers



//physics events
		// eventQueue.drainCollisionEvents((handle1, handle2, started) => {
		// if (started) {
		// 	console.log("Collision started between", handle1, "and", handle2);
		// } else {
		// 	console.log("Collision stopped between", handle1, "and", handle2);
		// }
		// });

////////// global events	

	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

	function initEvents () {


		document.addEventListener( 'keydown', onKeyDown );
		document.addEventListener( 'keyup', onKeyUp );
		document.addEventListener ('mousedown', onMouseDown );
		document.addEventListener ('mouseup', onMouseUp );
		document.addEventListener("wheel", onMouseWheel, false);
		document.addEventListener('mousemove', onMouseMove);

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




