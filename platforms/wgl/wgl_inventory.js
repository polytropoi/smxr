
import * as THREE from 'three';

import { userInventory, ShowHideDialogPanel, GetUserInventoryAsync, uniqueItems } from '../../../connect/dialogs.js';

import { eventEl } from '../../../connect/events.js';

import { ReturnObjectData, SceneObject, lastEvent} from './wgl_actions.js';

import { viewportPlaceholder, popup } from './wgl_controls.js';

import { ShowPopup } from './wgl_ui.js';

import { AddDynamicBody, SetEquippedRigidbody } from './wgl_physics.js';

// import { room } from './wgl_main.mjs';

import { activeObjex, LoadAndDropSingleObject, LoadModel, locationObjex } from './wgl_locations.js';

import { userData, room } from '../../../connect/connect.js';
// import {  } from '../../connect/dialogs.js';
// import { GetUserInventory } from '../../connect/dialogs.js';



export let sceneInventory = [];

export async function LoadSceneInventory () { //  user inventory loaded in dialogs.js

    // GetUserInventory();
    const sceneInventoryEl = document.getElementById("sceneInventory"); //popped serverside

    if (sceneInventoryEl) {
    
        const theData = sceneInventoryEl.getAttribute('data-inventory');
        sceneInventory = JSON.parse(atob(theData));
    
        console.log("scene inventory: " + JSON.stringify(sceneInventory));
        AddSceneInventoryObjects();
    }

    

    let items = await GetUserInventoryAsync();
    // 
    console.log("three userInventory " + JSON.stringify(uniqueItems));
    if (uniqueItems && uniqueItems.length) { //hrm still null
        
        // AddUserInventoryObjects(uniqueItems);
        FetchUserInventoryObjex(uniqueItems)
    }
}

eventEl.addEventListener('equip-inventory-object-event', EquipInventoryCheck);
eventEl.addEventListener('drop-inventory-object-event', DropInventoryCheck);
// eventEl.addEventListener('remove-inventory-object-event', RemoveInventoryCheck);




function EquipInventoryCheck(event) { //equip button in modal, from dialogs.js - TODO flex if from scene or scene inventory -- no, this only for userinventory

    const objectData = ReturnObjectData(event.details.objectID);
    console.log("equip event for object " + JSON.stringify(objectData));

    if (objectData) {
        if (objectData.actions != undefined && objectData.actions.length > 0) {
            for (let i = 0; i < objectData.actions.length; i++) {
                if (objectData.actions[i].actionType.toLowerCase().includes("equip")) { // fromSceneInventory, fromUserInventory?

                console.log("gots equip ACTION " + objectData.actions[i].actionName);
            //   action = objectData.actions[i];
                // console.log(JSON.stringify(action));
                if (objectData.fromUserInventory && userInventory) {
                    for (let i = 0; i < userInventory.inventoryItems.length; i++) {
                        if (userInventory.inventoryItems[i].objectID == event.details.objectID) {
                            // inventoryObj = userInventory[i];
                            EquipObject(objectData);
                            ShowHideDialogPanel();
                            break;
                            }
                        }
                            
                } 
                // else if (objectData.fromSceneInventory) {
                //                 for (let i = 0; i < sceneInventory.inventoryItems.length; i++) {
                //         if (sceneInventory.inventoryItems[i].objectID == event.details.objectID) {
                //             // inventoryObj = userInventory[i];
                //             EquipInventoryObject(objectData);
                //             // ShowHideDialogPanel();
                //             break;
                //             }
                //         }
                // } else {
                //     EquipInventoryObject(objectData);
                // }
            }
        } 
    }
    } else {
        console.log("cain't equip that!");
    }
}

export async function EquipObject (objectData) { 

        // console.log("tryna equip  " + objectID  + " equipped " + this.data.equipped + " tags " + tags + " eventData " + eventData);  
        
        // let objectData = ReturnObjectData(objectID);
        if (objectData) {        
            objectData.isEquipped = true;
            console.log("tryna equip object " + objectData.modelURL);  

            const equippedModelData = await LoadModel(objectData.modelURL);
            const equippedModel = equippedModelData.scene;
            // scene.add(equippedModel);
            viewportPlaceholder.add(equippedModel);

            equippedModel.traverse(function (child) {
                if (child.isMesh) {
                    child.userData.name = objectData.name;
                    child.userData.locationData = {};
                    child.userData.isEquipped = true;
                    child.userData.objectData = objectData;
                    // child.bindMode = "detached";
                }
            });
            // const worldPosition = new THREE.Vector3();
            // equippedModel.getWorldPosition(worldPosition);
            activeObjex.push(equippedModel);
            const equippedSceneObject = new SceneObject(equippedModel, objectData, true, viewportPlaceholder);
           
       
        } else {
          
            FetchSceneInventoryObject(objectID, true, tags, eventData);
        }
    }

