import { InitLocalColors, DisplayLocalFiles } from "../main/js/dialogs.js";

import { room, sceneLocations, locationTimestamps, localData, userData, lastCloudUpdate, InitCurves, 
   sceneEl, PlayerToLocation, getExtension, poiLocations, curveLocations, avatarName, UpdateAvatarName, UpdateUserProfile } from "../connect/connect.js";

import { settings } from "../../connect/settings.js";
import { SetTimeKeysData } from "../connect/events.js";
export let hasLocalData = false;
//////////////////////indexedDB functions...
export function InitIDB() {
   let playerPosMods = [];
   // let localSettings = {};
    console.log("tryna connect to SMXR indexeddb");
    if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
     }
    const request = indexedDB.open("SMXR", 2);
    request.onerror = (event) => {
       console.error("could not connect to iDB " + event);
       return "error"
    };
    request.onupgradeneeded = function (event) {
       const db = request.result;
      console.log("onupgradeneeded fired, indexedDB oldversion is " + event.oldVersion);

      if (event.oldVersion < 1) {
         console.log("is there a version 0")
            // const store = db.createObjectStore("scenes", { keyPath: "shortID" });
            // store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
         const store = db.createObjectStore("scenes", { keyPath: "shortID" });
         store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
      }
      if (event.oldVersion < 2) { //version 1
         const pstore = db.createObjectStore("profiles", { keyPath: "userID" });
         pstore.createIndex("profile", ["profile"], { unique: true });
        
      }
   };

    request.onsuccess = function () {
       console.log("Database opened successfully");
       const db = request.result;
       const transaction = db.transaction("scenes", "readwrite");
       const store = transaction.objectStore("scenes");

       const saveTimeStamp = Date.now();
       const lastSceneUpdate = null;

       //first check if there are localmods, version saved with tilde
       // const modQuery = store.get(room + "~"); //nope, needs cursor
       const modQuery = store.openCursor(room + "~"); //use cursor mode so it's iterable below
      //  const fileQuery = filestore.openCursor();
       modQuery.onsuccess = function (e) {
          var cursor = e.target.result;
          console.log("query for localData : " + e.target.result);
          // if (e.target.result) {
             if (cursor) {
                localData.lastUpdate = cursor.value.lastUpdate;

                // start location loop
                if (cursor.value.locations) {
                  for (let i = 0; i < cursor.value.locations.length; i++) { //mod or create the scene elements
                     // let loc = JSON.stringify(cursor.value.locations[i]);
                     console.log("cursor " + i + " of " + cursor.value.locations.length);
                     locationTimestamps.push(cursor.value.locations[i].timestamp.toString()); //hrm, for ref
                     localData.locations.push(cursor.value.locations[i]);
                     if (cursor.value.locations[i].markerType == "player") {
                        playerPosMods.push(cursor.value.locations[i].x + " " + cursor.value.locations[i].y + " " + cursor.value.locations[i].z);
                        console.log("PLayerPosMods :" + JSON.stringify(playerPosMods));
                     
                     }
                     if (cursor.value.locations[i].isLocal != undefined && cursor.value.locations[i].isLocal) { //only update ones with local changes
                     // console.log(cursor.value.locations[i].name + " markerType " + cursor.value.locations[i].markerType + " isLocal!" + " scale " + cursor.value.locations[i].xscale + cursor.value.locations[i].yscale + cursor.value.locations[i].zscale );
                     console.log("IDB cloudmarker name " + cursor.value.locations[i].name + " markerType " + cursor.value.locations[i].markerType + " isLocal " + " modelID " + cursor.value.locations[i].modelID);
                     let cloudEl = document.getElementById(cursor.value.locations[i].timestamp);

                        if (cloudEl) { //prexisting elements (cloud_marker, mod_model, mod_object) already rendered onload
                        
                           cloudEl.setAttribute("position", {x: cursor.value.locations[i].x, y: cursor.value.locations[i].y, z: cursor.value.locations[i].z });
                           cloudEl.setAttribute("rotation", {x: cursor.value.locations[i].eulerx, y: cursor.value.locations[i].eulery, z: cursor.value.locations[i].eulerz });
                           // cloudEl.setAttribute("scale", {x: cursor.value.locations[i].markerObjScale, y: cursor.value.locations[i].markerObjScale, z: cursor.value.locations[i].markerObjScale});
                           cloudEl.setAttribute("scale", {x: cursor.value.locations[i].xscale, y: cursor.value.locations[i].yscale, z: cursor.value.locations[i].zscale});
                           let cloudMarkerComponent = cloudEl.components.cloud_marker;
                           if (cloudMarkerComponent) {  
                              if (
                                 (cursor.value.locations[i].mediaID && cursor.value.locations[i].mediaID.includes("local_") || 
                                 (cursor.value.locations[i].modelID && cursor.value.locations[i].modelID.includes("local_")))) {
                                    cloudEl.classList.add("hasLocalFile");
                                    console.log("cursor hasLocalFile: "+ JSON.stringify(cursor.value.locations[i]));
                              }
                              if (cursor.value.locations[i].locationTags && cursor.value.locations[i].locationTags.includes("curve point")) {
                                 cloudEl.classList.add("curvepoint");
                              }
                              cloudMarkerComponent.updateAndLoad(cursor.value.locations[i].name, 
                                                               cursor.value.locations[i].description, 
                                                               cursor.value.locations[i].locationTags, 
                                                               cursor.value.locations[i].eventData, 
                                                               cursor.value.locations[i].markerType, 
                                                               cursor.value.locations[i].markerObjScale, 
                                                               cursor.value.locations[i].x, 
                                                               cursor.value.locations[i].y, 
                                                               cursor.value.locations[i].z, 
                                                               cursor.value.locations[i].eulerx, 
                                                               cursor.value.locations[i].eulery, 
                                                               cursor.value.locations[i].eulerz, 
                                                               cursor.value.locations[i].xscale,
                                                               cursor.value.locations[i].yscale,
                                                               cursor.value.locations[i].zscale,
                                                               cursor.value.locations[i].modelID,
                                                               cursor.value.locations[i].objectID,
                                                               cursor.value.locations[i].mediaID,
                                                               cursor.value.locations[i].targetElements );   

                           } else {
                              let modModelComponent = cloudEl.components.mod_model;
                              if (modModelComponent) {
                                 if (
                                    cursor.value.locations[i].modelID.includes("local_")) {
                                    cloudEl.classList.add("hasLocalFile");
                                 }
                                 modModelComponent.updateAndLoad(cursor.value.locations[i].name, //passing in params to function, order matters!
                                                               cursor.value.locations[i].description, 
                                                               cursor.value.locations[i].locationTags, 
                                                               cursor.value.locations[i].eventData, 
                                                               cursor.value.locations[i].markerType, 
                                                               // cursor.value.locations[i].markerObjScale, 
                                                               cursor.value.locations[i].x, 
                                                               cursor.value.locations[i].y, 
                                                               cursor.value.locations[i].z, 
                                                               cursor.value.locations[i].eulerx, 
                                                               cursor.value.locations[i].eulery, 
                                                               cursor.value.locations[i].eulerz, 
                                                               cursor.value.locations[i].xscale,
                                                               cursor.value.locations[i].yscale,
                                                               cursor.value.locations[i].zscale,
                                                               cursor.value.locations[i].modelID   );
                              }
                           }
                        } else {//local-only elements, not saved to cloud yet
                           hasLocalData = true;
                           let localEl = document.createElement("a-entity");
                                                   
                           if ( (cursor.value.locations[i].mediaID && cursor.value.locations[i].mediaID.includes("local_") || 
                              (cursor.value.locations[i].modelID && cursor.value.locations[i].modelID.includes("local_")))) {
                                    localEl.classList.add("hasLocalFile");
                           }
                           if (cursor.value.locations[i].markerType == "poi") {
                              poiLocations.push(cursor.value.locations[i]);
                           }
                           if (cursor.value.locations[i].markerType == "curve point") {
                              curveLocations.push(cursor.value.locations[i]);
                           }
                           if (cursor.value.locations[i].locationTags && cursor.value.locations[i].locationTags.includes("ar_parent")) {
                              let ar_parentEl = document.getElementById("ar_parent");
                              if (ar_parentEl) {
                                 ar_parentEl.appendChild(localEl);
                              }
                           } else {
                              sceneEl.appendChild(localEl);
                           }
                           localEl.setAttribute("position", {x: cursor.value.locations[i].x, y: cursor.value.locations[i].y, z: cursor.value.locations[i].z });
                           localEl.setAttribute("rotation", {x: cursor.value.locations[i].eulerx, y: cursor.value.locations[i].eulery, z: cursor.value.locations[i].eulerz });
                           // localEl.setAttribute("scale", {x: cursor.value.locations[i].markerObjScale, y: cursor.value.locations[i].markerObjScale, z: cursor.value.locations[i].markerObjScale});
                           
                           localEl.setAttribute("local_marker", { timestamp: cursor.value.locations[i].timestamp,
                                                               name: cursor.value.locations[i].name, 
                                                               modelID: cursor.value.locations[i].modelID, 
                                                               objectID: cursor.value.locations[i].objectID, 
                                                               mediaID: cursor.value.locations[i].mediaID, 
                                                               tags: cursor.value.locations[i].locationTags, 
                                                               eventData: cursor.value.locations[i].eventData, 
                                                               markerType: cursor.value.locations[i].markerType,
                                                               description: cursor.value.locations[i].description,
                                                               // position: cursor.value.locations[i].x +","+ cursor.value.locations[i].y+","+cursor.value.locations[i].z,
                                                               xpos: cursor.value.locations[i].x,
                                                               ypos: cursor.value.locations[i].y,
                                                               zpos: cursor.value.locations[i].z,
                                                               xrot: cursor.value.locations[i].eulerx,
                                                               yrot: cursor.value.locations[i].eulery,
                                                               zrot: cursor.value.locations[i].eulerz,
                                                               xscale: cursor.value.locations[i].xscale,
                                                               yscale: cursor.value.locations[i].yscale,
                                                               zscale: cursor.value.locations[i].zscale,
                                                               // rotation: cursor.value.locations[i].eulerx+","+cursor.value.locations[i].eulery +","+ cursor.value.locations[i].eulerz,
                                                               // scale: {x: cursor.value.locations[i].markerObjScale, y: cursor.value.locations[i].markerObjScale, z: cursor.value.locations[i].markerObjScale} derp
                                                               scale: cursor.value.locations[i].markerObjScale,
                                                               targetElements: cursor.value.locations[i].targetElements
                                                            });
                           localEl.id = cursor.value.locations[i].timestamp.toString(); //for lookups

                           if (cursor.value.locations[i].locationTags.includes("curve point")) {
                              localEl.classList.add("curvepoint");
                           }
                        }
                     }
                     
                  } //end locations loop
               }
               //settings loop
               if (cursor.value.settings) {
                  for (let key in cursor.value.settings) {
                     localData.settings[key] = cursor.value.settings[key]; //TODO apply each one?
                     
                     settings[key] = cursor.value.settings[key];
                     console.log("localdata settings key " + key);
                     if (key == "sceneEnvironmentPreset") {
                        let value = cursor.value.settings[key];
                        settings.sceneEnvironmentPreset = value;
                        console.log("local enviro: " + settings.sceneEnvironmentPreset);
                     }
                     

                  }
               }
               //localfiles loop
               if (cursor.value.localFiles) {
                  for (let key in cursor.value.localFiles) {
                     localData.localFiles[key] = cursor.value.localFiles[key]; 
                     console.log("localfiles " + localData.localFiles[key].data);
                     // localData.localFiles[key].data;
                     // settings[key] = cursor.value.localFiles[key];
                  }  
               }
               if (cursor.value.timedEvents) {
                  console.log("localdata timedEvents " + JSON.stringify(cursor.value.timedEvents));
                  SetTimeKeysData(cursor.value.timedEvents);
                  
                
               }

               cursor.continue(); 
                
            } else { //end cursor loop
               console.log("cursor is done...or was empty");
            }
 
       
       };
   
       modQuery.onerror = function () {
          console.log("no localdata found in IDB, query error");
          
       }
       transaction.oncomplete = function () {
         db.close();

         for (let i = 0; i < sceneLocations.locations.length; i++) { //top off the localdata with anything missing//like what?// unmodded locations!
            // console.log("CHCECKING LOCATION TIMESTAMPS : " +sceneLocations.locations[i].timestamp.toString() + " vs " + locationTimestamps );
            if (locationTimestamps.indexOf(sceneLocations.locations[i].timestamp.toString()) == -1) {
               // console.log("DID NOT FIND TIMESTAMP, MUST BE NEW! " + sceneLocations.locations[i].timestamp.toString() );
               localData.locations.push(sceneLocations.locations[i]); //OUCH that was dooping...
            }
         }
         InitLocalColors();

         let lastLocalUpdate = localData.lastUpdate;
         // console.log("COPIED LOCALDATA locations length " + localData.locations.length + " " + JSON.stringify(localData) + " last cloud update " +  lastCloudUpdate + " vs last local update " + lastLocalUpdate);
         if (lastCloudUpdate && lastLocalUpdate) {
            if (lastCloudUpdate > lastLocalUpdate) {
               console.log("MIGHTY CLOUD MODS ABOUT TO STEP ON YOUR PUNY LOCAL MODS");
               this.dialogEl = document.getElementById('mod_dialog');
               if (this.dialogEl) {
                  this.dialogEl.components.mod_dialog.showPanel("WARNING: RECENT CLOUD MODS MUST STEP ON YOUR LOCAL MODS!", null, "recentCloudMods" ); //param 2 is objID when needed
               }
               
            } else {
               console.log("COPIED LOCALDATA locations length " + localData.locations.length + " last cloud update " +  lastCloudUpdate + " vs last local update " + lastLocalUpdate);
            }
         }
         let objexEl = document.getElementById('sceneObjects');    
         if (objexEl) {
            const modObjectComponent = objexEl.components.mod_objex;
            if (modObjectComponent) {
               modObjectComponent.updateModdedObjects();
            }
            
         }
          //eventdata should have the name of a location with spawn markertype
         if (playerPosMods.length) {
            console.log("gots PLAYERPOSITIONS " + playerPosMods);
            if (playerPosMods.length) {
               PlayerToLocation(playerPosMods[Math.floor(Math.random() * playerPosMods.length)]);
           }
         }
         if (localData.settings) {

            // settings.sceneEnvironmentPreset = localData.settings.sceneEnvironmentPreset;
            console.log("resetting the environment preset to " + settings.sceneEnvironmentPreset)
            let envEl = document.getElementById('enviroEl');
            if (envEl) {
               envEl.setAttribute('enviro_mods', 'preset', settings.sceneEnvironmentPreset);
               // envEl.components.enviro_mods.loadPreset("moon");
            }
         }
         
         let localFileEls = document.querySelectorAll(".hasLocalFile");
         if (localFileEls) {
            for (let i = 0; i < localFileEls.length; i++) {
               console.log("gots element with haslocalfile " + localFileEls[i].id  );
               let localMarkerComponent = localFileEls[i].components.local_marker;
               if (localMarkerComponent) {
                  localMarkerComponent.loadLocalFile();
               }
               let cloudMarkerComponent = localFileEls[i].components.cloud_marker;
               if (cloudMarkerComponent) {
                  console.log("tryna loadLocalFile for cloudmarker"); 
                  cloudMarkerComponent.loadLocalFile();
               }
               let modModelComponent = localFileEls[i].components.mod_model;
               if (modModelComponent) {
                  modModelComponent.loadLocalFile();
               }
            }
         }
         InitCurves();

         //// now check for / save local profile
         if (userData) { //set in connect.js after token check

            InitLocalProfile(userData);

         }

       }

       request.oncomplete = function () {
          // db.close(); 
          // UpdateLocationData();

       }
    }
 }

 function TrimString(string) {
   return string.trim();
 }


 export function InitLocalProfile(userData) {
   console.log("tryna saveLocalProfile " + JSON.stringify(userData));
   let profile = {};
    console.log("tryna connect to SMXR indexeddb");
    if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
    }
    const request = indexedDB.open("SMXR", 2);
    request.onerror = (event) => {
       console.error("could not connect to iDB " + event);
       return "error"
    };
   request.onupgradeneeded = function (event) {
      const db = request.result;
      console.log("onupgradeneeded fired, indexedDB oldversion is " + event.oldVersion);

      if (event.oldVersion < 1) {
         console.log("is there a version 0")
         const store = db.createObjectStore("scenes", { keyPath: "shortID" });
         store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
      }
      if (event.oldVersion < 2) { //version 1
         const pstore = db.createObjectStore("profiles", { keyPath: "userID" });
         pstore.createIndex("profile", ["profile"], { unique: true });
      }
   };
   request.onsuccess = function () {
       console.log("Saving local profile, IDB opened successfully");
              let profile = {};
            //   profile.userID = userData.userID; //with tilde = the local version
        profile = userData;      
      const db = request.result;
      const transaction = db.transaction("profiles", "readwrite");
      const pstore = transaction.objectStore("profiles");

         const modQuery = pstore.openCursor(userData.userID); //use cursor mode so it's iterable below
         //  const fileQuery = filestore.openCursor();
         modQuery.onsuccess = function (e) {
            var pcursor = e.target.result;
            console.log("query for localData : " + e.target.result);
         // if (e.target.result) {
         const timestamp = Date.now();
            if (pcursor) {
               // console.log("existing profile " + JSON.stringify(pcursor.value));
               const name = pcursor.value.avatarName ? pcursor.value.avatarName : pcursor.value.userName;
               if (pcursor.value.avatarName || pcursor.value.userName) {
                  
                  console.log("overwriting avatar name " + avatarName + " with " + name);
                  UpdateAvatarName(name);
                  let updoc = pcursor.value;
                  if (!updoc.events) {
                     updoc.events = [];
                  }
                  let playerstate = "\n";
                  if (pcursor.value.playerState && pcursor.value.playerState.health) {
                     playerstate = "health: " + pcursor.value.playerState.health + "% - mana: " + pcursor.value.playerState.mana + "%\n";
                  } else {
                     updoc.playerState = {"health": 100, "mana": 100, "xp": 0, "armor": 1, "hungry": 0, "thirsty": 0, "sleepy": 0};
                  }
                  const event = {"event": "init_scene", "timestamp": timestamp, "id": room}
                  updoc.events.push(event);
                  // updoc.events = events;


                  pstore.put(updoc);
                  transaction.oncomplete = function () {
                     db.close();
                     // console.log("localprofile found and updated! " + JSON.stringify(updoc));
                  }

                  UpdateUserProfile(updoc);
                  const greeting = "Welcome back " + pcursor.value.avatarName + "!\n"
 
                  if (pcursor.value.equipment && pcursor.value.equipment.main) {
                     if (pcursor.value.equipment.main.equipped) {
                        console.log("player is equipped!");
                        const modObjexEl = document.getElementById("sceneObjects");
                        if (modObjexEl) {
                           modObjexEl.components.mod_objex.equipInventoryObject(pcursor.value.equipment.main.objectID, pcursor.value.equipment.main.tags, pcursor.value.equipment.main.eventData);
                             const playerHudEl = document.getElementById("player_hud");
                              if (playerHudEl) {
                               
                                 const equipment = "You are equipped with a " + pcursor.value.equipment.main.objectName + " tagged " + pcursor.value.equipment.main.tags;
                                 
                                 playerHudEl.components.player_hud.ShowMessageAndHide(greeting + playerstate + equipment);
                                 // playerHudEl.components.player_hud.ShowMessageAndHide("Welcome back " + pcursor.value.avatarName + "!\nYou are equipped with a " +
                                 //    pcursor.value.equipment.main.objectName + " tagged " + pcursor.value.equipment.main.tags);
                              }
                        } else {
                           console.log("cain't find mod_objex");
                        }
                     } else {
                        const playerHudEl = document.getElementById("player_hud");
                        if (playerHudEl) {
                           playerHudEl.components.player_hud.ShowMessageAndHide(greeting + playerstate);
                        }
                     }
                  } else {
                     const playerHudEl = document.getElementById("player_hud");
                     if (playerHudEl) {
                        playerHudEl.components.player_hud.ShowMessageAndHide(greeting + playerstate);
                     }
                  }
                 
               }
            } else {
               const saveTimeStamp = Date.now();
               console.log("writing localprofile for user " + userData.userID);
               let events = [];
               const event = {"event": "init_localprofile", "timestamp": timestamp, "id": room};
               profile.events = events;
               const playerState = {"health": 100, "mana": 100, "xp": 0, "armor": 1, "hungry": 0, "thirsty": 0, "sleepy": 0};
               profile.events.push(event);
               profile.playerState = playerState;
               pstore.put(profile); //write the local version
               transaction.oncomplete = function () {
                  db.close();
                  console.log("new localprofile saved! " + JSON.stringify(profile));
               }
                const playerHudEl = document.getElementById("player_hud");
                  if (playerHudEl) {
                     playerHudEl.components.player_hud.ShowMessageAndHide("Welcome " + profile.avatarName + "!");
                  }
            }
       };
     };
   }


   export function ReturnLocalProfile () { //
      if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
      }
      const request = indexedDB.open("SMXR", 2);
      request.onerror = (event) => {
         console.error("could not connect to iDB " + event);
         return "error" + event;
      };
      request.onupgradeneeded = function (event) {
         const db = request.result;
         console.log("onupgradeneeded fired, indexedDB oldversion is " + event.oldVersion);

         if (event.oldVersion < 1) {
            console.log("is there a version 0")
            const store = db.createObjectStore("scenes", { keyPath: "shortID" });
            store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
         }
         if (event.oldVersion < 2) { //version 1
            const pstore = db.createObjectStore("profiles", { keyPath: "userID" });
            pstore.createIndex("profile", ["profile"], { unique: true });
         }
      };
      request.onsuccess = function () {
         console.log("Saving local profile, IDB opened successfully");
         let profile = {};
               //   profile.userID = userData.userID; //with tilde = the local version
         profile = userData;      
         const db = request.result;
         const transaction = db.transaction("profiles", "readwrite");
         const pstore = transaction.objectStore("profiles");
         const modQuery = pstore.openCursor(userData.userID); //use cursor mode so it's iterable below
            //  const fileQuery = filestore.openCursor();
            modQuery.onsuccess = function (e) {
               var pcursor = e.target.result;
               console.log("query for localData : " + e.target.result);
            // if (e.target.result) {
            const timestamp = Date.now();
            if (pcursor) {
               console.log("existing profile " + JSON.stringify(pcursor.value));
               if (pcursor.value) {
                  return pcursor.value;
               }
            } else {
               return null;
            }
         }
         transaction.oncomplete = function () {
            db.close();
            console.log("localPlayerState updated! ");
         }
      }
   }

   export function UpdateLocalPlayerState (playerState) { 
      if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
      }
      const request = indexedDB.open("SMXR", 2);
      request.onerror = (event) => {
         console.error("could not connect to iDB " + event);
         return "error"
      };
      request.onupgradeneeded = function (event) {
         const db = request.result;
         console.log("onupgradeneeded fired, indexedDB oldversion is " + event.oldVersion);

         if (event.oldVersion < 1) {
            console.log("is there a version 0")
            const store = db.createObjectStore("scenes", { keyPath: "shortID" });
            store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
         }
         if (event.oldVersion < 2) { //version 1
            const pstore = db.createObjectStore("profiles", { keyPath: "userID" });
            pstore.createIndex("profile", ["profile"], { unique: true });
         }
      };
      request.onsuccess = function () {
         console.log("updating localPlayerState " + JSON.stringify(playerState));
         let profile = {};
               //   profile.userID = userData.userID; //with tilde = the local version
         // profile = userData;      
         const db = request.result;
         const transaction = db.transaction("profiles", "readwrite");
         const pstore = transaction.objectStore("profiles");
         const modQuery = pstore.openCursor(userData.userID); //use cursor mode so it's iterable below
         //  const fileQuery = filestore.openCursor();
         modQuery.onsuccess = function (e) {
            var pcursor = e.target.result;
            console.log("query for localData : " + e.target.result);
         // if (e.target.result) {
         const timestamp = Date.now();
            if (pcursor) {
               
               if (pcursor.value) {
                  profile = pcursor.value;
                  if (playerState) {
                     profile.playerState = playerState;
                     console.log("updating profile " + JSON.stringify(profile));
                     pstore.put(profile);
                     
                  }
               }
            }
         }
         transaction.oncomplete = function () {
            db.close();
            console.log("localPlayerState updated! ");
         }
      }
   }

   export function UpdateLocalEquipment (equipment) { 
      if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
      }
      const request = indexedDB.open("SMXR", 2);
      request.onerror = (event) => {
         console.error("could not connect to iDB " + event);
         return "error"
      };
      request.onupgradeneeded = function (event) {
         const db = request.result;
         console.log("onupgradeneeded fired, indexedDB oldversion is " + event.oldVersion);

         if (event.oldVersion < 1) {
            console.log("is there a version 0")
            const store = db.createObjectStore("scenes", { keyPath: "shortID" });
            store.createIndex("scene", ["scene"], { unique: true }); //multientry true?
         }
         if (event.oldVersion < 2) { //version 1
            const pstore = db.createObjectStore("profiles", { keyPath: "userID" });
            pstore.createIndex("profile", ["profile"], { unique: true });
         }
      };
      request.onsuccess = function () {
         console.log("updating local player equipment " + JSON.stringify(equipment));
         let profile = {};
               //   profile.userID = userData.userID; //with tilde = the local version
         // profile = userData;      
         const db = request.result;
         const transaction = db.transaction("profiles", "readwrite");
         const pstore = transaction.objectStore("profiles");
         const modQuery = pstore.openCursor(userData.userID); //use cursor mode so it's iterable below
         //  const fileQuery = filestore.openCursor();
         modQuery.onsuccess = function (e) {
            var pcursor = e.target.result;
            console.log("query for localData : " + e.target.result);
         // if (e.target.result) {
         const timestamp = Date.now();
            if (pcursor) {
               
               if (pcursor.value) {
                  profile = pcursor.value;
                  if (equipment) {
                     if (!profile.equipment) {
                        profile.equipment = {};
                     }
                     profile.equipment.main = equipment; //so can support multiple equip points later...
                     console.log("updating profile " + JSON.stringify(profile));
                     pstore.put(profile);
                     
                  }
               }
            }
         }
         transaction.oncomplete = function () {
            db.close();
            console.log("localPlayerState updated! ");
         }
      }
   }

 export function SaveLocalData() {  //local mods to iDB
    console.log("tryna connect to SMXR indexeddb");
    if (!('indexedDB' in window)) {
       console.log("This browser doesn't support IndexedDB");
       return;
    }
    const request = indexedDB.open("SMXR", 2);
    request.onerror = (event) => {
       console.error("could not connect to iDB " + event);
       return "error"
    };
   //  request.onupgradeneeded = function () {
   //     const db = request.result;
   //     const store = db.createObjectStore("scenes", { keyPath: "shortID" });
   //     store.createIndex("scene", ["scene"], { unique: true });
   //   };
     request.onsuccess = function () {
       console.log("Saving local data, IDB opened successfully");
       const db = request.result;
       const transaction = db.transaction("scenes", "readwrite");
       const store = transaction.objectStore("scenes");
       const saveTimeStamp = Date.now();
       // const lastSceneUpdate = null;
       let scene = {};
       scene.shortID = room + "~"; //with tilde = the local version
      if (localData.settings && localData.settings.sceneTags) {
         for (let i = 0; i < localData.settings.sceneTags.length; i++) {
            localData.settings.sceneTags[i] = localData.settings.sceneTags[i].trim();
            console.log("localData.settings.sceneTag + " +localData.settings.sceneTags[i]);
         }
         document.getElementById("sceneTagsField").value = localData.settings.sceneTags;
      }

       scene.settings = localData.settings;
       scene.locations = localData.locations;
       
       scene.localFiles = localData.localFiles;
       
       scene.timedEvents = localData.timedEvents;
      //  scene.localFiles = localData.localfiles;
       // scene.locations = JSON.parse(JSON.stringify(sceneLocations.locations));
       scene.lastUpdate = saveTimeStamp;
       console.log("writing localdata for scene id " + scene.shortID);
       store.put(scene); //write the local version
       transaction.oncomplete = function () {
         db.close();
         console.log("localdata saved!");
         hasLocalData = true;
       //   ShowHideDialogPanel();
          // InitLocalData();
         let mSpan = document.getElementById("modMessage");
         if (mSpan) {
            mSpan.innerText = "Mods Saved to Local Database!";
         }
         let dSpan = document.getElementById("detailModMessage");
         if (dSpan) {
            dSpan.innerText = "Mods Saved to Local Database!";
         }
         return "mods saved to local";
       };
    };
    
    }

   function SaveLocalFile(file) {  //save files to local db
      console.log("tryna save local file to SMXR indexeddb");
      if (!('indexedDB' in window)) {
         console.log("This browser doesn't support IndexedDB");
         return;
      }
      const request = indexedDB.open("SMXR", 2);
      request.onerror = (event) => {
         console.error("could not connect to iDB " + event);
         return "error"
      };
      // request.onupgradeneeded = function () {
      //    const db = request.result;
      //    const store = db.createObjectStore("scenes", { keyPath: "shortID" });
      //    store.createIndex("scene", ["scene"], { unique: true });
      //  };
      request.onsuccess = function () {
         console.log("Saving local data, IDB opened successfully");
         const db = request.result;
         const transaction = db.transaction("scenes", "readwrite");
         const store = transaction.objectStore("scenes");
         const saveTimeStamp = Date.now();
         // const lastSceneUpdate = null;
         let scene = {};
         scene.shortID = room + "~"; //with tilde = the local version
         
         // scene.settings = localData.settings;
         // scene.locations = localData.locations;
         // const file = await getFileFromInput();
         // const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
         // store.add(file);
         scene.settings = localData.settings; //these are superfluous, need to use a cursor.update version
         scene.locations = localData.locations; 
         scene.localFiles = localData.localFiles;
         let filename = file.name;
         localData.localFiles[filename] = file;
         scene.localFiles[filename] = file;
         // scene.locations = JSON.parse(JSON.stringify(sceneLocations.locations));
         scene.lastUpdate = saveTimeStamp;
         console.log("writing localfile data " + JSON.stringify(scene));
         store.put(scene); //write the local version
         transaction.oncomplete = function () {
           db.close();
           console.log("localdata saved!");
           hasLocalData = true;
            //   ShowHideDialogPanel();
               // InitLocalData();
            DisplayLocalFiles(); //in dialogs.js
         };
      };
   }

   export function SetHasLocalData (has) {
      hasLocalData = has;
   }
   export function DeleteLocalSceneData() {  //kill everything for this scene

        console.log("tryna connect to SMXR indexeddb");
        if (!('indexedDB' in window)) {
           console.log("This browser doesn't support IndexedDB");
           return;
        }
        const request = indexedDB.open("SMXR", 2);
        request.onerror = (event) => {
           console.error("could not connect to iDB " + event);
           return "error"
        };
        request.onupgradeneeded = function () {
           const db = request.result;
           const store = db.createObjectStore("scenes", { keyPath: "shortID" });
           store.createIndex("scene", ["scene"], { unique: true });
        };
        request.onsuccess = function () {
           console.log("tryna delete indexedDB localdata for this scene!");
           const db = request.result;
           const transaction = db.transaction("scenes", "readwrite");
  
           let deleterequest = transaction.objectStore("scenes").delete(room + "~");
           deleterequest.onerror = function () {
              console.log("cain't delete localdatas!?!?");
           }
        
           // report that the data item has been deleted
           transaction.oncomplete = () => {
           console.log("sceneData deleted - reload to confirm!");
           setTimeout(function () {
              window.location.reload();
           }, 2000);
  
           };
        };
     }

     export function DeleteFile(filename) {  //delete single file from db

      console.log("tryna connect to SMXR indexeddb");
      if (!('indexedDB' in window)) {
         console.log("This browser doesn't support IndexedDB");
         return;
      }
      const request = indexedDB.open("SMXR", 2);
      request.onerror = (event) => {
         console.error("could not connect to iDB " + event);
         return "error"
      };
      request.onupgradeneeded = function () {
         const db = request.result;
         const store = db.createObjectStore("scenes", { keyPath: "shortID" });
         store.createIndex("scene", ["scene"], { unique: true });
      };
      request.onsuccess = function () {
         console.log("tryna delete filename " + filename);
         const db = request.result;
         const transaction = db.transaction("scenes", "readwrite");
         const store = transaction.objectStore("scenes");
         const modQuery = store.openCursor(room + "~"); //use cursor mode so it's iterable below
         //  const fileQuery = filestore.openCursor();
         modQuery.onsuccess = function (e) {
            var cursor = e.target.result;
            if(cursor){
            // console.log(cursor.value);
               let updateData = cursor.value;
               console.log("tryna delete " + JSON.stringify(updateData.localFiles[filename]));
               delete updateData.localFiles[filename];
               const request = cursor.update(updateData);
               request.onsuccess = () => {
                  console.log("she's gone! woot!");
                  localData.localFiles = updateData.localFiles;
               };

               cursor.continue();
               // }
            } else { 
               console.log("fin mise a jour");
            }
         };
         modQuery.onerror = function () {
            console.log("no localdata found in IDB, query error");
            
         }
         transaction.oncomplete = function () {
            db.close();
            console.log("file hopefully deleted, db closed!");
            DisplayLocalFiles();
         }
      }
   }


