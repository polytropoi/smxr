

import * as THREE from 'three';

// import {SetPlayer} from '../../../connect/connect.js';
import { settings } from '../../../connect/settings.js';

import { closestNavmeshPoint, navAgentInstances } from './three_nav.js';

import { ActionSwitch } from './three_actions.js';


import { activeObjex, groundObjex, navmesh, EnterSceneGate } from './three_locations.js';

import { scene, cameraMode, renderer, clock, selectedObjects } from './three_main.mjs';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { FlyControls } from 'three/addons/controls/FlyControls.js';

import { MapControls } from 'three/addons/controls/MapControls.js';

import { InitReticle, textContainers, ThreeDeeText, HTMLText } from './three_ui.js';

import {PlayPauseMedia} from '../../../connect/dialogs.js';
import { getPlayerBody } from './three_physics.js';

export let camera, controls, player;
export let isReady = false;
export let followDistance = 8;
export let cameraAtZero = true;

let mousecaster, centercaster, playcaster, downcaster, goal, arrowHelper, lastRaycastHitPosition, lastRaycastHitDistance, lastRaycastHit, lastRaycastHitObject, lastHitObjectName;

export let dir = new THREE.Vector3;
export let playerDirection = new THREE.Vector3();
export var playerVector = new THREE.Vector3;
export var goalVector = new THREE.Vector3;
// var followDistance = 20;
export let fVelocity = 0.0;
export let speed = 0.0;
export let cameraWorldPosition = new THREE.Vector3();

	// export let playerPosition;

let selectColor = new THREE.Color(0xff3333);
let stopColor = new THREE.Color(0x26de57);
let goColor = new THREE.Color(0xff0000);

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let playerSpeed = 5;
let playerHeight = 1.6;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let raycastHitAgent;
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let pointerGizmo;
let reticle;
let mouseIsDown = false;
const mouse = new THREE.Vector2();

let targetLocation = new THREE.Vector3();
let validTarget = false;

let controlObject;
let lastPosition = new THREE.Vector3();

    // $('#popup').on('click', '#popup_yesButton', function(e) {
    //   console.log("popup yes button click on target " + e.target);
    //   if (e.target.dataset.eventdata) {
    //     console.log("tryna goto " + e.target.dataset.eventdata );
    //     EnterSceneGate(e.target.dataset.eventdata);
    //   }

      
    // });
    // $('#popup').on('click', '#popup_cancelButton', function(e) {
    //   console.log("popup cancel button click on target " + e.target);
    //   popup.style.display = "none";
    // });

export function SetPlayerLocation (locationData) {
    // if (controls && controls.object) {
    //      console.log("tryna set first person player lcoationDarta " + JSON.stringify(locationData));
    //     controls.object.position.set(locationData.x, locationData.y, locationData.z);
    // } else {
        if (player) {
            console.log("tryna set third person player to lcoationDarta " + JSON.stringify(locationData));
            player.position.set(parseFloat(locationData.x), parseFloat(locationData.y), parseFloat(locationData.z));
        } else {
            if (controlObject) {
                console.log("tryna set first person player lcoationDarta " + JSON.stringify(locationData));
                // controlObject.position.set(locationData.x, locationData.y, locationData.z);
                controls.object.position.set(parseFloat(locationData.x), parseFloat(locationData.y), parseFloat(locationData.z));
                controls.update();
            }
        }
    // }
}

