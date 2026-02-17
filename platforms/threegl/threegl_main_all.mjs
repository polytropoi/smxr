import * as THREE from "three";
import { getBody, getMouseBall } from "./getBodies.js";
import RAPIER from 'rapier';
import { UltraHDRLoader } from 'jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

	// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import getLayer from "./getLayer.js";

	import { settings } from '../../../connect/settings.js';
	import { SetTimeKeysData, eventEl } from '../../../connect/events.js';
  import { SetSceneLocations } from '../../../connect/connect.js';

	// import { InitSurface, InstanceOnSurface, instancedModels } from './threegl_instance.js';

  	import { InitPathfinding, agents } from './threegl_nav.js';

    import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

let sampler;
// let surface;
  	// import { InitEnvMap, InitFog } from '../three/three_sky.js';

const w = window.innerWidth;
const h = window.innerHeight;
export const scene = new THREE.Scene();
// scene.backgroundBlurriness = 0.1;
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;

let staticBodies = [];

eventEl.addEventListener('ready-event', init); 



	export let navmesh, surface;

  let locationData;
  let modelsData;
  let raycastHitAgent;

  // let mixer, objects;
  export let water;// waterLayer0, waterLayer1;
  export let clock;

  let model, floor, floorPosition;
  let postProcessing;
  let showDebug = false;
  let controls;

  let doPostProcessing = false;
  

  let activeObjex = [];
  let dynamicObjex = [];

  export let staticObjex = [];
  export let navmeshObjex = [];
  export let surfaceObjex = [];
  let instancedModels = [];


  const mouse = new THREE.Vector2();
  


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

async function init() {
  await initSky();
}

async function initSky () {
 

     if (settings && settings.sceneUseVolumetricFog) {
        console.log("doin some fog...");
        const fogColor = settings.sceneColor1; // Sky blue
        // const fogDensity = 0.01; // Adjust this value! (Default is 0.00025)
        scene.fog = new THREE.Fog(fogColor, 1, 300);
        // scene.fog = new THREE.FogExp2( fogColor, 0.01 );
        // scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
     }

     if (scene && settings && settings.skyboxURL) {
        console.log("gotsa skybox url " + settings.skyboxURL);
        const envMapURL = settings.skyboxURL;
        const equirectTextureLoader = new THREE.TextureLoader();

        const textureEquirect = await equirectTextureLoader.loadAsync( envMapURL );
        textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirect.colorSpace = THREE.SRGBColorSpace;
        scene.background = textureEquirect;
        scene.environment = textureEquirect;
        scene.environmentIntensity = 2;
     }
     initModels();
 }


export async function initModels() {
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
                            // child.material = transmat;
                            // InitPathfinding(); //no
                          // }
                        } else if (locationData[i].markerType == "surface" ) {
                          // if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {

                            surface = child;
                            console.log("gotsa surface " + child);

                            // InitSurface(surface);
                            // surfaceObjex.push(child);
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
}

async function initSystems() {
      // if (surfaceObjex.length) {
      // 	surface = surfaceObjex[0];
      	
      // } 
      if (staticObjex.length) { //eg ground and stuff
        // await initStaticObjex(); 
        await initDefaultCollider();
      }

      if (surface) { // => scattering instances
        //  InitSurface();
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

    }


await RAPIER.init();
const gravity = { x: 0.0, y: 0, z: 0.0 };
const world = new RAPIER.World(gravity);

const numBodies = 100;
const bodies = [];
for (let i = 0; i < numBodies; i++) {
  const body = getBody(RAPIER, world);
  bodies.push(body);
  scene.add(body.mesh);
}

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);

const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff);
hemiLight.intensity = 1;
scene.add(hemiLight);

// Sprites BG
const gradientBackground = getLayer({
  hue: 0.6,
  numSprites: 8,
  opacity: 0.2,
  radius: 10,
  size: 24,
  z: -10.5,
});
scene.add(gradientBackground);

const pointsGeo = new THREE.BufferGeometry();
const pointsMat = new THREE.PointsMaterial({ 
  size: 0.035, 
  vertexColors: true
});
const points = new THREE.Points(pointsGeo, pointsMat);
scene.add(points);

function renderDebugView() {
  const { vertices, colors } = world.debugRender();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

// Mouse Interactivity
const raycaster = new THREE.Raycaster();
const pointerPos = new THREE.Vector2(0, 0);
const mousePos = new THREE.Vector3(0, 0, 0);

const mousePlaneGeo = new THREE.PlaneGeometry(48, 48, 48, 48);
const mousePlaneMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x00ff00,
  transparent: true,
  opacity: 0.0
});
const mousePlane = new THREE.Mesh(mousePlaneGeo, mousePlaneMat);
mousePlane.position.set(0, 0, 0.2);
scene.add(mousePlane);


