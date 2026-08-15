import * as THREE from 'three';

import {scene, InitSystems, showDebug } from './wgl_main.mjs';

import {SetPlayerLocation, viewportPlaceholder} from './wgl_controls.js';

import {SceneObject, sceneObjects} from './wgl_actions.js';

import { SetSceneLocations, userData } from '../../../connect/connect.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import { instancedModels, createDefaultSurface, SetSurface } from './wgl_instance.js';

import { CreateLight } from './wgl_lights.js';
import { getTriggerBody, staticBodies, getModelKinematicBody, kinematicBodies, npcKinematicBodies, createDefaultCollider } from './wgl_physics.js';
import { agentModels, CreateNPCAgent, randomNavmeshPoint } from './wgl_nav.js';

import { splatObjex } from './wgl_splats.js';
import { InitVideo } from './wgl_media.js';
export let locations = {};

export let locationData;
export let modelsData;
export let objexData;
export let locationObjex = []; //includes location, objex, and model data

export let activeObjex = []; //raycastable

export let staticObjex = []; //physics
export let dynamicObjex = []; //""

export let groundObjex = [];

export let animationMixers = [];
export let animationData = {};

export let movingMeshes = [];

// export let sceneObjects = {};

export let navmesh;
export let navmeshGeometry;

export let playerPosition;

export let kinematicAgentMeshes = []; //children of navagents, for physics collisions

export async function LoadModel(url) {
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync(url);
        // scene.add(gltf.scene);
        return gltf;
    } catch (error) {
        console.error('An error happened during model loading', error);
    }
}

export function createDefaultNavmesh(locData) {
    // locationData[i].xscale, locationData[i].yscale, locationData[i].zscale
    console.log("tryna create default navmesh " + locData.xscale + " " + locData.yscale + " " +locData.zscale);
        const planeGeometry = new THREE.PlaneGeometry(locData.xscale, locData.zscale, 10, 10); // 50 x 50
        // navmeshGeometry = planeGeometry;
        planeGeometry.rotateX(-Math.PI / 2);

    //   planeGeometry.rotation.x = Math.PI / 2 * -1;
        const planeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'hotpink' });
        navmesh = new THREE.Mesh(planeGeometry, planeMaterial);
        navmesh.position.set(locData.x, locData.y, locData.z)
    
        
        scene.add(navmesh);
        if (locData.locationTags && locData.locationTags.includes("hide")) {
            navmesh.visible = false;
        }
        
        // navmesh.position.set(0,0,0);
        // // navmeshObject.scale.set(1,1,1);
        // navmesh.rotation.x = Math.PI / 2;
        // navmesh.updateMatrixWorld();
        // navmesh = navmeshObject;
        groundObjex.push(navmesh);
    }

