//loaded with landing pages, instead of connect.js, or landing.js (w/out aframe/three, with pixi refs)

import { GoWithIt } from "../vtt/vtt_main.mjs"; //pixi fu here!@

import {settings} from "../../connect/settings.js"

import {userProfile} from "../../connect/connect.js"

// import { Howl, Howler } from "howler";

// import { Howl } from 'howler'

// var sound = new Howl({
// //   src: ['/static/sounds/clock.ogg']
// });

/////////////////// main onload function, populate settings, etc. and some client-side utils & modding functions
export let room = window.location.pathname.split("/").pop(); //just the string after last slash (short code)
// var player = document.getElementById("player");
// export let posRotReader = document.getElementById("player").components.get_pos_rot; 
var player = null;
export let posRotReader;
export let lastLocalUpdate = "";
export let lastCloudUpdate = "";
export let localData = {locations:[], settings:{}, localFiles: {}}; //all the things
export let locationTimestamps = [];
export let sceneLocations = {locations: [], locationMods: []};
// export let settings; //push this to an aframe component for fetching...
export let attributions = [];
export var videoEl = null;
let sprites;
// export const mouse = new THREE.Vector2();
export const sceneEl = document.querySelector('a-scene');
// export let hasLocalData = false;
export const lerp = (x, y, a) => x * (1 - a) + y * a;

var dateString = Date.now().toString();
export let roomUsers = {};
export let stringRoomUsers = "";
var trimmedString = dateString.substring(dateString.length - 4, 4);
var username;
var pics = [];
var picsBuffer = [];
var picArrayIndex = 0;
var currentIndex = 0;
let avatarNameEl = document.querySelector(".avatarName"); //make this actual uid?  
// let avatarName = "";
let playFrames = false;
let isConnected = false;
export let userData = {};
let mySocketID = "";
let emitInterval = null;
let lastPosition = "";
let lastRotation = "";
let cameraPosition = {"x" : 0, "y": 0, "z": 0};
let cameraRotation = {"x" : 0, "y": 0, "z": 0};

let skyboxEl = document.getElementById('a_sky');
let posRotRunning = false;
export let timeKeysData = {};
export let tkStarttimes = [];

export let poiLocations = [];
export let curveLocations = [];
export let cloudMarkers = []; //???? unused>?//nope
export let sceneModels = [];

export let mappicURL;
export let backgroundURL;

let localKeys = [];

let volumePrimary = 0;
let volumeAmbient = 0;
let volumeTrigger = 0;

let currentLocationIndex = -1;
let currentTime = 0;  //depends on listenerMode

let modalTimeStatsEl = null; //stats for timekeys modal
let transportTimeStatsEl = null;
// let sceneType = null;

let uiVisible = true;
let pauseLoops = false;
let matrixClient = null;
let matrixRoomsData = null;
// let vidz = null;
// let videoEl = null;

export let timedEventsListenerMode = ""

let mouseDownStarttime = 0;
export let mouseDowntime = 0;
let isFiring = false;
let busy = false;  //prevent double on savetocloud..
var token = document.getElementById("token").getAttribute("data-token"); 
// var localtoken = localStorage.getItem("smToken"); //rem all localstorage!
let socketHost = "http://localhost:3000";
let liveKitHost = "http://localhost:8000";
// let socketHost = null;
var socket = null; //the socket.io instance below

let transformAll = false;

let currentLocalStorageUsed = null;
let currentAvailableLocalStorageEstimage = null;


export let allowCameraLock = true;
const camLockButton = document.getElementById("camLockToggleButton");
let intersections = [];
export let avatarName = "";
let primaryAudioEl = document.querySelector('#primaryAudio');

export let audioGroupsData = {};

// window.LocationRowClick = LocationRowClick;

