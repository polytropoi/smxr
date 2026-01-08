// Object.keys(require.cache).forEach(key => delete require.cache[key]);

	import * as THREE from 'three';

	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

	import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
	import { SetSceneLocations } from '../../../connect/connect.js';

	import { InitPathfinding, agents } from './spark_nav.js';

	import { InitSurface, InstanceOnSurface, instancedModels, createDefaultSurface } from './spark_instance.js';

	// import { UpdateText } from './spark_ui.js';

	import { world, gravity, initRapier, physicsIsReady, dynamicBodies, rapierDebugRenderer, 
		eventQueue, kinematicBodies, worldIsReady, 
		initDefaultStaticCollider} from './spark_physics.js';

	import { InitEnvMap, InitFog } from './spark_sky.js';

	import { splatObjex, initSplats } from './spark_splats.js';
	// import { Container } from '@pmndrs/uikit' //arghh	

	import Stats from './ui/stats.js';
import { initWater1, water } from './env/spark_water.js';



// import { sceneObjects } from '../../connect/dialogs.js';

	export let scene, navmesh, surface;

	let locationData;
	let modelsData;
	let raycastHitAgent;
	let mousecaster, downcaster, stats;
	// let mixer, objects;
	// export let water;// waterLayer0, waterLayer1;
	export let clock;
	export let camera, renderer;
	let model, floor, floorPosition;
	let postProcessing;
	let showDebug = true;
	let controls;

	let moveForward = false;
	let moveBackward = false;
	let moveLeft = false;
	let moveRight = false;
	let canJump = false;

	let prevTime = performance.now();
	const velocity = new THREE.Vector3();
	const direction = new THREE.Vector3();
	const vertex = new THREE.Vector3();
	const color = new THREE.Color();

	let doPostProcessing = false;
	

	let activeObjex = [];
	let dynamicObjex = [];
	export let playerPosition;

	  export let staticObjex = [];
  export let navmeshObjex = [];
  export let surfaceObjex = [];
