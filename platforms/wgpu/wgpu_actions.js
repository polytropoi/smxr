

import * as THREE from 'three';

import { player, lastRaycastHitObject, mouseDowntime, popup, hic_content, onMouseDown, lastRaycastHitPosition, lastRaycastHitDistance, worldHitPosition } from './wgpu_controls.js';

import { scene } from './wgpu_main.mjs';

import { settings } from '../../../connect/settings.js';
import { userData, room } from '../../../connect/connect.js';
import { locationObjex } from './wgpu_locations.js';
import { EquipObject } from './wgpu_inventory.js';

import { AddDynamicBody, getPlayerBody, kinematicBodies } from './wgpu_physics.js';
import { uiMode, ShowHTMLPopup, HideHTMLPopup } from './wgpu_ui.js';
// import { equippedRigidbody } from './three_physics.js';

export const sceneObjects = {}; //kv pairs, k = instanceID (location timestamp + index), v = sceneObject instance

export let equippedRigidbody;
export let playerRigidbody;
export let lastEvent;
// export const sceneObjectsArray = []; //array with all the object data

export function ActionSwitch (event) { //input from simple html popups
    console.log("ActionSwitch event " + JSON.stringify(event));
    const type = event.target.dataset.type; //e.g. markerType
    const data = event.target.dataset.data; //e.g. eventData
    const tags = event.target.dataset.tags; //e.g. location tags (or object tags?)
    
    lastEvent = event;
    console.log(type + " " + data + " " + tags);

    switch (type) {
        case "gate":
            EnterSceneGate(data);
        break;

        case "equip":
            // console.log("tryna pickup " + data +" from json "+ JSON.stringify(sceneObject));
            sceneObjects[data].confirmed("equip");
        break;

        case "pickup":
            // console.log("tryna pickup " + data +" from json "+ JSON.stringify(sceneObject));
            sceneObjects[data].confirmed("pickup");
        break;
    }
}

export async function SetPlayerRigidbody() {
    playerRigidbody = await getPlayerBody(player); 
    kinematicBodies.push(playerRigidbody);
}

export function ReturnObjectData (objectID) { //not the instance ID, but original mongoID of the object, to get the prototype
    let objek;
    console.log("looking for " + objectID + " in locationObjex length : " + locationObjex.length);
    if (locationObjex.length > 0) { 
        for (let i = 0; i < locationObjex.length; i++) { //spin through the original array to match object's mongoID
        console.log('tryna match object data for ' +objectID + " vs " + locationObjex[i].objectData._id);
        if (locationObjex[i].objectData._id == objectID) {
            console.log('gotsa objectID match to return data ' + objectID);
            // hasObj = true;
            objek = structuredClone(locationObjex[i].objectData);
            break;
        }
        }
    }
    // if (!objek) {

    // }
    return objek;
}

