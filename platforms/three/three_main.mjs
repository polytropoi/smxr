	import * as THREE from 'three/webgpu';

	import RAPIER from 'rapier';
	
	import { color, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, objectPosition, screenUV, viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, time } from 'three/tsl';
	
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

	import Stats from './stats.js';

	export let scene, navmesh, surface;

	let locationData;
	let modelsData;

	let camera, renderer, stats;
	let mixer, objects, water;// waterLayer0, waterLayer1;
	export let clock;
	let model, floor, floorPosition;
	let postProcessing;
	let controls;

	let doPostProcessing = true;

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

	
	async function init() {

		scene = new THREE.Scene();

		await RAPIER.init();	
		const gravity = { x: 0.0, y: 0, z: 0.0 };
		const world = new RAPIER.World(gravity);

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
											}

																	
											console.log("loaded mesh with tags " + locationData[i].locationTags);
											
											if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
												// child.material = transmat;
												child.material.transparent = true;
												child.material.opacity = 0;
											}
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
										scene.add(model);
									
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

		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.25, 100 );
		camera.position.set( 3, 2, 4 );

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( settings.sceneColor2, 20, 100 );
		scene.backgroundNode = normalWorld.y.mix( color( settings.sceneColor1 ), color( settings.sceneColor2 ) );
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
			// if (settings.sceneWater) {
			const waterModule = await import ('./tsl/tsl_water.js');
			// const waterModule = await import {Water} from './tsl/tsl_water.js'
			water = new waterModule.Water();
			

			// water = waterModule.water;
			console.log("water is " + water);


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
		material.colorNode = iceColorNode;

		const count = 100;
		const scale = 3.5;
		const column = 10;

		objects = new THREE.Group();

		for ( let i = 0; i < count; i ++ ) {

			const x = i % column;
			const y = i / column;

			const mesh = new THREE.Mesh( geometry, material );
			mesh.position.set( x * scale, 0, y * scale );
			mesh.rotation.set( Math.random(), Math.random(), Math.random() );
			objects.add( mesh );

		}

		objects.position.set (
			( ( column - 1 ) * scale ) * - .5,
			- 1,
			( ( count / column ) * scale ) * - .5
		);

		scene.add( objects );

		// floor

		floor = new THREE.Mesh( new THREE.CylinderGeometry( 2, 2, 10 ), new THREE.MeshStandardNodeMaterial( { colorNode: iceColorNode } ) );
		// floor = new THREE.Mesh( new THREE.CylinderGeometry( 1.1, 1.1, 10 ), returnM );
		floor.position.set( 0, - 5, 0 );
		scene.add( floor );
		

		// caustics
		if (water && water.waterLayer0) {
			const waterPosY = positionWorld.y.sub( water.position.y );

			let transition = waterPosY.add( .1 ).saturate().oneMinus();
			transition = waterPosY.lessThan( 0 ).select( transition, normalWorld.y.mix( transition, 0 ) ).toVar();
			const colorNode = transition.mix( material.colorNode, material.colorNode.add( water.waterLayer0 ) );

			//material.colorNode = colorNode;
			floor.material.colorNode = colorNode;
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

		window.addEventListener( 'resize', onWindowResize );



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

			object.position.y = Math.sin( clock.elapsedTime + object.id ) * .3;
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
