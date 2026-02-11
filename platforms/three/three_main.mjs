	import * as THREE from 'three/webgpu';

	import { color, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, objectPosition, screenUV, 
		viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, 
		time, fog, float, triNoise3D, positionView, uniform } from 'three/tsl';
	
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

	import { createLight, lightMods } from './three_lights.js';


	import { controls, player, camera, isReady, UpdateControls, cameraWorldPosition } from './three_controls.js';

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


	let doPostProcessing = false;
	
	export let activeObjex = []; //raycastable

	export let staticObjex = []; //physics
	export let dynamicObjex = []; //""

	let navmeshObjex = [];
	let surfaceObjex = [];

	export let cameraMode = "Orbit"; //default

	export let groundObjex = [];
	// let moveForward = false;
	// let moveBackward = false;
	// let moveLeft = false;
	// let moveRight = false;
	// let canJump = false;

	let playerPosition;
	// let playerSpeed = 5;
	// let prevTime = performance.now();
	// const velocity = new THREE.Vector3();
	// const direction = new THREE.Vector3();


	// export let player;
	// let keys, follow;
	
	// var dir = new THREE.Vector3;
	// let playerDirection = new THREE.Vector3();
	// var playerVector = new THREE.Vector3;
	// var goalVector = new THREE.Vector3;
	// // var followDistance = 20;
	// let fVelocity = 0.0;
	let speed = 0.0;
	// let cameraWorldPosition = new THREE.Vector3();


	// let arrowHelper;
	// let lastRaycastHitPosition;
	// let lastRaycastHitObject;
	// let playerNavAgent;
	// let playerReadyToNav = false;
	let video, videomesh, handLandmarker, useHandLandmarks;
	// const { video, handLandmarker } = await getVisionStuff();

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
		
		// if (cameraMode == "Fixed") {

			// 	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
			// 	camera.position.z = 5;
				
				
			// 	isReady = true;
			// } else if (cameraMode == "Fly") {
			// 	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
			// 	camera.position.set( 0, 5, 15 );
			// 		camera.lookAt( 0, 1, 0 );
			// 	controls = new FlyControls( camera, renderer.domElement );
			// 	controls.dragToLook = true;
			// 	controls.movementSpeed = 1;
			// 	controls.rollSpeed = Math.PI / 24;
			// 	controls.autoForward = false;
			// 	console.log("tryna set fly controls");
			// 	isReady = true;
			// } else if (cameraMode == "Orbit") {
			// 								camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
			// 		camera.position.set( 0, 5, 15 );
			// 		camera.lookAt( 0, 1, 0 );
			// 	controls = new OrbitControls( camera, renderer.domElement );
			// 	controls.minDistance = 1;
			// 	controls.maxDistance = 300;
			// 	controls.maxPolarAngle = Math.PI * 0.5;

			// 	// controls.autoRotate = true;
			// 	// controls.autoRotateSpeed = 1;
			// 	controls.target.set( 0, .2, 0 );
			// 	controls.update();
			// 	isReady = true;


			// 	const blocker = document.getElementById( 'blocker' );
			// 	const instructions = document.getElementById( 'instructions' );
			// 	blocker.style.display = "none";
			// 	instructions.style.display = "none";
			// 	// camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
			// 	// camera.position.set( 10, 50, 10 );
			// 	// camera.lookAt( 0, 1, 0 );
			// 	mousecaster = new THREE.Raycaster();
			// } else if (cameraMode == "Third Person") {
				
			// 	const blocker = document.getElementById( 'blocker' );
			// 	const instructions = document.getElementById( 'instructions' );
			// 	blocker.style.display = "none";
			// 	instructions.style.display = "none";
			// 	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
			// 	// camera.position.set( 0, followDistance, -followDistance );
			// 	camera.position.set( 0, 10, -followDistance );
			// 		camera.lookAt( 0, 1, 0 );

					
			// 		// controls.enabled = false;
			// 	// controls.autoRotate = true;
			// 	// controls.autoRotateSpeed = 1;
				

			// 	mousecaster = new THREE.Raycaster();	
			// 	downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
			// 	playcaster = new THREE.Raycaster();
			// 	var geometry = new THREE.CapsuleGeometry( 1, 2, 4, 8, 1 );
			// 	var material = new THREE.MeshBasicMaterial({"wireframe": true});

			// 	player = new THREE.Mesh( geometry, material );
			// 	player.userData.name = "player";
			// 	activeObjex.push(player);

			// 	goal = new THREE.Object3D;
			// 	// follow = new THREE.Object3D;

			// 	goal.position.z = -followDistance;
			// 	goal.add( camera );

			// 	controls = new OrbitControls( camera, renderer.domElement );
			// 		controls.minDistance = 1;
			// 		controls.maxDistance = 150;
			// 		controls.maxPolarAngle = Math.PI * .4;
			// 							controls.minPolarAngle = Math.PI * .25;

			// 	// pivot = new THREE.Object3D();
			// 	// scene.add(pivot);
			// 	// pivot.position.copy(camera.position); // Initialize the pivot at the camera's starting position

			// 	// Optional: offset the camera slightly from the pivot point
			// 	camera.position.z = 1; // Position the camera slightly behind the pivot
			// 	// pivot.add(camera);

			// 	scene.add( player );
			// 	// console.log("ADDING PLAYER FOR THIRD PERSON");
			// 	// keys = {
			// 	// 	a: false,
			// 	// 	s: false,
			// 	// 	d: false,
			// 	// 	w: false
			// 	// };
			// 	fVelocity = 0.0;
			// 	camera.lookAt(player.position);
			// 	// controls.target.set(player.position);
			// 	const dir = new THREE.Vector3(); // Direction (will be updated)
			// 	const origin = new THREE.Vector3(); // Origin (will be updated)
			// 	const length = 10; // Length of the arrow
			// 	const hex = 0xff0000; // Color (e.g., red)

			// 	arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
			// 	scene.add(arrowHelper);


			// 	isReady = true;
			// } else {
			// 	// camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
			// 		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
			// 		camera.position.set(0,10,0);
			// 	controls = new PointerLockControls( camera, document.body ); //use regular fp controls if has navmesh
			// 	downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
			
			// 	centercaster = new THREE.Raycaster();
			// 	// mousecaster = new THREE.Raycaster();

			// 	reticle = InitReticle();
			// 	reticle.position.z = -0.5;
			// 	camera.add(reticle);

			// 	controls.pointerSpeed = .25;

			// 	const blocker = document.getElementById( 'blocker' );
			// 	const instructions = document.getElementById( 'instructions' );
			// 					blocker.style.display = "block";
			// 	instructions.style.display = "block";

			// 	instructions.addEventListener( 'click', function () {

			// 		controls.lock();

			// 	} );

			// 	controls.addEventListener( 'lock', function () {

			// 		instructions.style.display = 'none';
			// 		blocker.style.display = 'none';

			// 	} );

			// 	controls.addEventListener( 'unlock', function () {

			// 		blocker.style.display = 'block';
			// 		instructions.style.display = '';

			// 	} );

			// 	scene.add( controls.object );
			// 	// controls.update();
			// 	isReady = true;


			// }

		// }
			



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
												child.castShadow = true;	
												child.receiveShadow = true;
												child.material.envMap = scene.environment;
												// }
												
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
										model.castShadow = true;
										model.receiveShadow = true;
										// model.material.envMap = scene.environment;
										// model.envMapIntensity = 2;
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

		const waterAmbientLight = new THREE.HemisphereLight( settings.sceneColor3, settings.sceneColor4, 1 );
		const skyAmbientLight = new THREE.HemisphereLight( settings.sceneColor2, 0, 1 );

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
		

		InitEnvMap();
		InitSky();
		InitFog();

		const scenePass = pass( scene, camera );
		const scenePassColor = scenePass.getTextureNode();
		const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );
		let hasBloom = false;
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
				postProcessing.outputNode = scenePassColorBlurred.add( bloomPass );
			} else {
				// postProcessing.outputNode = distanceMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor2 ) ) );
				postProcessing.outputNode = scenePassColorBlurred;
			}
	
		}
		

	} //end init!

	export function togglePostProcessing () { //call after physics is done, elsewise... :(
		console.log("tryna toggle post processing");
		doPostProcessing = !doPostProcessing;
	}