function RemoveFromSceneInventory (sceneObjectID) {

}

function DropInventoryCheck(event) { //equip button in modal, from dialogs.js


    const objectData = ReturnObjectData(event.details.objectID); //um, check inventory not locationObjex...
    console.log("check drop event for object " + JSON.stringify(objectData));

    if (objectData && objectData.actions != undefined && objectData.actions.length > 0) {
        for (let i = 0; i < objectData.actions.length; i++) {
        
        if (objectData.actions[i].actionType.toLowerCase().includes("drop")) {
            console.log("ACTION " + JSON.stringify(objectData.actions[i]));
        //   action = objectData.actions[i];
            // console.log(JSON.stringify(action));
            for (let i = 0; i < userInventory.inventoryItems.length; i++) {
                if (userInventory.inventoryItems[i].objectID == event.details.objectID) {
                    // inventoryObj = userInventory[i];
                    DropInventoryObject(objectData, objectData.actions[i], userInventory.inventoryItems[i]._id );
                    ShowHideDialogPanel();
                    break;
                }
            }
        break;
        } 
        }
    } else {
        console.log("cain't equip that!");
    }
}


async function DropInventoryObject (objectData, action, inventoryID) { 

        // console.log("tryna equip  " + objectID  + " equipped " + this.data.equipped + " tags " + tags + " eventData " + eventData);  
        
        // let objectData = ReturnObjectData(objectID)

        if (objectData) {        
            objectData.isEquipped = false;
            let data = {};
            data.inScene = room;
            // data.inScene
            // data.inventoryID = inventoryID;
            data.userData = userData;
            // data.object_item = this.data.objectData;
            // data.userData = userData;
            data.action = action;
            
            data.inventoryObj = objectData;
            data.inventoryObj.objectID = objectData._id;
            data.inventoryObj._id = inventoryID;
            const worldPosition = new THREE.Vector3();
            viewportPlaceholder.getWorldPosition(worldPosition);
            data.inventoryObj.location = worldPosition;
            // console.log("tryna drop object " + JSO>objectData);  
            var xhr = new XMLHttpRequest();
            xhr.open("POST", '/drop/', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));

            xhr.onload = function () {
                // do something to response
                console.log(JSON.stringify(this.responseText));
                if (this.responseText.toLowerCase().includes('updated')) {
                    
                    LoadAndDropSingleObject(objectData, worldPosition);
                
                } else if (this.responseText.toLowerCase().includes('no drop')) {

                    popup.innerHTML = "<br><br><h3>Sorry, you can't drop that here!</h3>";
                    ShowPopup();
                    setTimeout(() => {
                        popup.style.display = "none";
                    }, 3000);
                //   this.dialogEl = document.getElementById('mod_dialog');
                //   if (this.dialogEl != null) {
                //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop that here.");
                //   }
                } else if (this.responseText.toLowerCase().includes('maxed')) {
                    popup.innerHTML = "<br><br><h3>Sorry, no more of these can be here!</h3>";
                    ShowPopup();
                    setTimeout(() => {
                        popup.style.display = "none";
                    }, 3000);
                //   this.dialogEl = document.getElementById('mod_dialog');
                //   if (this.dialogEl != null) {
                //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop any more of those here.");
                //   }
                } 
            };
        } 
    }

  
  function FetchSceneInventoryObject(oID, equip, tags, eventData) { //add a single scene inventory object, e.g. child object spawn that isn't in initial collection, but don't init everything
    // let objexEl = document.getElementById('sceneObjects');   

    // if (objexEl && !objexEl.components.mod_objex.returnObjectExists(oID)) {
 
    // if (oIDs.length > 0) {
      // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
      let data = {};
      data.oIDs = [oID];
      var xhr = new XMLHttpRequest();
      xhr.open("POST", '/scene_inventory_objex/', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
      xhr.onload = function () {
        // do something to response
        // console.log("fetched obj resp: " +this.responseText);
        let response = JSON.parse(this.responseText);
        // console.log("gotsome objex: " + response.objex.length);
        if (response.objex.length > 0) {
            // objexEl.components.mod_objex.addFetchedObject(response.objex[0]); //add to scene object collection, so don't have to fetch again
            if (equip) {
            //   objexEl.components.mod_objex.equipInventoryObject(oID, tags, eventData)
            } 
        }
       
      }
    // } else {
    //   console.log("already have that object...");
    // }
  }
  
  function AddUserInventoryObjects (items) {
    let oIDs = [];
    if (items) {
        for (let i = 0; i < items.length; i++) {
            // if (sceneInventory[i].objectID && ReturnObjectData(sceneInventory[i].objectID) == null) { //if we don't already have this object data, need to fetch it
            //     if (!oIDs.includes(sceneInventory[i` ].objectID)) { //prevent duplicates
            //     // if ()
            if (items[i].objectID) {
                console.log("userInventory object " + items[i])
                oIDs.push(items[i]);
                }
            } 
        }
        FetchUserInventoryObjex(oIDs); 
    }
    
  function AddSceneInventoryObjects () { //get full list of objects in scene inventory, id those not already part of scene
    let oIDs = [];
    // this.fromSceneInventory = true;
    // // this.fromSceneInventory = objex._id //top level of inventory object, items are array property //NO, this is now the sceneID, set in each inventory_item//NOOO, it's nothing
    // // if (objex.inventoryItems != undefined && objex.inventoryItems.length > 0) {
    //     this.sceneInventoryItems = inventory_items;
    // }
    console.log("gots scene inventory items: " + JSON.stringify(sceneInventory));
    //wait, need to cache the locations where to place the fetched objs... :|
    if (sceneInventory) {
        for (let i = 0; i < sceneInventory.length; i++) {
        // if (sceneInventory[i].objectID && ReturnObjectData(sceneInventory[i].objectID) == null) { //if we don't already have this object data, need to fetch it
        //     if (!oIDs.includes(sceneInventory[i].objectID)) { //prevent duplicates
        //     // if ()
        if (sceneInventory[i].objectID) {
            console.log( sceneInventory[i].objectID)
            oIDs.push(sceneInventory[i].objectID);
        }
        //     console.log("gotsa oID from scene inventory that needs fetching!");
        //     }
        // }
        }
    }
    console.log("need to fetch inventory: " + oIDs);
    FetchSceneInventoryObjex(oIDs); 
    
}

  function FetchUserInventoryObjex(oIDs) { //fetch scene inventory objects, i.e. stuff dropped by users, at start to populate scene
    // let objexEl = document.getElementById('sceneObjects');    
    if (oIDs.length > 0) {
      // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
      let data = {};
      data.oIDs = oIDs;
        console.log("tryna fetch userInventory oids " + oIDs);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/user_inventory_objex/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
            // do something to response
            // console.log("fetched obj resp: " +this.responseText);
            let response = JSON.parse(this.responseText);
            // console.log("gotsome objex: " + JSON.stringify(response.objex));
            if (response.objex.length > 0) {
                for (let i = 0; i < response.objex.length; i++) {
                    // console.log("pushing userInventory object " + JSON.stringify(response.objex[i]));
                    let locObj = {};
                    locObj.objectData = structuredClone(response.objex[i]);
                    
                    locationObjex.push(locObj);
                }
            }

            }
        }
    }



  function FetchSceneInventoryObjex(oIDs) { //fetch scene inventory objects, i.e. stuff dropped by users, at start to populate scene
    // let objexEl = document.getElementById('sceneObjects');    
    if (oIDs.length > 0) {
      // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
      let data = {};
      data.oIDs = oIDs;
        console.log("tryna fetch sceneInventory oids " + oIDs);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/scene_inventory_objex/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
            // do something to response
            // console.log("fetched obj resp: " +this.responseText);
            let response = JSON.parse(this.responseText);
            console.log("gotsome sceneInventory objex: " + response.objex.length);
            if (response.objex.length > 0) {
    
                for (let s = 0; s < sceneInventory.length; s++) {
                    for (let i = 0; i < response.objex.length; i++) {
                        console.log(sceneInventory[s].objectID +" VS " + response.objex[i]._id);
                        if (sceneInventory[s].objectID == response.objex[i]._id) {

                            
                            // objexEl.components.mod_objex.addFetchedObject(response.objex[i]); //add to scene object collection, so don't have to fetch again
                            //use locs and instantiate!
                            // console.log(i + " vs " + response.objex.length - 1);
                            
                            // locationObjex.push(response.objex[i]);
                            response.objex[i].fromSceneInventory = true;
                            response.objex[i].sceneInventoryID = sceneInventory[s]._id;
                            console.log("scene inventory object " + response.objex[i].name + " inventoryID " + response.objex[i].sceneInventoryID);
                            LoadAndDropSingleObject(response.objex[i], sceneInventory[s].location);
                        
                        }
                    }
                    // sceneInventory.push(response.objex[i]);
                    // if (i == response.objex.length - 1) {
                    // //   objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
                    // }
                }
                    //     } else {
                    //     //   objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
                    //     }
                    // }
                // } else {
                // //   objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
                // }

                // for (let s = 0; s < sceneInventory.length; s++) {
                //     LoadAndDropSingleObject(sceneInventory[s], sceneInventory[s].locationData);
                // }
}
        }
    }

  }
  