export function InitLocations() {
    let modelsDataEl = document.getElementById('modelsData'); //"simple" entities, static or basic interaction
    if (modelsDataEl) {
        const theModelsData = modelsDataEl.getAttribute('data-models');
        modelsData = JSON.parse(atob(theModelsData));
        // console.log("modelsData " + JSON.stringify(modelsData));
    }

    let objexDataEl = document.getElementById('objexData'); //"complex" entities, with possible actions/behavior e.g. characters
    if (objexDataEl) {
        const theObjexData = objexDataEl.getAttribute('data-objex');
        objexData = JSON.parse(atob(theObjexData));
        // console.log("objexData " + JSON.stringify(objexData));
    }

    let locationDataEl = document.getElementById('locationData'); //locations have ids, types, can have models and objects assigned
    if (locationDataEl) {
        const theLocationData = locationDataEl.getAttribute('data-locations');

        locationData = JSON.parse(atob(theLocationData));
        SetSceneLocations(locationData);
        // console.log("locationData " + JSON.stringify(locationData));
    
    (async () => {
        try { 
            for (let i = 0; i < locationData.length; i++) {

                locations[locationData[i].timestamp] = locationData[i]; //cook an object instead of array for faster lookups by timestamp
                
                if (locationData.markerType != "none" && locationData[i].modelID && !locationData[i].modelID.includes("primitive") && locationData[i].modelID != "none") {
                    let model;
                    // if (locationData[i].modelID.includes("primitive")) {
                    //     console.log("gotsa primitive " + locationData[i].model);
                        
                    //     model = await LoadLocationModel(null, locationData[i]);
                    //     scene.add(model);
                    // } else { //it's a gltf
                        for (let m = 0; m < modelsData.length; m++) { //spin through imported models to match
                            if (locationData[i].modelID == modelsData[m]._id) {
                                locationData[i].isHidden = false;
                                
                                console.log("gotsa location model! " +modelsData[m].modelURL);
                                
                                if (modelsData[m].item_type == "splat") {
                                    console.log("GOTSA SPLAT! " + modelsData[m].name);
                                    let splat = {};
                                    splat.url = modelsData[m].modelURL;
                                    splat.locationData = locationData[i];
                                    splatObjex.push(splat);

                                } else {
                                    // const model = await loadModel(modelsData[m].modelURL); //loaded but not added to scene - wait for navmesh, surfaces, physics etc.
                                    let isActive = false;             
                                    if (locationData[i].markerType == "gate" || (locationData.locationTags && locationData.locationTags.includes("active"))) {
                                        isActive = true;
                                    } 
                                    const modelData = await LoadLocationModel(modelsData[m].modelURL, locationData[i], isActive);
                                    model = modelData.model;
                                    console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
                                    
                                    if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
                                        locationData[i].isHidden = true;
                                        // console.log("tryna hide model " + child.name);
                                    }															

                                    if (locationData[i].markerType == "brownian motion") {
                                        const meshMover = new MeshMover(model); 
                                        movingMeshes.push(meshMover);
                                    }
                            


                                    if (locationData[i].eventData && locationData[i].eventData.includes("instance") ) { // use instancing to make a bunch and scatter
                                        // console.log("tryna instance model " + locationData[i].name);
                                        let instancedModel = {};
                                        const originalModel = await LoadModel(modelsData[m].modelURL)
                                        // const countsplit = locationData[i].eventData.split("~");
                                        // const count = countsplit[1];
                                        instancedModel.model = originalModel.scene;
                                        instancedModel.locationData = locationData[i];
                                        instancedModel.modelData = modelsData[m];
                                        instancedModel.scale = locationData[i].yscale ? locationData[i].yscale : 1;
                                        // instancedModel.count = count;
                                        instancedModels.push(instancedModel);
                                        console.log("instancedModels length " + instancedModels.length);
                                        model.visible = false;
                                        scene.remove(model);  //don't need the reference model
                                    } else { // regular meshes
                                                                            
                                        scene.add(model);
                                        if (locationData[i].markerType == "video") {
                                            model.name = "videoModel";
                                            activeObjex.push(model);
                                            InitVideo(locationData[i]);
                                        }   
                                    }
                                    
                                    break; //only match one model per location!?
                                }
                            }
                        }
                    // } else 

                
                } else {
                    CreateDefaultLocationMarker(locationData[i]); //use primitive or default models
                    
                    if (locationData[i].markerType == "navmesh") {
                        createDefaultNavmesh(locationData[i]);
                    }
                    if (locationData[i].markerType == "surface") {
                        createDefaultSurface(locationData[i]);
                    }
                    if (locationData[i].markerType == "player") {
                        console.log("playerloc " + JSON.stringify(locationData[i]));
                        const px = parseFloat(locationData[i].x);
                        const py = parseFloat(locationData[i].y);
                        const pz = parseFloat(locationData[i].z);
                        SetPlayerLocation(px,py,pz);
                    }
                    if (locationData[i].markerType == "collider") {
                        // createDefaultCollider(locationData[i]);
                        let staticObject = {};
                        const geo = new THREE.PlaneGeometry(locationData[i].xscale, locationData[i].zscale, 10, 10);
                        const material = new THREE.MeshStandardMaterial( { color: 'blue', wireframe: true } );
                        const mesh = new THREE.Mesh(geo,material);
                        staticObject.mesh = mesh;
                        mesh.rotation.x = -Math.PI / 2;
                        mesh.position.set(locationData[i].x, locationData[i].z, locationData[i].z)
                        staticObject.locationData = locationData[i];
                        // staticObject.isHidden = locationData.locationTags && locationData.locationTags.includes("hide");
                        staticObject.isHidden = true;
                        console.log("gotsa static collider object ishidden " + staticObject.isHidden);
                        // scene.add(mesh);
                        // mesh.visible = false;
                        staticObjex.push(staticObject);
                    }
                    // if (locationData[i].markerType == "light") {
                    //     CreateLight(locationData[i]);
                    // }
                    // if (locationData[i].markerType == "gate") {
                    //     // CreateSceneGate(locationData[i]);
                    // }                        
                }
                if (locationData[i].objectID) { // objects can have (rigged) models, and actions, which can summon other objects with models and actions.  should be object type only?
                    
                    for (let o = 0; o < objexData.length; o++) { //spin through imported models to match
                        if (locationData[i].objectID == objexData[o]._id) {
                            // locationData[i].isHidden = false;
                            
                            // console.log("gotsa location objectID! " + objexData[o]._id +" looking for " + objexData[o].modelID);

                            if (objexData[o].modelID) {
                                for (let m = 0; m < modelsData.length; m++) { //spin through imported models to match - model deps/urls should have been added to the response serverside
                                    // console.log(modelsData[m]._id + " vs " + objexData[o].modelID );
                                    if (modelsData[m]._id == objexData[o].modelID) {
                                        console.log("gotsa location object modelID " + modelsData[m].modelURL);
                                        const locData = {};
                                        locData.locationData = locationData[i];
                                        locData.modelData = modelsData[m];
                                        locData.objectData = objexData[o]; //add the object data to the thing
                                        // const model = await LoadLocationModel(modelsData[m].modelURL, locData, true);

                                        locationObjex.push(locData);
                                        
                                        
                                    }
                                }
                            }

                        }
                    }
                }
                // console.log("locationData " + i + " of "  + locationData.length);
            }
            // console.log("looking for Surface with models " + instancedModels.length);
            
        } catch (e) {
            console.error("ERROR LOADING GLTF! " + e);
        } finally {
            // console.log("locations loaded! " + locations);
            InitSystems();
        }
    })();
    
    }
}

 class MeshMover{
    constructor(mesh){
        this.mesh = mesh;
        this.initPosition = new THREE.Vector3();

        this.mesh.getWorldPosition(this.initPosition);
        this.random1 = Math.random();
        this.random2 = Math.random();
        this.random3 = Math.random();
    }
    update(time) {

        // Creates a floating/bobbing effect
        this.mesh.position.y = this.initPosition.y + Math.cos(time * .001) * this.random1 / 2; 
        this.mesh.position.z = this.initPosition.z + Math.sin(time * .0001) * this.random2 * 10;
        // Creates a circular wandering effect
        this.mesh.position.x = this.initPosition.x + Math.sin(time * .0001) * this.random3 * 10;
    }
}