$(function() { 

   if (avatarNameEl) {
      avatarName = avatarNameEl.id;
   }

   player = document.getElementById("player");
   // player = document.getElementById("cameraRig");
   // let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
   // let theSettingsData = settingsEl.getAttribute('data-settings');
   // settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed

    let spritesEl = document.getElementById('spritesDataElement'); //volume, color, etc...
   let theSpritesData = spritesEl.getAttribute('data-sprites');
   sprites = JSON.parse(atob(theSpritesData)); //gets copied to localdata ifn mods are 'llowed

   // console.log("Settings : " + JSON.stringify(settings));
   let timedEventsEl = document.getElementById('timedEventsDataElement'); //volume, color, etc...
   if (timedEventsEl) {
      let theTimedEventsData = timedEventsEl.getAttribute('data-timedevents');
      timeKeysData =  JSON.parse(atob(theTimedEventsData));
      SetTimedEventsListenerMode(timeKeysData.listenTo);
      // timedEventsListenerMode = ;
      // window.timedEventsListenerMode = timedEventsListenerMode;
      console.log("timekeys Data1: " + JSON.stringify(timeKeysData));
   }
   lastCloudUpdate = settings.sceneLastUpdate;

   if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
      ShowEnableEthereumButton();  //bullshit enabled!
   } else {

   }

   let vidz = document.getElementsByTagName("video");
   if (vidz != null && vidz.length > 0) { //either video or audio, not both...?
      videoEl = vidz[0];
      console.log("videoEl " + videoEl.id);
   }
   // this.statsDiv = document.getElementById("transportStats");
   // document.getElementsByTagName('a-sky')[0].setAttribute('radius', 400); //nope!?!   

   console.log("room: " +room + " vid " + settings.sceneVideoStreams + " type " + settings.sceneType);

   $('#room_id').append($('<button><h4><strong>').text("Welcome to scene " + room).append("</strong></h4></button>"));



//    if (settings && settings.mappicURL) {
    

//    }
//    if (settings.sceneType == "Default" || settings.sceneType == "AFrame" || settings.sceneType == "default" || settings.sceneType == "aframe") {
//       // window.sceneType == "aframe";
//       if (settings.hideAvatars) {
//          player.setAttribute("player_mover", "init", true);
//          EmitSelfPosition();
//       }
//       posRotReader = document.getElementById("player").components.get_pos_rot; 
//       if (player != null) {
//          player.setAttribute("player_mover", "init", true);
//       }
//       let modelDataEl = document.getElementById('sceneModels');
//       if (modelDataEl) {
//          let modelData = modelDataEl.getAttribute('data-models');
//          sceneModels = JSON.parse(atob(modelData)); //convert from base64
//          // console.log("sceneModels " + JSON.stringify(sceneModels));
//          for (let i = 0; i < sceneModels.length; i++) {
//             if (sceneModels[i].sourceText != undefined && sceneModels[i].sourceText != 'undefined' && sceneModels[i].sourceText != null && sceneModels[i].sourceText.length > 0) {
//                attributions.push("Name: " + sceneModels[i].name + " - Type: " + sceneModels[i].item_type + " - Source: " + sceneModels[i].sourceText);
//             }
//          }
//       }
//       // console.log("settings: " + JSON.stringify(settings));
//       if (settings.skyboxIDs != null && settings.skyboxIDs.length > 0) {
         
//          // skyboxEl = document.createElement('a-entity');
//          // sceneEl = document.querySelector('a-scene');
//          // skyboxEl.setAttribute('skybox_dynamic', {enabled: true, id: settings.skyboxIDs[0]});
//          // skyboxEl.id = 'skybox_dynamic';
//          // sceneEl.appendChild(skyboxEl);
         
//       }
   
//       if (settings.skyboxID == "") {
//          // skyboxEl.components.skybox_dynamic.nextSkybox();
//       }
//     //   if (settings.audioGroups && settings.audioGroups.objectGroups && settings.audioGroups.objectGroups.length > 0 || 
//     //      settings.audioGroups && settings.audioGroups.triggerGroups && settings.audioGroups.triggerGroups.length > 0 || 
//     //      settings.audioGroups && settings.audioGroups.ambientGroups && settings.audioGroups.ambientGroups.length > 0 ||
//     //      settings.audioGroups && settings.audioGroups.primaryGroups &&  settings.audioGroups.primaryGroups.length > 0) {
//     //      // audioGroupsEl = document.getElementById('audioGroupsEl');
//     //      // if (audioGroupsEl != null) {
//     //      //    let audioGroupsController = audioGroupsEl.components.audio_groups_control;
//     //      //    if (audioGroupsController != null) {
//     //      //       audioGroupsController.LoadAudioGroups(settings.audioGroups);
//     //      //    }
//     //      // }
//     //      // audioGroupsEl.components.audio_groups_control.LoadAudioGroups(settings.audioGroups);
//     //      let audioGroupsEl = document.createElement('a-entity');
//     //      audioGroupsEl.setAttribute("id","audioGroupsEl");
//     //      audioGroupsEl.setAttribute("audio_groups_control", {init: ''});
//     //      sceneEl.appendChild(audioGroupsEl);
//     //   }
//    } else {
    //   console.log("not aframe or default scenetype!");
      // GetTextItems(); //only for plain pages or text adventure, scene_text_control fetches for aframe
      if (settings.sceneType == "landing") {
         if (settings.sceneTags && settings.sceneTags.includes("landing pics")) {
            let picGroupMgr = document.getElementById("pictureGroupsData");
            if (picGroupMgr) {
               let theData = picGroupMgr.getAttribute('data-picture-groups');
               let theJSONData = JSON.parse(atob(theData)); //convert from base64
               console.log(JSON.stringify(theJSONData));
               let picResp = "";
               for (let i = 0; i < theJSONData[0].images.length; i++) { //todo ++ groups
                  picResp = picResp + "<a href=\x22"+theJSONData[0].images[i].url+"\x22 target=\x22_blank\x22><img src=\x22"+theJSONData[0].images[i].url+"\x22 class=\x22cropped1 image-fluid\x22 style=\x22object-fit: cover;\x22 width=\x22512\x22 height=\x22256\x22></a>";
                }

               let picGroupsContainer = document.getElementById("picGroupsContainer");
               if (picGroupsContainer) {
                  picGroupsContainer.innerHTML = picResp;
               }
            }
         }
      }
   
    console.log("settings " + JSON.stringify(settings));
    console.log("sprites " + JSON.stringify(sprites));

    mappicURL = settings.mappicURL;
    backgroundURL = settings.backgroundURL;
    if (mappicURL || backgroundURL) {
        GoWithIt();
    }
   if (settings.useMatrix) {
      console.log("Loading browser MATRIX sdk!!!");
      GetMatrixData();
   }
   // if (settings.audioGroups) {
   //    ReturnAudioGroupsData(settings.audioGroups);
   //    // console.log("audioGroupsData  " + JSON.stringify(audioGroupsData));
   // }
   // if (settings.clearLocalMods) { //??????
   //    for (var i=0; i < localStorage.length; i++)  {
      
   //       let theKey = localStorage.key(i);
   //       if (theKey.includes(room) && theKey.includes("localmarker")) {
   //          localStorage.removeItem(theKey);
   //          console.log("removed " + theKey);
   //       }
   //    }
   // }

   if (settings.networking == 'SocketIO' && settings.socketHost) {
      if (settings.socketHost.length > 6) { //i.e. not "none" or empty
         socketHost = settings.socketHost;
         InitSocket();
      }
   } else if (settings.networking == 'WebRTC') {
      console.log("TRYNA INIT LIVEKIT");
      // InitLiveKit();
   }



   if (settings.sceneType == "Video Landing" && settings.sceneVideoStreams && settings.sceneVideoStreams.length) {
      SetVideoEventsData();
      var video = document.getElementById('video');
      if (Hls.isSupported()) {
        var hls = new Hls();
      //   hls.loadSource('/hls/' + vid);
        hls.loadSource(settings.sceneVideoStreams[0]);
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            // video.muted = true;
            video.play();
        });
      }
      // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
      // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
      // This is using the built-in support of the plain video element, without using hls.js.
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = '/hls/'+ vid;
      //   video.addEventListener('canplay', function () {
      //     video.play();
      //   });
      }
   }



   // if (settings.sceneTags && settings.sceneTags.includes("keys")) {

   // }


   if (settings.sceneTags && settings.sceneTags.includes("webcam")) {
      navigator.mediaDevices.getUserMedia({audio: false, video: true})
      .then(stream => {
        let $video = document.querySelector('video');
        $video.srcObject = stream
        $video.onloadedmetadata = () => {
          $video.play()
        }
      })
   }


  
   if (settings.allowMods) {
      //do this in dialog.js if not mobile
      // if ('storage' in navigator && 'estimate' in navigator.storage) {
      //       navigator.storage.estimate().then(({usage, quota}) => {
      //       currentLocalStorageUsed = usage;
      //       currentAvailableLocalStorageEstimage = quota;
      //       console.log(`Using ${usage} out of ${quota} bytes.`);
      //    });
      // }

   }
   if (settings.sceneScatterObjectLayers) {
      // console.log("objectScatterLayers: " + JSON.stringify(settings.sceneScatterObjectLayers));
   }

   if (settings.sceneEnvironmentPreset) {
      let envEl = document.getElementById('enviroEl');
      if (envEl) {
         // envEl.setAttribute('enviro_mods', 'preset', settings.sceneEnvironmentPreset);
         // envEl.components.enviro_mods.loadPreset("moon");
      }
   }


   let picGroupIconEl = document.getElementById('picGroupParent');
   if (picGroupIconEl) {
      if (settings.showCameraIcon) {
         
      } else {
         picGroupIconEl.setAttribute("visible", false);
      }
   }

}); //end onload