export class SceneObject { //things that might have models and actions and fancy params, e.g. characters, magic swords, etc
    constructor(object, objectData, isEquipped, objectParent) {

        this.object = object;
        this.objectData = objectData;
        this.sceneObjectID = objectData.sceneObjectID;
        this.sceneInventoryID = objectData.sceneInventoryID;
        this.object.userData.sceneObjectInstance = this;
        // console.log("new sceneObject " + this.objectData.sceneObjectID);

        this.isEquipped = false;
        this.fromSceneInventory = objectData.fromSceneInventory;

        // this.loadAction;
        // this.hasSelectAction = false;
        // this.selectAction;

        if (this.objectData.actions != undefined && this.objectData.actions.length > 0) {
      
        this.actions = {};
        
        for (let a = 0; a < this.objectData.actions.length; a++) {
            
            if (this.objectData.actions[a].objectID && this.objectData.actions[a].objectID.length > 8 ) {
                // FetchSceneInventoryObject(this.objectData.actions[a].objectID); //different object connected to this action, should check if this is already fetched
            }
                // console.log("action: " + JSON.stringify(this.objectData.actions[a].actionType));
            if (this.objectData.actions[a].actionType.toLowerCase() == "onload") {
                // this.hasSelectAction = true;
                this.loadAction = this.objectData.actions[a];
                console.log("object has loadAction! " + this.objectData.name);
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "select") {
                this.hasSelectAction = true;
                this.selectAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "highlight") {
                this.hasHighlightAction = true;
                this.highlightAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "collide") {
                this.hasCollideAction = true;
                this.collideAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "kill") { 
                this.hasKillAction = true;
                this.killAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "pickup") {
                this.hasPickupAction = true;
                this.pickupAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "drop") {
                this.hasDropAction = true;
                this.dropAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "throw") {
                this.hasThrowAction = true;
                this.throwAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "trigger") {
                this.hasTriggerAction = true;
                // this.throwAction = this.objectData.actions[a];
                // this.el.setAttribute("equipped_object_control", {init: true});
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "shoot") {
                this.hasShootAction = true;
                this.shootAction = this.objectData.actions[a];
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "equip") {
                this.hasEquipAction = true;
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "consume") {
                this.hasConsumeAction = true;
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "return") {
                // this.hasDropAction = true;
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "use") {
                // this.hasDropAction = true;
            }
            if (this.objectData.actions[a].actionType.toLowerCase() == "find") {
                // this.hasDropAction = true;
                this.findAction = this.objectData.actions[a];
            }
        }

        if (isEquipped) {
            this.objectParent = objectParent;
            this.isEquipped = true;
            this.setEquippedRigidbody();
        }
    }
}
    async setEquippedRigidbody () {
        const worldPosition = new THREE.Vector3();
        this.object.getWorldPosition(worldPosition);
        console.log("setting equippedRigidbody position " + JSON.stringify(worldPosition));
        const colliderScale = this.objectData.colliderScale ? this.objectData.colliderScale : 1;
        const yPosFudge = this.objectData.yPosFudge ? this.objectData.yPosFudge : 0; //offset the collider on y axis
        equippedRigidbody = await AddDynamicBody(this.object, worldPosition, colliderScale, yPosFudge, true, this.objectParent);        
        // playerRigidbody.disable();
        // SetEquippedRigidbody(rbody);
    }
    onOver () {

    }
    onDown () {

    }
       