async function InitCharacter(locationData) {
    console.log("tryna init non-object ccharacter " + JSON.stringify(locationData.modelData));
     const modelData = await LoadModel(locationData.modelData.modelURL);
            
    const model = modelData.scene;
  
    let count = 1;
    model.userData.locationData = locationData;
   
    const animations = modelData.animations;
    animationData[locationData.timestamp] = animations;
    for (let z = 0; z < count; z++) {
        console.log("tryna clone a character mesh " + z);
        // scene.add(model);
        // AssignModelToAgent(model);
        // agentModels.push(model);
        let clonedModel;
        if (animations && animations.length) {
            clonedModel = SkeletonUtils.clone(model); // normal clone/copy doesn't work
        } else {
            clonedModel = model.clone();
        }
        // const sceneObjectID = locationObjex[i].locationData.timestamp + "_" + Date.now();
        // locationObjex[i].objectData.sceneObjectID = sceneObjectID;
        clonedModel.name = locatioData.name;
        
        // clonedModel.userData.locationData = locationObjex[i].locationData;
        // clonedModel.userData.objectData = locationObjex[i].objectData;

        clonedModel.userData.name = locatioData.name;
        
        clonedModel.traverse(function (child) { 
            if (child.isMesh) {
                child.userData.name = locatioData.name;
                child.userData.locationData = locationData;
                // child.userData.objectData = locationObjex[i].objectData;
                // child.bindMode = "detached";
            }
        });

        const geometry = new THREE.CapsuleGeometry( .25, .5, 4, 8, 1 );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
        const physicsColliderMesh = new THREE.Mesh( geometry, material );
        clonedModel.add(physicsColliderMesh);
        
        const xscale = locationData.xscale ? parseFloat(locationData.xscale) : 1;
        const yscale = locationData.yscale ? parseFloat(locationData.yscale) : 1;
        const zscale = locationData.zscale ? parseFloat(locationData.zscale) : 1;
        const random = clamp(Math.random() * 2, .75, 1.25);
        console.log("tryna scale sceneObjectID " + sceneObjectID + "  " + xscale + " " + yscale + " " + zscale);
        clonedModel.position.set(0,0,0);
        
        clonedModel.scale.set(xscale * random, yscale * random, zscale * random);
        scene.add(clonedModel);
        activeObjex.push(clonedModel);
        activeObjex.push(parent);

        physicsColliderMesh.layers.enable(0);
        if (!showDebug) {
            physicsColliderMesh.visible = false;
        }
        physicsColliderMesh.userData.locationData = locationData;

        await CreateNPCAgent(null, clonedModel, animations, z.toString(), locationData);
        kinematicAgentMeshes.push(physicsColliderMesh); //load later after settledown

    }
}
// export async function LoadLocationObject (objectData) {
//      return modelData = await LoadModel(objectData.modelData.modelURL);
            