export function SetControls(cameraMode, cameraFOV) {

    if (settings) {
        if (settings.playerHeight) {
            playerHeight = parseFloat(settings.playerHeight);
        }
        if (settings.playerSpeed) {
            playerSpeed = parseFloat(settings.playerSpeed);
        }
    }
    if (cameraMode == "Mouse Look") { //no pointer lock or controller at all!  drag to look is better imo

        var geometry = new THREE.CapsuleGeometry(1, 2, 4, 8, 1);
        var material = new THREE.MeshBasicMaterial({ 'visible': false });

        player = new THREE.Mesh(geometry, material);
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, .1, 500);
        
        camera.position.set(0, 0, 0);
        scene.add(player);
        player.add(camera);


        downcaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 50);

        // centercaster = new THREE.Raycaster();
        mousecaster = new THREE.Raycaster();
        
        isReady = true;

        const pointerGeo = new THREE.CapsuleGeometry(.05, .2, 8, 8);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 'blue', transparent: true, opacity: .5 });
        pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
        pointerGizmo.up.set(0, 1, 0);
        scene.add(pointerGizmo);

    } else if (cameraMode == "Fixed") {

        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 5;


        isReady = true;
    } else if (cameraMode == "Fly") {
        // const blocker = document.getElementById( 'blocker' );
        // const instructions = document.getElementById( 'instructions' );
        // if (blocker) {
        //     blocker.style.display = "none";
        //     instructions.style.display = "none";
        // }
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, 1, 1000);
        scene.add(camera);

        // camera.lookAt( 0, 1, 0 );
        const geo = new THREE.SphereGeometry(.01, 10);
        const mat = new THREE.MeshBasicMaterial({ color: "red", side: THREE.DoubleSide, opacity: 0.5, transparent: true });
        const mesh = new THREE.Mesh(geo, mat);
        // reticle.position.z = -.5;

        scene.add(mesh);
        // camera.add(mesh);
        mesh.position.z = -1;
        reticle = InitReticle();
        reticle.position.z = -.5;
        camera.attach(reticle);
        camera.attach(mesh);
        camera.position.set(0, 1, 0);
        controls = new FlyControls(camera, renderer.domElement);
        controls.dragToLook = true;
        controls.movementSpeed = 2;
        controls.rollSpeed = Math.PI / 24;
        controls.autoForward = false;
        console.log("tryna set fly controls");
        centercaster = new THREE.Raycaster();


        centercaster = new THREE.Raycaster();
        isReady = true;
    } else if (cameraMode == "Map") {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, .01, 1000);
        camera.position.set(0, 100, 50);
        camera.lookAt(0, 1, 0);
        controls = new MapControls(camera, renderer.domElement);
        controls.dragToLook = true;
        controls.movementSpeed = 1;
        controls.rollSpeed = Math.PI / 24;
        controls.autoForward = false;
        console.log("tryna set map controls");
        isReady = true;
        const pointerGeo = new THREE.CapsuleGeometry(.2, 2, 4, 4);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 'blue' });
        pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
        pointerGizmo.up.set(0, 1, 0);
        scene.add(pointerGizmo);
        mousecaster = new THREE.Raycaster();
    } else if (cameraMode == "Orbit") {
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.set(0, 5, 15);
        camera.lookAt(0, 1, 0);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 1;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI * 0.5;

        // controls.autoRotate = true;
        // controls.autoRotateSpeed = 1;
        controls.target.set(0, .2, 0);
        controls.update();
        isReady = true;


        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        // camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
        // camera.position.set( 10, 50, 10 );
        // camera.lookAt( 0, 1, 0 );
        const pointerGeo = new THREE.CapsuleGeometry(.05, .1, 4, 4);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 'blue' });
        pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
        pointerGizmo.up.set(0, 1, 0);
        scene.add(pointerGizmo);
        mousecaster = new THREE.Raycaster();
    } else if (cameraMode == "Third Person") {

        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        if (blocker) {
            blocker.style.display = "none";
            instructions.style.display = "none";
        }
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, 0.1, 500);
        // camera.position.set( 0, followDistance, -followDistance );
        camera.position.set(0, 10, -followDistance);
        // camera.lookAt( 0, 1, 0 );


        // controls.enabled = false;
        // controls.autoRotate = true;
        // controls.autoRotateSpeed = 1;


        mousecaster = new THREE.Raycaster();
        downcaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 100);
        playcaster = new THREE.Raycaster();
        var geometry = new THREE.CapsuleGeometry(1, 2, 4, 8, 1);
        var material = new THREE.MeshBasicMaterial({ "wireframe": true });

        player = new THREE.Mesh(geometry, material);
        player.userData.name = "player";
        activeObjex.push(player);

        goal = new THREE.Object3D;
        // follow = new THREE.Object3D;

        goal.position.z = -followDistance;
        goal.add(camera);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = .5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI * .4;
        controls.minPolarAngle = Math.PI * .25;
        // controls.enableZoom = false; 

        // camera.position.z = .1; // Position the camera slightly behind the pivot

        scene.add(player);

        fVelocity = 0.0;
        camera.lookAt(player.position);
        // controls.target.set(player.position);
        const dir = new THREE.Vector3(); // Direction (will be updated)
        const origin = new THREE.Vector3(); // Origin (will be updated)
        const length = 10; // Length of the arrow
        const hex = 0xff0000; // Color (e.g., red)

        arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
        scene.add(arrowHelper);

        const pointerGeo = new THREE.CapsuleGeometry(.2, 2, 4, 4);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 'blue' });
        pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
        pointerGizmo.up.set(0, 1, 0);
        scene.add(pointerGizmo);

        isReady = true;
    } else if (cameraMode == "First Person") { //default first person
        // camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
        camera = new THREE.PerspectiveCamera(cameraFOV, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.set(0, 10, 0);

        controls = new PointerLockControls(camera, document.body); //use regular fp controls if has navmesh
        
        downcaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 100);

        centercaster = new THREE.Raycaster();
        // mousecaster = new THREE.Raycaster();

        reticle = InitReticle();
        reticle.position.z = -.5;
        camera.add(reticle);

        controls.pointerSpeed = .25;

        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        blocker.style.display = "block";
        instructions.style.display = "block";

        instructions.addEventListener('click', function () {

            controls.lock();

        });

        controls.addEventListener('lock', function () {

            instructions.style.display = 'none';
            blocker.style.display = 'none';
            PlayPauseMedia();

        });

        controls.addEventListener('unlock', function () {

            blocker.style.display = 'block';
            instructions.style.display = '';

        });

        controlObject = controls.object;

        scene.add(controlObject);
        
        // controls.update();
        isReady = true;

        const pointerGeo = new THREE.CapsuleGeometry(.2, 2, 4, 4);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 'blue' });
        pointerGizmo = new THREE.Mesh(pointerGeo, pointerMat);
        pointerGizmo.up.set(0, 1, 0);
        scene.add(pointerGizmo);



    } else {
        console.log("no valid camera Mode!");
    }

}