    onClick (event) {
        lastEvent = event;
        console.log("clicked sceneObject with actions " + JSON.stringify(this.objectData.actions));
           
        // if (textData != null && textData != undefined && textData != "" && textData != "none") {
        //     popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + "  </h1>"  + textData.text;
        //     ShowPopup(event);
        // } else 
        if (this.isEquipped) {
            console.log("clicked on equipped object! mousedowntime id " + mouseDowntime);

             if (this.hasThrowAction) {
                console.log("throw action " + JSON.stringify(this.throwAction));
                if (this.throwAction.sourceObjectMod.toLowerCase() == "persist") { //transfer to scene inventory
                    this.object.visible = false;
                    this.dropObject(this.objectData._id); //just drop for now...throw/shoot/swing next! --< ?
                    
                } else if (this.throwAction.sourceObjectMod.toLowerCase() == "remove") {
                    if (mouseDowntime <= 0) {
                        mouseDowntime = 1;
                    }
                    this.throwObject(this.objectData._id, mouseDowntime, "5");

                }
                // if (this.triggerAudioController != null) {
                //     // this.triggerAudioController.components.trigger_audio_control.playAudioAtPosition(this.hitpoint, this.distance, ["throw"], .5);//tagmangler needs an array
                // }
            }
            if (this.hasShootAction) {
                console.log("shoot action " + JSON.stringify(this.shootAction));
            
                // if (this.triggerAudioController != null) {
                // this.triggerAudioController.components.trigger_audio_control.playAudioAtPosition(this.hitpoint, this.distance, ["shoot"], .5);//tagmangler needs an array, add vol mod 
                // }
                // this.el.object3D.visible = false;
                this.el.classList.remove("activeObjexRay");
            
                this.shootObject(this.data.objectData._id);
                // this.restoreEquipped;
                setTimeout(() => {
                // this.el.object3D.visible = true;
                this.el.classList.add("activeObjexRay");
                }, 1000);
                // this.applyForce();
                
            } 
        } else { //not an equipped object
            console.log("clicked on unequipped object named " + this.objectData.sceneObjectID);
            popup.innerHTML = "";
            let header = "";
            // if (this.objectData && this.objectData.labeltext && this.objectData.labeltext.length) {
            if (this.objectData.labeltext && this.objectData.labeltext.includes("~")) {
                const labelSplit = this.objectData.labeltext.split("~");
                const randomIndex = Math.floor(Math.random() * labelSplit.length);
                header = "<h1>" + this.objectData.name + " : </h1> <div>"+ labelSplit[randomIndex]+"</div>";
                    // ShowPopup(event);
            } else {
                // if (this.objectData) {
                header = "<h1>" + this.objectData.name + " : </h1> <div>"+ this.objectData.description+"</div>";
                    // ShowPopup(event);
                // }
            }
            // }
            let pickupButton = "";
            let equipButton = "";
            let consumeButton = "";
            let hasActions = false;
            let cancelButton = "";
            // cancelButton = "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>";
            if (this.hasPickupAction) {
                // popup.innerHTML += "<h1>"+this.objectData.name+" </h1> <div>"+this.objectData.description+"</div>" +
                // popup.innerHTML +=
                hasActions = true;
                pickupButton = "<button id=\x22popup_yesButton\x22 data-tags=\x22\x22 data-type=\x22pickup\x22 data-data=\x22"+
                this.objectData.sceneObjectID+"\x22 class=\x22collectButton\x22>Collect</button>";

                // popup.innerHTML += "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>"+
                // "<button id=\x22popup_yesButton\x22 data-tags=\x22\x22 data-type=\x22pickup\x22 data-data=\x22"+
                // this.objectData.sceneObjectID+"\x22 class=\x22yesButton\x22>Collect</button>"+
                // "</div>";
                cancelButton = "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>";
                
            } 
            if (this.hasEquipAction) {
                // popup.innerHTML += "<h1>"+this.objectData.name+" </h1> <div>"+this.objectData.description+"</div>" +
                // popup.innerHTML +=
                hasActions = true;
                equipButton = "<button id=\x22popup_yesButton1\x22 data-tags=\x22\x22 data-type=\x22equip\x22 data-data=\x22"+
                this.objectData.sceneObjectID+"\x22 class=\x22equipButton\x22>Equip</button>";

                cancelButton = "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>";
                // popup.innerHTML += "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>"+
                // "<button id=\x22popup_yesButton\x22 data-tags=\x22\x22 data-type=\x22equip\x22 data-data=\x22"+
                // this.objectData._id+"\x22 class=\x22yesButton\x22>Equip</button>"+
                // "</div>";
            }
            if (this.hasConsumeAction || this.objectData.objtype == "Consumable") {
                // popup.innerHTML += "<h1>"+this.objectData.name+" </h1> <div>"+this.objectData.description+"</div>" +
                // popup.innerHTML +=
                consumeButton = "<button id=\x22popup_yesButton2\x22 data-tags=\x22\x22 data-type=\x22consume\x22 data-data=\x22"+
                this.objectData.sceneObjectID+"\x22 class=\x22consumeButton\x22>Consume</button>";
                hasActions = true;
                cancelButton = "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22hicCancelButton\x22>Cancel</button>";
                // popup.innerHTML += "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button>"+
                // "<button id=\x22popup_yesButton2\x22 data-tags=\x22\x22 data-type=\x22consume\x22 data-data=\x22"+
                // this.objectData.sceneObjectID+"\x22 class=\x22yesButton\x22>Consume</button>"+
                // "</div>";
            } 
            if (hasActions) {
                // popup.innerHTML = header + cancelButton + pickupButton + equipButton + consumeButton + "</div>";
                const htmlstring  = header + cancelButton + pickupButton + equipButton + consumeButton + "</div>";
                // "<button id=\x22popup_yesButton2\x22 data-tags=\x22\x22 data-type=\x22consume\x22 data-data=\x22"+
                // this.objectData.sceneObjectID+"\x22 class=\x22yesButton\x22>Consume</button>"+
                // "</div>";
                ShowHTMLPopup(event, htmlstring);
                if (uiMode == "hic") {
                    // UpdateHIC(popup.innerHTML);
                    document.getElementById("popup_cancelButton").addEventListener ('pointerdown', onMouseDown );
                    document.getElementById("popup_yesButton").addEventListener ('pointerdown', onMouseDown );
                     document.getElementById("popup_yesButton1").addEventListener ('pointerdown', onMouseDown );
                     document.getElementById("popup_yesButton2").addEventListener ('pointerdown', onMouseDown );
                    //  document.getElementById("popup_yesButton3").addEventListener ('pointerdown', onMouseDown );
                } else {
                    // ShowPopup(event);
                    //  UpdateHIC(popup.innerHTML);
                }
                
            }
        }
        
    }

