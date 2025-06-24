//loaded with landing pages, instead of connect.js

// import { SaveLocalData, DeleteLocalSceneData, SetHasLocalData } from "../connect/indexedDb.js";
// import { matrixClient } from "../connect/matrix.js";
// import { youtubePlayer, youtubeIsPlaying, primaryAudioEl, mouse } from "../../main/src/component/content-utils.js";
// import { youtubePlayer, youtubeIsPlaying } from "content-utils";
// import { SetSelectedLocationTimestamp, ShowHideDialogPanel, sceneObjects, SceneManglerModal } from "../main/js/dialogs.js";

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
export let settings; //push this to an aframe component for fetching...
export let attributions = [];
export var videoEl = null;
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
// let cloudData = {};


let transformAll = false;

let currentLocalStorageUsed = null;
let currentAvailableLocalStorageEstimage = null;


export let allowCameraLock = true;
const camLockButton = document.getElementById("camLockToggleButton");
let intersections = [];
export let avatarName = "";
let primaryAudioEl = document.querySelector('#primaryAudio');

// window.LocationRowClick = LocationRowClick;

$(function() { 
   // InitIDB();
   if (avatarNameEl) {
      avatarName = avatarNameEl.id;
   }

   player = document.getElementById("player");
   // player = document.getElementById("cameraRig");
   let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
   let theSettingsData = settingsEl.getAttribute('data-settings');

   settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed
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
   setTimeout(function () {
      // localStorage.setItem("last_page", room);
      tcheck(); //token auth

   }, 1000);
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
   
   if (settings.useMatrix) {
      console.log("Loading browser MATRIX sdk!!!");
      GetMatrixData();
   }
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
// export function ReturnSceneColors() {
//    return scene
// }



function GrabLocation(locationKey) {
   console.log("tryna grablocation : " +locationKey);  
}


export function PlayerToLocation(worldPos) {
   
   console.log("tryna set PlayerToLocation " + JSON.stringify(worldPos));
   if (player) {
      player.setAttribute('position', worldPos);
   }
   
  
}





async function ConnectToEthereum() { //whatever..
   const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
   const account = accounts[0];
   if (account != null) {
      const ethereumButton = document.getElementById("ethereumButton");
      ethereumButton.style.color = "green";
      console.log("ethereum account : " + account);
   }
}

async function ShowEnableEthereumButton ()  {
   const ethereumButton = document.getElementById("ethereumButton");
   if (ethereumButton != null) {
   ethereumButton.style.display = "block";
   ethereumButton.addEventListener('click', () => {
      ConnectToEthereum();
      //Will Start the metamask extension
      // ethereum.request({ method: 'eth_requestAccounts' });

      });
   }
}

function tcheck () {
   let pin = getParameterByName('p');
   if (pin != null) {
      console.log("GOTSA PIN!" + pin);

   } // else {
   if (token != null) {
      $.get( "/ami-rite-token/" + token, function( data ) {
         console.log("amirite : " + JSON.stringify(data));
         
         if (data == '0' || data == '1' || data == '3' || data == '1' || data == '4' || data == '5') {//all auth fails
            // console.log("guest token");
            if (socket != null && socket != undefined) {
               if (!socket.connected) {
                  socket.connect(socketHost);
               }
            }
            userData.isGuest = true;
            userData.avatarName = avatarName;
            userData.userName = avatarName;
            userData.userID = "00000";
                              // const profile = {"userID": "00000", "userName": avatarName}
            // SaveLocalProfile(userData);
            // SaveLocalProfile(userData);
            // if (getParameterByName('p') != null) {
            //    console.log("GOTSA PIN!");
            // }
            // userData = data;
         } else {
            // let user = JSON.parse(data);
         
            // if (data.userID  > 1) {
               if (data._id != null) {
                  // console.log("gotsa user token" + JSON.stringify(data));
                  // userid = data._id;
                  avatarName = data.userName;
                  userData.userName = data.userName;
                  // userData = data;
                  userData.avatarName = data.userName;
                  userData.userID = data._id;
                  if (data.authLevel == "domain_admin") {
                     userData.sceneOwner = "indaehoose";
                  }
                  console.log("userData " + JSON.stringify(userData));
                  if (socket != null && socket != undefined) {
                     if (!socket.connected) {
                        socket.connect(socketHost);
                     }
                  }
                  const profile = {"userID": data._id, "userName": data.userName}
                  // SaveLocalProfile(userData);
            
                  //socket.connect(socketHost);
               // }
            }
         }

               

         // } else {
         //    console.log("nurp");
         // }
      });
      } else {
         // window.location.href = './login.html';
         console.log("notoken");
      }
   // }
}

if (sceneEl != null) {

   // AFRAME.registerComponent('location_data', { //initial loading of "official" location data from cloud, embedded in server response
   //    schema: {
   //    initialized: {default: ''},
   //    jsonData: {default: ''},
   //    youtubePosition: {type: 'vec3', default: {x: 0, y: 1, z: -5}} 
       
   //    },
   //    init: function() {

   //          let theData = this.el.getAttribute('data-locations');
   //          // console.log("location_data el" + this.el.id);
   //          // let locations = [];
   //          this.data.jsonData = JSON.parse(atob(theData)); //convert from base64
   //          // this.rEl = null;
   //          // if (localData != "") {
   //          if (this.data.jsonData.length) {
   //          for (let i = 0; i < this.data.jsonData.length; i++) {
   //             let locItem = this.data.jsonData[i];
   //             sceneLocations.locations.push(locItem);
   //             // localData.locations.push(locItem);
   //             if (locItem.markerType != undefined) {
   //                if (locItem.markerType.toLowerCase().includes("youtube")) {
   //                   this.data.youtubePosition.x = locItem.x;
   //                   this.data.youtubePosition.y = locItem.y; 
   //                   this.data.youtubePosition.z = locItem.z;
   //                   // console.log("YOTUBE POSOTION: " +JSON.stringify(this.data.youtubePosition));
   //                }
   //                if (locItem.markerType == "poi") {
   //                   let nextbuttonEl = document.getElementById('nextButton');
   //                   let prevbuttonEl = document.getElementById('previousButton');
   //                   nextbuttonEl.style.visibility = "visible";
   //                   prevbuttonEl.style.visibility = "visible";
   //                   poiLocations.push(locItem);
   //                }
   //                if (locItem.markerType == "curve point") {
   //                   // let nextbuttonEl = document.getElementById('nextButton');
   //                   // let prevbuttonEl = document.getElementById('previousButton');
   //                   // nextbuttonEl.style.visibility = "visible";
   //                   // prevbuttonEl.style.visibility = "visible";
   //                   curveLocations.push(locItem);
   //                }
   //                if (locItem.markerType.toLowerCase().includes("placeholder") ||
   //                   locItem.markerType.toLowerCase().includes("poi") ||
   //                   // locItem.markerType.toLowerCase().includes("poi") ||
   //                   locItem.markerType.toLowerCase().includes("gate") || 
   //                   locItem.markerType.toLowerCase().includes("portal") || 
   //                   locItem.markerType.toLowerCase().includes("mailbox") || 
   //                   locItem.markerType.toLowerCase().includes("waypoint")) {
   //                   cloudMarkers.push(locItem);
                  
   //                }
            
   //             }
   //             if (i == this.data.jsonData.length - 1) {
   //                sceneEl.removeAttribute("keyboard-shortcuts");
   //                // if (settings.allowMods) {
   //                   this.waitAndInitLocalDB();     
   //                   console.log("poiLocations " + JSON.stringify(poiLocations));        
   //                   // InitIDB();
   //                // }
   //             }
   //          }
   //       } else {
   //          if (!AFRAME.utils.device.isMobile()) {
   //             InitIDB();
   //          } else {
   //             InitCurves(); //this is called from InitDB above if not mobile
   //          }
   //       }
          
   //    }, 
   //    returnYouTubePosition: function() {
   //       return this.data.youtubePosition;
   //    },
   //    waitAndInitLocalDB: function () {
   //       setTimeout( function() {
   //          if (settings && settings.allowMods && !AFRAME.utils.device.isMobile()) {
   //             InitIDB();
   //          }
   //       }, 3000);
   //    },
   //    // applyLocalDataToCloudElement: function (locationKey) {
   //    //    for 
   //    // },
   //    updateSceneLocationData: function() {

   //       let thedata = JSON.parse(JSON.stringify(localData.locations));
   //    // let length = thedata.length;
   //    console.log(thedata.length + " local sceneLocations " + JSON.stringify(thedata));
   //    //    console.log(JSON.stringify(sceneLocations));
   //       for (let i = 0; thedata.length; i++) {
   //          // UpdateLocation(sceneLocations.locations[i]);
   //          if (thedata[i] != undefined) {
   //             let ts = sceneLocations.locations[i].phID;
   //             let rEl = document.getElementById(ts);
   //             if (rEl) {
   //                console.log("gotsa element with id " + JSON.stringify(thedata[i]));
   //                // let obj = rEl.getObject3D('mesh');
   //                // obj.position.set({x: sceneLocations.locations[i].x, y: sceneLocations.locations[i].y, z: sceneLocations.locations[i].z });
   //                // obj.rotation.set({x: sceneLocations.locations[i].eulerx, y: sceneLocations.locations[i].eulery, z: sceneLocations.locations[i].eulerz });
   //                //    // obj.scale.set({x: sceneLocations.locations[i].markerObjScale, y: sceneLocations.locations[i].markerObjScale, z: sceneLocations.locations[i].markerObjScale});
   //                // rEl.setAttribute("position", {x: sceneLocations.locations[i].x, y: sceneLocations.locations[i].y, z: sceneLocations.locations[i].z });
   //                // rEl.setAttribute("rotation", {x: sceneLocations.locations[i].eulerx, y: sceneLocations.locations[i].eulery, z: sceneLocations.locations[i].eulerz });
   //                // rEl.setAttribute("scale", {x: sceneLocations.locations[i].markerObjScale, y: sceneLocations.locations[i].markerObjScale, z: sceneLocations.locations[i].markerObjScale});
   //             }
   //          }
   //       }
   //    }
   // });


}

function ShowHideUI () {
   uiVisible = !uiVisible;
   console.log("tryna showHideUI " + uiVisible);
   let canvasOverlay = document.getElementById("canvasOverlay");
   let nipple = document.getElementById("np");
   let geoButtons = document.getElementById("geopanel");
   let button_left_1 = document.getElementById("button_left_1");
   let button_left_2 = document.getElementById("button_left_2");
   let button_left_3 = document.getElementById("button_left_3");
   let button_left_4 = document.getElementById("button_left_4");
   let button_left_5 = document.getElementById("button_left_5");
   if (!uiVisible) {
      if (canvasOverlay) {
         canvasOverlay.style.visibility = "hidden";
      }
      if (nipple) {
         nipple.style.visibility = "hidden";
      }
      if (geoButtons) {
         geoButtons.style.visibility = "hidden";
      }
      if (button_left_1) {
         button_left_1.style.visibility = "hidden";
      }
      if (button_left_2) {
         button_left_2.style.visibility = "hidden";
      }
      if (button_left_3) {
         button_left_3.style.visibility = "hidden";
      }
      if (button_left_4) {
         button_left_4.style.visibility = "hidden";
      }
      if (button_left_5) {
         button_left_5.style.visibility = "hidden";
      }
   } else {
      if (canvasOverlay) {
         canvasOverlay.style.visibility = "visible";
      }
      if (nipple) {
         nipple.style.visibility = "visible";
      }
      if (geoButtons) {
         geoButtons.style.visibility = "visible";
      }
      if (button_left_1) {
         button_left_1.style.visibility = "visible";
      }
      if (button_left_2) {
         button_left_2.style.visibility = "visible";
      }
      if (button_left_3) {
         button_left_3.style.visibility = "visible";
      }
      if (button_left_4) {
         button_left_4.style.visibility = "visible";
      }
      if (button_left_5) {
         button_left_5.style.visibility = "visible";
      }
   }
}


$(document).on("click",".cw-canvas-overlay",function() { 
   this.element.classList.toggle("cw-show-canvas");
});


$(document).on("click",".picbutton",function() { 
   let picbuttonID = this.id;
   console.log("picbutton clicked from " + picbuttonID);
   // $(".screen-overlay").backstretch("Destroy", true);
   $(".screen-overlay").css('visibility',"visible");
   $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
});

$(document).on("click","#play",function() { 
   console.log("play clicked");
   // $(".screen-overlay").backstretch("Destroy", true);
   $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
});

$(document).on("click","#pause",function(){ 
   console.log("pause clicked");
   // $(".screen-overlay").backstretch("Destroy", true);
   $(".screen-overlay").backstretch("pause");
   // $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
});

$(document).on("click","#next",function(){ 
   // console.log("next clicked");
   // $(".screen-overlay").backstretch("Destroy", true);
   // if (currentIndex > 0)
   // currentIndex--;
   // var pic = pics[currentIndex];
   // $(".screen-overlay").backstretch(pic, {fade: 250});
   $(".screen-overlay").backstretch("next");
});
$(document).on("click","#prev",function(){ 
   // console.log("prev clicked");
   // $(".screen-overlay").backstretch("Destroy", true);
   // if (currentIndex < pics.length - 1)
   // currentIndex++;
   // var pic = pics[currentIndex];
   // $(".screen-overlay").backstretch(pic, {fade: 250});
   $(".screen-overlay").backstretch("prev");
});

// window.onclick = function(event) { //click outside modal to close
//    if (event.target == theModal && event.target != modalContent) {
//      theModal.style.display = "none";
//    }
//  }
// var HideMobileKeyboard = function() {
// 	document.activeElement.blur();
// 	$("input").blur();
// };

//  var modalCloser = document.getElementById("modalCloser"); //or the close button
//  if (modalCloser != null) {
//    modalCloser.addEventListener('click', function() {
//       theModal.style.display = "none";
//       HideMobileKeyboard();
//    });
// }

var closer = document.getElementById("adSquareCloseButton");
   if (closer != null) {
      closer.addEventListener('click', function() {
      const ad = document.getElementById("adSquareOverlay");
      ad.remove();
   });
}

var scloser = document.getElementById("screenOverlayCloseButton");
   if (scloser != null) {
      scloser.addEventListener('click', function() {
   // const screen = document.getElementById("screenOverlay");
   $(".screen-overlay").css('visibility','hidden');
   $(".screen-overlay").backstretch("pause");
   $(".screen-overlay").backstretch("destroy", true);
});
}
var mapcloser = document.getElementById("mapOverlayCloseButton");
   if (mapcloser != null) {
      mapcloser.addEventListener('click', function() {
   // const screen = document.getElementById("mapOverlay");
   $(".map-overlay").css('visibility','hidden');
   $(".map-overlay").backstretch("pause");
   $(".map-overlay").backstretch("destroy", true);
});
}

$(window).on("backstretch.before", function (e, instance, index) {
   // If we wanted to stop the slideshow after it reached the end
   // if (index != 1 && index != 0 && index === instance.images.length - 1) {
   // instance.pause();
   // $(".screen-overlay").backstretch("destroy", true);
   // $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
   // if (pics.length > 1) {
   //     console.log("resetting backstretch with pics.length " + pics.length);
   //      instance.images = pics;
   //     }
   // };
});


$(window).on("backstretch.after", function (e, instance, index) {
   if (playFrames) {
      console.log("played frame " + index + " of " + instance.images.length);
      let count = instance.images.length;
      currentIndex = index;
      if (count != 0) {
         if (count == 1) {

         } else if (index == count - 1) {
            $(".screen-overlay").backstretch("destroy", true);
            $(".screen-overlay").backstretch(pics, {duration: 2000, fade: 500});
         }
      }
   } else {

      // $(".screen-overlay").backstretch("destroy", true);
   }
});

 function backStretchMe() {
   $(".screen-overlay").backstretch(pics);
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



function InitSocket () {
if (settings && !socket) {

   socket = io.connect(socketHost, {
         query : {
            token: token,
            uname: avatarName,
            color: RandomHexColor(),
            room: room
         },
         url: socketHost + "/socket.io/?EIO=4&transport=polling&t=NNjNltH",
         autoConnect: false,  //connection is opened if token checks out above
         reconnection: false
         });      
      }

   socket.on('connect', function() {
   
      isConnected = true;
      console.log("tryna join " + avatarName + " socketID " + socket.id);
      mySocketID = socket.id;
      socket.emit('join', room, avatarName, "web");
   
   });

   socket.on('user joined', function(data) {
      console.log("room user " + data + 'joined room ' + room);
      socket.emit('room users', room);
      UpdatePlayerAvatars(roomUsers);
      EmitSelfPosition();
   });

   socket.on('admin message', function (data) {
      console.log('recieved admin message : ' + data + ' in room ' + room);
      if (data.toString().toLowerCase() == "next") {
         GoToNext();
      }
   });

   socket.on('room users', function (data) {
    console.log("room users data : " + data);
   $('#users').html("");

      roomUsers = JSON.parse(data);

      UpdatePlayerAvatars(roomUsers);
      let roomUsersString = "";
      // console.log("room users count = " +roomUsers.length);
      let usercount = 0;
         // for (let value of Object.values(roomUsers)) { //key = socket.id, value= username
      
         // console.log(value); 
         // usercount++;
         // //   $('#users').prepend($('<button class=\x22btn\x22 style=\x22margin: 5px 5px 5px 5px;\x22><h4><strong>').text( value ).append("</strong></h4></button>"));
         //    if (value.includes("~")) {
         //       split = value.split("~"); //color is appended to username
         //       roomUsersString += "<a href=\x22#\x22 style=\x22color:"+split[1]+"\x22>"+split[0]+"</a>, ";
         //    } else {
         //       roomUsersString += value + ", ";
         //    }   
         // }
      var keys = Object.keys(roomUsers);
      for(var i=0; i<keys.length; i++){
         var key = keys[i];
         var isMe = "";
         // console.log(key, roomUsers[key]);
         if (key === socket.id) {
            isMe = "*";
            // console.log("key isMe " + key);
         }
         const value = roomUsers[key];
         // console.log("roomUsers key:value: " + key + " " + value); 
         usercount++;
      //   $('#users').prepend($('<button class=\x22btn\x22 style=\x22margin: 5px 5px 5px 5px;\x22><h4><strong>').text( value ).append("</strong></h4></button>"));
         if (value.includes("~")) {
            let split = value.split("~"); //color is appended to username
            split[0] = split[0].replace("_", " ");
            roomUsersString += isMe + "<a href=\x22#\x22 class=\x22tooltip\x22 style=\x22color:"+split[1]+"\x22>"+ split[0]+"<span class=\x22tooltiptext\x22>"+split[0]+"</span></a>, ";
         } else {
            roomUsersString += value + ", ";
         }   
      }
      roomUsersString = roomUsersString.substring(0, roomUsersString.length - 2); //trim last comma and trailing space
      roomUsersString = usercount + " users connected: " + roomUsersString;
      // console.log(roomUsersString);
      $('#users').html(roomUsersString);
      stringRoomUsers = roomUsersString;
      // $('#users_2').html(roomUsersString);
      EmitSelfPosition();
   });

   socket.on('getbytes', function (data, metadata) {
         //TODO split the incoming wad and build array(s) of pics, audio, etc based on metadata
         console.log("tryna parse some bytes");
   });

   socket.on('getpicframe', function (data, sid) {

      
      console.log("getting pic frame from " + sid + " roomUsers " + JSON.stringify(roomUsers));
      let userName = "";
      var keys = Object.keys(roomUsers);
      for(var i=0; i<keys.length; i++){
         var key = keys[i];
         console.log(key, roomUsers[key]);
         if (keys[i] === sid) {
            console.log(roomUsers[key] + " sent a pic frame!");
            userName = roomUsers[key];
         }
      }   
      // foreach(var user in roomUsers) {
      //    if (user.key == socket.id) {
      //       console.log(user.value + " sent a pic frame!");
      //    }
      
      // }
      var instance = $('body').data('backstretch');
      var base64 = _arrayBufferToBase64(data);
      var imgSrc = "data:image/jpg;base64," + base64;
      // if (instance === undefined) {
      //     pics.push(imgSrc);
      //     // $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
      //         $(".screen-overlay").backstretch(imgSrc);
      // } 
      // $(".screen-overlay").backstretch("destroy", true);
      // $(".screen-overlay").backstretch(pics);
      // $(".screen-overlay").backstretch(imgSrc, {fade: 250});
      // $('#future').prepend($('<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>').text( "<"+ userName + " <a id="+socket.id+" href=\x22#\x22>sent a pic</a>").append("</span><hr>"));
      $('#future').prepend($("<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>-"+ userName + " <button class=\x22btn picbutton\x22 id="+sid+" href=\x22#\x22>sent a pic</button></span><hr>"));
      UpdateContentBox();
         if (pics.length < 1) {
            
            pics.push(imgSrc);
            // picsBuffer = pics;
            // console.log("pushing pic # " + pics.length);
            if (!instance) {
                  $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
            }
         } 

      if (picArrayIndex < 20) {
      if (pics < picArrayIndex) {
         pics.push(imgSrc);
         // $(".screen-overlay").backstretch(imgSrc);
      } else {
         pics.splice(picArrayIndex, 1, imgSrc);  
      }
      picArrayIndex++;
      } else {
      picArrayIndex = 0;
      pics.splice(picArrayIndex, 1, imgSrc);
      picArrayIndex++;
      }

   });

   socket.on('getaudiochunk', function (data){
      console.log("messages data : " + data);

   });

   socket.on('user messages', function(data1, data2) {
         console.log("messages data : " + data1 + data2);
         // $('#future').prepend($('<div class=\x22row bubble pull-left\x22 style=\x22margin: 5px 5px 5px 5px;\x22><span class=\x22smallfont_yellow\x22>').text( data1 + ": " + data2).append("</span></div>"));
         // $('#future').prepend($('<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>').text( "<"+ data1 + ": " + data2).append("</span>"));
         $('#future').prepend("<div class=\x22messageBubbleIn\x22 style=\x22float: left;\x22>"+ data1 + ": " + data2 + "</div><br><br><br>");
         if ($('#future li').length > 555) {
            $('#future li').last().remove();
         }
         // UpdateContentBox();
   });

   socket.on('playerposition', function(uname, posX, posY, posZ, rotX, rotY, rotZ, socketID, source) {
      // console.log("player position data : " + uname + "x " + posX + " y " + posY + " z " + posZ + " rx " + rotX + " ry " + rotY + " rz " + rotZ + " sid " + socketID + " from " + source);
      let pAvatar = document.getElementById(socketID);
      // console.log("pAvatar is " + JSON.stringify(pAvatar));
      // pAvatar.setAttribute('lerp', {'position': posObj, 'rotation': rotObj});
      if (pAvatar != null) { //TODO Interpolation!
         if (source == "unity") {
            posZ = posZ * -1;
         }
         const posObj = {};
         posObj.x = posX;
         posObj.y = posY;
         posObj.z = posZ;
         const rotObj = {};
         rotObj.x = rotX;
         rotObj.y = rotY;
         rotObj.z = rotZ;
         // pAvatar.setAttribute('lerp', {'position': posObj, 'rotation': rotObj});
         // const posRotObj = {position: posX + "," + posY + "," + posZ, rotation: rotX + "," + rotY + "," + rotZ};
               const posRotObj = {}
               posRotObj.position = posObj;
               posRotObj.rotation = rotObj;
               var mover = pAvatar.components.mover; //much easier
               // MoveElement(socketID, posRotObj);
               // const event = new CustomEvent('update_pos_rot', {detail: posRotObj}, false);
               // console.log("tryna dispatchEvent " + event);
               // pAvatar.dispatchEvent(event);
               mover.move(socketID, posObj, rotObj);
         // pAvatar.setAttribute('position', posX + " " + posY + " " + posZ);
         // pAvatar.setAttribute('rotation', rotX + " " + rotY + " " + rotZ);
      } else {
         UpdatePlayerAvatars(roomUsers);
      }
      EmitSelfPosition();
   });

   socket.on('selfplayerposition', function() {
      let pAvatar = document.getElementById(mySocketID);
      if (pAvatar != null) {
         pAvatar.setAttribute('position', cameraPosition.x + " " + cameraPosition.y + " " + cameraPosition.z);
      }
   });

   socket.on('disconnect', function() {
      UpdatePlayerAvatars(roomUsers);
   });
   socket.on('user left', function(id) {
      console.log("user left with socket id " + id);
   });
} //InitSocket end

// socket.on('selfplayerposition', function() {
//    let pAvatar = document.getElementById(mySocketID);
//    if (pAvatar != null) {
//       pAvatar.setAttribute('position', cameraPosition.x + " " + cameraPosition.y + " " + cameraPosition.z);
//    }
// });

// socket.on('disconnect', function() {
//    UpdatePlayerAvatars(roomUsers);
// });
// socket.on('user left', function(id) {
//    console.log("user left with socket id " + id);
// });
// function lerp (start, end, amt){
//    return (1-amt)*start+amt*end
//  }
// function lerp(v0, v1, t) { //used in content-utils, why here?
//    return v0*(1-t)+v1*t
// }



export function SendChatMessage() {
   if (socket) {
      var message = $('#chat_input').val();
      if (message.length > 0) {
      message = $('<div>').text(message).html(); //sanitize with wierd jquery fu
      console.log("tryna send " + message);
      if (message.includes("https://")) {
         message = "<a href=\x22"+message+"\x22 target=\x22_blank\x22>"+message+"</a>";
      }
      $('#future').prepend("<div class=\x22messageBubbleOut\x22 style=\x22float: right;\x22>you:</span> " +  message +"</div><br><br><br>");
      // $('#future').prepend($('<div style=\x22float: right;\x22><span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightgreen\x22>').html( ">you:</span> " +  message +"</div>").append("<hr>"));
      if (socket) {
         socket.emit('user message', message); //but not to ourselfs
      }
      
      UpdateContentBox();
      document.getElementById("chat_input").value = "";
      }
   } else {
      console.log("socket not connected..");
      $('#future').prepend("<div class=\x22messageBubbleOut\x22 style=\x22float: right;\x22></span>Socket Not Connected!</div><br><br><br>");
   }
}
export function ValidateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return (true)
  }
    alert("You have entered an invalid email address!")
    return (false)
}
export function SendInvitation() {
   if (!userData.isGuest) {
      let data = {};
      let inviteEmail = document.getElementById("email_input").value;
      let inviteMessage = document.getElementById("chat_input").value;
      if (inviteEmail != null && ValidateEmail(inviteEmail)) {
         data.sceneShareWithPeople = [];
         
         data.sceneShareWithPeople.push(inviteEmail);
         
         data.sceneShareWithMessage = inviteMessage;
         data.sceneTitle = settings.sceneTitle;
         data.sceneKeynote = settings.sceneKeynote;
         data.sceneDescription = settings.sceneDescription;
         data.short_id = room;
         data.sceneEventStart = settings.sceneEventStart;
         data.sceneEventEnd = settings.sceneEventEnd;
         data.sceneAccessLinkExpire = settings.sceneAccessLinkExpire;
         data._id = settings._id;
         console.log(JSON.stringify(data));
         var xhr = new XMLHttpRequest();
         xhr.open("POST", '/share_scene/', true);
         xhr.setRequestHeader('Content-Type', 'application/json');
         xhr.send(JSON.stringify(data));
         xhr.onload = function () {
            // do something to response
            document.getElementById("emailContainer").innerHTML = "Invitation Sent!";
            console.log(this.responseText);
            if (this.responseText.includes("Invitations sent: ")) {
               console.log("sent!"); 
            } else {
               console.log("not sent!");
               document.getElementById("emailContainer").innerHTML = this.responseText;
            }
         };
      }
   }
   // axios.post('/share_scene/', data)
   //     .then(function (response) {
   //         console.log(response);
   //        if (response.data.includes("Invitations sent: ")) {
   //             // window.location.reload();
   //             $("#topSuccess").html(response.data);
   //             $("#topSuccess").show();
   //         } else {
   //             $("#topAlert").html(response.data);
   //             $("#topAlert").show();
   //         }
   //     })                      
   //     .catch(function (error) {
   //         console.log(error);
   //     });
   // },
   // cancel: function () {
   //     $("#topAlert").html("Update cancelled");
   //     $("#topAlert").show();
   // }
}

function _arrayBufferToBase64( buffer ) {
   var binary = '';
   var bytes = new Uint8Array( buffer );
   var len = bytes.byteLength;
   for (var i = 0; i < len; i++) {
       binary += String.fromCharCode( bytes[ i ] );
   }
   return window.btoa( binary );
}

//todo -  mod EmitSelfPosition to send lat/lng/elevation instead if mapbox mode
//todo - get a list of all OTHER players than me, with updated locations attached
function ReturnPlayerData() { //return my un/color to set marker at current map coordinates
   if (sceneEl != null) {
      mode = "mapbox"; //this is called only from mapbox context in location-fu
      var keys = Object.keys(roomUsers);
      for(var i=0; i<keys.length; i++) { //create new avatars as needed
      var key = keys[i];
         if (key == socket.id) {
            console.log("player " + roomUsers[key]);
            return roomUsers[key];
         }
      }
   }
}
function Disconnect() {
   console.log("tryna disconnect..");
   socket.disconnect();
   let roomAvatars = sceneEl.querySelectorAll('.avatar');
   for (var a=0; a<roomAvatars.length; a++) { //clean up disconnected avatars
      roomAvatars[a].remove();
   }
   $('#users').html("disconnected");
   // document.querySelector("avatar").style.visibility = "hidden";
}

function UpdatePlayerAvatars(roomUsers) { //aframe only, need to flex.. //no, just make this a component function, to avoid creating a-entities outside of aframe
   console.log("tryna UpdatePlayerAvatars" + JSON.stringify(roomUsers));
   
   if (sceneEl != null && (settings.sceneType == "aframe" || settings.sceneType == "AFrame" || settings.sceneType == "Default") && !settings.hideAvatars && roomUsers) {
      var keys = Object.keys(roomUsers);
      var alreadyCreated = ""; //temp string to prevent doubles
      for(var i=0; i<keys.length; i++) { //create new avatars as needed
         
         var key = keys[i];
         // console.log("tryna UpdatePlayerAvatars " + key + " " + roomUsers[key] + " vs " + socket.id);
            if (key != socket.id) { //don't make one for ourselves, only other users..
            // console.log(key + " " + roomUsers[key] + sceneEl.querySelector('#' + keys[i]));

            let avatarEl = document.getElementById('#' + keys[i]); //maybe not catching this in time, since it was just created
            if (!avatarEl && !alreadyCreated.includes(key)) {
               console.log("tryna create avatar for " + roomUsers[key]);
               alreadyCreated += key;
               let createAvatarEl = document.getElementById('createAvatars');
               if (createAvatarEl) {
                  let createAvatarComponent = createAvatarEl.components.create_avatars;
                  if (createAvatarComponent) {
                     console.log("gots createAvatarComponennt, tryna createAvatar..." + key);
                     createAvatarComponent.createAvatar(key); //YES, it's below, but...
                  }
               }
               // let avatar = document.createElement("a-entity"); //this make bad!
               // // let avatar = sceneEl.createElement("a-entity");
               // // avatar.setAttribute('avatar-pos-rot');
               // avatar.classList.add("avatar");
               // let userSplit = roomUsers[key].split("~"); //color appended to username after tilde on server
               // let color = "blue";
               // if (userSplit.length > 1) {
               //    color = userSplit[1];
               //    if (!color.includes("#")) {
               //       color = "#" + color;
               //    }
               // }
               // avatar.setAttribute('avatar-callout', {'calloutString': userSplit[0], 'hexColor': color});
               // // avatar.setAttribute('lerp', {});
               // avatar.setAttribute('mover', 'eltype', 'avatar');   
               // avatar.id = keys[i]; //assign id for #lookups
               // sceneEl.appendChild(avatar);
            }
         }
      }

      let roomAvatars = sceneEl.querySelectorAll('.avatar');
      console.log("roomAvatars " + roomAvatars.length);
      var dupeCheck = "";
      for (var a=0; a<roomAvatars.length; a++) { //clean up disconnected avatars
         let active = false;
         for(var i=0; i<keys.length; i++) {
            var key = keys[i];
            // console.log("checking key, roomUsers[key]);
            if (roomAvatars[a].id == key && !dupeCheck.includes(key)) {
               active = true;
               dupeCheck += key
               console.log("room avatar active " + key);
            }
         }
         if (!active) {
            console.log("tryna remove " + roomAvatars[a].id)
            roomAvatars[a].remove();
         }
      }
   }
}

function AvatarClicked(sid) {
   console.log("AvatarClicked " +sid);
   SceneManglerModal('Messages');
}

function UpdatePlayerPosition(sid, px, py, pz) { //nevermind
   var keys = Object.keys(roomUsers);
   for(var i=0; i<keys.length; i++){
      var key = keys[i];
      console.log(key, roomUsers[key]);
      if (keys[i] === sid) {
         console.log(roomUsers[key] + " is moving!");
         
      }
   }
}

// InitContentBox();
// window.onload = init;
// if (document.querySelector(".avatarName")) {
//    avatarName = document.querySelector(".avatarName").id;
// }

var context;    // Audio context
var buf;        // Audio buffer

function playByteArray(byteArray) {

   var arrayBuffer = new ArrayBuffer(byteArray.length);
   var bufferView = new Uint8Array(arrayBuffer);
   for (let i = 0; i < byteArray.length; i++) {
     bufferView[i] = byteArray[i];
   }

   context.decodeAudioData(arrayBuffer, function(buffer) {
       buf = buffer;
       play();
   });
}

// Play the loaded file
function play() {
   // Create a source node from the buffer
   var source = context.createBufferSource();
   source.buffer = buf;
   // Connect to the final output node (the speakers)
   source.connect(context.destination);
   // Play immediately
   source.start(0);
}

function UpdateContentBox() { //nm for now
   // console.log("tryna update content box");
   // var coll = document.getElementsByClassName("collapsible");
   // var i;

   // for (i = 0; i < coll.length; i++) {
   //    var content = coll[i].nextElementSibling;
   //       content.style.maxHeight = content.scrollHeight + "px";

   // }
}



// function HideAll() {
//    let overlay = document.getElementById('canvasOverlay');
//    overlay.style.display = 'none';
// }
// function ShowAll() {
//    let overlay = document.getElementById('canvasOverlay');
//    overlay.style.display = 'block';
// }
// function PlayerToLocation (timestamp) { //locationIDs = timestamp, unique in scene
//    sceneLocations.locations;
// }