//   let instancedModels = [];

	let sceneCameraMode;


	const mouse = new THREE.Vector2();
	

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
	async function init () {
		 	
		await asyncInit();
	}

	async function asyncInit() {

		// initRapier();
		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setAnimationLoop( animate );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Recommended for better quality

		// renderer.inspector = new Inspector();
		document.body.appendChild( renderer.domElement );

		if (settings && settings.sceneCameraMode) {
			if (settings.sceneCameraMode == "First Person") {

				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.y = 10;

				downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

				controls = new PointerLockControls( camera, document.body );

				const blocker = document.getElementById( 'blocker' );
				const instructions = document.getElementById( 'instructions' );

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
				sceneCameraMode = "First Person";
			
		} else {

			camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.25, 500 );

			camera.position.set( 10, 50, 10 );
			camera.lookAt( 0, 1, 0 );
			controls = new OrbitControls( camera, renderer.domElement );
			controls.minDistance = 1;
			controls.maxDistance = 300;
			controls.maxPolarAngle = Math.PI * 0.75;
			// controls.autoRotate = true;
			// controls.autoRotateSpeed = 1;
			controls.target.set( 0, .2, 0 );
			controls.update();
			sceneCameraMode = "Orbit";
		}
	}

		await initRapier();

		//
		// UpdateText("HERE WE GO!");

		await initModels();

	} 
	export async function initModels () {
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
									console.log("gotsa location model! " +modelsData[m].modelURL + " type " + modelsData[m].item_type);
									
									// const model = await loadModel(modelsData[m].modelURL); //loaded but not added to scene - wait for navmesh, surfaces, physics etc.
																				
									console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
									
									if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
									
										locationData[i].isHidden = true;
										// console.log("tryna hide model " + child.name);
									}															
									
									if (modelsData[m].item_type == "splat") {
										console.log("GOTSA SPLAT!");
										let splat = {};
										splat.url = modelsData[m].modelURL;
										splat.locationData = locationData[i];
										splatObjex.push(splat);
									} else {
										// const transmat = new THREE.MeshBasicNodeMaterial( { transparent: true, opacity: 0, color: 0x111111, depthWrite :false});
										const model = await loadModel(modelsData[m].modelURL);
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
														// child.material = transmat;
														// InitPathfinding(); //no
													// }
												} else if (locationData[i].markerType == "surface" ) {
													// if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {
														surface = child;
														surfaceObjex.push(child);
														// child.material = transmat;
														
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
											const zscale = locationData[i].zscale ? locationData[i].scale : 1;

											model.scale.set(xscale,yscale,zscale);
											// model.layers.set(1);
											model.userData = locationData[i];
											model.name = "model_" + locationData[i].name;
											model.castShadow = true;
											model.receiveShadow = true;
											// model.material.envMap = scene.environment;
											// model.envMapIntensity = 2;
											scene.add(model);
											activeObjex.push(model);
																				
										}
									}
									break; //only match one model per location!?
								}
							}
						} else { //primitives
							
							// if (locationData[i].markerType == "player") {
							// 	playerPosition = locationData[i];
							// }

						}
						//locations with no models...

						// if (locationData[i].markerType == "surface") {
						// 	createDefaultSurface();
						// }
						if (locationData[i].markerType == "player") {
							console.log("playerposition " + JSON.stringify(locationData[i]));
							playerPosition = locationData[i];
						}
						// console.log("locationData " + i + " of "  + locationData.length);
					}
					// console.log("looking for Surface with models " + instancedModels.length);
					
				} catch (e) {
					console.error("ERROR LOADING GLTF! " + e);
				} finally {
					console.log("settings " + JSON.stringify(settings));

					if (playerPosition) {
						console.log("tryna set player position " + playerPosition);
						camera.position.set( playerPosition.x, playerPosition.y, playerPosition.z );
					} 
					if (!navmesh) {
						createDefaultNavmesh();
					}
					if (staticObjex.length == 0) {
						initDefaultStaticCollider();
					}
					initSystems();
				}
			})();
			
		}
	}
		function createDefaultNavmesh() {
				  const planeGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); // 50 x 50
				//   planeGeometry.rotation.x = Math.PI / 2 * -1;
					const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'hotpink' });
					let navmeshObject = new THREE.Mesh(planeGeometry, planeMaterial);
					
					navmeshObject.position.set(0,0,0);
					navmeshObject.scale.set(1,1,1);
					navmeshObject.rotation.x = -Math.PI / 2;
					navmeshObject.updateMatrixWorld();
					navmesh = navmeshObject;
					
					scene.add(navmeshObject);
		}
		// }

		async function initSystems() {
			if (splatObjex.length) {
				// surface = surfaceObjex[0];
				initSplats();
			} 
			if (staticObjex.length) { //eg ground and stuff
				// await initStaticObjex(); 
				// await initDefaultCollider();
			}

			if (surface) { // => scattering instances
				await InitSurface();
				console.log("instantiating on surface with models " + instancedModels.length);
				for (let i = 0; i < instancedModels.length; i++) {
					let count = 33;
					let scale = 1;
					let yMod = 0;
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
					InstanceOnSurface(instancedModels[i].model, count, scale, yMod);
							
				} 
			}

			if (navmesh) {
				await InitPathfinding(); //after this the actual physics
				
			}

			InitEnvMap();
			// InitSky();
			InitFog();


			window.addEventListener( 'resize', onWindowResize );


			mousecaster = new THREE.Raycaster();


		}

		console.log("settings " + JSON.stringify(settings));

		if (settings && settings.sceneTags) {
			// if (settings.sceneTags.includes("debug")) {
			// stats.showPanel( 0,1,2,3 );
			stats = new Stats();

			stats.domElement.style.right = 'auto';
			stats.domElement.style.left = '0px'; // Positioned at top-right
			stats.domElement.style.bottom = '0px';
			document.body.appendChild(stats.domElement);
			// }
			if (settings && settings.sceneWater && settings.sceneWater != 0 && settings.sceneWater.name != "") {
				// const waterModule = await import ('./env/spark_water.js');
				if (settings.sceneWater.name == "water1") {
					initWater1();
					// const waterModule = await import {Water} from './tsl/tsl_water.js'
					// water = new waterModule.Water1();
				} else if (settings.sceneWater.name == "water2") {
					// water = new waterModule.Water2();
				}
								// water = waterModule.water;
				console.log("water is " + water);
			} 

			// }
		}


		// }
		

		
		// scene = new THREE.Scene();
		// // scene.fog = new THREE.Fog( settings.sceneColor2, 20, 300 );
		// const fogColor = settings.sceneColor2; // Sky blue
		// // const fogDensity = 0.01; // Adjust this value! (Default is 0.00025)
		// scene.fog = new THREE.Fog(fogColor, 1, 100);
		// InitCustomFog();
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

		const waterAmbientLight = new THREE.HemisphereLight( settings.sceneColor3, settings.sceneColor4, 5 );
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


		// if (settings && settings.sceneTags) {
		// 	// if (settings.sceneTags.includes("debug")) {
		// 	// stats.showPanel( 0,1,2,3 );
		// 	stats = new Stats();

		// 	stats.domElement.style.right = 'auto';
		// 	stats.domElement.style.left = '0px'; // Positioned at top-right
		// 	stats.domElement.style.bottom = '0px';
		// 	document.body.appendChild(stats.domElement);
		// 	// }
		// 	if (settings && settings.sceneWater && settings.sceneWater != 0 && settings.sceneWater.name != "") {
		// 		// const waterModule = await import ('./tsl/tsl_water.js');
		// 		// if (settings.sceneWater.name == "water1") {
				
		// 		// 	// const waterModule = await import {Water} from './tsl/tsl_water.js'
		// 		// 	water = new waterModule.Water1();
		// 		// } else if (settings.sceneWater.name == "water2") {
		// 		// 	water = new waterModule.Water2();
		// 		// }
		// 						// water = waterModule.water;
		// 		console.log("water is " + water);
		// 	} 

		// 	// }
		// }
		// objects

	

				

		// renderer

		// renderer = new THREE.WebGLRenderer({antialias: true});
		// renderer.setPixelRatio( window.devicePixelRatio );
		// renderer.setSize( window.innerWidth, window.innerHeight );
		// renderer.setAnimationLoop( animate );
		// renderer.shadowMap.enabled = true;
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Recommended for better quality

		// // renderer.inspector = new Inspector();
		// document.body.appendChild( renderer.domElement );

		// if (settings && settings.sceneCameraMode) {
		// 	if (settings.sceneCameraMode == "First Person") {

		// 		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
		// 		camera.position.y = 10;

		// 		downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

		// 		controls = new PointerLockControls( camera, document.body );

		// 		const blocker = document.getElementById( 'blocker' );
		// 		const instructions = document.getElementById( 'instructions' );

		// 		instructions.addEventListener( 'click', function () {

		// 			controls.lock();

		// 		} );

		// 		controls.addEventListener( 'lock', function () {

		// 			instructions.style.display = 'none';
		// 			blocker.style.display = 'none';

		// 		} );

		// 		controls.addEventListener( 'unlock', function () {

		// 			blocker.style.display = 'block';
		// 			instructions.style.display = '';

		// 		} );

		// 		scene.add( controls.object );
		// 		sceneCameraMode = "First Person";
		// 	}
		// } else {

		// 	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.25, 500 );

		// 	camera.position.set( 10, 50, 10 );
		// 	camera.lookAt( 0, 1, 0 );
		// 	controls = new OrbitControls( camera, renderer.domElement );
		// 	controls.minDistance = 1;
		// 	controls.maxDistance = 300;
		// 	controls.maxPolarAngle = Math.PI * 0.75;
		// 	// controls.autoRotate = true;
		// 	// controls.autoRotateSpeed = 1;
		// 	controls.target.set( 0, .2, 0 );
		// 	controls.update();
		// 	sceneCameraMode = "Orbit";
		// }



	//end init!

	export function togglePostProcessing () { //call after physics is done, elsewise... :( //NOPE, webgpu only fnow
		console.log("tryna toggle post processing");
		doPostProcessing = !doPostProcessing;
	}


