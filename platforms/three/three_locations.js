import * as THREE from 'three';

import {scene, InitSystems } from './three_main.mjs';

import {SetPlayerLocation} from './three_controls.js';

import { SetSceneLocations, userData } from '../../../connect/connect.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import { instancedModels, createDefaultSurface, SetSurface } from './three_instance.js';

import { CreateLight } from './three_lights.js';
import { getTriggerBody, staticBodies, getModelKinematicBody, kinematicBodies, npcKinematicBodies } from './three_physics.js';
import { agentModels, CreateNPCAgent, randomNavmeshPoint } from './three_nav.js';
import { modelViewProjection } from 'three/tsl';

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

export let navmesh;

export let playerPosition;

async function LoadModel(url) {
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync(url);
        // scene.add(gltf.scene);
        return gltf;
    } catch (error) {
        console.error('An error happened during model loading', error);
    }
}

export function createDefaultNavmesh() {
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
                                    
                                    // const model = await loadModel(modelsData[m].modelURL); //loaded but not added to scene - wait for navmesh, surfaces, physics etc.
                                                                                
                                    const modelData = await LoadLocationModel(modelsData[m].modelURL, locationData[i]);
                                    model = modelData.model;
                                    console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
                                    
                                    if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
                                    
                                        locationData[i].isHidden = true;
                                        // console.log("tryna hide model " + child.name);
                                    }															

                               


                                    if (locationData[i].eventData && locationData[i].eventData.includes("instance") ) { // use instancing to make a bunch and scatter
                                        // console.log("tryna instance model " + locationData[i].name);
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
                                        scene.remove(model);  //don't need the reference model
                                    } else { // regular meshes
                                                                             
                                        scene.add(model);
                                                                            
                                    }
                                    break; //only match one model per location!?
                                }
                            }
                        // }
                        // } else 

                    
                    } else {
                        CreateDefaultLocationMarker(locationData[i]); //use primitive or default models
                        
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
                                        console.log(modelsData[m]._id + " vs " + objexData[o].modelID );
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

export async function LoadLocationObjex() { //got to wait to load these, might need navagent etc
    if (locationObjex.length) {
        for (let i = 0; i < locationObjex.length; i++) {
            const modelData = await LoadLocationModel(locationObjex[i].modelData.modelURL, locationObjex[i].locationData);
            
            const model = modelData.model;
            model.userData.locationData = locationObjex[i].locationData;
            model.userData.objectData = locationObjex[i].objectData;
            const animations = modelData.animations;
            let count = 1;
            if (locationObjex[i].locationData.eventData && locationObjex[i].locationData.eventData.includes("scatter")) {
                if (locationObjex[i].locationData.eventData.includes("~")) {
                    count = parseFloat(locationObjex[i].locationData.eventData.split("~")[1]);
                }
            }
            // console.log("count is " + count);

            if (locationObjex[i].locationData.markerType == "character") {
                animationData[locationData[i].timestamp] = animations;
                for (let z = 0; z < count; z++) {
                    console.log("tryna clone a skinned mesh " + z);
                    // scene.add(model);
                    // AssignModelToAgent(model);
                    // agentModels.push(model);

                    const clonedModel = SkeletonUtils.clone(model); // normal clone/copy doesn't work

                    const agentID = locationObjex[i].locationData.timestamp + "_" + z.toString();

                    clonedModel.name = agentID;
                    
                    // const pos = randomNavmeshPoint();
                    
                    clonedModel.userData.name = agentID;
                    activeObjex.push(clonedModel);
                    
                
                    // npcKinematicBodies.push(body);

                    clonedModel.traverse(function (child) { 
                        if (child.isMesh) {
                            child.userData.locationData = locationObjex[i].locationData;
                            child.userData.objectData = locationObjex[i].objectData;
                        }
                    });
                    
                    scene.add(clonedModel);
                    // const body = await getModelKinematicBody(clonedModel); //pass the index too
                    // kinematicBodies.push(body);
                    await CreateNPCAgent(clonedModel, animations, z.toString(), locationObjex[i].locationData);
                
                }
            
            } else {
                // if (count != 1) {
                //     for (let z = 0; z < count; z++) {
                    console.log("tryna place an object " + locationObjex[i].locationData.name + " " + locationObjex[i].modelData.modelURL);
                //     }
                // } else {
                  const clonedObject = model.clone();
                    const x = parseFloat(locationObjex[i].locationData.x);
                    const y = parseFloat(locationObjex[i].locationData.y);
                    const z = parseFloat(locationObjex[i].locationData.z);
                    clonedObject.scale.set(4,4,4);
                    clonedObject.position.set(x,y,z);
                      scene.add(clonedObject);
                      clonedObject.visible = true;

                // }
            }
        }
    }
}

async function LoadLocationModel (url, locationData, isActive) {

    let model;
    let animations;
    if (!url) { //i.e. it's a primitive, not gltf
        console.log("no model url " + locationData.modelID);
        if (locationData.modelID.includes("sphere")) {
            console.log("gotsa sphere primitive");
            const geometry = new THREE.SphereGeometry(1,16,16);
            const material = new THREE.MeshBasicNodeMaterial({color: 'red', transparent: true, opacity: .5});
            model = new THREE.Mesh(geometry, material);
        } else if (locationData.modelID.includes("cube")) {
            const geometry = new THREE.BoxGeometry(1,1,1,16,16);
            const material = new THREE.MeshBasicNodeMaterial({color: 'red', transparent: true, opacity: .5});
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
   
        console.log("gotsa model !" + JSON.stringify(locationData));
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
        
        // model.castShadow = true;
        // model.receiveShadow = true;
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
                    // console.log("tryna hide model " + child.name);
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
                if (isActive || locationData.markerType == "navmesh" || locationData.locationTags.includes("active")) {
                    activeObjex.push(child);
                }
            
                if (locationData.markerType == "navmesh" ) {
                    // if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh")) {
                        navmesh = child;
                        navmesh.userData.name = "navmesh";
                    
                        groundObjex.push(navmesh);
                    
                } else if (locationData.markerType == "surface" ) {
                    console.log("gotsa ssurface");
                    // if (settings && settings.sceneTags && settings.sceneTags.includes("instancing")) {
                    SetSurface(child);
                        // surface = child;
                        // child.material = transmat;
                        // InitSurface();
                    // }
                }
                if (locationData.eventData.includes("static")) {
                
                    let staticObject = {};
                    staticObject.mesh = child;
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
                // mesh.layers.set(1);
                // // Rotate if necessary to match bone direction
                // // mesh.rotation.x = Math.PI / 2;
                // mesh.userData = {};
                // mesh.userData.name = "bone_" + locationData.timestamp;
                // mesh.userData.locationData = locationData;
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
            // model.material.color = "orange";
            console.log("adding trigger! " + model);
        }
        break;

        case "collider":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            model = await LoadLocationModel('https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb', locationData, true);
        }
        if (model) {
            scene.add(model.model);
            // model.material.color = "orange";
            console.log("adding collider! " + model);
        }
        break;

        case "gate":

        if (locationData.modelID && locationData.modelID.includes("primitive")) {
            model = await LoadLocationModel(null, locationData, true);
        } else {
            locationData.modelID = "primitive_cube";
            model = await LoadLocationModel(null, locationData, true);
        }
        if (model) {
            scene.add(model.model);
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
            if (model)
            scene.add(model.model);
            // model.material.color = "orange";
            console.log("adding a light! " + model);
        // }
        break;
    }
}

