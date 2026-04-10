
import { lastRaycastHitObject, ShowPopup } from './three_controls.js';

export function HTMLActionSwitch (event) { //input from simple html popups
    const type = event.target.dataset.markertype;
    const eventdata = event.target.dataset.eventdata;
    const tags = event.target.dataset.tags;
    
    console.log(type + " " + eventdata + " " + tags);


    switch (type) {
        case "gate":
            EnterSceneGate(eventdata);
        break;
    }
}

export class SceneObject { //things with actions and fancy params, e.g. characters, magic items
    constructor(object, objectData, locationData) {

        this.object = object;
        this.objectData = objectData;
        this.object.userData.sceneObjectInstance = this;
        console.log("new sceneObject " + JSON.stringify(this.objectData));

        this.isEquipped = false;
        this.fromSceneInventory = false;
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
      }
    }
       
    onClick (event) {
        console.log("clicked sceneObject with actions " + JSON.stringify(this.objectData.actions));
           
        // if (textData != null && textData != undefined && textData != "" && textData != "none") {
        //     popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + "  </h1>"  + textData.text;
        //     ShowPopup(event);
        // } else 
            if (this.hasPickupAction) {
                popup.innerHTML = "<h1>"+this.objectData.name+" </h1> <div>Pickup object?</div>" +
                "<br><br><div><button id=\x22popup_cancelButton\x22 class=\x22cancelButton\x22>Cancel</button> <button id=\x22popup_yesButton\x22 data-tags=\x22\x22 data-markertype=\x22pickup\x22 data-eventdata=\x22"+
                this+"\x22 class=\x22yesButton\x22>Yes</button>"+
                "</div>";
                ShowPopup(event);
            } else if (lastRaycastHitObject.userData.objectData && lastRaycastHitObject.userData.objectData.labeltext && lastRaycastHitObject.userData.objectData.labeltext.length) {
                if (lastRaycastHitObject.userData.objectData.labeltext.includes("~")) {
                    const labelSplit = lastRaycastHitObject.userData.objectData.labeltext.split("~");
                    const randomIndex = Math.floor(Math.random() * labelSplit.length);
                    popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + labelSplit[randomIndex];
                        ShowPopup(event);
                } else {
                    if (lastRaycastHitObject.userData.objectData) {
                        popup.innerHTML = "<h1>" + lastRaycastHitObject.userData.objectData.name + " : </h1>"  + lastRaycastHitObject.userData.objectData.description;
                        ShowPopup(event);
                    }
                }
         }
        
    }

    confirmed (type) {
        if (type == "pickup" && this.hasPickupAction) {
            console.log(JSON.stringify(this.pickupAction));
            let data = {};
            data.sceneID = settings._id;
            data.fromSceneInventory = this.data.fromSceneInventory;
            data.timestamp = this.data.timestamp;
            data.fromScene = room;
            data.object_item = this.objectData;
            data.userData = userData;
            data.action = this.pickupAction;
            console.log("pickupaction " + JSON.stringify(data));
    
            //   Pickup(data, this.el.id);
            
            // this.pickup(data);
        }
    }

    drop (data) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/drop/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
            // do something to response
            console.log(this.responseText);
            if (this.responseText.toLowerCase().includes('updated')) {
            let objexEl = document.getElementById('sceneObjects');    
            objexEl.components.mod_objex.dropObject(data.inventoryObj.objectID);
            
            } else if (this.responseText.toLowerCase().includes('no drop')) {
            this.dialogEl = document.getElementById('mod_dialog');
            if (this.dialogEl != null) {
                this.dialogEl.components.mod_dialog.confirmResponse("You can't drop that here.");
            }
            } else if (this.responseText.toLowerCase().includes('maxxed')) {
            this.dialogEl = document.getElementById('mod_dialog');
            if (this.dialogEl != null) {
                this.dialogEl.components.mod_dialog.confirmResponse("You can't drop any more of those here.");
            }
            } 
        };
    }
    // hide
    pickup (data, id) {
    console.log("tryna act on " + id);
    let objEl = document.getElementById(id);
    if (objEl != null) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/pickup/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
        // do something to response
        console.log(this.responseText);
        this.dialogEl = document.getElementById('mod_dialog');
        if (this.dialogEl != null) {
            
            if (this.responseText.toLowerCase().includes("saved")) { //put in inventory
            if (data.action.sourceObjectMod.toLowerCase() == "remove") {
                objEl.components.mod_object.hideObject();
            }
            this.dialogEl.components.mod_dialog.confirmResponse("Saved to inventory!");
            console.log('pickedup!');
            } else if (this.responseText.toLowerCase().includes("consume")) { //
            
            console.log("tryuna consumobjEl");
            if (data.action.sourceObjectMod.toLowerCase() == "remove") {
                objEl.components.mod_object.hideObject();
            }
            if (data.action.sourceObjectMod.toLowerCase() == "replace model") {
                objEl.components.mod_object.replaceModel(data.action.modelID);
            }
            if (data.action.sourceObjectMod.toLowerCase() == "replace object") {
                objEl.components.mod_object.replaceObject(data.action.objectID);
            }
            // if (data.action.sourceObjectMod.toLowerCase() == "equip") {
            //   objEl.components.mod_object.equipObject(data.action.objectID);
            // }

            if (data.action.sourceObjectMod.toLowerCase() == "random location") {
                objEl.components.mod_object.randomLocation();
            }
            this.dialogEl.components.mod_dialog.confirmResponse("Refreshing!");
            console.log("consumed");
            } else if (this.responseText.toLowerCase().includes("equip")) {
            console.log("tryna equi9p dout");
            } else {
            console.log("maxed");
            this.dialogEl.components.mod_dialog.confirmResponse("You can't have any more of those");
            }
        }
        };
    }
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