export async function ReturnMap () {
    await settings;
    console.log("tryna return mappicURL " + settings.mappicURL);
    return settings.mappicURL;
}

export async function ReturnBackground () {
    await settings;
    console.log("tryna return backgroundURL " + settings.backgroundURL);
    return settings.backgroundURL;
}

export async function ReturnText () {
    await settings;
    console.log("tryna return scenetext " + settings.sceneGreeting);
    return settings.sceneGreeting + "~" + settings.sceneQuest;
}

// export async function ReturnAudioGroups () {
//     await settings;
//     console.log("tryna return audioData " + settings.audioGroups);
//     let audioGroupDataResponse = await ReturnAudioGroupsData();
//     return audioGroupDataResponse;
// }
export async function ReturnUserProfile () {
   
   await userProfile; 
   console.log("tryna return userProfile " + userProfile.avatarName);
   return userProfile;
}

export async function ReturnSprites () {
    await sprites;
    // console.log("tryna return sprites " + sprites);
    return sprites;
}


export function UpdateAvatarName(name) {
   avatarName = name;
   const usernameEl = document.getElementById("userName");
   usernameEl.innerText = avatarName;
}

export function SetTimedEventsListenerMode(mode) {
   timedEventsListenerMode = mode;
}

$('#nextButton').on('click', function(e) {
   GoToNext();
});
$('#previousButton').on('click', function(e) {
   GoToPrevious();
});