window.addEventListener('mousemove', (evt) => {
  pointerPos.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1
  );
});

let cameraDirection = new THREE.Vector3();
function handleRaycast() {
  // orient the mouse plane to the camera
  camera.getWorldDirection(cameraDirection);
  cameraDirection.multiplyScalar(-1);
  mousePlane.lookAt(cameraDirection);

  raycaster.setFromCamera(pointerPos, camera);
  const intersects = raycaster.intersectObjects(
    [mousePlane],
    false
  );
  if (intersects.length > 0) {
    mousePos.copy(intersects[0].point);
  }
}

function animate() {
  requestAnimationFrame(animate);
  world.step();
  handleRaycast();
  mouseBall.update(mousePos);
  ctrls.update();
  // renderDebugView();
  bodies.forEach(b => b.update());
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);




async function initDefaultCollider () {
  
  const cubeBodyDesc = new RAPIER.RigidBodyDesc()
    .setTranslation(0, -1, 0); // Position in physics world (meters)
    // .setLinDamping(0.1) // Optional: damping
    // .setAngDamping(0.1);
  const cubeBody = world.createRigidBody(cubeBodyDesc);

  // 3. Create the Rapier Collider (Collision Shape)
  // Note: cuboid(halfWidth, halfHeight, halfDepth)
  const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(100, 0, 100) // Matches 1x1x1 mesh
    .setDensity(1)
    .setRestitution(0.8); // Bounciness
  world.createCollider(cubeColliderDesc, cubeBody.handle);

  // Store references to sync them (e.g., in an array)
  staticBodies.push({ cubeBody });

}



export async function InitSurface () {
    // surface = surfaceObjex[0];
    await surface;
    console.log("GOTSA SURFACE " + surface);
    // surface;
    sampler = new MeshSurfaceSampler(surface);
    sampler.build(); 
}

export async function InstanceOnSurface (model, count, scaleFactor, yMod) {

    await sampler;
    console.log("TRYNA INSTANCE ON SURFACE " + model.name + " count " + count);
    // Assuming 'terrainMesh' is your loaded terrain and 'treeGeometry'/'treeMaterial' are defined
    if (sampler) {

        count = count * 3;

        // let scaleFactor = data.yscale;

        console.log("gotsa SURFACE for " + model.name + " count " + count);

        let sampleGeometry, sampleMaterial;
            let sampleGeos = [];
            let sampleMats = [];
            let instancedMeshes = [];
            // let childCount = 0;
            model.traverse(node => {
            if (node.isMesh && node.material) {
                // childCount++;
                sampleGeometry = node.geometry;
                sampleGeos.push(sampleGeometry);
                sampleMaterial = node.material;
                sampleMats.push(sampleMaterial);
                
            }
        });

        console.log("child count for model " + sampleGeos.length);
        for (let c = 0; c < sampleGeos.length; c++) {
            const instancedMesh = new THREE.InstancedMesh(sampleGeos[c], sampleMats[c], count);
            instancedMeshes.push(instancedMesh);
        }
                        
        const waterLevel = parseFloat(settings.sceneWater.level);
        const dummy = new THREE.Object3D();
        let position = new THREE.Vector3();
        let theCount = 0;
        for (let i = 0; i < count; i++) {            
            await sampler.sample(position);
            
            if (position.y < waterLevel)  {
                // await sampler.sample(position);
                position.y = -100;
            }
            // position.y = position.y + yMod;
                // console.log("mesh position " + position.y);
            dummy.position.set(position.x, position.y, position.z);
            // console.log("instance positon " + JSON.stringify(position));
            // Optional: Add some random rotation
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const scale = Math.random() * scaleFactor * .75;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix(); // Update matrix based on position/rotation
            for (let m = 0; m < instancedMeshes.length; m++) {
                
                // console.log("instance count " + i);
                if (position.y > waterLevel)  {
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                    instancedMeshes[m].instanceMatrix.needsUpdate = true;
                } else {
                    // dummy.scale.setScalar(0);
                    dummy.scale.set(0,0,0);
                    instancedMeshes[m].setMatrixAt(i, dummy.matrix);
                }
            }

        }
        for (let s = 0; s < instancedMeshes.length; s++) {
            instancedMeshes[s].castShadow = true;
            instancedMeshes[s].receiveShadow = true;
          
            scene.add(instancedMeshes[s]);
        }
    
    } else {
        console.log("NO SURFACE");
    }
}