////////////// MAIN LOOP FOR ALL THE THINGS ////////////////
	function animate() {

		 



		const time = performance.now();


		if ( navmesh && downcaster && controls.object && sceneCameraMode && sceneCameraMode === "First Person" && controls.isLocked === true ) {

			downcaster.ray.origin.copy( controls.object.position );
			downcaster.ray.origin.y -= 20;
			console.log("downcaster origin " + JSON.stringify(downcaster.ray.origin));
			

			const intersections = downcaster.intersectObjects( navmesh, false );

			const onObject = intersections.length > 0;

			if (intersections.length > 0) {
				console.log("controls.object hit distance " + intersections[0].distance + " position " + JSON.stringify(controls.object.position));
			}

			const delta = ( time - prevTime ) / 1000;

			velocity.x -= velocity.x * .1 * delta;
			velocity.z -= velocity.z * .1 * delta;

			// velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
			velocity.y = 0;

			direction.z = Number( moveForward ) - Number( moveBackward );
			direction.x = Number( moveRight ) - Number( moveLeft );
			direction.normalize(); // this ensures consistent movements in all directions

			if ( moveForward || moveBackward ) velocity.z -= direction.z * 4.0 * delta;
			if ( moveLeft || moveRight ) velocity.x -= direction.x * 4.0 * delta;

			if ( onObject === true ) {

				velocity.y = Math.max( 0, velocity.y );
				canJump = true;

			}

			controls.moveRight( - velocity.x * delta );
			controls.moveForward( - velocity.z * delta );

			// controls.object.position.y += ( velocity.y * delta ); // new behavior

			if ( controls.object.position.y < -10 ) {

				velocity.y = 0;
				controls.object.position.y = 10;

				canJump = true;

			}
			console.log("controls.object position " + JSON.stringify(controls.object.position));
			console.log("controls.object velocity " + JSON.stringify(velocity));
			

		} else {
			// controls.update();
		}


		if (stats) {
			stats.update();
		}

		// floor.position.y = floorPosition.y - 5;

		// if ( model ) {

		// 	mixer.update( delta );

		// 	model.position.y = floorPosition.y;

		// }

		// for ( const object of objects.children ) {

		// 	// object.position.y = Math.sin( clock.elapsedTime + object.id ) * .3;
		// 	object.rotation.y += delta * .3;

		// }
		if (agents.length) {
			if (clock) {
				const deltaTime = clock.getDelta();
				agents.forEach(a =>
					a.update(deltaTime));
			}
		}
				
  		if (world && physicsIsReady && worldIsReady) {
			
			 world.step();//!!!
			 

			dynamicBodies.forEach(b => 
				b.update());
		
			kinematicBodies.forEach(c => 
				c.update());

				

		}
		if (rapierDebugRenderer && showDebug) {
			rapierDebugRenderer.update();
		}

		if (doPostProcessing) {
			// postProcessing.render();
		} else {
			renderer.render(scene, camera);
		}

		if (water) {
			
			water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
		}


		prevTime = time;


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


	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}
	// window.addEventListener('mousemove', onMouseMove);

	function onMouseMove(e) {
		if (scene && mouse && camera && mousecaster) {
			mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

			mousecaster.setFromCamera(mouse, camera);

			var raycastHits = mousecaster.intersectObjects(activeObjex, true);
			let selectColor = new THREE.Color(0xff3333);
			let stopColor = new THREE.Color(0x26de57);
			let goColor = new THREE.Color(0xff0000);
			if (raycastHits.length > 0) {
			// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
			// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
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

	const onKeyDown = function ( event ) {

		console.log("gotsa keydown event " + event.code);

		switch (event.code) {
			case 'KeyW':
			controls.moveForward(0.025)
			break
			case 'KeyA':
			controls.moveRight(-0.025)
			break
			case 'KeyS':
			controls.moveForward(-0.025)
			break
			case 'KeyD':
			controls.moveRight(0.025)
			break
		//   }
// }
			// case 'ArrowUp':
			// case 'KeyW':
			// 	moveForward = true;
			// 	break;

			// case 'ArrowLeft':
			// case 'KeyA':
			// 	moveLeft = true;
			// 	break;

			// case 'ArrowDown':
			// case 'KeyS':
			// 	moveBackward = true;
			// 	break;

			// case 'ArrowRight':
			// case 'KeyD':
			// 	moveRight = true;
			// 	break;

			// case 'Space':
			// 	if ( canJump === true ) velocity.y += 350;
			// 	canJump = false;
			// 	break;

		}

	};

	// const onKeyUp = function ( event ) {
	// 	console.log("gotsa keyup event " + event.code);
	// 	switch ( event.code ) {

	// 		case 'ArrowUp':
	// 		case 'KeyW':
	// 			moveForward = false;
	// 			break;

	// 		case 'ArrowLeft':
	// 		case 'KeyA':
	// 			moveLeft = false;
	// 			break;

	// 		case 'ArrowDown':
	// 		case 'KeyS':
	// 			moveBackward = false;
	// 			break;

	// 		case 'ArrowRight':
	// 		case 'KeyD':
	// 			moveRight = false;
	// 			break;

	// 	}

	// };

	document.addEventListener( 'keydown', onKeyDown );
	// document.addEventListener( 'keyup', onKeyUp );

// billboard tsl
// 	material.positionNode = material.positionNode = tsl.Fn(() => {
// 	const objectCenter = tsl.modelWorldMatrix.mul(tsl.vec4(0.0, 0.0, 0.0, 1.0)).xyz;
// 	const up = tsl.vec3(0, 1, 0).toVar();
// 	const toCamera = tsl.cameraPosition.sub(objectCenter).toVar();
// 	// set toCamera.y = 0 to only allow rotation around the y-axis (i.e. make it "cylindrical")
// 	toCamera.assign(tsl.vec3(toCamera.x, 0, toCamera.z).normalize());
// 	const right = up.cross(toCamera).normalize();
// 	up.assign(toCamera.cross(right).normalize());
// 	const rotationMatrix = tsl.mat3(right, up, toCamera);
// 	return rotationMatrix.mul(tsl.positionGeometry);
// })();