$('a-entity').each(function() {  //external way of getting click duration for physics

   $(this).bind('mousedown', function() {
     mouseDownStarttime = Date.now() / 1000;
   });
   $(this).bind('mouseup', function() {
     mouseDowntime = (Date.now() / 1000) - mouseDownStarttime; 

   });
   // $(this).bind('touchstart', function() {
   //    mouseDownStarttime = Date.now() / 1000;
   //  });
   //  $(this).bind('touchend', function() {
   //    mouseDowntime = (Date.now() / 1000) - mouseDownStarttime;

   //  });
    $(this).bind('beforexrselect', e => {
      e.preventDefault();
    });
 
 });

function UpdateSceneLocations () { //unused?
   console.log("tryna UpdateSceneLocations : " + JSON.stringify(localData));
   for (let i = 0; i < sceneLocations.locations.length; i++) {
      let ts = locationTimestamps.indexOf(sceneLocations.locations[i].timestamp); //avoid having to doubleloop
      console.log("checking locIDs " + sceneLocations.locations[i].timestamp + " index " + ts);
      if (ts != -1) {
         console.log("updating sceneLocation : " + JSON.stringify(sceneLocations.locations[i]) + " to " + JSON.stringify(localData.locations[ts]));
         sceneLocations.locations.splice(i, 1, localData.locations[ts]);

         console.log(JSON.stringify(sceneLocations.locations));
      }
   }
}