export function UpdateControls() {
    const time = performance.now();
    if (cameraMode == "Fixed") {
        // if (useHandLandmarks) {
        //     //?
        // }
    } else if (settings && controls && cameraMode == "Fly") {
        // controls.update(time);
        const delta = clock.getDelta();

        controls.update(delta);
        cameraWorldPosition.copy(camera.position);
        centerRaycast();
    } else if (settings && controls && cameraMode == "Orbit") { //easy peasy
        controls.update();
        cameraWorldPosition.copy(camera.position);
    } else if (settings && player && cameraMode == "Third Person") { // kinda combines follow cam and orbit control
        speed = 0.0;

        // if (!playerReadyToNav) {          

        if (moveForward) {
            // camera.lookAt( player.position );
            // controls.target.set(player.position.x, player.position.z, player.position.z);
            speed = .2;
            // console.log("speed " + speed);		
        } else if (moveBackward) {
            // camera.lookAt( player.position );
            // controls.target.set(player.position.x, player.position.z, player.position.z);
            speed = -.2;
        }

        fVelocity += (speed - fVelocity) * .5;
        player.translateZ(fVelocity);
        camera.getWorldPosition(cameraWorldPosition); //bc it's a child in this mode
        camera.lookAt(player.position);

        // if (mouseIsDown && targetLocation && validTarget) {
        //     // player.lookAt(targetLocation);
        //     console.log("target location " + JSON.stringify(targetLocation));
        //     // return;
        // } else {
            if (moveLeft) {
                player.rotateY(0.025);
            } else if (moveRight) {
                player.rotateY(-0.025);
            }
        // }

        playerVector.lerp(player.position, .5);
        goalVector.copy(goal.position);

        dir.copy(playerVector).sub(goalVector).normalize();
        const dis = playerVector.distanceTo(goalVector) - followDistance;
        goal.position.addScaledVector(dir, dis);


        // console.log("goal position " + JSON.stringify(goal.position));
        //temp.setFromMatrixPosition(goal.matrixWorld);

        //camera.position.lerp(temp, 0.2);


        downcaster.ray.origin.copy(player.position);
        downcaster.ray.origin.y += 10;
        // console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
        const intersections = downcaster.intersectObjects(groundObjex, false); //groundObjex == navmesh
        if (!intersections.length) {
            //off the navmesh, get closest point and go back
            // velocity.x = 0;
            // velocity.y = 0;
            // velocity.z = 0;
            const goodSpot = closestNavmeshPoint(player.position);
            if (goodSpot) {
                player.position.set(goodSpot.x, goodSpot.y, goodSpot.z);
                console.log("back to goodSpot " + JSON.stringify(goodSpot));
            }
        } else {
            // velocity.y = 0;
            // intersections[0].point.x = 
            player.position.y = intersections[0].point.y + playerHeight; //needs offset var, player location y?


            // console.log("gotsa navmesh mousehit " + JSON.stringify(raycastHits[0].point));
            // const localNormal = intersections[0].face.normal;

            // const worldNormal = localNormal.clone().transformDirection(intersections[0].object.matrixWorld);

            // player.lookAt(worldNormal);
            // rotateObjectToNormal(player, worldNormal);
            // player.rotateZ(worldNormal.z);

            canJump = true; //not really
        }
        if (controls) { //toggle?
            controls.update();
        }

        // }
        const origin = player.position.clone();
        player.getWorldDirection(playerDirection);
        playcaster.set(origin, playerDirection);
        arrowHelper.setDirection(playcaster.ray.direction);
        arrowHelper.position.copy(playcaster.ray.origin);
        playerRaycast();

    } else if (cameraMode == "First Person") { //First personc cam w/ pointer lock and center cursor
        cameraWorldPosition.copy(camera.position);
        if (navmesh && controls && controls.isLocked === true) {

            downcaster.ray.origin.copy(controls.object.position);
            downcaster.ray.origin.y += 10;
            // console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
            const intersections = downcaster.intersectObjects(groundObjex, false); //groundObjex == navmesh

            const onObject = intersections.length > 0;
            if (onObject) {
                // console.log(JSON.stringify(controls.object.position) + " pos " + groundObjex.length + " groundObjex with intersections " + intersections.length + " distance to 0th " + intersections[0].distance + " point.y " + intersections[0].point.y + " camera y " + controls.object.position.y);
            }

            const delta = (time - prevTime) / 1000;

            velocity.x -= velocity.x * 12 * delta;
            velocity.z -= velocity.z * 12 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); // this ensures consistent movements in all directions

            if (moveForward || moveBackward) {
                velocity.z -= direction.z * 20.0 * (playerSpeed) * delta;
                console.log("velocity on " + velocity.z);
            }
            if (moveLeft || moveRight) velocity.x -= direction.x * 20.0 * (playerSpeed) * delta;

            if (onObject === true) {

                velocity.y = Math.max(0, velocity.y);
                canJump = true;

            }

            // console.log("delta " + delta + " direction " + JSON.stringify(direction) + " velocity " + JSON.stringify(velocity));
            controls.moveRight(- velocity.x * delta);
            controls.moveForward(- velocity.z * delta);

            controls.object.position.y += (velocity.y * delta); // new behavior

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
                // intersections[0].point.x = 
                controls.object.position.y = intersections[0].point.y + playerHeight;

                canJump = true;
            }
            centerRaycast();

        }
    } else if (cameraMode == "Mouse Look") { //First person with no cursor lock, with mouse caster
        cameraWorldPosition.copy(player.position);
        if (navmesh && player) {

            downcaster.ray.origin.copy(player.position);
            downcaster.ray.origin.y += 10;


            if (lastPosition === null) {   
                // firstTry = true;
                lastPosition = new THREE.Vector3();
                player.getWorldPosition(lastPosition);
                // if (this.data.xzOrigin) this.lastPosition.y -= this.xzOrigin.object3D.position.y;
            }
    
            // console.log("tryna downcast from " + JSON.stringify(downcaster.ray.origin));
            const intersections = downcaster.intersectObjects(groundObjex, false); //groundObjex == navmesh

            const onObject = intersections.length > 0;
            if (onObject) {
                // console.log(JSON.stringify(controls.object.position) + " pos " + groundObjex.length + " groundObjex with intersections " + intersections.length + " distance to 0th " + intersections[0].distance + " point.y " + intersections[0].point.y + " camera y " + controls.object.position.y);
            }

            const delta = (time - prevTime) / 1000;
            
            velocity.x -= velocity.x * 12 * delta;
            velocity.z -= velocity.z * 12 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);

            direction.normalize(); // this ensures consistent movements in all directions


            // player.getWorldDirection(direction);
            // direction.normalize();
            if (moveForward || moveBackward) {
                velocity.z -= direction.z * .2 * (playerSpeed) * delta;
            
            }
            if (moveLeft || moveRight) {
                velocity.x -= direction.x * .2 * (playerSpeed) * delta;
                // console.log("sideways " + velocity.x);
            }
            // player.position.lerp(direction, .01);
            // player.translateZ(velocity.z);
            // player.translateX(velocity.x);

            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);

            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3();
            right.crossVectors(forward, up).normalize(); // Calculate right vector

            if (onObject === true) {

                velocity.y = Math.max(0, velocity.y);
                canJump = true;

            }

            if (!intersections.length) {
                //off the navmesh, get closest point and go back
                velocity.x = 0;
                velocity.y = 0;
                velocity.z = 0;
                player.position.copy(lastPosition)
                // const goodSpot = closestNavmeshPoint(player.position);
                // if (goodSpot) {
                //     player.position.set(goodSpot.x, goodSpot.y, goodSpot.z);
                //     console.log("back to goodSpot " + JSON.stringify(goodSpot));
                // }
            } else {
                // velocity.y = 0;
                // intersections[0].point.x = 
                player.getWorldPosition(lastPosition);
                            // Move right (positive) or left (negative)
                player.position.addScaledVector(right, -velocity.x);

                // Move forward:

                player.position.y = intersections[0].point.y + playerHeight; //snap y to navmesh
                player.position.addScaledVector(forward, -velocity.z);
                

                canJump = true; //hrm...
            }
          

        }
    }
        prevTime = time;

}

