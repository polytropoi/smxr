	import * as THREE from 'three/webgpu';

	import RAPIER from 'rapier';
	
	import { color, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, objectPosition, screenUV, 
		viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, time, fog, float, triNoise3D, positionView, uniform } from 'three/tsl';
	
	// import { ColorNode, MeshBasicNodeMaterial } from 'three/addons/examples/jsm/nodes/Nodes.js';

	import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

	import { Inspector } from 'three/addons/inspector/Inspector.js';

	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

	import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
	import { SetSceneLocations } from '../../../connect/connect.js';


	import { InitPathfinding, agents } from './three_nav.js';

	import { getRainbowMaterial } from './tsl/rainbow.js'


	import { InitSurface, InstanceOnSurface, instancedModels } from './three_instance.js';

	import { UpdateText } from './three_ui.js';

	import { getDynamicBody } from './three_physics.js';

	import { InitEnvMap, InitSky, InitFog } from './three_sky.js';


	// import { Container } from '@pmndrs/uikit'

	import Stats from './stats.js';


// import { sceneObjects } from '../../connect/dialogs.js';

	export let scene, navmesh, surface;

	let locationData;
	let modelsData;
	let raycastHitAgent;
	let raycaster, stats;
	let mixer, objects, water;// waterLayer0, waterLayer1;
	export let clock;
	export let camera, renderer;
	let model, floor, floorPosition;
	let postProcessing;
	let controls;

	let doPostProcessing = true;

	let activeObjex = [];


	const mouse = new THREE.Vector2();
	

	eventEl.addEventListener('ready-event', init); //fired when settings are loaded..


	async function loadModel(url) {
		const loader = new GLTFLoader();
		try {
			const gltf = await loader.loadAsync(url);
			scene.add(gltf.scene);
			return gltf.scene;
		} catch (error) {
			console.error('An error happened during model loading', error);
		}
	}

	
	////////////// SCENE INIT FUNCTION 

	async function init() {

		scene = new THREE.Scene();


		await RAPIER.init();	
		const gravity = { x: 0.0, y: 0, z: 0.0 };
		const world = new RAPIER.World(gravity);

		// UpdateText("HERE WE GO!");
		

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
			 //reuse the loader
			// try {
			(async () => {
				try { 
					for (let i = 0; i < locationData.length; i++) {
						if (locationData[i].modelID && locationData.modelID != "none") {
							for (let m = 0; m < modelsData.length; m++) {
								if (locationData[i].modelID == modelsData[m]._id) {
									console.log("gotsa model! " +modelsData[m].modelURL);
									
									const model = await loadModel(modelsData[m].modelURL); //needs to wait for navmesh, surfaces, etc.
																				
									console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
									
													
									
									const transmat = new THREE.MeshBasicNodeMaterial( { transparent: true, opacity: 0, color: 0x111111, depthWrite :false});
									model.traverse(function (child) {
										if (child.isMesh){
											
											if (locationData[i].markerType == "navmesh" ) {
												if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh")) {
													navmesh = child;
													child.material = transmat;
													InitPathfinding();
												}
											} else if (locationData[i].markerType == "surface" ) {
												if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {
													surface = child;
													// child.material = transmat;
													InitSurface();
												}
											} else {
												// child.mesh.layers.set(1);
												// child.mesh.userData = locationData[i];
												if (locationData[i].eventData.includes("static_")) {
													const geometry = child.geometry;
													let rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
														.setTranslation(parseFloat(locationData[i].x),parseFloat(locationData[i].y),parseFloat(locationData[i].z))
														// .setLinearDamping(1)
														// .setAngularDamping(1);
													let rigid = world.createRigidBody(rigidBodyDesc);
													const positionAttribute = geometry.getAttribute('position');

													let points = positionAttribute.array;
													let colliderDesc = RAPIER.ColliderDesc.convexHull(points).setDensity(1);
													world.createCollider(colliderDesc, rigid);
												} else if  (locationData[i].eventData.includes("dynamic")) {


												}
												
											}
											
																	
											console.log("loaded mesh with tags " + locationData[i].locationTags);
											
											if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
												// child.material = transmat;
												child.material.transparent = true;
												child.material.opacity = 0;
											} else {
												// if (child.material.envMap) {
												child.castShadow = true;	
												child.receiveShadow = true;
													child.material.envMap = scene.environment;
												// }
												
											}
											// child.material.envMap = scene.environment;
										}
									});
									if (locationData[i].eventData && locationData[i].eventData.includes("instance") ) {
										console.log("EVENT DATA WITH INSTANCING");
										let instancedModel = {};
										instancedModel.model = model;
										instancedModel.locationData = locationData[i];
										instancedModel.modelData = modelsData[m];
										instancedModels.push(instancedModel);
										console.log("instancedModels length " + instancedModels.length);
										model.visible = false;
									} else {
										model.position.set(locationData[i].x,locationData[i].y,locationData[i].z);
										model.scale.set(locationData[i].xscale,locationData[i].yscale,locationData[i].zscale)
										scene.add(model);
										// model.layers.set(1);
										model.userData = locationData[i];
										model.name = "model_" + locationData[i].name;
										model.castShadow = true;
										model.receiveShadow = true;
										// model.material.envMap = scene.environment;
										// model.envMapIntensity = 2;
										activeObjex.push(model);
										
	
									
									}
								}
							}
						}
						// console.log("locationData " + i + " of "  + locationData.length);
					}
					// console.log("looking for Surface with models " + instancedModels.length);
					if (surface) {

						console.log("instantiating on surface with models " + instancedModels.length);
						for (let i = 0; i < instancedModels.length; i++) {
							let count = 33;
							let scale = 1;
							if (instancedModels[i].locationData.eventData.includes("~")) {
								let countSplit = instancedModels[i].locationData.eventData.split("~");
								count = countSplit[1];
							} else {
								if (instancedModels[i].locationData.eventData.includes("grass")) {
									count = 333;
								}
								if (instancedModels[i].locationData.eventData.includes("rocks")) {
									count = 333;
								}
							}	

							if (instancedModels[i].locationData.yscale) {
								scale = instancedModels[i].locationData.yscale * .5;
							}

							InstanceOnSurface(instancedModels[i].model, count, scale);
						} 
					}
				} catch (e) {
					console.error("ERROR LOADING GLTF! " + e);
				}
			})();
		}



		console.log("settings " + JSON.stringify(settings));

		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.25, 300 );
		camera.position.set( 3, 2, 4 );

		
		// scene = new THREE.Scene();
		// // scene.fog = new THREE.Fog( settings.sceneColor2, 20, 300 );
		// const fogColor = settings.sceneColor2; // Sky blue
		// // const fogDensity = 0.01; // Adjust this value! (Default is 0.00025)
		// scene.fog = new THREE.Fog(fogColor, 1, 300);
		// InitCustomFog();
		// scene.backgroundNode = normalWorld.y.mix( color( settings.sceneColor1 ), color( settings.sceneColor2 ) );
		camera.lookAt( 0, 1, 0 );

		const sunLight = new THREE.DirectionalLight( settings.sceneColor2, 5 );
		sunLight.castShadow = true;
		sunLight.shadow.camera.near = .1;
		sunLight.shadow.camera.far = 5;
		sunLight.shadow.camera.right = 2;
		sunLight.shadow.camera.left = - 2;
		sunLight.shadow.camera.top = 1;
		sunLight.shadow.camera.bottom = - 2;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.bias = - 0.001;
		sunLight.position.set( .5, 3, .5 );

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
		if (settings && settings.sceneTags) {
			// if (settings.sceneTags.includes("debug")) {
			// stats.showPanel( 0,1,2,3 );
			stats = new Stats();
			document.body.appendChild(stats.domElement);
			// }
			if (settings && settings.sceneWater && settings.sceneWater != 0) {
				const waterModule = await import ('./tsl/tsl_water.js');
				// const waterModule = await import {Water} from './tsl/tsl_water.js'
				water = new waterModule.Water();
				

				// water = waterModule.water;
				console.log("water is " + water);
			}

			// }
		}
		// objects

		const textureLoader = new THREE.TextureLoader();
		const iceDiffuse = textureLoader.load( 'https://servicemedia.s3.amazonaws.com/assets/pics/water2c.jpeg' );
		iceDiffuse.wrapS = THREE.RepeatWrapping;
		iceDiffuse.wrapT = THREE.RepeatWrapping;
		iceDiffuse.colorSpace = THREE.NoColorSpace;

		const iceColorNode = triplanarTexture( texture( iceDiffuse ) ).add( color( settings.sceneColor1 ) ).mul( .4 );

		const geometry = new THREE.IcosahedronGeometry( 1, 3 );
		// const material = new THREE.MeshStandardNodeMaterial( { colorNode: iceColorNode } );
		const material = getRainbowMaterial();
		// material.colorNode = iceColorNode;

		const count = 100;
		const scale = 10;
		const column = 10;

		objects = new THREE.Group();

		for ( let i = 0; i < count; i ++ ) {

			const x = i % column;
			const y = i / column;

			const mesh = new THREE.Mesh( geometry, material );
			mesh.position.set( x * scale + Math.random(), 0, y * scale * Math.random() );
			mesh.rotation.set( Math.random(), Math.random(), Math.random() );
			objects.add( mesh );
			getDynamicBody(RAPIER, world, mesh);
			activeObjex.push(mesh);

		}

		objects.position.set (
			( ( column - 1 ) * scale ) * - .5,
			- 1,
			( ( count / column ) * scale ) * - .5
		);

		scene.add( objects );
		// activeObjex.push(objects);
		// floor

		// floor = new THREE.Mesh( new THREE.CylinderGeometry( 2, 2, 10 ), new THREE.MeshStandardNodeMaterial( { colorNode: iceColorNode } ) );
		// // floor = new THREE.Mesh( new THREE.CylinderGeometry( 1.1, 1.1, 10 ), returnM );
		// floor.position.set( 0, - 5, 0 );
		// scene.add( floor );
		

		// caustics
		if (water && water.waterLayer0) {
			const waterPosY = positionWorld.y.sub( water.position.y );

			let transition = waterPosY.add( .1 ).saturate().oneMinus();
			transition = waterPosY.lessThan( 0 ).select( transition, normalWorld.y.mix( transition, 0 ) ).toVar();
			const colorNode = transition.mix( material.colorNode, material.colorNode.add( water.waterLayer0 ) );

			material.colorNode = colorNode;
			// floor.material.colorNode = colorNode;
		}

		

		// }

		// renderer

		renderer = new THREE.WebGPURenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setAnimationLoop( animate );
		// renderer.inspector = new Inspector();
		document.body.appendChild( renderer.domElement );

		controls = new OrbitControls( camera, renderer.domElement );
		controls.minDistance = 1;
		controls.maxDistance = 100;
		controls.maxPolarAngle = Math.PI * 0.9;
		// controls.autoRotate = true;
		// controls.autoRotateSpeed = 1;
		controls.target.set( 0, .2, 0 );
		controls.update();

		InitEnvMap();
		InitSky();
		InitFog();

		// gui

		// const gui = renderer.inspector.createParameters( 'Settings' );

		floorPosition = new THREE.Vector3( 0, .2, 0 );

		// gui.add( floorPosition, 'y', - 1, 1, .001 ).name( 'floor position' );

		// post processing

				const scenePass = pass( scene, camera );
				const scenePassColor = scenePass.getTextureNode();
				const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );
				const waterMask = objectPosition( camera ).y.greaterThan( screenUV.y.sub( .5 ).mul( camera.near ) ).toInspector( 'Post-Processing / Water Mask' );

				const scenePassColorBlurred = gaussianBlur( scenePassColor );
				scenePassColorBlurred.directionNode = waterMask.select( scenePassDepth, scenePass.getLinearDepthNode().mul( 5 ) ).toInspector( 'Post-Processing / Blur Strength [ Depth ]', ( node ) => node.toFloat() );

				const vignette = screenUV.distance( .5 ).mul( 1.35 ).clamp().oneMinus().toInspector( 'Post-Processing / Vignette' );

				postProcessing = new THREE.PostProcessing( renderer );
				postProcessing.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( settings.sceneColor1 ) ).mul( vignette ) );

		//

		// const pmremGenerator = new THREE.PMREMGenerator( renderer );

		// const loader = new THREE.TextureLoader() ;
		// // const loader = new RGBELoader() ;


		window.addEventListener( 'resize', onWindowResize );


		raycaster = new THREE.Raycaster();

	} //end init!

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function animate() {

		controls.update();

		const delta = clock.getDelta();

		if (stats) {
			stats.update();
		}

		// floor.position.y = floorPosition.y - 5;

		// if ( model ) {

		// 	mixer.update( delta );

		// 	model.position.y = floorPosition.y;

		// }

		for ( const object of objects.children ) {

			// object.position.y = Math.sin( clock.elapsedTime + object.id ) * .3;
			object.rotation.y += delta * .3;

		}

		if (doPostProcessing) {
			postProcessing.render();
		} else {
			renderer.render(scene, camera);
		}
		if (agents.length) {
			for (let i = 0; i < agents.length; i++) {
				agents[i].update(delta);
			}
		}
	}


	/////// events and listeners and handlers

		window.addEventListener('mousemove', onMouseMove);

		function onMouseMove(e) {
			if (mouse && camera && raycaster) {
				mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

				raycaster.setFromCamera(mouse, camera);

				var raycastHits = raycaster.intersectObjects(scene.children, true);
				let newColor = new THREE.Color(0x26de57);
				let oldColor = new THREE.Color(0xff0000);
				if (raycastHits.length > 0) {
				// console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
				// 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
					if (raycastHits[0].object.name.includes("agent")) {
						
						if ( raycastHitAgent != raycastHits[ 0 ].object ) {
							console.log ("new raycast hit on " + raycastHits[0].object.name);
							raycastHitAgent = raycastHits[ 0 ].object;	

								if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode )  {
							
									console.log("intersected material found!");
									raycastHitAgent.material.materialColor = newColor;

									
								} else if (raycastHitAgent && raycastHitAgent.material) {
									raycastHitAgent.material.color = newColor;
								
								}
								const navAgentInstance = raycastHitAgent.userData.NavAgentInstance;
								if (navAgentInstance) {
									navAgentInstance.agentRaycastHit();
								}
								
								
						} else {
							// console.log("rehit agent " + raycastHits[0].object.name));
						}
					} else {
						if ( raycastHitAgent ) {
							if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
								console.log("tryna reset agent colornode after no hit");
								raycastHitAgent.material.materialColor = oldColor;
								raycastHitAgent.material.needsUpdate = true;
								
							} else if (raycastHitAgent.material) {
								console.log("tryna reset agent color after no hit");
								raycastHitAgent.material.color = oldColor;
							}
						}
						raycastHitAgent = null;
					}
				} else {
					if ( raycastHitAgent ) {
					// 	{
						if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
							console.log("tryna reset agent color after no hit");
							raycastHitAgent.material.materialColor = oldColor;
							raycastHitAgent.material.needsUpdate = true;
						} else if (raycastHitAgent.material) {
							console.log("tryna reset agent color after no hit");
							raycastHitAgent.material.color = oldColor;
						}
					}
					raycastHitAgent = null;
				}
			}
		}


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