import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../../../connect/media.js';
import { settings } from '../../../connect/settings.js';
import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
import { SetSceneLocations } from '../../../connect/connect.js';

import { InitPathfinding, agents, closestNavmeshPoint } from './spark_nav.js';

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

export let camera, scene, renderer, controls;

let locationData;
let modelsData;
let raycastHitAgent;
const objects = [];

let groundObjex = [];
let downcaster, mousecaster;

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


    export let navmesh, surface;


    // let mixer, objects;
    // export let water;// waterLayer0, waterLayer1;
    export let clock;

    let model, floor, floorPosition;
    let postProcessing;
    let showDebug = true;


    let doPostProcessing = false;
    

    let activeObjex = [];
    let dynamicObjex = [];
    export let playerPosition;

      export let staticObjex = [];
  export let navmeshObjex = [];
  export let surfaceObjex = [];
//   let instancedModels = [];
    eventEl.addEventListener('ready-event', init);



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


// init();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.y = 10;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x00000 );
    // scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 2.5 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    controls = new PointerLockControls( camera, document.body );
    controls.pointerSpeed = .25;
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

    const onKeyDown = function ( event ) {

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

        }

    };

    const onKeyUp = function ( event ) {

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

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );

    downcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 200 );

    // floor

    // let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    // floorGeometry.rotateX( - Math.PI / 2 );

    // // vertex displacement

    // let position = floorGeometry.attributes.position;

    // for ( let i = 0, l = position.count; i < l; i ++ ) {

    //     vertex.fromBufferAttribute( position, i );

    //     vertex.x += Math.random() * 20 - 10;
    //     vertex.y += Math.random() * 2;
    //     vertex.z += Math.random() * 20 - 10;

    //     position.setXYZ( i, vertex.x, vertex.y, vertex.z );

    // }

    // floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    // position = floorGeometry.attributes.position;
    // const colorsFloor = [];

    // for ( let i = 0, l = position.count; i < l; i ++ ) {

    //     color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );
    //     colorsFloor.push( color.r, color.g, color.b );

    // }

    // floorGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

    // const floorMaterial = new THREE.MeshBasicMaterial( { wireframe: true } );

    // const floor = new THREE.Mesh( floorGeometry, floorMaterial );
    // scene.add( floor );

    // // objects

    // const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 ).toNonIndexed();

    // position = boxGeometry.attributes.position;
    // const colorsBox = [];

    // for ( let i = 0, l = position.count; i < l; i ++ ) {

    //     color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );
    //     colorsBox.push( color.r, color.g, color.b );

    // }

    // boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

    // for ( let i = 0; i < 500; i ++ ) {

    //     const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
    //     boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );

    //     const box = new THREE.Mesh( boxGeometry, boxMaterial );
    //     box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
    //     box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
    //     box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

    //     scene.add( box );
    //     objects.push( box );

    // }

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );

    //

    window.addEventListener( 'resize', onWindowResize );

    initModels();

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
                                                    // child.material.transparent = true;
                                                    // child.material.opacity = 0;
                                                    child.material.wireframe = true;
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
                                                        groundObjex.push(navmesh);
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
                        // if (locationData[i].markerType == "player") {
                        //     console.log("playerposition " + JSON.stringify(locationData[i]));
                        //     playerPosition = locationData[i];
                        // }
                        // console.log("locationData " + i + " of "  + locationData.length);
                    }
                    // console.log("looking for Surface with models " + instancedModels.length);
                    
                } catch (e) {
                    console.error("ERROR LOADING GLTF! " + e);
                } finally {
                    console.log("settings " + JSON.stringify(settings));

                    // if (playerPosition) {
                    //     console.log("tryna set player position " + playerPosition);
                    //     camera.position.set( playerPosition.x, playerPosition.y, playerPosition.z );
                    // } 
                    if (!navmesh) {
                        createDefaultNavmesh();
                    } else {
                    //    await InitPathfinding();
                    }
                    if (staticObjex.length == 0) {
                        // initDefaultStaticCollider();
                    }
                    initSystems();
                }
            })();
            
        }
    }

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
                if (settings && settings.sceneTags) {
                    // if (settings.sceneTags.includes("debug")) {
                    // stats.showPanel( 0,1,2,3 );
                    // stats = new Stats();
        
                    // stats.domElement.style.right = 'auto';
                    // stats.domElement.style.left = '0px'; // Positioned at top-right
                    // stats.domElement.style.bottom = '0px';
                    // document.body.appendChild(stats.domElement);
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
    
    
            }
    

            function createDefaultNavmesh() {
                      const planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10); // 50 x 50
                    //   planeGeometry.rotation.x = Math.PI / 2 * -1;
                        const planeMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: 'hotpink' });
                        let navmeshObject = new THREE.Mesh(planeGeometry, planeMaterial);
                        
                        navmeshObject.position.set(0,0,0);
                        navmeshObject.scale.set(1,1,1);
                        navmeshObject.rotation.x = -Math.PI / 2;
                        navmeshObject.updateMatrixWorld();
                        navmesh = navmeshObject;
                        
                        
                        scene.add(navmeshObject);
                        groundObjex.push(navmesh);
            }



function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    const time = performance.now();

    if ( navmesh && controls.isLocked === true ) {

        downcaster.ray.origin.copy( controls.object.position );
        downcaster.ray.origin.y += 10;
        console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
        const intersections = downcaster.intersectObjects( groundObjex, true );

        const onObject = intersections.length > 0;
        if (onObject) {
            console.log("intersections " + intersections.length + " distance to 0th " + intersections[0].distance + " point.y " + intersections[0].point.y + " camera y " + controls.object.position.y);
        }

        const delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 12 * delta;
        velocity.z -= velocity.z * 12 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 20.0 * (settings.playerSpeed) * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 20.0 * (settings.playerSpeed) * delta;

        if ( onObject === true ) {

            velocity.y = Math.max( 0, velocity.y );
            canJump = true;

        }

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
                controls.object.position.y = intersections[0].point.y + 2;

                canJump = true;
            }
        // }
           

        // }

    }

    if (water) {			
        water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    }


    prevTime = time;

    renderer.render( scene, camera );

}