function NavmeshConstraint () {

}

//////////////////////////. PROCESS RAYCAST HIT /////////////////
function RaycastHit(type, hit) {

    if (lastRaycastHitObject) {
        if (lastRaycastHitObject != hit.object) {
            selectedObjects.length = 0;
            for (let i = 0; i < textContainers.length; i++) {
                textContainers[i].visible = false;
            }
            // lastRaycastHit = null;
            // const textContainer = lastRaycastHitObject.getObjectByName('textContainer');
            // if (textContainer) {
            //     textContainer.visible = false;
            // }
        } else {
            // if (lastRaycastHitObject) {
            //     return;
            // }

        }
    } else {
        lastRaycastHit = hit;
        lastRaycastHitObject = hit.object;
        return;
    }

  
    lastRaycastHit = hit;
    lastRaycastHitObject = hit.object;
    lastHitObjectName = lastRaycastHitObject.userData.name ? lastRaycastHitObject.userData.name : lastRaycastHitObject.name;
    lastRaycastHitPosition = hit.point;
    lastRaycastHitDistance = hit.distance;
    const locationData = lastRaycastHitObject.userData.locationData;
    if (!locationData) {
        return;
    }

    if (hit.instanceId) {
            console.log("INSTANCE HIT " + hit.instanceId);
        
    }
    const objectData = lastRaycastHitObject.userData.objectData;
    const name = lastRaycastHitObject.userData.name ? lastRaycastHitObject.userData.name : lastRaycastHitObject.name;
    let showCallout = false;
    
    if (type == "mouse" &&
        locationData && 
        locationData.markerType != "navmesh" &&
        name != "navmesh"
        // ((locationData.locationTags && locationData.locationTags.includes("callout") || 
        // locationData.markerType == "character" ||
        // locationData.markerType == "object" || 
        // locationData.markerType == "poi" || 
        // locationData.markerType == "gate" ||
        // locationData.markerType == "placeholder"))      
        ) {

        showCallout = true;
   
        // console.log(type + " hit object type " + locationData.markerType + " desc  " + hit.object.name + " distance " + hit.distance);

        // console.log(type + " hit object type " + locationData.markerType);//.markerType + " desc  " + hit.object.name + " distance " + hit.distance);
                 
        // ThreeDeeText(locationData.name,1,lastRaycastHitObject, lastRaycastHitPosition, lastRaycastHitDistance, null, locationData.yscale);
     
         if (objectData && objectData.callouttext && objectData.callouttext.length) {
            // console.log("callout text "  + objectData.callouttext);
            const calloutsplit = objectData.callouttext.split("~");
            const randomIndex = Math.floor(Math.random() * calloutsplit.length);
            const textstring = calloutsplit[randomIndex];
            // console.log("textstring is " + textstring);

            ThreeDeeText(textstring,1,lastRaycastHitObject.parent, lastRaycastHitPosition, lastRaycastHitDistance, null, locationData.yscale);
            // HTMLText(textstring,1,lastRaycastHitObject, lastRaycastHitPosition, lastRaycastHitDistance, null, locationData.yscale);
        } else {
            ThreeDeeText(locationData.name,1,lastRaycastHitObject, lastRaycastHitPosition, lastRaycastHitDistance, null, locationData.yscale);
            // HTMLText(locationData.name,1,lastRaycastHitObject, lastRaycastHitPosition, lastRaycastHitDistance, null, locationData.yscale);
        }
    }
    // if (name != "navmesh") {
    //     // if (lastRaycastHitObject != hit.object) {
    //        console.log(type + " hit object " + name );
    //     // }
    // }

    if (pointerGizmo && (type == "mouse" || type == "center")) {
        const localNormal = hit.face.normal;
        const worldNormal = localNormal.clone().transformDirection(hit.object.matrixWorld);
        // console.log("hit worldnormal " + JSON.stringify(worldNormal));
        pointerGizmo.position.set(hit.point.x, hit.point.y, hit.point.z);

        // pointerGizmo.lookAt(worldNormal);
        rotateObjectToNormal(pointerGizmo, worldNormal);
    }
    if (name == "navmesh" || locationData.markerType == "navmesh") {
        if (type == "mouse" && mouseIsDown) {
            targetLocation.copy(lastRaycastHitPosition); //to move stuff around
            validTarget = true;
        } else {
            validTarget = false;
        }
        selectedObjects.length = 0;
    } else if (name == "surface") {
        selectedObjects.length = 0;
    } else if (name == "player") {

        selectedObjects.length = 0;
    } else if (name && name.includes("agent")) { //just test agents
        validTarget = true;
        if (raycastHitAgent != hit.object) {
            // console.log ("new mouse raycast hit on agent " + raycastHits[0].object.name);
            raycastHitAgent = hit.object;
            selectedObjects.push(hit.object);
            if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode) {
                // console.log("intersected material found!");
                // raycastHitAgent.material.materialColor = goColor;
            } else if (raycastHitAgent && raycastHitAgent.material) {
                // raycastHitAgent.material.color = goColor;

            }
            const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //but skinned meshes are parent.parent.userData
            if (navAgentInstance) {
                navAgentInstance.agentRaycastHit();
            }
        } else {
            // console.log("rehit agent " + raycastHits[0].object.name));
        }
    } else if (locationData && locationData.markerType == "character" ) {
        // if (raycastHitAgent != hit.object) {
            console.log("gotsa character hit " + locationData.name);
            raycastHitAgent = hit.object;
            selectedObjects.push(hit.object);
            // if (raycastHitAgent && raycastHitAgent.material && raycastHitAgent.material.colorNode) {
            //     // console.log("intersected material found!");
            //     raycastHitAgent.material.materialColor = goColor;
            // } else if (raycastHitAgent && raycastHitAgent.material) {
            //     raycastHitAgent.material.color = goColor;

            // }
            // console.log("character object name : " + raycastHitAgent.name + " " + JSON.stringify(raycastHitAgent.userData));
            // hit.object.parent.parent.traverse(function (child) {
            //     console.log("child type " + child.type); 
            // });

            // console.log("hit character object name : " + raycastHitAgent.parent.parent.parent.name + " locID " + locationData.timestamp);
            // const rootObject = getRoot(raycastHitAgent)
            // logHierarchy(raycastHitAgent);
            // raycastHitAgent.traverse (

            // )
            // const agentID = raycastHitAgent.parent.parent.name;
            
            const navAgentInstance = raycastHitAgent.parent.userData.NavAgentInstance; //hrm
            // const navAgentInstance = raycastHitAgent.parent.getObjectByName("NavAgent");
            // const navAgentInstance = navAgentInstances[agentID];
            if (navAgentInstance) {
                console.log("gotsa navagent");
                navAgentInstance.agentRaycastHit();
            } else {
                console.log("no navagent found on character!");
            }
        // }
    } else if (locationData && locationData.markerType == "gate" ) {
        
    } else {
        // if (lastRaycastHit.instanceId) {

        // }
        // if (lastRaycastHitObject && lastRaycastHitObject != hit.object) {
        //    
        // } else { 
            // 
            // if ( type != "player") {
            //         validTarget = true;
            //     if (cameraMode == "Third Person" && type == "mouse") {
            //         selectedObjects.length = 0;
            //         selectedObjects.push(hit.object);
            //     } else if ((cameraMode == "First Person" || cameraMode == "Fly") && type == "center") {
            //         selectedObjects.length = 0;
            //         selectedObjects.push(hit.object);
            //     } else if ((cameraMode == "Orbit" || cameraMode == "Map") && type == "mouse") {
            //         selectedObjects.length = 0;
            //         selectedObjects.push(hit.object);
            //     }
            //     // console.log("seelected objex " + selectedObjects.length + " name " + name + " type hit " + type);
            // }
        // }


    }

}

