
import { userInventory, ShowHideDialogPanel } from '../../../connect/dialogs.js';

import { eventEl } from '../../../connect/events.js';

import { ReturnObjectData, SceneObject } from './three_actions.js';

import { viewportPlaceholder } from './three_controls.js';

import { scene } from './three_main.mjs';

import { activeObjex, LoadModel } from './three_locations.js';



export let sceneInventory = [];

export function LoadSceneInventory () { //  user inventory loaded in dialogs.js

    // GetUserInventory();
    const sceneInventoryEl = document.getElementById("sceneInventory"); //popped serverside

    if (sceneInventoryEl) {
    
        const theData = sceneInventoryEl.getAttribute('data-inventory');
        sceneInventory = JSON.parse(atob(theData));
    
    // console.log("scene inventory: " + JSON.stringify(sceneInventory));
    }

    // console.log("userInventory " + JSON.stringify(userInventory));
}

eventEl.addEventListener('equip-inventory-object-event', EquipInventoryItem);


function EquipInventoryItem(event) { //equip button in modal, from dialogs.js//skip


    const objectData = ReturnObjectData(event.details.objectID);
        console.log("equip event for object " + JSON.stringify(objectData));

          if (objectData.actions != undefined && objectData.actions.length > 0) {
              for (let i = 0; i < objectData.actions.length; i++) {
                
                if (objectData.actions[i].actionType.toLowerCase().includes("equip")) {
                    console.log("ACTION " + JSON.stringify(objectData.actions[i]));
                //   action = objectData.actions[i];
                  // console.log(JSON.stringify(action));
                  for (let i = 0; i < userInventory.inventoryItems.length; i++) {
                    if (userInventory.inventoryItems[i].objectID == event.details.objectID) {
                      // inventoryObj = userInventory[i];
                        EquipInventoryObject(objectData);
                        ShowHideDialogPanel();
                        break;
                    }
                  }
                break;
                } 
              }
            }


}

async function EquipInventoryObject (objectData) { //for onload equip ...?

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
            
            activeObjex.push(equippedModel);
            equippedModel.userData.sceneObjectInstance = new SceneObject(equippedModel, objectData);
          // console.log("tryna equip object " + this.el.id);
        //   dropPos = new THREE.Vector3();
        //   objEl = document.createElement("a-entity");
        //   equipHolder = document.getElementById("equipPlaceholder");
        //   if (equipHolder) {
        //     // equipHolder.object3D.getWorldPosition( dropPos );
        //     locData = {};
        //     // locData.x = dropPos.x;
        //     // locData.y = dropPos.y;
        //     // locData.z = dropPos.z;
        //     locData.x = 0;
        //     locData.y = 0;
        //     locData.z = 0;
        //     locData.locationTags = tags;
        //     locData.eventData = eventData;
        //     locData.markerObjScale = (objectData.objScale != undefined && objectData.objScale != "") ? objectData.objScale : 1; //these come from objectData, not locData
        //     locData.eulerx = (objectData.eulerx != undefined && objectData.eulerx != "") ? objectData.eulerx : 0;
        //     locData.eulery = (objectData.eulery != undefined && objectData.eulery != "") ? objectData.eulery : 0;
        //     locData.eulerz = (objectData.eulerz != undefined && objectData.eulerz != "") ? objectData.eulerz : 0;
        //     locData.timestamp = Date.now();
        //     objEl.setAttribute("mod_object", {'eventData': null, 'locationData': locData, 'objectData': objectData, 'isEquipped': true, 'isSpawned': true});
        //     objEl.id = "obj" + objectData._id + "_" + locData.timestamp;
            
        //     objEl.classList.add('equipped');
            
        //     objEl.classList.add('activeObjexRay');
        //     equipHolder.appendChild(this.objEl); //parent to equip holder instead of scene as below
        //     const updoc = {"equipped": true, "objectID": objectID, "objectName": this.objectData.name , "tags": tags, "eventData": eventData}; //saved to profile.equipment.main
        //     UpdateLocalEquipment(updoc);
        //   } else {
        //     console.log("caint equip!");
        //   }
        } else {
          
            FetchSceneInventoryObject(objectID, true, tags, eventData);
        }
        // this.el.setAttribute('gltf-model', '#' + modelID.toString());

    }

  
  function FetchSceneInventoryObject(oID, equip, tags, eventData) { //add a single scene inventory object, e.g. child object spawn that isn't in initial collection, but don't init everything
    let objexEl = document.getElementById('sceneObjects');   

    if (objexEl && !objexEl.components.mod_objex.returnObjectExists(oID)) {
 
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
            objexEl.components.mod_objex.addFetchedObject(response.objex[0]); //add to scene object collection, so don't have to fetch again
            if (equip) {
              objexEl.components.mod_objex.equipInventoryObject(oID, tags, eventData)
            } 
        }
       
      }
    } else {
      console.log("already have that object...");
    }
  }
  
  function FetchSceneInventoryObjex(oIDs) { //fetch scene inventory objects, i.e. stuff dropped by users, at start to populate scene
    let objexEl = document.getElementById('sceneObjects');    
    if (oIDs.length > 0) {
      // objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
      let data = {};
      data.oIDs = oIDs;
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
  
          for (let i = 0; i < response.objex.length; i++) {
            objexEl.components.mod_objex.addFetchedObject(response.objex[i]); //add to scene object collection, so don't have to fetch again
            //use locs and instantiate!
            // console.log(i + " vs " + response.objex.length - 1);
            if (i == response.objex.length - 1) {
              objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
            }
          }
        } else {
          objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
        }
      }
    } else {
      objexEl.components.mod_objex.loadSceneInventoryObjects(); //ok load em up
    }
  }
  