// export function Drop (data) {
//   var xhr = new XMLHttpRequest();
//   xhr.open("POST", '/drop/', true);
//   xhr.setRequestHeader('Content-Type', 'application/json');
//   xhr.send(JSON.stringify(data));
//   xhr.onload = function () {
//     // do something to response
//     console.log(this.responseText);
//     if (this.responseText.toLowerCase().includes('updated')) {
     
      
//     } else if (this.responseText.toLowerCase().includes('no drop')) {
//     //   this.dialogEl = document.getElementById('mod_dialog');
//     //   if (this.dialogEl != null) {
//     //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop that here.");
//     //   }
//     } else if (this.responseText.toLowerCase().includes('maxxed')) {
//     //   this.dialogEl = document.getElementById('mod_dialog');
//     //   if (this.dialogEl != null) {
//     //     this.dialogEl.components.mod_dialog.confirmResponse("You can't drop any more of those here.");
//     //   }
//     } 
//   };
// }
// export function Pickup (data, id) {
//   console.log("tryna act on " + id);
//   let objEl = document.getElementById(id);
//   if (objEl != null) {
//     var xhr = new XMLHttpRequest();
//     xhr.open("POST", '/pickup/', true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.send(JSON.stringify(data));
//     xhr.onload = function () {
//       // do something to response
//       console.log(this.responseText);
//       this.dialogEl = document.getElementById('mod_dialog');
//       if (this.dialogEl != null) {
        