////////////// MAIN LOOP FOR ALL THE THINGS ////////////////
	function animate() {
		// const time = performance.now();
		// scene.updateMatrixWorld(true);
	if (clock && isReady) {
					// if (cameraMode == "Fixed") {
					// 	if (useHandLandmarks) {
							
					// 	}
					// } else if (settings && controls && cameraMode == "Fly") { //easy peasy
					// 	// controls.update(time);
					// 				const delta = clock.getDelta();
							
					// 		controls.update( delta );
					
					// } else if (settings && controls && cameraMode == "Orbit") { //easy peasy
					// 	controls.update();
					// 	cameraWorldPosition.copy(camera.position);
					// } else if (settings && player && cameraMode == "Third Person") { // kinda combines follow cam and orbit control
					// 	speed = 0.0;
						
					// 	// if (!playerReadyToNav) {
							
							
					// 		if ( moveForward ) {
					// 			// camera.lookAt( player.position );
					// 			// controls.target.set(player.position.x, player.position.z, player.position.z);
					// 			speed = .2;
					// 			// console.log("speed " + speed);		
					// 		} else if ( moveBackward ) {
					// 			// camera.lookAt( player.position );
					// 			// controls.target.set(player.position.x, player.position.z, player.position.z);
					// 			speed = -.2;
					// 		}
									
					// 		fVelocity += ( speed - fVelocity ) * .5;
					// 		player.translateZ( fVelocity );
					// 		camera.getWorldPosition(cameraWorldPosition); //bc it's a child in this mode
					// 		camera.lookAt( player.position );

					// 		if ( moveLeft ) {
					// 			player.rotateY(0.025);
					// 		} else if ( moveRight ) {
					// 			player.rotateY(-0.025);
					// 		}
								
					// 		playerVector.lerp(player.position, .5);
					// 		goalVector.copy(goal.position);
							
					// 		dir.copy( playerVector ).sub( goalVector ).normalize();
					// 		const dis = playerVector.distanceTo( goalVector ) - followDistance;
					// 		goal.position.addScaledVector( dir, dis );

							
					// 		// console.log("goal position " + JSON.stringify(goal.position));
					// 		//temp.setFromMatrixPosition(goal.matrixWorld);
							
					// 		//camera.position.lerp(temp, 0.2);
							

					// 		downcaster.ray.origin.copy( player.position );
					// 		downcaster.ray.origin.y += 10;
					// 		// console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
					// 		const intersections = downcaster.intersectObjects( groundObjex, false ); //groundObjex == navmesh
					// 		if (!intersections.length) {
					// 			//off the navmesh, get closest point and go back
					// 			// velocity.x = 0;
					// 			// velocity.y = 0;
					// 			// velocity.z = 0;
					// 			const goodSpot = closestNavmeshPoint(player.position);
					// 			if (goodSpot) {
					// 				player.position.set(goodSpot.x, goodSpot.y, goodSpot.z); 
					// 				console.log("back to goodSpot " + JSON.stringify(goodSpot));
					// 			}
					// 		} else {
					// 			// velocity.y = 0;
					// 			// intersections[0].point.x = 
					// 			player.position.y = intersections[0].point.y + 2; //needs offset var, player location y?

							
					// 		// console.log("gotsa navmesh mousehit " + JSON.stringify(raycastHits[0].point));
					// 		// const localNormal = intersections[0].face.normal;
							
					// 		// const worldNormal = localNormal.clone().transformDirection(intersections[0].object.matrixWorld);
							
					// 		// player.lookAt(worldNormal);
					// 		// rotateObjectToNormal(player, worldNormal);
					// 		// player.rotateZ(worldNormal.z);
								
					// 			canJump = true; //not really
					// 		}

							



					// 		if (controls) { //toggle?
					// 			controls.update();
					// 		}

					// 	// }
					// 	const origin = player.position.clone();
					// 		player.getWorldDirection(playerDirection);
					// 		playcaster.set(origin, playerDirection);
					// 	arrowHelper.setDirection(playcaster.ray.direction);
					// 	arrowHelper.position.copy(playcaster.ray.origin);
					// 	playerRaycast();
								

					// } else { //First personc cam w/ pointer lock and center cursor
					// 	cameraWorldPosition.copy(camera.position);
					// 	if ( navmesh && controls && controls.isLocked === true ) {
										
					// 		downcaster.ray.origin.copy( controls.object.position );
					// 		downcaster.ray.origin.y += 10;
					// 		// console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
					// 		const intersections = downcaster.intersectObjects( groundObjex, false ); //groundObjex == navmesh
					
					// 		const onObject = intersections.length > 0;
					// 		if (onObject) {
					// 			// console.log(JSON.stringify(controls.object.position) + " pos " + groundObjex.length + " groundObjex with intersections " + intersections.length + " distance to 0th " + intersections[0].distance + " point.y " + intersections[0].point.y + " camera y " + controls.object.position.y);
					// 		}
					
					// 		const delta = ( time - prevTime ) / 1000;
					
					// 		velocity.x -= velocity.x * 12 * delta;
					// 		velocity.z -= velocity.z * 12 * delta;
					
					// 		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
					
					// 		direction.z = Number( moveForward ) - Number( moveBackward );
					// 		direction.x = Number( moveRight ) - Number( moveLeft );
					// 		direction.normalize(); // this ensures consistent movements in all directions
					
					// 		if ( moveForward || moveBackward ) velocity.z -= direction.z * 20.0 * (playerSpeed) * delta;
					// 		if ( moveLeft || moveRight ) velocity.x -= direction.x * 20.0 * (playerSpeed) * delta;
					
					// 		if ( onObject === true ) {
					
					// 			velocity.y = Math.max( 0, velocity.y );
					// 			canJump = true;
					
					// 		}
					
					// 		// console.log("delta " + delta + " direction " + JSON.stringify(direction) + " velocity " + JSON.stringify(velocity));
					// 		controls.moveRight( - velocity.x * delta );
					// 		controls.moveForward( - velocity.z * delta );
					
					// 		controls.object.position.y += ( velocity.y * delta ); // new behavior
					
					// 		// if ( controls.object.position.y < - 10 ) {
					
					// 		// } else {
					// 			if (!intersections.length) {
					// 				//off the navmesh, get closest point and go back
					// 				velocity.x = 0;
					// 				velocity.y = 0;
					// 				velocity.z = 0;
					// 				const goodSpot = closestNavmeshPoint(controls.object.position);
					// 				if (goodSpot) {
					// 					controls.object.position.set(goodSpot.x, goodSpot.y, goodSpot.z); 
					// 					console.log("back to goodSpot " + JSON.stringify(goodSpot));
					// 				}
					// 			} else {
					// 				velocity.y = 0;
					// 				// intersections[0].point.x = 
					// 				controls.object.position.y = intersections[0].point.y + 4;
									
					// 				canJump = true;
					// 			}
					// 	centerRaycast();
					
					// 	}
					// }
					// 	prevTime = time;
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
				for (let i = 0; i < lightMods.length; i++) {
					lightMods[i].intensity = Math.sin(time * .001) * 100;
				}
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

	// function mouseRaycast (e) {

	// 	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	// 	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	// 	// console.log("mouse pos " + JSON.stringify(mouse));
	// 	mousecaster.setFromCamera(mouse, camera);

	// 	var raycastHits = mousecaster.intersectObjects(activeObjex, true);
	// 	let selectColor = new THREE.Color(0xff3333);
	// 	let stopColor = new THREE.Color(0x26de57);
	// 	let goColor = new THREE.Color(0xff0000);
	// 	if (raycastHits.length > 0) {
			
	// 	// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
	// 	// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
	// 		if (raycastHits[0].object.userData.name == "navmesh") {
	// 			lastRaycastHitObject = raycastHits[0].object; 
	// 			// console.log("gotsa navmesh mousehit " + JSON.stringify(raycastHits[0].point));
	// 			lastRaycastHitPosition = raycastHits[0].point;
	// 			const localNormal = raycastHits[0].face.normal;
				
	// 			const worldNormal = localNormal.clone().transformDirection(raycastHits[0].object.matrixWorld);
	// 			// console.log("hit worldnormal " + JSON.stringify(worldNormal));
	// 			pointerGizmo.position.set(raycastHits[0].point.x,raycastHits[0].point.y,raycastHits[0].point.z);
	// 			// pointerGizmo.lookAt(worldNormal);
	// 			rotateObjectToNormal(pointerGizmo, worldNormal);
	// 		} else if (raycastHits[0].object.userData.name == "player") {

	// 			lastRaycastHitPosition = raycastHits[0].point;
	// 			lastRaycastHitObject = raycastHits[0].object; 
	// 			// const distance = 5;
	// 			// camera.position.sub(controls.target).setLength(distance).add(controls.target);
	// 			// controls.update();
	// 			// console.log("tryna reset controls");

	// 		} else if (raycastHits[0].object.name.includes("agent")) {

	// 			lastRaycastHitObject = raycastHits[0].object;
	// 			if ( raycastHitAgent != raycastHits[ 0 ].object ) {
	// 				console.log ("new mouse raycast hit on agent " + raycastHits[0].object.name);
	// 				raycastHitAgent = raycastHits[ 0 ].object;	
	// 				if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
	// 					console.log("intersected material found!");
	// 					raycastHitAgent.material.materialColor = goColor;
	// 				} else if (raycastHitAgent && raycastHitAgent.material) {
	// 					raycastHitAgent.material.color = goColor;
					
	// 				}
	// 				const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //can do this easier, but good to know
	// 				if (navAgentInstance) {
	// 					navAgentInstance.agentRaycastHit();
	// 				}
	// 			} else {
	// 				// console.log("rehit agent " + raycastHits[0].object.name));
	// 			}
	// 		} else {
	// 			if ( raycastHitAgent ) {
	// 				if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 					// console.log("tryna reset agent colornode after no hit");
	// 					raycastHitAgent.material.materialColor = stopColor;
	// 					raycastHitAgent.material.needsUpdate = true;
						
	// 				} else if (raycastHitAgent.material) {
	// 					// console.log("tryna reset agent color after no hit");
	// 					raycastHitAgent.material.color = stopColor;
	// 				}
	// 			}
	// 			raycastHitAgent = null;
	// 			lastRaycastHitObject = null;
	// 		}
	// 	} else {
	// 		if (lastRaycastHitObject) {
	// 			lastRaycastHitObject = null;
	// 		}
	// 		if ( raycastHitAgent ) {
	// 		// 	{
	// 			if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 				// console.log("tryna reset agent color after no hit");
	// 				raycastHitAgent.material.materialColor = stopColor;
	// 				raycastHitAgent.material.needsUpdate = true;
	// 			} else if (raycastHitAgent.material) {
	// 				// console.log("tryna reset agent color after no hit");
	// 				raycastHitAgent.material.color = stopColor;
	// 			}
	// 		}
	// 		raycastHitAgent = null;
	// 	}
	// }
	

	// function playerRaycast () {

	// 	if (playcaster) {
	// 		var raycastHits = playcaster.intersectObjects(activeObjex, true);
	// 		let selectColor = new THREE.Color(0xff3333);
	// 		let stopColor = new THREE.Color(0x26de57);
	// 		let goColor = new THREE.Color(0xff0000);
	// 		if (raycastHits.length > 0) {
				
	// 		// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
	// 		// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
	// 			if (raycastHits[0].object.name.includes("agent")) {

	// 				lastRaycastHitObject = raycastHits[0].object;
	// 				if ( raycastHitAgent != raycastHits[ 0 ].object ) {
	// 					console.log ("new player raycast hit on agent " + raycastHits[0].object.name);
	// 					raycastHitAgent = raycastHits[ 0 ].object;	
	// 					if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
	// 						console.log("intersected material found!");
	// 						raycastHitAgent.material.materialColor = goColor;
	// 					} else if (raycastHitAgent && raycastHitAgent.material) {
	// 						raycastHitAgent.material.color = goColor;
						
	// 					}
	// 					const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //can do this easier, but good to know
	// 					if (navAgentInstance) {
	// 						navAgentInstance.agentRaycastHit();
	// 					}
	// 				} else {
	// 					// console.log("rehit agent " + raycastHits[0].object.name));
	// 				}
	// 			} else {
	// 				if ( raycastHitAgent ) {
	// 					if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 						// console.log("tryna reset agent colornode after no hit");
	// 						raycastHitAgent.material.materialColor = stopColor;
	// 						raycastHitAgent.material.needsUpdate = true;
							
	// 					} else if (raycastHitAgent.material) {
	// 						// console.log("tryna reset agent color after no hit");
	// 						raycastHitAgent.material.color = stopColor;
	// 					}
	// 				}
	// 				raycastHitAgent = null;
	// 				lastRaycastHitObject = null;
	// 			}
	// 		} else {
	// 			if (lastRaycastHitObject) {
	// 				lastRaycastHitObject = null;
	// 			}
	// 			if ( raycastHitAgent ) {
	// 			// 	{
	// 				if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 					// console.log("tryna reset agent color after no hit");
	// 					raycastHitAgent.material.materialColor = stopColor;
	// 					raycastHitAgent.material.needsUpdate = true;
	// 				} else if (raycastHitAgent.material) {
	// 					// console.log("tryna reset agent color after no hit");
	// 					raycastHitAgent.material.color = stopColor;
	// 				}
	// 			}
	// 			raycastHitAgent = null;
	// 		}
	// 	}
	// }
	// function centerRaycast () {
	// 	if (scene && camera && centercaster && isReady) {

	// 		centercaster.setFromCamera( new THREE.Vector2(0,0), camera );  
	// 		const raycastHits = centercaster.intersectObjects(activeObjex, true);
	// 		let lastHitObject;
	// 		let selectColor = new THREE.Color(0xff3333);
	// 		let stopColor = new THREE.Color(0x26de57);
	// 		let goColor = new THREE.Color(0xff0000);
	// 		if (raycastHits.length > 0) {
	// 		// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
	// 		// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
				
	// 				if (raycastHits[0].object.userData.name == "navmesh") {
	// 					console.log("navmesh Mousehit");
	// 				}
	// 				if (raycastHits[0].object.name.includes("agent")) {
					
	// 				if ( raycastHitAgent != raycastHits[ 0 ].object ) {
	// 					console.log ("new raycast hit on agent " + raycastHits[0].object.name);
	// 					raycastHitAgent = raycastHits[ 0 ].object;	

	// 						if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
						
	// 							console.log("intersected material found!");
	// 							raycastHitAgent.material.materialColor = goColor;

								
	// 						} else if (raycastHitAgent && raycastHitAgent.material) {
	// 							raycastHitAgent.material.color = goColor;
							
	// 						}
	// 						const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance;
	// 						if (navAgentInstance) {
	// 							navAgentInstance.agentRaycastHit();
	// 						}
							
							
	// 				} else {
	// 					// console.log("rehit agent " + raycastHits[0].object.name));
	// 				}
	// 			} else {
	// 				if ( raycastHitAgent ) {
	// 					if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 						// console.log("tryna reset agent colornode after no hit");
	// 						raycastHitAgent.material.materialColor = stopColor;
	// 						raycastHitAgent.material.needsUpdate = true;
							
	// 					} else if (raycastHitAgent.material) {
	// 						// console.log("tryna reset agent color after no hit");
	// 						raycastHitAgent.material.color = stopColor;
	// 					}
	// 				}
	// 				raycastHitAgent = null;
	// 			}
	// 		} else {
	// 			if ( raycastHitAgent ) {
	// 			// 	{
	// 				if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
	// 					// console.log("tryna reset agent color after no hit");
	// 					raycastHitAgent.material.materialColor = stopColor;
	// 					raycastHitAgent.material.needsUpdate = true;
	// 				} else if (raycastHitAgent.material) {
	// 					// console.log("tryna reset agent color after no hit");
	// 					raycastHitAgent.material.color = stopColor;
	// 				}
	// 			}
	// 			raycastHitAgent = null;
	// 		}
	// 	}
	// }

	// function onMouseDown(event) {
	// 	playerReadyToNav = true;
	// 	mouseIsDown = true;
	// 	let lastHitObjectName;
	// 	if (lastRaycastHitObject && lastRaycastHitPosition) {
	// 		lastHitObjectName = lastRaycastHitObject.userData ? lastRaycastHitObject.userData.name : lastRaycastHitObject.name;
	// 		console.log(JSON.stringify(lastRaycastHitPosition) + " named " + lastHitObjectName);
			
	// 		if (lastHitObjectName == "player") {
	// 			// controls.target.set(player.position);
	// 			camera.lookAt(player.position);
	// 			controls.target.set(0,0,0);
	// 		} else if (lastHitObjectName == "navmesh") {
	// 			// playerNavAgent.playerNavMode(true);
	// 			const navAgentInstance = player.userData.NavAgentInstance; //can do this easier, but good to know
	// 				if (navAgentInstance) {
	// 					navAgentInstance.playerNav(true);
	// 					// controls
	// 					// player.position.set(closestNavmeshPoint(player.position.x, player.position.y, player.position.z ));
	// 					navAgentInstance.newPath(lastRaycastHitPosition);
	// 				}
	// 			// controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);
	// 		}

	// 		// controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);

	// 	}
	// 	// isDragging = true;
	// 	previousMousePosition = {
	// 		x: event.clientX,
	// 		y: event.clientY
	// 	};


	// 	// if ()
	// }

	// function onMouseUp(e) {
	// 	mouseIsDown = false;
	// 	playerReadyToNav = false;

	// }


	// function onMouseMove(event) {
	// 	// console.log("mouse move " +scene + mouse + camera + mousecaster + isReady);
	// 	if (scene && mouse && camera && mousecaster && isReady) {
	// 		mouseRaycast(event);
	// 	}

	// 	//  if (!mouseIsDown) return; //nope, orbit is better

	// 	// 	const deltaX = event.clientX - previousMousePosition.x;
	// 	// 	const deltaY = event.clientY - previousMousePosition.y;

	// 	// 	// Adjust rotation speed with a sensitivity scale factor
	// 	// 	const sensitivity = 0.003; 

	// 	// 	// Apply rotation to the pivot
	// 	// 	// Rotate around the Y-axis for horizontal movement (yaw)
	// 	// 	goal.rotation.y += deltaX * sensitivity; 
	// 	// 	// Rotate around the X-axis for vertical movement (pitch)
	// 	// 	// You might want to limit the pitch rotation to prevent the camera from flipping upside down
	// 	// 	goal.rotation.x += deltaY * sensitivity;

	// 	// 	// Optional: clamp vertical rotation (e.g., between -PI/2 and PI/2)
	// 	// 	goal.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, goal.rotation.x));


	// 	// 	previousMousePosition = {
	// 	// 		x: event.clientX,
	// 	// 		y: event.clientY
	// 	// 	};
	// }