    confirmed (type) {
        if (type == "pickup" && this.hasPickupAction) {
            console.log(JSON.stringify(this.pickupAction));
            let data = {};
            data.sceneID = settings._id;
            data.object_item = this.objectData;
            
            data.action = this.pickupAction;
            data.sceneID = settings._id;
            data.fromSceneInventory = this.fromSceneInventory;
            data.timestamp = this.timestamp;
            data.fromScene = room;
            data.object_item = this.objectData;
            data.userData = userData;
            data.action = this.pickupAction;
            console.log("pickupaction " + JSON.stringify(data));
    
            //   Pickup(data, this.el.id);
            
            this.pickupObject(data, this.object);
        } else if (type == "equip" && this.hasEquipAction) {
          let data = {};
            data.sceneID = settings._id;
            data.objectID = this.objectData._id;
            data.action = this.equipAction;
            data.sceneObjectID = this.sceneObjectID;
            data.sceneInventoryID = this.sceneInventoryID;
            data.sceneID = settings._id;
            data.fromSceneInventory = this.fromSceneInventory;
            data.timestamp = this.timestamp;
            data.fromScene = room;
            data.object_item = this.objectData;
            data.userData = userData;
            
            // console.log("equip action " + JSON.stringify(data));
    
            //   Pickup(data, this.el.id);
            
            this.equipObject(data, this.object);
        }
    }
    throwObject() {
        


        const worldPosition = new THREE.Vector3();
        this.object.getWorldPosition(worldPosition);

        console.log(JSON.stringify(worldPosition));

        //     SetEquippedRigidbody(rbody);
        // console.log("tryna throw");
        // await equippedRigidbody;
        // if (equippedRigidbody) {
        // scene.attach(this.object);
        // this.object.removeFromParent();
        equippedRigidbody.addForce(worldPosition, mouseDowntime);
         if (this.object.parent) {
                this.object.parent.remove(this.object);
            } else {
                scene.remove(this.object);
            }
        // this.object.
                    // this.object.parent.remove(thisObject);
        // }
        // dynamicBodies.push(rbody);
        // rbody.AddForce();
    }
    removeFromInventory (data, waitTime) { //i.e. destroy, consume

        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/remove_from_user_inventory/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
            // do something to response
            console.log(this.responseText);
            if (this.responseText.toLowerCase().includes('updated')) {
            // let objexEl = document.getElementById('sceneObjects');    
            // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
            
            } else if (this.responseText.toLowerCase().includes('no drop')) {
            // this.dialogEl = document.getElementById('mod_dialog');
            // if (this.dialogEl != null) {
            //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop that here.");
            // }
            } else if (this.responseText.toLowerCase().includes('maxxed')) {
            // this.dialogEl = document.getElementById('mod_dialog');
            // if (this.dialogEl != null) {
            //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop any more of those here.");
            // }
            } 
        };

    }

    dropObject (data) { //transfer from user to scene inventory
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/drop/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
            // do something to response
            console.log(this.responseText);
            if (this.responseText.toLowerCase().includes('updated')) {
                 const worldPosition = new THREE.Vector3();
                this.object.getWorldPosition(worldPosition);
                scene.attach(this.object);
                // const colliderScale = this.objectData.colliderScale ? this.objectData.colliderScale : 1;
                // const yPosFudge = this.objectData.yPosFudge ? this.objectData.yPosFudge : 0; //offset the collider on y axis
                // equippedRigidbody = await AddDynamicBody(this.object, worldPosition, colliderScale, yPosFudge, true, this.objectParent);       

            // let objexEl = document.getElementById('sceneObjects');    
            // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
            
            } else if (this.responseText.toLowerCase().includes('no drop')) {
                // this.dialogEl = document.getElementById('mod_dialog');
                // if (this.dialogEl != null) {
                //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop that here.");
                // }
            } else if (this.responseText.toLowerCase().includes('maxed')) {
                // this.dialogEl = document.getElementById('mod_dialog');
                // if (this.dialogEl != null) {
                //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop any more of those here.");
                // }
            } 
        };
    }

    equipObject (data, thisObject) { //transfer from scene or scene inventory...to what?
        console.log("tryna equip from scene or scene inventory");
        // let event = {};
        // event.details.object
        // EquipInventoryCheck(data.objectID);
        if (data.fromSceneInventory) {
            // console.log("tryna equip from sceneinventory : " +JSON.stringify(data);
            console.log("tryna equip from sceneinventory : " + data.sceneInventoryID);
            EquipObject(this.objectData);
            if (thisObject.parent) {
                thisObject.parent.remove(thisObject);
            } else {
                scene.remove(thisObject);
            }
        } else {
            console.log("tryna equip from scene : " + data.sceneObjectID);
             EquipObject(this.objectData);
             if (thisObject.parent) {
                thisObject.parent.remove(thisObject);
            } else {
                scene.remove(thisObject);
            }
            // thisObject.parent.remove(thisObject);
        }

    }

    // hide
    pickupObject (data, thisObject) { //i.e. collect, put into user inventory
        // console.log("tryna pickup " + JSON.stringify(data) + " this.objectData " + JSON.stringify(this.object));
        // let objEl = document.getElementById(id);
        // if (objEl != null) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/pickup/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
        // do something to response
        console.log(this.responseText);

        if (this.responseText.toLowerCase().includes("saved")) {
            
            htmlstring = "<br><br><h3>Saved to inventory!</h3>";
            ShowHTMLPopup(event, htmlstring);
            // popup.innerHTML = 
            // ShowPopup(lastEvent);
            setTimeout(() => {
                popup.style.display = "none";
                HideHTMLPopup();
            }, 3000);
            // this.object.visible = false;
            thisObject.parent.remove(thisObject);
            // // scene.remove(mesh);
            // thisObject.geometry.dispose();
            // thisObject.material.dispose();

        }

        if (this.responseText.toLowerCase().includes("max")) {
            
            
            
            const htmlstring = "<br><br><h3>Sorry, you can't have any more of those!</h3>";
            ShowHTMLPopup(event, htmlstring);
            // popup.innerHTML = 
            // ShowPopup(lastEvent);
            setTimeout(() => {
                popup.style.display = "none";
                HideHTMLPopup();
            }, 3000);

            // ShowPopup(lastEvent);
            // setTimeout(() => {
            //     popup.style.display = "none";
            // }, 3000);
        }
        // this.dialogEl = document.getElementById('mod_dialog');
        // if (this.dialogEl != null) {
            
        //     if (this.responseText.toLowerCase().includes("saved")) { //put in inventory
        //     if (data.action.sourceObjectMod.toLowerCase() == "remove") {
        //         objEl.components.mod_object.hideObject();
        //     }
        //     this.dialogEl.components.mod_dialog.confirmResponse("Saved to inventory!");
        //     console.log('pickedup!');
        //     } else if (this.responseText.toLowerCase().includes("consume")) { //
            
        //     console.log("tryuna consumobjEl");
        //     if (data.action.sourceObjectMod.toLowerCase() == "remove") {
        //         objEl.components.mod_object.hideObject();
        //     }
        //     if (data.action.sourceObjectMod.toLowerCase() == "replace model") {
        //         objEl.components.mod_object.replaceModel(data.action.modelID);
        //     }
        //     if (data.action.sourceObjectMod.toLowerCase() == "replace object") {
        //         objEl.components.mod_object.replaceObject(data.action.objectID);
        //     }
        //     // if (data.action.sourceObjectMod.toLowerCase() == "equip") {
        //     //   objEl.components.mod_object.equipObject(data.action.objectID);
        //     // }

        //     if (data.action.sourceObjectMod.toLowerCase() == "random location") {
        //         objEl.components.mod_object.randomLocation();
        //     }
        //     this.dialogEl.components.mod_dialog.confirmResponse("Refreshing!");
        //     console.log("consumed");
        //     } else if (this.responseText.toLowerCase().includes("equip")) {
        //     console.log("tryna equi9p dout");
        //     } else {
        //     console.log("maxed");
        //     this.dialogEl.components.mod_dialog.confirmResponse("You can't have any more of those");
        //     }
        // }
        }
    // }
    }

}


function EnterSceneGate (eventData) {

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
                        window.location.href = "/three/" + data.short_id;
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