//         if (this.responseText.toLowerCase().includes("saved")) { //put in inventory
//           if (data.action.sourceObjectMod.toLowerCase() == "remove") {
//             objEl.components.mod_object.hideObject();
//           }
//           this.dialogEl.components.mod_dialog.confirmResponse("Saved to inventory!");
//           console.log('pickedup!');
//         } else if (this.responseText.toLowerCase().includes("consume")) { //
          
//           console.log("tryuna consumobjEl");
//           if (data.action.sourceObjectMod.toLowerCase() == "remove") {
//             objEl.components.mod_object.hideObject();
//           }
//           if (data.action.sourceObjectMod.toLowerCase() == "replace model") {
//             objEl.components.mod_object.replaceModel(data.action.modelID);
//           }
//           if (data.action.sourceObjectMod.toLowerCase() == "replace object") {
//             objEl.components.mod_object.replaceObject(data.action.objectID);
//           }
//           // if (data.action.sourceObjectMod.toLowerCase() == "equip") {
//           //   objEl.components.mod_object.equipObject(data.action.objectID);
//           // }

//           if (data.action.sourceObjectMod.toLowerCase() == "random location") {
//             objEl.components.mod_object.randomLocation();
//           }
//           this.dialogEl.components.mod_dialog.confirmResponse("Refreshing!");
//           console.log("consumed");
//         } else if (this.responseText.toLowerCase().includes("equip")) {
//           console.log("tryna equi9p dout");
//         } else {
//           console.log("maxed");
//           this.dialogEl.components.mod_dialog.confirmResponse("You can't have any more of those");
//         }
//       }
//     };
//   }
// }