function getRoot(object) {
  let current = object;
  while (current.parent !== null) {
    current = current.parent;
  }
  return current;
}

function logHierarchy(object, depth = 0) {
    let indent = '  '.repeat(depth);
    console.log(`${indent}- ${object.name || object.type}`);

    // Recursively call this function for all children
    for (const child of object.children) {
        logHierarchy(child, depth + 1);
    }
}

export function mouseRaycast(e) {

    if (!activeObjex.length) {
        return;
    } 
    scene.updateMatrixWorld(true);
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    // console.log("mouse pos " + JSON.stringify(mouse));
    mousecaster.setFromCamera(mouse, camera);

    var raycastHits = mousecaster.intersectObjects(activeObjex, true);
    let selectColor = new THREE.Color(0xff3333);
    let stopColor = new THREE.Color(0x26de57);
    let goColor = new THREE.Color(0xff0000);
    if (raycastHits.length > 0) {

        // console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
        // 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
        if (raycastHits[0].object.userData) {
            RaycastHit("mouse", raycastHits[0]);
        } else {
            selectedObjects.length = 0;
            // lastRaycastHit = null;
            lastRaycastHitObject = null;
            raycastHitAgent = null;
            // if (raycastHitAgent) {
                
            //     if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
            //         // raycastHitAgent.material.materialColor = stopColor;
            //         // raycastHitAgent.material.needsUpdate = true;

            //     } else if (raycastHitAgent.material) {
            //         // console.log("tryna reset agent color after no hit");
            //         // raycastHitAgent.material.color = stopColor;
            //     }
            // }
        }

    } else {
        selectedObjects.length = 0;
        for (let i = 0; i < textContainers.length; i++) {
            textContainers[i].visible = false;
        }
        if (lastRaycastHitObject) {
            lastRaycastHit = null;
            lastRaycastHitObject = null;
            raycastHitAgent = null;
        }
        // if (raycastHitAgent) {
        //     // 	{
        //     if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
        //         // console.log("tryna reset agent color after no hit");
        //         // raycastHitAgent.material.materialColor = stopColor;
        //         // raycastHitAgent.material.needsUpdate = true;
        //     } else if (raycastHitAgent.material) {
        //         // console.log("tryna reset agent color after no hit");
        //         // raycastHitAgent.material.color = stopColor;
        //     }
        // }
        
    }
}