export function getExtension(filename) {
   // console.log("tryna get extension of " + filename);
   var i = filename.lastIndexOf('.');
   return (i < 0) ? '' : filename.substr(i);
}

export async function GetMatrixData() { //use matrix.org for... something
   if (!matrixClient) {
      let opts = {}; //um no
      matrixClient = matrixcs.createClient("https://matrix.org");
   }
   await matrixClient.startClient({ initialSyncLimit: 10 });
      if (!matrixRoomsData) {
         matrixClient.publicRooms(function (err, data) { //pulls 100 random rooms
            if (err) {
               console.error("err %s", JSON.stringify(err));
               return;
            }
            // matrixRoomsData = data;
            console.log("Congratulations! The matrix client got " + data.chunk.length + " rooms.");
      
            // const matrixMeshEl = document.getElementById("matrix_meshes");
            // if (matrixMeshEl != null) {
            //    const matrixMeshComponent = matrixMeshEl.components.matrix_meshes;
            //    if (matrixMeshComponent != null) {  
                  let length = data.chunk.length;
                  console.log("matrix length " + length);
                  let trimToLength = length < 100 ? length : 75;
                  let trimmedLength = length;
                  let trimmedIndexes = [];
                  let randomIndex = 0;
                  for (let i = 0; i < length; i++) {
                     randomIndex = Math.floor(Math.random()*data.chunk.length);
                     // console.log("pushing randomIndex " + randomIndex);
                     // trimmedIndexes.push(randomIndex);
                     data.chunk.splice(randomIndex, 1)
                     if (i === length - 1) {
                        //sweeeet...
                        // matrixMeshComponent.loadRoomData(data.chunk.splice(trimmedIndexes, 1)); 
                        console.log("returning data " + JSON.stringify(data));
                        return data;
                     }
                  } 
            //    } else {
            //       console.log("matrix component not found!");
            //    }
            // } else {
            //    console.log("matrixEl not found!");
            // }
         });
      } else {
         const matrixMeshEl = document.getElementById("matrix_meshes");
         if (matrixMeshEl != null) {
            const matrixMeshComponent = matrixMeshEl.components.matrix_meshes;
            if (matrixMeshComponent != null) {  
               let length = matrixRoomsData.chunk.length;
               let trimToLength = 99;
               let trimmedLength = length - trimToLength;
               let trimmedIndexes = [];
               let randomIndex = 0;
               for (let i = 0; i < trimmedLength; i++) {
                  randomIndex = Math.floor(Math.random()*matrixRoomsData.chunk.length);
                  // console.log("pushing randomIndex " + randomIndex);
                  // trimmedIndexes.push(randomIndex);
                  matrixRoomsData.chunk.splice(randomIndex, 1)
                  if (i === trimmedLength - 1) {
                     //sweeeet...
                     // matrixMeshComponent.loadRoomData(data.chunk.splice(trimmedIndexes, 1)); 
                     matrixMeshComponent.loadRoomData(matrixRoomsData);   
                  }
               } 
            }
         }

      }   
   }
// }

