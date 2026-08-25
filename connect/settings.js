export let settings;

export let profile;

export let pixelsPerMeterActual = 10; //pull from scene.settings instead...
// export let mapWidth = 0;
// export let mapHeight = 0;
// export let selectedPosition = {};
export let mods = {locations: []};

import { InitConnect, SetPlayerToLastPosition, InitSocket, localData } from "../connect/connect.js";
import { SettingsLoaded, LocalDataLoaded } from "./events.js";

$(function() { 

    let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
    let theSettingsData = settingsEl.getAttribute('data-settings');

    settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed
    console.log("settings : " + JSON.stringify(settings));
    InitConnect();
    SettingsLoaded();

   if (settings.sceneTags.includes("allow mods")) {
         localData.settings = settings;
   }

});

export function UpdateUserProfile (userProfile) { //called from indexedDB.js
   profile = userProfile;
   console.log("userProfile is ready for " + profile.avatarName);
   SetPlayerToLastPosition();
   if (settings.networking == 'SocketIO' && settings.socketHost) {
      if (settings.socketHost.length > 6) { //i.e. not "none" or empty
         InitSocket(); //hrm
         
      }
   }
   LocalDataLoaded();
}


export function UpdateModdedLocations (location) { //called from indexeddb
   mods.locations.push(location);
   console.log("updated modded locations " + JSON.stringify(mods));
}

// export function UpdateMapDimensions(x, y) {
//    mapWidth = x;
//    mapHeight = y;
// }  