const getFileFromInput = () => {
	return new Promise((resolve, reject) => {
		const file = document.getElementById('importFile').files[0];
		const reader = new FileReader();
		reader.onload = (event) => {
			document.getElementById('importFile').value = '';
			resolve({
				name: file.name,
				type: file.type,
				size: file.size,
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file); //this actually converts blob to arraybuffer
	});
};

export const ConvertAndSaveLocalFile = async () => {
   let file = await getFileFromInput();
   if (getExtension(file.name) == ".glb" || getExtension(file.name) == ".jpg") {
      console.log("tryna save a local file " + file.name);
      SaveLocalFile(file);
      // filedb = await initIndexedDb('SMXR', [{ name: storeName, keyPath: storeKey }]);
      // renderAvailableImagesFromDb();

      await renderStorageQuotaInfo();
   } else {
      console.log("only .glb or .jpg files currently supported");
   }

}
export const InitLocalFiles = async () => {
	// filedb = await initIndexedDb('SMXR', [{ name: storeName, keyPath: storeKey }]);
	// renderAvailableImagesFromDb();


   await renderStorageQuotaInfo();

}

const getStorageQuotaText = async () => {
	const estimate = await navigator.storage.estimate();
	const totalQuota = +(estimate.quota || 0);
	const usedQuota = +(estimate.usage || 0);
	const freeQuota = totalQuota - usedQuota;
// 
	return {
		totalQuota: formatAsByteString(totalQuota),
		usedQuota: formatAsByteString(usedQuota),
		freeQuota: formatAsByteString(freeQuota)
	};
};

/**
 * @desc Renders the storage quota info in the DOM
 * @returns {Promise<void>}
 */
const renderStorageQuotaInfo = async () => {
	const { totalQuota, usedQuota, freeQuota } = await getStorageQuotaText();
   if (document.getElementById('storage-total')) {
      document.getElementById('storage-total').textContent = totalQuota;
      document.getElementById('storage-used').textContent = usedQuota;
      document.getElementById('storage-free').textContent = freeQuota;
   }
}

// Util functions
export const formatAsByteString = (bytes) => {
   // console.log("tryna format " + bytes);
	const oneGigabyte = 1024 * 1024 * 1024;
	const oneMegabyte = 1024 * 1024;
	const oneKilobyte = 1024;

	return bytes > oneGigabyte ? `${(bytes / oneGigabyte).toFixed(2)} GB` : bytes > oneMegabyte ? `${(bytes / oneMegabyte).toFixed(2)} MB` : `${(bytes / oneKilobyte).toFixed(2)}KB`;
}

// const deleteImageFromIndexedDb = (storeKey) => {
// 	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
// 	store.delete(storeKey);
// 	store.transaction.oncomplete = async () => {
// 		clearGalleryImages();
// 		renderAvailableImagesFromDb();
// 		await renderStorageQuotaInfo();
// 	};
// };