export function SetTimeKeysData (tkData) {
   timeKeysData = tkData;
}
export function MediaTimeUpdate (timeString) {
   // console.log("MediaTimeUpdate " + fancyTimeString);
   // transportTimeStatsEl = document.getElementById("transportStats");
   if (transportTimeStatsEl == null) {
      transportTimeStatsEl = document.getElementById("transportStats");
   } else {
      transportTimeStatsEl.innerHTML = timeString;
   }
   modalTimeStatsEl = document.getElementById('modalTimeStats');
   if (modalTimeStatsEl == null) {
      } else {
         modalTimeStatsEl.innerHTML = timeString;
      }
      
   }
   
function ReturnModelName (_id) {
   if (_id.toString().includes("primitive_")) {
      console.log("tryna return primitive name " + _id);
      return _id.replace("primitive_", "");
   } else if (_id.toString().includes("local_")) {
      return _id.replace("local_", "");
   } else {
      for (let i = 0; i < sceneModels.length; i++) {
         if (sceneModels[i]._id == _id) {
            return sceneModels[i].name;
            break;
         }
      }
   }
}
function ReturnObjectName (_id) {
   for (let i = 0; i < sceneObjects.length; i++) {
      if (sceneObjects[i]._id == _id) {
         return sceneObjects[i].name;
      }
   }
}

export function ReturnAttributions () {
   let attribString = "";
   if (attributions.length > 0) {
      for (let i = 0; i < attributions.length; i++) {
         let thestring = attributions[i];

         attribString = attribString + "<p>"+attributions[i]+"</p>";
      }
   }
   return attribString;
}

export function SendAdminMessage() {
   let aMessage = $('#chat_input').val();
   console.log(socket + " " + userData.sceneOwner + " " + $('#chat_input').val())
   if (socket && userData.sceneOwner && aMessage.length > 0) {
      socket.emit('admin message', aMessage);
      document.getElementById("chat_input").value = "";
      if (aMessage.toString().toLowerCase() == "next") {
         GoToNext();
      }
   }
}

function download(filename, text) {
   var pom = document.createElement('a');
   pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
   pom.setAttribute('download', filename);

   if (document.createEvent) {
       var event = document.createEvent('MouseEvents');
       event.initEvent('click', true, true);
       pom.dispatchEvent(event);
   }
   else {
       pom.click();
   }
}
// from https://gist.github.com/jonleighton/958841
function arrayBufferToBase64(arrayBuffer) { //works for large files too?
   var base64    = ''
   var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
 
   var bytes         = new Uint8Array(arrayBuffer)
   var byteLength    = bytes.byteLength
   var byteRemainder = byteLength % 3
   var mainLength    = byteLength - byteRemainder
 
   var a, b, c, d
   var chunk
 
   // Main loop deals with bytes in chunks of 3
   for (var i = 0; i < mainLength; i = i + 3) {
     // Combine the three bytes into a single integer
     chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
 
     // Use bitmasks to extract 6-bit segments from the triplet
     a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
     b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
     c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
     d = chunk & 63               // 63       = 2^6 - 1
 
     // Convert the raw binary segments to the appropriate ASCII encoding
     base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
   }
 
   // Deal with the remaining bytes and padding
   if (byteRemainder == 1) {
     chunk = bytes[mainLength]
 
     a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
 
     // Set the 4 least significant bits to zero
     b = (chunk & 3)   << 4 // 3   = 2^2 - 1
 
     base64 += encodings[a] + encodings[b] + '=='
   } else if (byteRemainder == 2) {
     chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
 
     a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
     b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
 
     // Set the 2 least significant bits to zero
     c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
 
     base64 += encodings[a] + encodings[b] + encodings[c] + '='
   }
   
   return base64
 }

 function base64ToArrayBuffer(base64) {
   var binaryString = atob(base64);
   var bytes = new Uint8Array(binaryString.length);
   for (var i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
   }
   return bytes.buffer;
}
export function ExportMods () {
   let currentTimestamp = Math.round(Date.now() / 1000).toString();
   let mods = {};
   // mods.localFiles = localData.localFiles;
   // mods.locationMods = sceneLocations.locationMods;

   // if (sceneColor1 != "" || sceneColor2 != "" || sceneColor3 != "" || sceneColor4 != "") { //defined globally above
      
   //    mods.colorMods = {sceneColor1: sceneColor1, sceneColor2: sceneColor2, sceneColor3: sceneColor3, sceneColor4: sceneColor4};
   // }
   // if (volumePrimary != "" ||volumeAmbient != "" || volumeTrigger != "") {
   //    mods.volumeMods = {volumePrimary: volumePrimary, volumeAmbient: volumeAmbient, volumeTrigger: volumeTrigger};
   // }
   if (timeKeysData.timekeys != undefined) {
      mods.timedEvents = timeKeysData;
   }
   mods.locations = localData.locations;
   mods.settings = localData.settings;
   mods.localFiles = localData.localFiles;
   for (let key in mods.localFiles) {
      mods.localFiles[key].data = arrayBufferToBase64(localData.localFiles[key].data); //might need to async...
   }
   // console.log(JSON.stringify(mods.localFiles));
   var encodedString = btoa(JSON.stringify(mods));
   download(room+"_mods_"+currentTimestamp+".txt", encodedString);
}