// }

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export async function LoadLocationObjex() { // wait to load these, might need navagent etc
    if (locationObjex.length) {
        for (let i = 0; i < locationObjex.length; i++) {


            // const modelData = await LoadLocationModel(locationObjex[i].modelData.modelURL, locationObjex[i].locationData);
            const modelData = await LoadModel(locationObjex[i].modelData.modelURL);
            
            const model = modelData.scene;
            model.userData.locationData = locationObjex[i].locationData;
            model.userData.objectData = locationObjex[i].objectData;

            model.castShadow = true;
            model.receiveShadow = true;
            const animations = modelData.animations;
            let count = 1;
            if (locationObjex[i].locationData.eventData && locationObjex[i].locationData.eventData.includes("scatter")) { //scatter, not instancing, but cloning multiples
                if (locationObjex[i].locationData.eventData.includes("~")) {
                    count = parseFloat(locationObjex[i].locationData.eventData.split("~")[1]);
                }
            }
            // console.log("count is " + count);

            if (locationObjex[i].locationData.markerType == "character") {
                animationData[locationData[i].timestamp] = animations;
                for (let z = 0; z < count; z++) {
                    console.log("tryna clone a character mesh " + z);
                    // scene.add(model);
                    // AssignModelToAgent(model);
                    // agentModels.push(model);
                    let clonedModel;
                    if (animations && animations.length) {
                        clonedModel = SkeletonUtils.clone(model); // normal clone/copy doesn't work
                    } else {
                        clonedModel = model.clone();
                    }
                    const sceneObjectID = locationObjex[i].locationData.timestamp + "_" + Date.now();
                    locationObjex[i].objectData.sceneObjectID = sceneObjectID;
                    clonedModel.name = sceneObjectID;
                    
                    // const pos = randomNavmeshPoint();
                    
                    
                    clonedModel.userData.locationData = locationObjex[i].locationData;
                    clonedModel.userData.objectData = locationObjex[i].objectData;

                    clonedModel.userData.name = sceneObjectID;
                    // activeObjex.push(clonedModel);
                    
                    clonedModel.castShadow = true;
                    clonedModel.receiveShadow = true;
                    // npcKinematicBodies.push(body);

                    clonedModel.traverse(function (child) { 
                        if (child.isMesh) {
                            child.userData.name = sceneObjectID;
                            child.userData.locationData = locationObjex[i].locationData;
                            child.userData.objectData = locationObjex[i].objectData;
                            child.castShadow = true;
                            child.receiveShadow = true;
                            // child.bindMode = "detached";
                        }
                    });

                    const geometry = new THREE.CapsuleGeometry( .25, .5, 4, 8, 1 );
                    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
                    const physicsColliderMesh = new THREE.Mesh( geometry, material );
                    clonedModel.add(physicsColliderMesh);
                    // const parent = new THREE.Mesh( geometry, material );
                    // scene.add(parent);
                    // parent.userData.locationData = locationObjex[i].locationData;
                    // parent.userData.objectData = locationObjex[i].objectData;
                    // parent.add(clonedModel);
                    const xscale = locationObjex[i].locationData.xscale ? parseFloat(locationObjex[i].locationData.xscale) : 1;
                    const yscale = locationObjex[i].locationData.yscale ? parseFloat(locationObjex[i].locationData.yscale) : 1;
                    const zscale = locationObjex[i].locationData.zscale ? parseFloat(locationObjex[i].locationData.zscale) : 1;
                    const random = clamp(Math.random() * 2, .75, 1.25);
                    console.log("tryna scale sceneObjectID " + sceneObjectID + "  " + xscale + " " + yscale + " " + zscale);
                    clonedModel.position.set(0,0,0);
                    
                    clonedModel.scale.set(xscale * random, yscale * random, zscale * random);
                    scene.add(clonedModel);
                    activeObjex.push(clonedModel);
                    // activeObjex.push(parent);

                    physicsColliderMesh.layers.enable(0);
                    if (!showDebug) {
                        physicsColliderMesh.visible = false;
                    }
                    physicsColliderMesh.userData.locationData = locationObjex[i].locationData;
                    physicsColliderMesh.userData.objectData = locationObjex[i].objectData;
                    // parent.name = "navagent";
                    // await CreateNPCAgent(parent, clonedModel, animations, z.toString(), locationObjex[i].locationData);
                    const sceneObject = new SceneObject(clonedModel, locationObjex[i].objectData, false, null);
                    // const sceneObjectInstance = {sceneObjectID : sceneObject};
                    // sceneObjects.push(sceneObjectInstance);
                    sceneObjects[sceneObjectID] = sceneObject;
                        // const sceneObjectInstance = {sceneObjectID : sceneObject};
                        // sceneObjects.push(sceneObject);
                    // sceneObjectInstance.
                    await CreateNPCAgent(null, clonedModel, animations, z.toString(), locationObjex[i].locationData, locationObjex[i].objectData, sceneObject);
                    kinematicAgentMeshes.push(physicsColliderMesh); //load later after settledown

                    // const body = await getModelKinematicBody(physicsColliderMesh, locationObjex[i].locationData, locationObjex[i].objectData); //pass the index too
                    // kinematicBodies.push(body);
                }
            
            } else {
                if (count != 1) {
                    for (let zm = 0; zm < count; zm++) {
                        // console.log("tryna place an object " + zm + " " + locationObjex[i].locationData.name + " " + locationObjex[i].modelData.modelURL);
                        //     }
                        // } else {
                        const clonedObject = model.clone();
                        const sceneObjectID = locationObjex[i].locationData.timestamp + "_" + Math.floor(Date.now()/1000);
                        locationObjex[i].objectData.sceneObjectID = sceneObjectID;

                        const randomPoint = randomNavmeshPoint();
                        const x = randomPoint.x;
                        const y = randomPoint.y;
                        const z = randomPoint.z;
                        clonedObject.scale.set(1,1,1);
                        clonedObject.position.set(x,y,z);
                        clonedObject.castShadow = true;
                        clonedObject.receiveShadow = true;
                        scene.add(clonedObject);
                        clonedObject.visible = true;
                        activeObjex.push(clonedObject);
                        clonedObject.traverse(function (child) { 
                        if (child.isMesh) {
                            child.userData.locationData = locationObjex[i].locationData;
                            child.userData.objectData = locationObjex[i].objectData;
                            child.castShadow = true;
                            child.receiveShadow = true;
                            }
                        });

                        const sceneObject = new SceneObject(clonedObject, locationObjex[i].objectData, false, null);
                        sceneObjects[sceneObjectID] = sceneObject;
                        // const sceneObjectInstance = {sceneObjectID : sceneObject};
                        // sceneObjects.push(sceneObject);
                    }
                } else {
                    // const clonedObject = model.clone();

                    const sceneObjectID = locationObjex[i].locationData.timestamp;
                    locationObjex[i].objectData.sceneObjectID = sceneObjectID;
                    model.scale.set(locationObjex[i].locationData.xscale,locationObjex[i].locationData.yscale,locationObjex[i].locationData.zscale);
                    model.position.set(locationObjex[i].locationData.x,locationObjex[i].locationData.y,locationObjex[i].locationData.z);
                    scene.add(model);
                    model.visible = true;
                    activeObjex.push(model);
                    model.castShadow = true;
                        model.receiveShadow = true;
                    model.traverse(function (child) { 
                    if (child.isMesh) {
                        child.userData.locationData = locationObjex[i].locationData;
                        child.userData.objectData = locationObjex[i].objectData;
                         child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    const sceneObject = new SceneObject(model, locationObjex[i].objectData, false, null);
                    sceneObjects[sceneObjectID] = sceneObject;
                    // sceneObjectsArray.push(locationObjex[i].data)
                        // const sceneObjectInstance = {sceneObjectID : sceneObject};
                        // sceneObjects.push(sceneObject);
                }
            }
        }
    }
}

export async function LoadAndDropSingleObject (oData, locationData) { //eg drop

    try {
    const sceneObjectID = oData._id + "_so_" +  Math.floor(Date.now()/1000);
    // objectData.sceneObjectID = sceneObjectID;

    console.log("tryna LoadAndDropSingleObject " + oData.name);
    let matchedObject = oData;
     

    // for (let i = 0; i < locationObjex.length; i++) {
    //     if (oData.objectID == locationObjex[i]._id) {
    //         matchedObject = locationObjex[i];
    //     }
    // }

    if (matchedObject) {
        // console.log("matched inventory to location object " + JSON.stringify(matchedObject));
        matchedObject.sceneObjectID = sceneObjectID;
        const modelData = await LoadModel(matchedObject.modelURL);        
        const model = modelData.scene;
        model.userData.locationData = locationData;
        model.userData.objectData = matchedObject;
        const animations = modelData.animations;
        // model.scale.set(objectData.locationData.xscale,objectData.locationData.yscale,objectData.locationData.zscale);
        // model.position.set(objectData.locationData.x,objectData.locationData.y,objectData.locationData.z);
        scene.add(model);
        model.visible = true;
        activeObjex.push(model);
        model.traverse(function (child) { 
        if (child.isMesh) {
            child.userData.locationData = locationData;
            child.userData.objectData = matchedObject;
            }
        });

        // const worldPosition = new THREE.Vector3();
        // viewportPlaceholder.getWorldPosition(worldPosition);
        model.position.set(locationData.x, locationData.y, locationData.z);
        const sceneObject = new SceneObject(model, matchedObject, false, null);
        sceneObjects[sceneObjectID] = sceneObject;
    }
    } catch (e) {
        console.log("error tryna LoadAndDropSingleObject " + e);    
    }
}

//main geo loading method, see loadlocationobjex for "objex"
async function LoadLocationModel (url, locationData, isActive) { 

    let model;
    let animations;
    if (!url) { //i.e. it's a primitive, not gltf
        // console.log("no model url " + locationData.modelID);
        if (locationData.modelID.includes("sphere")) {
            // console.log("gotsa sphere primitive");
            const geometry = new THREE.SphereGeometry(1,16,16);
            const material = new THREE.MeshBasicMaterial({color: 'red', transparent: true, opacity: .5});
            model = new THREE.Mesh(geometry, material);
        } else if (locationData.modelID.includes("cube")) {
            const geometry = new THREE.BoxGeometry(1,1,1,16,16);
            const material = new THREE.MeshBasicMaterial({color: 'red', transparent: true, opacity: .5});
            model = new THREE.Mesh(geometry, material);
        } else if (locationData.modelID.includes("capsule")) {
            const geometry = new THREE.CapsuleGeometry( 1, 1, 4, 8, 1 );
            const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
            model = new THREE.Mesh( geometry, material );
        } else if (locationData.modelID.includes("cylinder")) {
            const geometry = new THREE.PlaneGeometry( 1, 1, 20, 24 );
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
            model = new THREE.Mesh( geometry, material );
        } else if (locationData.modelID.includes("plane")) {
            const geometry = new THREE.PlaneGeometry( 1, 1 );
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
            model = new THREE.Mesh( geometry, material );
        } else if (locationData.modelID.includes("torus")) {
        
        }
    } else { 
        console.log("tryna fetch model " + url)
        const gltf = await LoadModel(url);
        model = gltf.scene;
        animations = gltf.animations;

    }

    if (model) {
   
        console.log("gotsa model !" + JSON.stringify(locationData) + " " + isActive);
        model.position.set(parseFloat(locationData.x),parseFloat(locationData.y),parseFloat(locationData.z));
        const xscale = locationData.xscale ? locationData.xscale : 1;
        const yscale = locationData.yscale ? locationData.yscale : 1;
        const zscale = locationData.zscale ? locationData.zscale : 1;

        const eulerx = locationData.eulerx ? locationData.eulerx : 0;
        const eulery = locationData.eulery ? locationData.eulery : 0;
        const eulerz = locationData.eulerz ? locationData.eulerz : 0;

        model.rotation.x = eulerx;
        model.rotation.y = eulery;
        model.rotation.z = eulerz;

        model.scale.set(xscale,yscale,zscale);

            // model.scale.set(20,20,20);
        
        // model.layers.set(1);
        model.userData.locationData = locationData;

        model.userData.timestamp = locationData.timestamp;
        
        model.castShadow = true;
        model.receiveShadow = true;
        // if (locationData.locationTags.includes("active")) {
            // activeObjex.push(model);
        // } 

        if (locationData.locationTags && locationData.locationTags.includes("billboard")) {
            lookAtCameraObjects.push(model);
        }

        model.traverse(function (child) {
           
            if (child.isMesh){

                child.userData = {};
                child.userData.locationData = locationData; //
                
                child.castShadow = true;
                child.receiveShadow = true;
                // console.log("loaded mesh with tags " + locationData.locationTags);
                child.userData.locationData = locationData;
                if (locationData.locationTags && locationData.locationTags.includes("hide") ) {
            
                    // child.material = transmat;
                    child.material.transparent = true;
                    child.material.opacity = 0;
                    // locationData.isHidden = true;
                    console.log("tryna hide model " + child.name);
                    child.visible = false;
                } else {
                                                                
                    if (child.material) {
                        // console.log("setting scene.environment envmap " + scene.environment );
                        // child.material.roughness = 0.5;
                        child.material.envMap = scene.environment;
                        child.envMapIntensity = 5;
                        child.castShadow = true;	
                        child.receiveShadow = true;
                    }
                    // activeObjex.push(navmesh);
                
                }
                if ((isActive || locationData.locationTags.includes("active")) && locationData.markerType != "trigger") {
                    activeObjex.push(child);
                }
            
                if (locationData.markerType == "navmesh" ) {
                    // if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh")) {
                        navmesh = child;
                        navmesh.userData.name = "navmesh";
                        child.material.transparent = true;
                        child.material.opacity = 0;
                        groundObjex.push(navmesh);
                    
                } else if (locationData.markerType == "surface" ) {
                    console.log("gotsa ssurface");
                    // if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {
                    SetSurface(child);
                    // child.material.transparent = true;
                    //     child.material.opacity = 0;
                        // surface = child;
                        // child.material = transmat;
                        // InitSurface();
                    // }
                }
                if (locationData.eventData.includes("static")) {
                
                    let staticObject = {};
                    staticObject.mesh = child;
                    // child.visible = false;
                    staticObject.locationData = locationData;
                    staticObject.isHidden = locationData.locationTags && locationData.locationTags.includes("hide");
                    console.log("gotsa static object ishidden " + staticObject.isHidden);
                    staticObjex.push(staticObject);
                } else if  (locationData.eventData.includes("dynamic")) {
                    dynamicObjex.push(model);

                } else {
                    // child.mesh.layers.set(1);
                    // child.mesh.userData = locationData[i];	
                }
                    
                
            } else if (child.isBone && !child.parent.isBone) { //add raycast/collision meshes to root bone(s)
                // const geometry = new THREE.CapsuleGeometry(1, 1, 8, 8); // Base size
                console.log("gotsa bone! " + child);
                // const geometry = new THREE.CylinderGeometry(2, 2, 2, 8, 8); // Base size
                // const material = new THREE.MeshBasicMaterial({ color: 'red' });
                // const mesh = new THREE.Mesh(geometry, material);
                // mesh.material.side = THREE.DoubleSide;

                //     // Position and orient the mesh to span the bone
                // mesh.position.set(0, 0, 0); // Usually at the parent bone
                
                // // if (settings && settings.)
               
                // // Scale mesh based on bone's position vector length
                // const boneLength = child.position.length();
                // if (boneLength > 1) {
                //     mesh.scale.set(1, boneLength, 1);
                //     mesh.position.y = boneLength / 2; // Adjust based on pivot
                // }
                // // mesh.layers.set(1);
                // // Rotate if necessary to match bone direction
                // // mesh.rotation.x = Math.PI / 2;
                // mesh.userData = {};
                // mesh.userData.name = "bone_" + locationData.timestamp;
                // mesh.userData.locationData = locationData;
                // // mesh.userData.objectData = objectData;
                // activeObjex.push(mesh);
                // child.add(mesh);
                // mesh.visible = true;
            } 
            

        });
        
        // scene.add(model);
        return {"model" : model, "animations" : animations};
    } else {
        return null;
    }
}

async function CreateDefaultLocationMarker(locationData) { //use default model or primitive

    console.log("tryna load default or primitive " + locationData.modelID + " for " + locationData.markerType);
    let model;
    switch (locationData.markerType) {

        case "poi":
            
        if (locationData.modelID &&locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        if (model) {
            scene.add(model.model);
            model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding poi! " + model);
        }
        break;
        
        case "placeholder":

        if (locationData.modelID &&locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        if (model) {
            scene.add(model.model);
            model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding placeholder! " + model);
        }
        break;

        case "trigger":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        if (model) {
            
            
            scene.add(model.model);
            const triggerBody = await getTriggerBody(model.model, locationData);
            staticBodies.push(triggerBody);
            model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding trigger! " + model);
        }
        break;

        case "collider":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            // model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        if (model) {
            scene.add(model.model);
            model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding collider! " + model);
        }
        break;

        case "gate":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            // locationData.modelID = "primitive_cube";
            model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/gate2.glb', locationData, true);
        }
        if (model) {
            scene.add(model.model);
            model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding a gate! " + model);
        }
        break;

        case "light":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            // model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        // if (model) {
            CreateLight(locationData);
        //     if (model) {
        //     scene.add(model.model);
        // model.model.castShadow = true;
            // model.material.color = "orange";
            console.log("adding a light! ");
        // }
        break;

        // case "video": 

        // if (locationData.modelID && locationData.modelID.includes("primitive")) {
        //     model = await LoadLocationModel(null, locationData, true);
        // } else {
        //     // locationData.modelID = "primitive_cube";
        //     model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/gate2.glb', locationData, true);
        // }
       
        // break;
    }
}

export function EnterSceneGate (eventData) {

    if (eventData != null && eventData != "") {
        console.log("tryna gate with eventData " + eventData);
        if (eventData.toString().toLowerCase().includes("tag")) { //if it's a tag look up matches
        if (eventData.toString().toLowerCase().includes("~")) {
            const tagSplit = eventData.toString().toLowerCase().split("~");
            (async () => { //hrm where to put this?
                try {
                console.log("tryna fetch scenes with tags " + tagSplit[1]);
                const response = await fetch('/scenedata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                    tags: tagSplit[1]
                    })
                });
                const data = await response.json();
                if (data.short_id) {
                    // let url = "/webxr/" + data.short_id;
                    window.location.href = "/webxr/" + data.short_id;
                    // that.dialogEl.components.mod_dialog.showPanel("Go to " + data.sceneTitle +" ?", "href~"+ url, "gatePass", 5000 );
                } else {
                    console.log("no scenes found with tags " + eventData);
                }
                } catch(error) {
                    console.log(error);
                } 
            })();  
        }
        } else { //if not a tag assume it's a short_id
        console.log("no tags but going to " + eventData);
        window.location.href = "/three/" + eventData;
        // window.location.href = locData.eventData;
        }
        
    } else { //otherwise go to a random domain scene
        console.log("tryna go to random domain scene");
        let ascenesEl = document.getElementById("availableScenesControl");
        if (ascenesEl) {
        let asControl = ascenesEl.components.available_scenes_control; //available scenes in this domain
        if (asControl) {
            let scene = asControl.returnRandomScene();
            let url = "/three/" + scene.sceneKey;
            window.location.href = url; 
            
        }
        }
    }
}
