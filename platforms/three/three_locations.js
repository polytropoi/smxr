import * as THREE from 'three';

import {scene, initSystems} from './three_main.mjs';

import {SetPlayerLocation} from './three_controls.js';

import { SetSceneLocations, userData } from '../../../connect/connect.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { instancedModels } from './three_instance.js';

import { CreateLight } from './three_lights.js';
export let locations = {};

export let locationData;
export let modelsData;

export let activeObjex = []; //raycastable

export let staticObjex = []; //physics
export let dynamicObjex = []; //""

export let groundObjex = [];

export let navmesh, surface;

export let playerPosition;

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

export function initLocations() {
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

                    locations[locationData[i].timestamp] = locationData[i];

                    if (locationData[i].modelID && locationData[i].modelID != "none") {
                        for (let m = 0; m < modelsData.length; m++) { //spin through imported models to match
                            if (locationData[i].modelID == modelsData[m]._id) {
                                locationData[i].isHidden = false;
                                console.log("gotsa location model! " +modelsData[m].modelURL);
                                
                                const model = await loadModel(modelsData[m].modelURL); //loaded but not added to scene - wait for navmesh, surfaces, physics etc.
                                                                            
                                console.log("model loaded " + modelsData[m]._id + " tryna set pos at " + locationData[i].x + " " + locationData[i].y + " " + locationData[i].z);
                                
                                if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
                                
                                    locationData[i].isHidden = true;
                                    // console.log("tryna hide model " + child.name);
                                }															

                                model.traverse(function (child) {
                                    
                                    if (child.isMesh){
                                        child.castShadow = true;
                                        child.receiveShadow = true;
                                        console.log("loaded mesh with tags " + locationData[i].locationTags);
                                        child.userData.locationData = locationData[i];
                                        if (locationData[i].locationTags && locationData[i].locationTags.includes("hide") ) {
                                        
                                            // child.material = transmat;
                                            child.material.transparent = true;
                                            child.material.opacity = 0;
                                            // locationData[i].isHidden = true;
                                            console.log("tryna hide model " + child.name);
                                        } else {
                                                                                            
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
                                            console.log("gotsa ssurface");
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


                                if (locationData[i].eventData && locationData[i].eventData.includes("instance") ) { // use instancing to make a bunch and scatter
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

                                    const eulerx = locationData[i].eulerx ? locationData[i].eulerx : 0;
                                    const eulery = locationData[i].eulery ? locationData[i].eulery : 0;
                                    const eulerz = locationData[i].eulerz ? locationData[i].eulerz : 0;

                                    model.rotation.x = eulerx;
                                    model.rotation.y = eulery;
                                    model.rotation.z = eulerz;

                                    model.scale.set(xscale,yscale,zscale);
                                    
                                    // model.layers.set(1);
                                    model.userData.locationData = locationData[i];
                                    // model.name = "model_" + locationData[i].name;
                                    
                                    // model.castShadow = true;
                                    // model.receiveShadow = true;
                                    if (locationData[i].locationTags.includes("active")) {
                                        activeObjex.push(model);
                                    } 
                                    if (locationData[i].locationTags.includes("billboard")) {
                                        lookAtCameraObjects.push(model);
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
                            CreateLight(locationData[i]);
                        }
                        if (locationData[i].markerType == "gate") {
                            // CreateSceneGate(locationData[i]);
                        }
                        

        
                    }
                    // console.log("locationData " + i + " of "  + locationData.length);
                }
                // console.log("looking for Surface with models " + instancedModels.length);
                
            } catch (e) {
                console.error("ERROR LOADING GLTF! " + e);
            } finally {
                console.log("locations loaded! " + JSON.stringify(locations));
                initSystems();
            }
        })();
        
    }

}