export function playerRaycast() {

    if (playcaster) {
        var raycastHits = playcaster.intersectObjects(activeObjex, true);
        let selectColor = new THREE.Color(0xff3333);
        let stopColor = new THREE.Color(0x26de57);
        let goColor = new THREE.Color(0xff0000);
        if (raycastHits.length > 0) {
            if (raycastHits[0].object.userData) {
                RaycastHit("player", raycastHits[0]);
            } else {
                selectedObjects.length = 0;
            }

        } else {
            selectedObjects.length = 0;
            if (lastRaycastHitObject) {
                // lastRaycastHitObject = null;
            }
            if (raycastHitAgent) {
                // 	{
                if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
                    // console.log("tryna reset agent color after no hit");
                    // raycastHitAgent.material.materialColor = stopColor;
                    // raycastHitAgent.material.needsUpdate = true;
                } else if (raycastHitAgent.material) {
                    // console.log("tryna reset agent color after no hit");
                    // raycastHitAgent.material.color = stopColor;
                }
            }
            raycastHitAgent = null;
        }
    }
}

export function centerRaycast() {
    if (scene && camera && centercaster && isReady) {

        centercaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const raycastHits = centercaster.intersectObjects(activeObjex, true);
        let lastHitObject;
        let selectColor = new THREE.Color(0xff3333);
        let stopColor = new THREE.Color(0x26de57);
        let goColor = new THREE.Color(0xff0000);
        if (raycastHits.length > 0) {
            // console.log("raycast hit layer " + JSON.stringify(raycastHits[0].object.layers) + " distance " + raycastHits[0].distance +  
            // 				" id " + raycastHits[0].object.id + " name " + raycastHits[0].object.name +  " instanceId " + raycastHits[0].instanceId + " locationData " + JSON.stringify(raycastHits[0].object.userData));
            if (raycastHits[0].object.userData) {
                RaycastHit("center", raycastHits[0]);
            } else {
                selectedObjects.length = 0;
            }

        } else {
            selectedObjects.length = 0;
            if (raycastHitAgent) {
                // 	{
                if (raycastHitAgent.material && raycastHitAgent.material.colorNode) {
                    // console.log("tryna reset agent color after no hit");
                    // raycastHitAgent.material.materialColor = stopColor;
                    // raycastHitAgent.material.needsUpdate = true;
                } else if (raycastHitAgent.material) {
                    // console.log("tryna reset agent color after no hit");
                    // raycastHitAgent.material.color = stopColor;
                }
            }
            raycastHitAgent = null;
        }
    }
}