export function PlayerToLocation(worldPos) {
   
   console.log("tryna set PlayerToLocation " + JSON.stringify(worldPos));
   if (player) {
      player.setAttribute('position', worldPos);
   }
     
}


function getParameterByName(name, url) {
   if (!url) {
     url = window.location.href;
   }
   name = name.replace(/[\[\]]/g, "\\$&");
   var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
       results = regex.exec(url);
   if (!results) return null;
   if (!results[2]) return '';
   return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function RandomHexColor() {
   return  "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
}

// async function InitLiveKit() {
//    const room = new LivekitClient.Room();
//    // let url = "wss://smxr-m9z9nvrk.livekit.cloud";
//    let url = liveKitHost;
//    let token = settings.liveKitToken;
//    // let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTEwNjI0OTIsImlzcyI6IkFQSVp6a1VvY1hMeWIyViIsIm5iZiI6MTcxMTA2MTU5Miwic3ViIjoicG9seXRyb3BvaSIsInZpZGVvIjp7ImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsInJvb20iOiJ0ZXN0cm9vbTJiIiwicm9vbUpvaW4iOnRydWV9fQ.sn9b33OYbM2TTRYNx3eznWrasgnLJCI02NeAhkr-Rc4";
//    // call this some time before actually connecting to speed up the actual connection
//    room.prepareConnection(url, token);
//    room
//    .on(LivekitClient.RoomEvent.TrackSubscribed, handleTrackSubscribed)
//    .on(LivekitClient.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
//    .on(LivekitClient.Participant.ActiveSpeakersChanged, handleActiveSpeakerChange)
//    .on(LivekitClient.RoomEvent.Disconnected, handleDisconnect)
//    .on(LivekitClient.RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
//    await room.connect(url, token);
//    console.log('connected to livekit room ' + room.name);
//    // publish local camera and mic tracks
//    await room.localParticipant.enableCameraAndMicrophone();

// }
// function handleTrackSubscribed(
//   track,
//   publication,
//   participant,
// ) {
//    console.log("gotsa livekit track subscription " + track.kind);
//   if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
//     // attach it to a new HTMLVideoElement or HTMLAudioElement

//     const element = track.attach();
//     parentElement.appendChild(element);
//   }
// }

// function handleTrackUnsubscribed(
//   track,
//   publication,
//   participant,
// ) {
//   // remove tracks from all attached elements
//   track.detach();
// }

// function handleLocalTrackUnpublished(
//   publication,
//   participant,
// ) {
//   // when local tracks are ended, update UI to remove them from rendering
//   publication.track.detach();
// }

// function handleActiveSpeakerChange(speakers) {
//   // show UI indicators when participant is speaking
// }

// function handleDisconnect() {
//   console.log('disconnected from room');
// }



