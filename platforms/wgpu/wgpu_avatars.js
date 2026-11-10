
import * as THREE from 'three';

import { userData, room, avatars, roomUsers, ReturnRoomUsersString } from '../../../connect/connect.js';

import { activeObjex, LoadModel } from './wgpu_locations.js';

import { scene, loadingHeader } from './wgpu_main.mjs';
// import { eventEl } from '../../../connect/events.js';

import { StartPopup } from './wgpu_ui.js';
export let avatarCount = 0; //extant avatars, should be roomUsersCount - 1
export let roomUsersCount = 0; //i.e. socket connections, from connect.js
// export let avatars = {}
// eventEl.addEventListener('avatar-event', AvatarEvent); //no workie from here?!?
let eventEl = document.getElementById("eventEl");
eventEl.addEventListener('avatar-event', AvatarEvent);

let firstTime = true;

function RemoveAvatarByName(name) {

    const selectedObject = scene.getObjectByName(name);
    if (selectedObject) {
        // 2. Remove it from its parent (usually the scene)
        selectedObject.parent.remove(selectedObject);

        // 3. Optional but highly recommended: Free up GPU memory
        if (selectedObject.geometry) selectedObject.geometry.dispose();
        
        if (selectedObject.material) {
            if (Array.isArray(selectedObject.material)) {
                selectedObject.material.forEach(material => material.dispose());
            } else {
                selectedObject.material.dispose();
            }
        }
    }
}

export function UpdateRoomUsers () {
    // if (firstTime) {
    //     firstTime = false;
        const roomUserString = ReturnRoomUsersString(roomUsers);
        StartPopup(loadingHeader, roomUserString, true);	
    // }       
}

export async function AvatarEvent(event) { //


    console.log("gotsa avatarEvent " + JSON.stringify(event.details));
    
    if (event.details.type == "create") {
        // https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb
         const avatar_id = "avatar_" + event.details.socketID;
        if (!avatars[avatar_id]) {
            avatars[avatar_id] = event.details;
            const model = await LoadModel('https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb');
            console.log("tryna set avatar color " + event.details.color);
            const material = new THREE.MeshStandardMaterial( { color: event.details.color } ); //color is passed in socket handshake, and appended to username
            const avatarModel = model.scene;
            material.needsUpdate = true;
            // index = 0;
            avatarModel.traverse(node => {
                if (node.name == "head" || node.name == "body") { //not the eyes!
                    node.material = material;
                    node.name = avatar_id;
                    node.userData.name = avatar_id;
                }
            });
            avatarModel.name = avatar_id;
            avatarModel.userData.name = avatar_id;
            scene.add(avatarModel);
            activeObjex.push(avatarModel);

            roomUsersCount = Object.keys(roomUsers).length;
            avatarCount = Object.keys(avatars).length;
            console.log(event.details.color  + " avatar with ID " + avatar_id + " for roomUsers " + roomUsersCount + " vs avatarCount " + avatarCount);
           
            UpdateRoomUsers(roomUsers);
            
            // avatars[avatar_id].sceneAvatar = new SceneAvatar(avatar_id);
        } else {
            console.log("alreay have an avatar with ID " + avatar_id + " : " + avatars[avatar_id])
        }

        // avatars[]
        
    } else if (event.details.type == "delete") {
        delete avatars[event.details.avatarID];
        RemoveAvatarByName(event.details.avatarID);
        console.log("created avatar with ID " + event.details.avatarID);

    } else if (event.details.type == "move") {
        //find by name
        const avatar_id = "avatar_" + event.details.socketID;
        console.log("tryna move avatarID " + avatar_id);

        const targetAvatar = avatars[avatar_id];
        if (targetAvatar) {
            const avatarModel = scene.getObjectByName(avatar_id);
            if (avatarModel) {
                console.log("gotsa avatarmodel name " + targetAvatar.name + " color " + targetAvatar.color + " socketiD " + event.details.socketID);
                avatarModel.position.set(event.details.posX,event.details.posY,event.details.posZ);
                avatarModel.rotation.set(event.details.rotX,event.details.rotY,event.details.rotZ);
            } else {
                console.log("caint find no avatarModel for " +avatar_id);
            }
        }
    } else if (event.details.type == "update room users") {
        // StartPopup(loadingHeader, stringRoomUsers, true);
        UpdateRoomUsers(event);

    }

}

class SceneAvatar { //must be a socket connection!
    constructor (avatarID) {
        // this.model = model;
        // this.targetPosition = new THREE.Vector3();
        this.avatarID = avatarID;
        this.avatarModel = scene.getObjectByName(avatarID);
        if (this.avatarModel) {
            console.log("gotsa avatarModel! " + avatarID);
        } else {
            console.log("caint find avatarmodel " + avatarID);
        }
    }

    setTargetPosition (targetPosition) {
        this.targetPosition = targetPosition;
    }

    update(deltaTime) {

    }
}