export function onMouseDown(event) { //clicked on threejs object
    // playerReadyToNav = true;
    // console.log(event.target.id);
    const popup = document.getElementById("popup");
    if (event.target.id == "popup_yesButton") {
      ActionSwitch(event);
      popup.style.display = "none";
      return;

    } else if (event.target.id == "popup_cancelButton") {
      popup.style.display = "none";
      return;
    }
    // if (event.target.)
    // event.preventDefault();
    // event.stopPropagation();
    mouseIsDown = true;
    if (scene && mouse && camera && mousecaster && isReady) {
        mouseRaycast(event);
    }
    if (lastRaycastHitObject) {
        // const popup = document.getElementById("popup");
        if (lastRaycastHitObject.userData && lastRaycastHitObject.userData.locationData) {
            console.log("mousedown on " + lastRaycastHitObject.userData.locationData.name + " " + lastRaycastHit.instanceId);
            
            // if (lastRaycastHitObject.userData.locationData) {

            //     if (lastRaycastHitObject.userData.objectData) {
            //         console.log("objectData : "+ JSON.stringify(lastRaycastHitObject.userData.objectData));
            //         // if (lastRaycastHitObject.userData.locationData.objectData.callouttext.length) {
            //         //     console.log("callout text " + lastRaycastHitObject.userData.locationData.objectData.callouttext);
            //             // const calloutsplit = lastRaycastHitObject.userData.locationData.objectData.callouttext.split("~");
            //             // const randomIndex = Math.floor(Math.random() * calloutsplit.length);
            //             // const textstring = calloutsplit[randomIndex];
            //             // console.log("textstring is " + textstring);
            //             const textstring = "what!?!";
            //             // HTMLText(textstring,1,lastRaycastHitObject, lastRaycastHitPosition, lastRaycastHitDistance, null, lastRaycastHitObject.userData.locationData.yscale);
            //         // }

                   
            //     } else {
            //         console.log("locationData : "+ JSON.stringify(lastRaycastHitObject.userData.locationData));
            //     }

            // }

            let navAgentInstance;
            if (lastRaycastHitObject.parent.parent && lastRaycastHitObject.parent.parent.userData) {
                navAgentInstance = lastRaycastHitObject.parent.parent.userData.NavAgentInstance;
            }//hrm
            if (!navAgentInstance) {
                navAgentInstance = lastRaycastHitObject.parent.userData.NavAgentInstance; //hrm
            }
            if (navAgentInstance) {
                navAgentInstance.agentClick();
                // // const popup = document.getElementById("popup");
                //   Object.assign(popup.style, {
                //     left: `${event.clientX - 150}px`,
                //     top: `${event.clientY - 100}px`,
                //     display: 'block',
                // });
                ShowPopup(event);
                
                    if (lastRaycastHitObject.userData.objectData.labeltext && lastRaycastHitObject.userData.objectData.labeltext.length) {
                        if (lastRaycastHitObject.userData.objectData.labeltext.includes("~")) {
                            const labelSplit = lastRaycastHitObject.userData.objectData.labeltext.split("~");
                            const randomIndex = Math.floor(Math.random() * labelSplit.length);
                            popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + labelSplit[randomIndex];
                        } 
                    } else {
                        popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + lastRaycastHitObject.userData.objectData.description;
                    }
                    
            } else if (lastRaycastHitObject.userData.objectData) {
                //  const popup = document.getElementById("popup");
                // Object.assign(popup.style, {
                //     left: `${event.clientX - 150}px`,
                //     top: `${event.clientY - 100}px`,
                //     display: 'block',
                // });
                ShowPopup(event);
                if (lastRaycastHitObject.userData.objectData.labeltext && lastRaycastHitObject.userData.objectData.labeltext.length) {
                        if (lastRaycastHitObject.userData.objectData.labeltext.includes("~")) {
                            const labelSplit = lastRaycastHitObject.userData.objectData.labeltext.split("~");
                            const randomIndex = Math.floor(Math.random() * labelSplit.length);
                            popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + labelSplit[randomIndex];
                        } else {
                            popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + lastRaycastHitObject.userData.objectData.labeltext;
                        }
                    } else if (lastRaycastHitObject.userData.objectData.callouttext && lastRaycastHitObject.userData.objectData.callouttext.length) {
                        if (lastRaycastHitObject.userData.objectData.callouttext.includes("~")) {
                            const calloutSplit = lastRaycastHitObject.userData.objectData.callouttext.split("~");
                            const randomIndex = Math.floor(Math.random() * calloutSplit.length);
                            popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + calloutSplit[randomIndex];
                        } else {
                            popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + lastRaycastHitObject.userData.objectData.callouttext;
                        }
                    }
            } else if (lastRaycastHit.instanceId) {
                // // const popup = document.getElementById("popup");
                // console.log(lastRaycastHit.instanceId);
                //   Object.assign(popup.style, {
                //     left: `${event.clientX - 150}px`,
                //     top: `${event.clientY - 100}px`,
                //     display: 'block',
                // });
                ShowPopup(event);
                popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.locationData.name + " # " + lastRaycastHit.instanceId +" :</h1>"  + lastRaycastHitObject.userData.locationData.description;

            } else if (lastRaycastHitObject.userData.locationData.markerType == "gate") {
                // console.log(event.clientX + " " + window.innerWidth);
                // let xpos = event.clientX - 150;
                // if ((window.innerWidth - event.clientX) < 150) {
                //     xpos = event.clientX - 300;
                // } else if (event.clientX < 150) {
                //     xpos = 0;
                // }
                // let ypos = event.clientY - 100;
                // Object.assign(popup.style, {
                //     left: `${xpos}px`,
                //     top: `${ypos}px`,
                //     display: 'block',
                // });
                ShowPopup(event);
                popup.innerHTML = "<h1> Scene Gate :</h1>"  + lastRaycastHitObject.userData.locationData.description +
                "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button> <button id=\x22popup_yesButton\x22 data-tags=\x22"+lastRaycastHitObject.userData.locationData.locationTags+"\x22 data-markertype=\x22"+lastRaycastHitObject.userData.locationData.markerType+"\x22 data-eventdata=\x22"+
                lastRaycastHitObject.userData.locationData.eventData+"\x22 class=\x22yesButton\x22>Go</button>"+
                "</div>";

            } else {
                // const popup = document.getElementById("popup");
                popup.style.display = "none";
            }
        } else {
            // const popup = document.getElementById("popup");
            popup.style.display = "none";
        }
    }

        // let lastHitObjectName;
        // if (lastRaycastHitObject && lastRaycastHitPosition) {
        //     lastHitObjectName = lastRaycastHitObject.userData ? lastRaycastHitObject.userData.name : lastRaycastHitObject.name;
        //     console.log(JSON.stringify(lastRaycastHitPosition) + " named " + lastHitObjectName);

        //     if (lastHitObjectName == "player") {
        //         // controls.target.set(player.position);
        //         // camera.lookAt(player.position);
        //         // controls.target.set(0, 0, 0);
        //     } else if (lastHitObjectName == "navmesh") {
        //         // playerNavAgent.playerNavMode(true);
        //         // const navAgentInstance = player.userData.NavAgentInstance; //can do this easier, but good to know
        //         //     if (navAgentInstance) {
        //         //         navAgentInstance.playerNav(true);
        //         //         // controls
        //         //         // player.position.set(closestNavmeshPoint(player.position.x, player.position.y, player.position.z ));
        //         //         navAgentInstance.newPath(lastRaycastHitPosition);
        //         //     }
        //         // controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);
        //     }

        //     // controls.target.set(lastRaycastHitPosition.x, lastRaycastHitPosition.y, lastRaycastHitPosition.z);

        // }
        // // isDragging = true;
        // previousMousePosition = {
        //     x: event.clientX,
        //     y: event.clientY
        // };
    if (cameraMode == "Fly") {
        controls.dragToLook = true;
    }

    // if ()
}

function ShowPopup (event) {
    const popup = document.getElementById("popup");
    // console.log("tryna show popup at " + event.clientX + " " + window.innerWidth);
    let xpos = event.clientX - 150;
    if ((window.innerWidth - event.clientX) < 150) {
        xpos = event.clientX - 300;
    } else if (event.clientX < 150) {
        xpos = 0;
    }
    let ypos = event.clientY - 100;
    Object.assign(popup.style, {
        left: `${xpos}px`,
        top: `${ypos}px`,
        display: 'block',
    });
}

export function onMouseUp(e) {
    mouseIsDown = false;
    // playerReadyToNav = false;
    if (cameraMode == "Fly") {
        controls.dragToLook = true;
    }

}


export function onMouseMove(event) {
    // console.log("mouse move " +scene + mouse + camera + mousecaster + isReady);
    if (scene && mouse && camera && mousecaster && isReady) {
        mouseRaycast(event);
    }
    if (mouseIsDown && cameraMode == "Mouse Look" && scene && mouse && camera ) {
        // Calculate mouse position relative to the center of the screen
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Adjust camera rotation based on mouse movement deltas
        // Use an appropriate rotation order (e.g., 'YXZ') to avoid gimbal lock issues
        camera.rotation.order = 'YXZ';
        camera.rotation.y -= movementX * 0.002; // Adjust sensitivity
        camera.rotation.x -= movementY * 0.002;

        // Constrain vertical look to prevent the camera from flipping over
        camera.rotation.x = Math.max( -Math.PI / 2, Math.min( Math.PI / 2, camera.rotation.x ) );
    }
    //  if (!mouseIsDown) return; //nope, orbit is better

    // 	const deltaX = event.clientX - previousMousePosition.x;
    // 	const deltaY = event.clientY - previousMousePosition.y;

    // 	// Adjust rotation speed with a sensitivity scale factor
    // 	const sensitivity = 0.003; 

    // 	// Apply rotation to the pivot
    // 	// Rotate around the Y-axis for horizontal movement (yaw)
    // 	goal.rotation.y += deltaX * sensitivity; 
    // 	// Rotate around the X-axis for vertical movement (pitch)
    // 	// You might want to limit the pitch rotation to prevent the camera from flipping upside down
    // 	goal.rotation.x += deltaY * sensitivity;

    // 	// Optional: clamp vertical rotation (e.g., between -PI/2 and PI/2)
    // 	goal.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, goal.rotation.x));


    // 	previousMousePosition = {
    // 		x: event.clientX,
    // 		y: event.clientY
    // 	};
}


export function onMouseWheel(e) {
    if (camera) {
        if (cameraMode == "Fixed") {

        } else if (!controls || (controls && !controls.enabled)) {
            // if (controls && (controls.getDistance() < 300)) {
            const v = followDistance + e.deltaY * 0.005;
            // if (v >= 0 && v <= 100) {
            followDistance = v;
            console.log('v is ' + v);
            if (v / 2 > 0) {
                // camera.lookAt(player);
                camera.position.y = v / 2;
                camera.position.z = v / 2;
                cameraAtZero = false;
            } else {
                camera.position.y = 0;
                camera.position.z = 0;
                cameraAtZero = true;
            }
            // }
            // return false;
        } else {
            if (cameraMode != "Orbit") {

                // const distanceFactor = controls.getDistance();
                // const polarAngle = controls.getPolarAngle();
                // const azimuthAngle = controls.getAzimuthalAngle();
                // if (distanceFactor < 20) {
                // 	controls.maxPolarAngle = Math.PI * .5;
                // } else if (distanceFactor < 30) {
                // 	controls.maxPolarAngle = Math.PI * .4;
                // } else if (distanceFactor < 50) {
                // 	controls.maxPolarAngle = Math.PI * .3;
                // }
                // console.log("distanceFactor " + distanceFactor + " polarAngle " + polarAngle +  " azimuth " + azimuthAngle);
                // controls.maxPolarAngle = Math.PI * distanceFactor;
            }
           
        }
    }
    // }
}

export const onKeyDown = function (event) {
    console.log("keydown " + event.code);
    switch (event.code) {

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
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;

        case 'KeyO':

            toggleOrbitControl();
            break;
    }
};

export const onKeyUp = function (event) {
    // console.log("keyup " + event.code);	
    switch (event.code) {

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


function rotateObjectToNormal(object, targetNormal) {
    object.up.copy(targetNormal).normalize();
    const tempTarget = new THREE.Vector3();
    const newQuaternion = new THREE.Quaternion();
    const currentWorldUp = new THREE.Vector3();
    object.getWorldDirection(currentWorldUp); // actually gets the forward direction -Z

    const orientationMatrix = new THREE.Matrix4();


    object.up.copy(targetNormal);

    const direction = new THREE.Vector3(0, 0, -1); // Object's local forward direction (negative Z)

    object.up.copy(targetNormal);
    const upVector = new THREE.Vector3(0, 1, 0); // Default object 'up' direction in local space
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(upVector, targetNormal.clone().normalize());

    // Apply the quaternion to the object
    object.setRotationFromQuaternion(quaternion);
}