

import { SaveLocalData, DeleteLocalSceneData, SetHasLocalData, InitIDB, UpdateLocalPlayerState } from "../connect/indexedDb.js";


import { SetSelectedLocationTimestamp, ShowHideDialogPanel, sceneObjects, SceneManglerModal } from "./dialogs.js";
import { SetTimedEventsListenerMode, timeKeysData, SetTimeKeysData, SetPrimaryAudioEventsData, SetVideoEventsData, selectedPosition, MapUpdate } from "../connect/events.js";


import { settings, profile, pixelsPerMeterActual } from "../connect/settings.js";

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
// export const mouse = new THREE.Vector2();
export const sceneEl = document.querySelector('a-scene'); //related to problem...
// export let hasLocalData = false;
export const lerp = (x, y, a) => x * (1 - a) + y * a;

var dateString = Date.now().toString();
export let roomUsers = {};
export let stringRoomUsers = "";
export let userProfile;

export let playerPosition;
export let playerRotation = {x: 0, y: 0, z: 0};
// let playerQuaternion = new THREE.Quaternion();


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
// export let timeKeysData = {};
// export let tkStarttimes = [];


export let poiLocations = [];
export let curveLocations = [];
export let cloudMarkers = []; //???? unused>?//nope
export let sceneModels = [];

// let localKeys = [];

let volumePrimary = 0;
let volumeAmbient = 0;
let volumeTrigger = 0;

let currentLocationIndex = -1;
// let currentTime = 0;  //depends on listenerMode

// let modalTimeStatsEl = null; //stats for timekeys modal
// let transportTimeStatsEl = null;
// let sceneType = null;

let uiVisible = true;

let matrixClient = null;
let matrixRoomsData = null;
// let vidz = null;
// let videoEl = null;

// export let timedEventsListenerMode = "";

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
// let primaryAudioEl = document.querySelector('#primaryAudio');

let writeCount = 0;
window.LocationRowClick = LocationRowClick;

// export function SetPlayer(thePlayer) { //for non-dom routes
//    player = thePlayer;
// }

// $(function() { 
export function InitConnect() {
   // InitIDB();
      // LoadPrimaryAudioHowl();
      console.log("InitConnect!");
   if (avatarNameEl) {
      avatarName = avatarNameEl.id;
   }

   player = document.getElementById("player");
   
   // player = document.getElementById("cameraRig");
   // let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
   // let theSettingsData = settingsEl.getAttribute('data-settings');

   // settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed
   // console.log("Settings : " + JSON.stringify(settings));
   let timedEventsEl = document.getElementById('timedEventsDataElement'); //volume, color, etc...
   if (timedEventsEl) {
      let theTimedEventsData = timedEventsEl.getAttribute('data-timedevents');
      SetTimeKeysData(JSON.parse(atob(theTimedEventsData)));
      // timeKeysData =  JSON.parse(atob(theTimedEventsData));
      SetTimedEventsListenerMode(timeKeysData.listenTo);

      

      // timedEventsListenerMode = ;
      // window.timedEventsListenerMode = timedEventsListenerMode;
      console.log("timekeys Data1: " + JSON.stringify(timeKeysData));
   }


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

   
   setTimeout(function () {
      // localStorage.setItem("last_page", room);
      tcheck(); //token auth

   }, 1000);
   $('#room_id').append($('<button><h4><strong>').text("Welcome to scene " + room).append("</strong></h4></button>"));

   if (settings && settings.sceneType && (settings.sceneType == "Default" || settings.sceneType == "AFrame" || settings.sceneType == "default" || settings.sceneType == "aframe")) {
      // window.sceneType == "aframe";
      if (settings.hideAvatars) {
         player.setAttribute("player_mover", "init", true);
         EmitSelfPosition();
      }
      posRotReader = document.getElementById("player").components.get_pos_rot; 
      if (player != null) {
         player.setAttribute("player_mover", "init", true);
      }
      let modelDataEl = document.getElementById('sceneModels');
      if (modelDataEl) {
         let modelData = modelDataEl.getAttribute('data-models');
         sceneModels = JSON.parse(atob(modelData)); //convert from base64
         // console.log("sceneModels " + JSON.stringify(sceneModels));
         for (let i = 0; i < sceneModels.length; i++) {
            if (sceneModels[i].sourceText != undefined && sceneModels[i].sourceText != 'undefined' && sceneModels[i].sourceText != null && sceneModels[i].sourceText.length > 0) {
               attributions.push("Name: " + sceneModels[i].name + " - Type: " + sceneModels[i].item_type + " - Source: " + sceneModels[i].sourceText);
            }
         }
      }
      // console.log("settings: " + JSON.stringify(settings));
      if (settings.skyboxIDs != null && settings.skyboxIDs.length > 0) {
         
         // skyboxEl = document.createElement('a-entity');
         // sceneEl = document.querySelector('a-scene');
         // skyboxEl.setAttribute('skybox_dynamic', {enabled: true, id: settings.skyboxIDs[0]});
         // skyboxEl.id = 'skybox_dynamic';
         // sceneEl.appendChild(skyboxEl);
         
      }
   
      if (settings.skyboxID == "") {
         // skyboxEl.components.skybox_dynamic.nextSkybox();
      }
      if (settings.audioGroups && settings.audioGroups.objectGroups && settings.audioGroups.objectGroups.length > 0 || 
         settings.audioGroups && settings.audioGroups.triggerGroups && settings.audioGroups.triggerGroups.length > 0 || 
         settings.audioGroups && settings.audioGroups.ambientGroups && settings.audioGroups.ambientGroups.length > 0 ||
         settings.audioGroups && settings.audioGroups.primaryGroups &&  settings.audioGroups.primaryGroups.length > 0) {
         // audioGroupsEl = document.getElementById('audioGroupsEl');
         // if (audioGroupsEl != null) {
         //    let audioGroupsController = audioGroupsEl.components.audio_groups_control;
         //    if (audioGroupsController != null) {
         //       audioGroupsController.LoadAudioGroups(settings.audioGroups);
         //    }
         // }
         // audioGroupsEl.components.audio_groups_control.LoadAudioGroups(settings.audioGroups);
         let audioGroupsEl = document.createElement('a-entity');
         audioGroupsEl.setAttribute("id","audioGroupsEl");
         audioGroupsEl.setAttribute("audio_groups_control", {init: ''});
         sceneEl.appendChild(audioGroupsEl);
      }
   } else {
      console.log("not aframe or default scenetype!");
      // GetTextItems(); //only for plain pages or text adventure, scene_text_control fetches for aframe
      if (settings && settings.sceneType && settings.sceneType == "landing") {
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
      // InitIDB();
   }
   // console.log("room: " +room + " vid " + settings.sceneVideoStreams + " type " + settings.sceneType);

   lastCloudUpdate = settings.sceneLastUpdate;
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
   console.log("socketfu: " + settings.networking + " " + settings.socketHost);
   if (settings.networking == 'SocketIO' && settings.socketHost) {
      if (settings.socketHost.length > 6) { //i.e. not "none" or empty
         socketHost = settings.socketHost;
         if (!socket) {
         // //InitSocket();
      }
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

   if (settings.sceneTags && settings.sceneTags.includes("show camera lock")) {
      const camLockButton = document.getElementById("camLockToggleButton");
      
      if (camLockButton) {
         camLockButton.style.visibility = "visible";
         camLockButton.addEventListener('click', () => {
            ToggleCameraLock();
         });
      }
   }
   if (settings.sceneTags && settings.sceneTags.includes("keys")) { //synth keys

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

   let primaryAudioEventData = document.getElementById("audioEventsData");
   if (primaryAudioEventData) {
      SetPrimaryAudioEventsData();
   }

   // sceneEl = document.querySelector('a-scene');
   if (sceneEl) {
      sceneEl.removeAttribute("keyboard-shortcuts"); //give me back the f key!
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
   // if (settings.sceneCameraMode && settings.sceneCameraMode == "Follow Path" || settings.sceneTags && settings.sceneTags.includes("curve")) {

   // }
   // this.asky = document.getElementsByTagName('a-sky')[0];
   // if (this.asky && settings) {
   //   console.log("tryna mod asky radius " + settings.sceneSkyRadius);
   //   // this.asky1 = this.askies[0];
   //   this.asky.setAttribute("radius", settings.sceneSkyRadius);
   //   let skybox = document.getElementById("skybox");
   //   if (skybox) {
   //     let skyrad = settings.sceneSkyRadius - 2;
   //     console.log("tryna mod asky radius " + skyrad);
   //     skybox.setAttribute("radius", skyrad); //in case using reflection and enviro is on..
   //   } else {
   //     let skyboxD = document.getElementById("skybox_dynamic");
   //     if (skyboxD) {
   //       let skyradD = settings.sceneSkyRadius - 2;
   //       console.log("tryna mod asky radius " + skyradD);
   //       skyboxD.setAttribute("radius", skyradD); //in case using reflection and enviro is on..
   //     }
   //   }
   // }
   let sceneGreetingDialogEl = document.getElementById("sceneGreetingDialog");
   if (sceneGreetingDialogEl) {

      let sgdialogComponent = sceneGreetingDialogEl.components.scene_greeting_dialog;
      if (sgdialogComponent) {
         console.log("tryna initMe sceneGreeting");
         sgdialogComponent.initMe();
      }
   }

   let picGroupIconEl = document.getElementById('picGroupParent');
   if (picGroupIconEl) {
      if (settings.showCameraIcon) {
         
      } else {
         picGroupIconEl.setAttribute("visible", false);
      }
   }

   // } 
   // let player = document.getElementById("player");
   // document.body.addEventListener("obbcollisionstarted", function (e) {
   if (player) {
      player.addEventListener("obbcollisionstarted", function (e) {
         if (e.detail) {
            console.log("player obbcollision start  " + e.detail.withEl.id); 
            let el = document.getElementById(e.detail.withEl.id);
            if (el) {
               if (el.components.cloud_marker) {
                  el.components.cloud_marker.playerTriggerHit();
                                          
               } else if (el.components.local_marker) {
                  el.components.local_marker.playerTriggerHit();
                                          
               }
            }
         }
      });
   }

   // player.addEventListener("obbcollisionstarted", function (e) {
   //    if (e.detail) {
   //       console.log("obbcollision start  " + e.detail.withEl.id); 
   //       if ((e.detail.withEl.id.toString() == "player") || (e.detail.withEl.components && (e.detail.withEl.components.cloud_marker || e.detail.withEl.components.local_marker))) {
   //       // if (e.detail.withEl.id.toString() == "player") {
            
   //          let index = intersections.indexOf(e.detail.withEl.id);
   //          console.log("got obbcollision hit " + e.detail.withEl.id + " index " + index);
   //          if (index == -1) {
   //             intersections.push(e.detail.withEl.id);
   //             console.log("obb collision start with " + e.detail.withEl.id + " intersect index " + index + " " + intersections);
   //             if (intersections.indexOf("player") != -1) {
   //                for (let i = 0; i < intersections.length; i++) {
   //                   if (intersections[i] != "player") {
   //                      let el = document.getElementById(intersections[i]);
   //                      if (el) {
   //                         if (el.components.cloud_marker) {
   //                            el.components.cloud_marker.playerTriggerHit();
   //                                                    break;
   //                         } else if (el.components.local_marker) {
   //                            el.components.local_marker.playerTriggerHit();
   //                                                    break;
   //                         }
   //                      }

   //                   }
   //                }
   //             }
   //          }
   //       //   }  
   //       }
   //    }
   //  });
   
   if (player) {
      
    player.addEventListener("obbcollisionended", function (e) {
         if (e.detail) {
         console.log("player obbcollision end  " + e.detail.withEl.id); 
            let el = document.getElementById(e.detail.withEl.id);
            if (el) {
               if (el.components.cloud_marker) {
                  el.components.cloud_marker.playerTriggerExit();
                                       
               } else if (el.components.local_marker) {
                  el.components.local_marker.playerTriggerExit();
                                          
               }
            }
         }
      }); 
   }
    


} //end onload

// export function UpdateUserProfile (profile) {
//    userProfile = profile;
//    console.log("userProfile for " + profile.avatarName);
//    // profileLoaded(profile);
// }

export function SetPlayerToLastPosition () {
   if (settings && settings.sceneTags && settings.sceneTags.includes("last position")) {
      if (player && profile.history && profile.history.init_scene && profile.history.init_scene[room] && profile.history.init_scene[room].lastPosition) {         
         player.setAttribute("position", profile.history.init_scene[room].lastPosition);
         player.setAttribute("rotation", profile.history.init_scene[room].lastRotation);
         UpdatePlayerAvatars();
         userData.avatarName = profile.avatarName;
         // userData = profile;
         userData.userName = profile.avatarName;
      } else {
         console.log("last position not found!");
      }
   }
}

export function UpdateAvatarName(name) {
   avatarName = name;
   const usernameEl = document.getElementById("userName");
   usernameEl.innerText = avatarName;
}
// export function UpdatePoiLocations(loc) { //placeholder and poi locations
//    poiLocations.push(loc);
// }

$('#nextButton').on('click', function(e) {
   console.log("tryna goto next");
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

export function SetSceneLocations (sceneLocs) { //e.g. from vtt/non aframe, not set in content-utils
   sceneLocations.locations = sceneLocs;
   // console.log(JSON.stringify(sceneLocations));
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

// export function SetTimeKeysData (tkData) {
//    timeKeysData = tkData;
// }
// export function MediaTimeUpdate (timeString) {
//    // console.log("MediaTimeUpdate " + fancyTimeString);
//    // transportTimeStatsEl = document.getElementById("transportStats");
//    if (transportTimeStatsEl == null) {
//       transportTimeStatsEl = document.getElementById("transportStats");
//    } else {
//       transportTimeStatsEl.innerHTML = timeString;
//    }
//    modalTimeStatsEl = document.getElementById('modalTimeStats');
//    if (modalTimeStatsEl == null) {
//       } else {
//          modalTimeStatsEl.innerHTML = timeString;
//       }
      
//    }
   
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

export function SaveModsToCloud() { //Save button on location modal, writes local mods upstairs..

   if (userData.sceneOwner != null && !busy) {
      busy = true;
      let mods = {};
      mods.shortID = room;
      mods.userData = userData;

      mods.localFiles = localData.localFiles; 
      for (let key in mods.localFiles) {
         if (localData.localFiles[key].data) {
            mods.localFiles[key].data = arrayBufferToBase64(localData.localFiles[key].data); //might need to async...
         }
            
      }
      
      mods.locationMods = localData.locations;

      console.log("mods.locationMods " + JSON.stringify(mods));
      for (let i = 0; i < mods.locationMods.length; i++) { //pop the properties for non-uniform scaling...
         if (mods.locationMods[i].xscale == null) {
            mods.locationMods[i].xscale = mods.locationMods[i].markerObjScale;
         }
         if (mods.locationMods[i].yscale == null) {
            mods.locationMods[i].yscale = mods.locationMods[i].markerObjScale;
         }
         if (mods.locationMods[i].zscale == null) {
            mods.locationMods[i].zscale = mods.locationMods[i].markerObjScale;
         }
      }
      // mods.colorMods = {};
      if (localData.settings.sceneColor1 != "" || localData.settings.sceneColor2 != "" || localData.settings.sceneColor3 != "" || localData.settings.sceneColor4 != "") { //defined globally above
         mods.colorMods = {sceneColor1: localData.settings.sceneColor1, sceneColor2: localData.settings.sceneColor2, sceneColor3: localData.settings.sceneColor3, sceneColor4: localData.settings.sceneColor4};
      }
      if (volumePrimary != "" ||volumeAmbient != "" || volumeTrigger != "") {
         mods.volumeMods = {volumePrimary: volumePrimary, volumeAmbient: volumeAmbient, volumeTrigger: volumeTrigger};
      }
      mods.sceneTimedEvents = localData.timedEvents;
      mods.sceneEnvironmentPreset = localData.settings.sceneEnvironmentPreset;
      mods.sceneTags = localData.settings.sceneTags;
      // console.log(JSON.stringify(mods));

      // var encodedString = btoa(JSON.stringify(mods));
      
      // console.log("MODS " + JSON.stringify(mods));
      
      var xhr = new XMLHttpRequest();
      xhr.open("POST", '/add_scene_mods/'+room, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      // xhr.send(JSON.stringify(mods));
      let modString = JSON.stringify(mods);
      console.log(modString);
      xhr.send(modString);
      xhr.onload = function () {
         // do something to response
         console.log(this.responseText);
         if (this.responseText == 'updated') {
            // SaveLocalData();
            DeleteLocalSceneData();
            setTimeout(function () {
               window.location.reload();
            }, 1000);
         } 
      };

   } else {
      console.log("you ain't the sceneOwner!");
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

export function ImportMods (event) {
   console.log("tryna import mods " + event.target.files[0].name);
   if (event.target.files[0].name.includes(room.toString())) { //file is imported text file, all base64
      var selectedFile = event.target.files[0];
      var reader = new FileReader();
      reader.onload = function(event) {
      var decodedString = atob(event.target.result);
      console.log(decodedString); 
      let mods = JSON.parse(decodedString);

      for (let key in mods.localFiles) { //should probably async somehow..
         localData.localFiles[key] = mods.localFiles[key];
         localData.localFiles[key].data = base64ToArrayBuffer(mods.localFiles[key].data); //convert imported base64 to array buffer
         console.log("back to array buffer : " + localData.localFiles[key].name);

      }

      if (mods != null && mods != undefined && mods.settings != {}) {
         if (mods.settings.sceneColor1) {
            localData.settings.sceneColor1 = mods.settings.sceneColor1;
         }
         if (mods.settings.sceneColor2) {
            localData.settings.sceneColor2 = mods.settings.sceneColor2;
         }
         if (mods.settings.sceneColor3) {
            localData.settings.sceneColor3 = mods.settings.sceneColor3;
         }
         if (mods.settings.sceneColor4) {
            localData.settings.sceneColor4 = mods.settings.sceneColor4;
         }
         // InitLocalColors();
         if (mods.settings.sceneTags) {
            console.log("gots mods sceneTags " + JSON.stringify(mods.settings.sceneTags));
            for (let i = 0; i < mods.settings.sceneTags.length; i++) {
               mods.settings.sceneTags[i] = mods.settings.sceneTags[i].trim();
               console.log("mods.settings.sceneTag + " +mods.settings.sceneTags[i]);
            }
            localData.settings.sceneTags = mods.settings.sceneTags;

         }

      }
      if (mods != null && mods != undefined && mods.locations != null && mods.locations.length > 0) {
         localData.locations = [];
         console.log("localData.locations " + JSON.stringify(localData.locations));
         for (let i = 0; i < mods.locations.length; i++) {
               localData.locations.push(mods.locations[i]);
         }

      } 

      if (mods != null && mods != undefined && mods.timekeyMods != null) {
         timeKeysData = mods.timedEvents;
      }
      console.log("mods.localFiles :" + Object.keys(mods.localFiles));

      SaveLocalData();
      setTimeout(function () { //hrm, maybe just don't and prompt user to reload?
         window.location.reload();
      }, 3000);
      };
      reader.readAsText(selectedFile);
    
   } else {
      console.log("wrong room!")
   }
}
export function SaveTimekeysToLocal () {
   console.log(JSON.stringify(timeKeysData));
   localData.timedEvents = timeKeysData;
   SaveLocalData();
   // localStorage.setItem(room + "_timeKeys", JSON.stringify(timeKeysData));
}


export function SaveModToLocal(locationKey) { //locationKey is now just timestamp of the location item and element id, unique enough
   let name = document.getElementById('locationName').value;
   console.log("tryna save mod to local with key " + locationKey + " named " +name);
   
   SetHasLocalData(true);
   let locItem = {};

   
   // let keySplit = locationKey.split("~");
   // if (!settings.hasBgMap) { 
      locItem.x = document.getElementById('xpos').value;
      locItem.z = document.getElementById('zpos').value;
         let modX = locItem.x;
         let modZ = locItem.z;

   // if ((settings.sceneType == "aframe" || settings.sceneType == "Default") && settings.hasBgMap) {
   //    console.log("modded position values x and z " + locItem.x + " " + locItem.z + " from 3d mode because there's a map!");
   //          //   if ((settings.sceneType == "aframe" || settings.sceneType == "Default") && settings.hasBgMap) { //reverse the position conversion if in map mode
   //       // if (cursor.value.sceneTags.includes("map")) {
   //    const mapScale = pixelsPerMeterActual; //multiply by (originally divided 1 by) pixelsPerMeterActual, e.g 10 = .1

      
   //    if (locItem.x < 0) {
   //       modX = ((settings.mapWidth / 2) - Math.abs(locItem.x)) * mapScale;
   //    } else {
   //       modX = ((settings.mapWidth / 2) + Math.abs(locItem.x)) * mapScale;
   //    }
   //    //leave the y alone...
   //    if (locItem.z < 0) {
   //       modZ = ((settings.mapHeight / 2) - Math.abs(locItem.z)) * mapScale;
   //    } else {
   //       modZ = ((settings.mapHeight / 2) + Math.abs(locItem.z)) * mapScale;
   //    }
   //    console.log("modded location " + modX + " " + modZ);
   // }
   
   

   locItem.eulerx = document.getElementById('xrot').value.length > 0 ? document.getElementById('xrot').value : '0';
   locItem.y = document.getElementById('ypos').value;
   locItem.eulery = document.getElementById('yrot').value.length > 0 ? document.getElementById('yrot').value : '0';

   locItem.eulerz = document.getElementById('zrot').value.length > 0 ? document.getElementById('zrot').value : '0';
   // locItem.lat 
   // locItem.label = document.getElementById('locationName').value;
   locItem.name = name;
   locItem.description = document.getElementById('locationDescription').value;
   locItem.markerType = document.getElementById('locationMarkerType').value;
   locItem.eventData = document.getElementById('locationEventData').value;
   // locItem.targetElements = document.getElementById('targetElements').value; //nope only gets one
   locItem.targetElements = Array.from(document.getElementById('targetElements').options).filter(function (option) {
      return option.selected;
    }).map(function (option) {
      return option.value;
    });
   locItem.timestamp = locationKey;
   locItem.xscale = document.getElementById("xscale").value;
   locItem.yscale = document.getElementById("yscale").value;
   locItem.zscale = document.getElementById("zscale").value;
   locItem.mediaID = document.getElementById("locationMedia").value;

   // locItem.phID = locationKey.toString();
   locItem.type = "Worldspace";

   locItem.isLocal = true;
   locItem.locationTags = document.getElementById("locationTags").value;
   if (locItem.name.includes('local ')) {
      locItem.name = 'local ' + locItem.markerType; //fix default names in case type changes
   }

   locItem.modelID = document.getElementById('locationModel').value; // model _id
   locItem.model = ReturnModelName(locItem.modelID);
   // if ((locItem.modelID || locItem.modelID != "" || locItem.modelID != undefined) && locItem.markerType == "none" || locItem.markerType == "" || locItem.markerType == undefined) {
   //    locItem.markerType = "model";
   // }

   locItem.objectID = document.getElementById('locationObject').value; //object _id
   locItem.objectName = ReturnObjectName(locItem.objectID);

   // if ((locItem.objectID || locItem.objectID != "" || locItem.objectID != undefined) && locItem.markerType == "none" || locItem.markerType == "" || locItem.markerType == undefined) {
   //    locItem.markerType = "object";
   // }
   // if (locationKey.toString().includes("local")) {
   //    locItem.isLocal = true;
   // }
   console.log("tryna savelocation "+locationKey+"  : " + JSON.stringify(locItem));
   // console.log("tryna savelocation "+locationKey+"  : " + locItem.targetElements);
   // localStorage.setItem(locationKey, JSON.stringify(locItem));
   let hasLocal = false;
   for (let i = 0; i < localData.locations.length; i++) {
      // console.log("chck : " + localData.locations[i].timestamp.toString() + " vs " +locationKey.toString());
      if (localData.locations[i].timestamp.toString() == locationKey.toString() ) {
       
         // localData.locations[i] = Object.assign(locItem); //merge?
         // locItem.x = document.getElementById('xpos').value;
         if ((settings.sceneType == "aframe" || settings.sceneType == "Default") && settings.hasBgMap) { //don't change pos values if from bgmap
            modX = localData.locations[i].x;
            modZ = localData.locations[i].z;
         }
         localData.locations[i].x = modX;
         localData.locations[i].eulerx = locItem.eulerx;
         localData.locations[i].xscale = locItem.xscale;
         localData.locations[i].y = locItem.y;
         localData.locations[i].eulery = locItem.eulery;
         localData.locations[i].yscale = locItem.yscale;
         localData.locations[i].z = modZ;
         localData.locations[i].eulerz = locItem.eulerz;
         localData.locations[i].zscale = locItem.zscale;

            // locItem.lat/lng //TODO!
         // localData.locations[i] = locItem.label;
         localData.locations[i].name = locItem.name;
         localData.locations[i].description = locItem.description;
         localData.locations[i].markerType = locItem.markerType;
         localData.locations[i].eventData = locItem.eventData;
         localData.locations[i].timestamp = locItem.timestamp;
         // localData.locations[i].markerObjScale = locItem.markerObjScale;
         // localData.locations[i] = locItem.phID;
         localData.locations[i].type = locItem.type;
         localData.locations[i].isLocal = locItem.isLocal;
         localData.locations[i].locationTags = locItem.locationTags;
         localData.locations[i].modelID = locItem.modelID;
         localData.locations[i].model = locItem.model;
         localData.locations[i].objectID = locItem.objectID;
         localData.locations[i].objectName = locItem.objectName;
         localData.locations[i].targetElements = locItem.targetElements;
         localData.locations[i].mediaID = locItem.mediaID;
         hasLocal = true;
         // isLocal = true;
         localData.locations[i].hasLocalData = true;
  
         console.log(locItem.name + " gotsa match for localData.locations " + locationKey.toString() + " data " +JSON.stringify(localData.locations[i]));
         let theEl = document.getElementById(locationKey.toString());
         if (theEl) {
            if (sceneEl) {
                             
               console.log("found the EL: " + locationKey + " locItem dat " + JSON.stringify(locItem) );
               // localData.locations[i].xscale = o3DScale.x;
               // localData.locations[i].yscale = o3DScale.y;
               // localData.locations[i].zscale = o3DScale.z;
               // locItem.xscale = o3DScale.x;
               // locItem.yscale = o3DScale.y;
               // locItem.zscale = o3DScale.z;
               // let scale = (locItem.markerObjScale != undefined && locItem.markerObjScale != null && locItem.markerObjScale != "") ? locItem.markerObjScale : 1;
               // theEl.setAttribute('position', {x: locItem.x, y: locItem.y, z: locItem.z});
               // theEl.setAttribute('rotation', {x: locItem.eulerx, y: locItem.eulery, z: locItem.eulerz});
               // theEl.setAttribute('scale', {x: scale, y: scale, z: scale});
               let modModelComponent = theEl.components.mod_model;
               let localMarkerComponent = theEl.components.local_marker;
               let cloudMarkerComponent = theEl.components.cloud_marker;
               let type = "";
               if (modModelComponent) {
                  type = "modModelComponent";
                  modModelComponent.data.modelID = locItem.modelID;
                  modModelComponent.data.eventData = locItem.eventData;
                  modModelComponent.data.tags = locItem.locationTags;
                  // modModelComponent.loadModel(locItem.modelID); 
                  modModelComponent.data.name = locItem.name;
                  modModelComponent.data.markerType = locItem.markerType;
                  modModelComponent.data.xpos = locItem.x;
                  modModelComponent.data.ypos = locItem.y;
                  modModelComponent.data.zpos = locItem.z;
                  modModelComponent.data.xrot = locItem.eulerx;
                  modModelComponent.data.yrot = locItem.eulery;
                  modModelComponent.data.zrot = locItem.eulerz;
                  modModelComponent.data.xscale = locItem.xscale;
                  modModelComponent.data.yscale = locItem.yscale;
                  modModelComponent.data.zscale = locItem.zscale;
                  modModelComponent.data.scale = locItem.markerObjScale;
                  modModelComponent.data.tags = locItem.locationTags;
                  modModelComponent.loadModel(locItem.modelID); 
                  
                  // modModelComponent.updateMaterials();
               } else if (cloudMarkerComponent) {
                  console.log("found the cloudmarker component!");
                  type = "cloudMarkerComponent";
                  cloudMarkerComponent.data.modelID = locItem.modelID;
                  cloudMarkerComponent.data.modelID = locItem.mediaID;
                  cloudMarkerComponent.data.name = locItem.name;
                  cloudMarkerComponent.data.markerType = locItem.markerType;
                  cloudMarkerComponent.data.description = locItem.description;
                  cloudMarkerComponent.data.xpos = locItem.x;
                  cloudMarkerComponent.data.ypos = locItem.y;
                  cloudMarkerComponent.data.zpos = locItem.z;
                  cloudMarkerComponent.data.xrot = locItem.eulerx;
                  cloudMarkerComponent.data.yrot = locItem.eulery;
                  cloudMarkerComponent.data.zrot = locItem.eulerz;
                  cloudMarkerComponent.data.xscale = locItem.xscale;
                  cloudMarkerComponent.data.yscale = locItem.yscale;
                  cloudMarkerComponent.data.zscale = locItem.zscale;
                  cloudMarkerComponent.data.scale = locItem.markerObjScale;
                  cloudMarkerComponent.data.tags = locItem.locationTags;
                  cloudMarkerComponent.data.targetElements = locItem.targetElements;
                  
                  cloudMarkerComponent.loadModel(locItem.modelID); 
                  cloudMarkerComponent.updateMaterials();
                  cloudMarkerComponent.loadMedia(locItem.mediaID);
                  
               } else if (localMarkerComponent) {
                  type = "localMarkerComponent";
                  localMarkerComponent.data.modelID = locItem.modelID;
                  localMarkerComponent.data.mediaID = locItem.mediaID;
                  localMarkerComponent.data.name = locItem.name;
                  localMarkerComponent.data.markerType = locItem.markerType;
                  localMarkerComponent.data.description = locItem.description;
                  localMarkerComponent.data.xpos = locItem.x;
                  localMarkerComponent.data.ypos = locItem.y;
                  localMarkerComponent.data.zpos = locItem.z;
                  localMarkerComponent.data.xrot = locItem.eulerx;
                  localMarkerComponent.data.yrot = locItem.eulery;
                  localMarkerComponent.data.zrot = locItem.eulerz;
                  localMarkerComponent.data.xscale = locItem.xscale;
                  localMarkerComponent.data.yscale = locItem.yscale;
                  localMarkerComponent.data.zscale = locItem.zscale;
                  localMarkerComponent.data.scale = locItem.markerObjScale;
                  localMarkerComponent.data.tags = locItem.locationTags;
                  localMarkerComponent.data.targetElements = locItem.targetElements;
               
                  localMarkerComponent.loadModel(locItem.modelID); 
                  localMarkerComponent.updateMaterials();
                  localMarkerComponent.loadMedia(locItem.mediaID); 

               }
               console.log("updating existing element " + type + " " + locationKey+ " : " + JSON.stringify(locItem));
               SaveLocalData();
               
               break;
            } else {
               
               // var buff = Buffer.from(JSON.stringify(locItem)).toString("base64"); //nope, node only...
               const buff = btoa(JSON.stringify(locItem));
               theEl.setAttribute("data-eldata", buff);
               MapUpdate(locationKey);
               console.log("setting theEl cloudMarker data " + locationKey);
               SaveLocalData();
            }
         } else {
            // SaveLocalData();
            console.log("DINT FIND THEEL " + locationKey);
            break;
            
         }
      }
   }
   
   // ShowHideDialogPanel();
   //if "L" key isdown?
   // SceneManglerModal('Locations');
}

function GrabLocation(locationKey) {
   console.log("tryna grablocation : " +locationKey);  
}

export function ToggleTransformControls (locationKey) {

   const transformEls = document.getElementsByClassName("transformControls");
   if (transformEls.length > 0) {
      for (var i=0; i<transformEls.length; i++) { //turn them all off!
         let transform_controls_component = transformEls[i].components.transform_controls;
         if (transform_controls_component) {
            transform_controls_component.detachTransformControls();
         } 
      }
   }

   const transformEl = document.getElementById(locationKey);
   console.log("tryna transform a location " + locationKey);

   

   if (transformEl) {
      console.log("gotsa transformEl for transform_control");
      let transform_controls_component = transformEl.components.transform_controls;
      if (transform_controls_component) {
         if (transform_controls_component.data.isAttached == true) {
            console.log("tryna detach transform_control " + transform_controls_component.data.isAttached);
            transform_controls_component.detachTransformControls();
           
         } else {
            console.log("tryna attach transform_control " + transform_controls_component.data.isAttached);
            transform_controls_component.attachTransformControls();
           
         }
      } else {
         console.log("tryna setattrribue transform_controls");
         transformEl.setAttribute("transform_controls", "");
      }
   }
}
function ToggleAllTransformControls () {
   const moddables = document.getElementsByClassName("allowMods");
   if (!transformAll) {
      for (var i=0; i<moddables.length; i++) {
         let transform_controls_component = moddables[i].components.transform_controls;
         if (transform_controls_component) {
            transform_controls_component.attachTransformControls();
         } else {
            moddables[i].setAttribute("transform_controls", "");
         }
      }
      transformAll = true;
   } else {
      for (var i=0; i<moddables.length; i++) {
         let transform_controls_component = moddables[i].components.transform_controls;
         if (transform_controls_component) {
            transform_controls_component.detachTransformControls();
         } 
      }
      transformAll = false;
   }
   // ShowHideDialogPanel();
}

export function SnapLocation(locationKey) { //snap selected object to player loc
  
   const snapEl = document.getElementById(locationKey);
   const cameraPosition = new THREE.Vector3(); 
   const viewportHolder = document.getElementById('viewportPlaceholder3');
   viewportHolder.object3D.getWorldPosition( cameraPosition );

   console.log("tryna snaplocation : " +locationKey + " to " + JSON.stringify(cameraPosition));
   if (snapEl != null) {
      // let scale = snapEl.getAttribute("scale");
      // snapEl.setAttribute("scale", 1);
      let snapx = cameraPosition.x.toFixed(2);
      let snapy = cameraPosition.y.toFixed(2);
      let snapz = cameraPosition.z.toFixed(2);
      // snapEl.setAttribute("scale", scale);
         document.getElementById('xpos').value = snapx; //update elements in the modal dialog
         document.getElementById('ypos').value = snapy;
         document.getElementById('zpos').value = snapz;
         // 
         snapEl.setAttribute('position', {"x": snapx, "y": snapy, "z": snapz});
         SaveModToLocal(locationKey);
      } else {
         console.log("couldnot find snapEl " + locationKey);
      } 
}

export function GoToPosRot (pos, rot) {
   console.log("tryna send player to " + JSON.stringify(pos));
   if (player) {
      player.setAttribute("position", {x: pos.x, y: pos.y, z: pos.z} );
   }
}

export function GoToLocation(locationKey) { //aframe only.. :(
   console.log("tryna goat locatioKey " + locationKey);
   // let location = JSON.parse(localStorage.getItem(locationKey));
   // if ((settings.sceneType.toLowerCase() == "aframe" || settings.sceneType.toLowerCase() == "default") && settings.hasBgMap) {
   //    //if there's a map, move viewport instead of player

   // } else {
   let targetEl = document.getElementById(locationKey);
   if (targetEl) { 
      let targetLocation = targetEl.getAttribute('position');
      if (targetLocation) {
      
         if (player == null) {
            player = document.getElementById('player');
         }

         let worldPos = new THREE.Vector3();
               // location.getWorldPosition(worldPos);
         worldPos = {'x': targetLocation.x, 'y': targetLocation.y + 1, 'z': targetLocation.z + 3};
        
         player.setAttribute('position', worldPos);
         console.log("target "+JSON.stringify(targetLocation)+ " vs. player " + JSON.stringify(player.getAttribute('position')));

         // } 
      }
   }
}

export function PlayerToLocation(worldPos) {
   
   console.log("tryna set PlayerToLocation " + JSON.stringify(worldPos));
   if (player) {
      player.setAttribute('position', worldPos);
   } 
}

export function GoToNext() {

   console.log("tryna gotonext " + settings.sceneType);
   // if ((settings.sceneType.toLowerCase() == "aframe" || settings.sceneType.toLowerCase() == "default") && settings.hasBgMap) { 
// if (currentLocationIndex > 0) {
   if (settings.sceneType == "mapbox") {
      
      var locbuttons = document.getElementsByClassName("locbutton");
      if (currentLocationIndex < locbuttons.length - 1) {
         currentLocationIndex++;
         if (currentLocationIndex == 0) {
            currentLocationIndex = 1
         }
      } else {
         currentLocationIndex = 1; //zero index is user location, so skip it
      }
      let lbData = locbuttons[currentLocationIndex].id;
      FlyToMapPosition(lbData.split("_")[0],lbData.split("_")[1], false);
    
   // } else if ((settings.sceneType.toLowerCase() == "aframe" || settings.sceneType.toLowerCase() == "default") && settings.hasBgMap) { 
      
   } else {
     
         let curveDriver = document.getElementById("cameraCurve");
         if (curveDriver && settings && timedEventsListenerMode ) {

            if (sceneLocations != null && curveLocations.length > 0) { 
               if (currentLocationIndex < curveLocations.length - 1) {
                  currentLocationIndex++;
               } else {
                  currentLocationIndex = 0;
                  
               }
               
               if (localData.locations) {
                  for (let i = 0; i < localData.locations.length; i++) {
                     if (localData.locations[i].timestamp == curveLocations[currentLocationIndex].timestamp) {
                        curveLocations[currentLocationIndex] = localData.locations[i];
                        console.log("curve currentLocationIndex " +  currentLocationIndex  +" curveLocations"  + JSON.stringify(curveLocations[currentLocationIndex]));
                        GoToLocation(curveLocations[currentLocationIndex].timestamp);
                        if (curveLocations[currentLocationIndex].targetElements && curveLocations[currentLocationIndex].targetElements.length > 0) {
                           let modCurveComponent = curveDriver.components.mod_curve;
                           if (modCurveComponent && curveLocations[currentLocationIndex].targetElements[0] != "none") {
                              // // let lookAtPosition = new THREE.Vector3();
                              // lookAtPosition.x = parseFloat(localData.locations[i].x);
                              // lookAtPosition.y = parseFloat(localData.locations[i].y);
                              // lookAtPosition.z = parseFloat(localData.locations[i].z);
                              let curvePointEl = document.getElementById(curveLocations[currentLocationIndex].targetElements[0]);
                              if (curvePointEl) {
                                 let lookPos = curvePointEl.getAttribute("position");
                                 modCurveComponent.lookAt(lookPos.x, lookPos.y, lookPos.z);
                              }
                              
                              // console.log("tryna lookat " + JSON.stringify(lookAtPosition));
                              // modCurveComponent.lookAt(parseFloat(localData.locations[i].x), parseFloat(localData.locations[i].y), parseFloat(localData.locations[i].z));
                              
                              break;
                           }
                        }
                     }
                  }
               }
               
            // hasCurve = true;
            // if (curveLocations.)
            // let modCurveComponent = curveDriver.components.mod_curve;
            // if (modCurveComponent) {
            //    modCurveComponent.moveToNext();
            // }
            //    // PlayPauseMedia();
            }
         } else {
            console.log("currentLocationIndex " +  currentLocationIndex  +" poiLocations"  + JSON.stringify(poiLocations));
            if (sceneLocations != null && poiLocations.length > 0) { 
               if (currentLocationIndex < poiLocations.length - 1) {
                  currentLocationIndex++;
               } else {
                  currentLocationIndex = 0;
                  
               }
            console.log("currentLocationIndex " +  currentLocationIndex  + " " + JSON.stringify(poiLocations));
            GoToLocation(poiLocations[currentLocationIndex].timestamp);
            document.getElementById("footerText").innerHTML = poiLocations[currentLocationIndex].name;

         }

      }
      if (skyboxEl != null) {
         skyboxEl.components.skybox_dynamic.nextSkybox();
      } else {
         console.log("no skyboxEl!");
      }
      // let tunnels = document.getElementsByTagName("mod_tunnel");
      let tunnels = document.querySelectorAll("[mod_tunnel]")
      if (tunnels) {
         for (let i = 0; i < tunnels.length; i++) {
            console.log("gotsa tunnel tryna switch texture...");
            tunnels[i].components.mod_tunnel.randomTexture();
         }
      }
      if (socket) {
         // EmitSelfPosition();
      }
         
   }
}
// }
export function GoToPrevious() {

   if (settings.sceneType == "mapbox") {
      
      var locbuttons = document.getElementsByClassName("locbutton");
      if (currentLocationIndex > 0) {
         currentLocationIndex--;
         if (currentLocationIndex == 0) {
            currentLocationIndex = locbuttons.length - 1;
         }
      } else {
         currentLocationIndex = locbuttons.length - 1;
      }
      let lbData = locbuttons[currentLocationIndex].id;
      FlyToMapPosition(lbData.split("_")[0],lbData.split("_")[1], false);
    
   } else {
      let hasCurve = false;
      if (localData.settings.sceneTags && localData.settings.sceneTags.includes("follow path")) {
         let curveDriver = document.getElementById("cameraCurve");
         if (curveDriver && settings && timedEventsListenerMode ) {
            hasCurve = true;
         let modCurveComponent = curveDriver.components.mod_curve;
            if (modCurveComponent) {
               modCurveComponent.moveToNext();
               // PlayPauseMedia();
            }
         }
      }
      console.log("poiLocations length " + poiLocations.length);
      if (sceneLocations != null && poiLocations.length > 0) {
         if (currentLocationIndex > 0) {
            currentLocationIndex--;
         } else {
            currentLocationIndex = poiLocations.length - 1;
         }
         
         GoToLocation(poiLocations[currentLocationIndex].timestamp);
         let curveDriver = document.getElementById("cameraCurve");
         if (!curveDriver) {
            document.getElementById("footerText").innerHTML = poiLocations[currentLocationIndex].name;
         }// }
      }
      if (skyboxEl != null) {
         skyboxEl.components.skybox_dynamic.previousSkybox();
      }
      let tunnels = document.querySelectorAll("[mod_tunnel]")
      if (tunnels) {
         for (let i = 0; i < tunnels.length; i++) {
            console.log("gotsa tunnel tryna switch texture...");
            tunnels[i].components.mod_tunnel.randomTexture();
         }
      }
   }
}

export function ReturnLocationTable () { //just show em all now!

   let tablerows = "";
   // console.log("localData.locations " + JSON.stringify(localData.locations) );
   if (!localData.locations.length) {
     
      for (let i = 0; i < sceneLocations.locations.length; i++) {
         let markerString = "";
         if (sceneLocations.locations[i].isLocal != null && sceneLocations.locations[i].isLocal === true) {
            markerString = "<span style=\x22color: skyblue; font-weight: bold;\x22>"+sceneLocations.locations[i].markerType+"</span>";
         } else {
            markerString = "<span style=\x22color: lime; font-weight: bold;\x22>"+sceneLocations.locations[i].markerType+"</span>";
         }        
         let namelabel = (sceneLocations.locations[i].name != 'undefined' && sceneLocations.locations[i].name != undefined && sceneLocations.locations[i].name != null) ? sceneLocations.locations[i].name : sceneLocations.locations[i].label; 
         tablerows = tablerows + "<tr class=\x22clickableRow\x22 onclick=\x22LocationRowClick('"+sceneLocations.locations[i].timestamp+"')\x22><td>"+namelabel+"</td>"+
         "<td>"+sceneLocations.locations[i].x+","+sceneLocations.locations[i].y+","+sceneLocations.locations[i].z+"</td><td>"+sceneLocations.locations[i].model+"</td><td>"+ markerString+"</td></tr>";
      }
   } else {
      for (let i = 0; i < localData.locations.length; i++) {
         localData.locations[i].x = parseFloat(localData.locations[i].x).toFixed(2).toString();
         localData.locations[i].y = parseFloat(localData.locations[i].y).toFixed(2).toString();
         localData.locations[i].z = parseFloat(localData.locations[i].z).toFixed(2).toString();
         // localData.locations[i].y = localData.locations[i].y.toFixed(2);
         // localData.locations[i].z = localData.locations[i].z.toFixed(2);
         let namelabel = (localData.locations[i].name != 'undefined' && localData.locations[i].name != undefined && localData.locations[i].name != null) ? localData.locations[i].name : localData.locations[i].label; 
         let namestring = "<span style=\x22color: white; \x22>"+namelabel+"</span>";
         if (localData.locations[i].isLocal != null && localData.locations[i].isLocal === true) {
            namestring = "<span style=\x22color: skyblue; \x22>"+namelabel+"</span>";
            // hasLocalData = true;
         }  

         let markerString = "<span style=\x22color: white; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         if (localData.locations[i].markerType == "waypoint") {
            markerString = "<span style=\x22color: lime; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "poi") { 
            markerString = "<span style=\x22color: blueviolet; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "placeholder") { 
            markerString = "<span style=\x22color: yellow; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         }  else if (localData.locations[i].markerType == "character") { 
            markerString = "<span style=\x22color: aqua; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         }  else if (localData.locations[i].markerType == "gate") { 
            markerString = "<span style=\x22color: coral; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "object") { 
            markerString = "<span style=\x22color: salmon; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "trigger") { 
            markerString = "<span style=\x22color: LightSalmon; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "collider") { 
            markerString = "<span style=\x22color: firebrick; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "navmesh") { 
            markerString = "<span style=\x22color: skyblue; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "light") { 
            markerString = "<span style=\x22color: palegoldenrod; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "curve point") { 
            markerString = "<span style=\x22color: blue; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } else if (localData.locations[i].markerType == "player") { 
            markerString = "<span style=\x22color: lime; font-weight: bold;\x22>"+localData.locations[i].markerType+"</span>";
         } 

         // console.log("locMdl " +localData.locations[i].model + " " + localData.locations[i].modelID);

         let mAsset = (localData.locations[i].model || localData.locations[i].model == undefined || localData.locations[i].model == 'undefined' || localData.locations[i].model == "none") ? localData.locations[i].model : null;
         if (localData.locations[i].modelID && localData.locations[i].modelID.toString().includes("primitive")) {
            if (localData.locations[i].modelID.toString().includes("cube")) {
               mAsset = "Cube";
            }  else if (localData.locations[i].modelID.toString().includes("sphere")) {
               mAsset = "sphere";
            }  else if (localData.locations[i].modelID.toString().includes("cylinder")) {
               mAsset = "cylinder";
            } 
           
         }
         let oAsset = (localData.locations[i].objectName || localData.locations[i].objectName == undefined || localData.locations[i].objectName == 'undefined' || localData.locations[i].objectName == "none") ? localData.locations[i].objectName : null;
         let lAsset = (localData.locations[i].filename || localData.locations[i].filename == undefined || localData.locations[i].filename == 'undefined' || localData.locations[i].filename == "none") ? localData.locations[i].filename : null;
         let fAsset = (localData.locations[i].title || localData.locations[i].title == undefined || localData.locations[i].title == 'undefined' || localData.locations[i].title == "none") ? localData.locations[i].title : null;

         let asset = 'none';
         if (mAsset) {
            asset = mAsset;
         }
         if (oAsset) {
            asset = oAsset;
         }
         if (lAsset) {
            asset = lAsset;
         }
         if (fAsset) {
            asset = fAsset;
         }
         tablerows = tablerows + "<tr class=\x22clickableRow\x22 onclick=\x22LocationRowClick('"+localData.locations[i].timestamp+"')\x22><td>"+namestring+"</td><td>"+localData.locations[i].timestamp+"</td>"+
         "<td>"+localData.locations[i].x+", "+localData.locations[i].y+", "+localData.locations[i].z+"</td><td>"+asset+"</td><td>"+ markerString+"</td></tr>";
      }
   }
   return "<table id=\x22locations\x22><th style=\x22color: black;\x22>Name</th><th style=\x22color: black;\x22>ID</th><th style=\x22color: black;\x22>Position</th><th style=\x22color: black;\x22>Asset</th><th style=\x22color: black;\x22>Type</th>"+tablerows+"</table>";
}

function LocationRowClick(data) {
  
   console.log("location row click: " + data);
   ShowHideDialogPanel();
   // ShowLocationModal(data);
   // selectedLocationTimestamp = data;
   SetSelectedLocationTimestamp(data);
   SceneManglerModal('Location');
   // ShowLocationModal(isCloud, data);
}

export function CreateLocationAlt (filename, type, position, timestamp) { //for not-aframe views, args null by default

   console.log("trynsa createlocation with file " + filename + " type " + type + " position " + JSON.stringify(position));
   // let timestamp = null;
   let markertype = "placeholder";
   
   let modelID = "none";
   let mediaID = "none";
   if (filename && type) {
      markertype = type;
      if (type == "model") {
         modelID = filename;
      } else if (type == "picture") {
         mediaID = filename;
      }
   }
   // if (type) {
   //    markertype = type;
   // }
   
   console.log("tryna create new location type " + markertype);
   let newPosition = {}; 
   if (!position) { //if added from dialog instead of with picker
      // let viewportHolder = document.getElementById('viewportPlaceholder');
      newPosition.x = selectedPosition.x;
      newPosition.y = 0;
      newPosition.z = selectedPosition.y; 
      // viewportHolder.object3D.getWorldPosition( newPosition );
   } else {
      newPosition = position;
   }  

   console.log("new position for placeholder " + JSON.stringify(newPosition));

   let phEl = document.createElement('div');
   document.body.appendChild(phEl);
   // var sceneEl = document.querySelectorAll('a-scene')[0];
   
   // phEl.setAttribute('skybox-env-map', '');
   // timestamp = timestamp;
   // timestamp = parseInt(timestamp);
   let locItem = {};
   locItem.x = newPosition.x.toString();
   locItem.eulerx = 0; //maybe get look vector?
   locItem.y = newPosition.y.toString();
   locItem.eulery = 0;
   locItem.z = newPosition.z.toString();
   locItem.eulerz = 0;
   locItem.type = "Worldspace";
   locItem.label = 'local ' + markertype;
   locItem.name =  'local ' + markertype;
   locItem.description = '';
   locItem.markerType = markertype;
   locItem.eventData = '';
   locItem.isNew = true;
   locItem.timestamp = timestamp;
   locItem.xscale = 1;
   locItem.yscale = 1;
   locItem.zscale = 1;
   locItem.locationTags = '';
   locItem.phID = timestamp;
   locItem.modelID = modelID;
   locItem.mediaID = mediaID;
   locItem.isLocal = true;
   if (!localData) {
      localData = {};
   }
   if (!localData.locations) {
      localData.locations = [];
      localData.locations.push(locItem);
   } else {
      localData.locations.push(locItem);
   }
   

   poiLocations.push(locItem);

   phEl.classList.add("local_marker");
   phEl.id = timestamp;
   let data = {markerType: locItem.markerType, 
               timestamp: timestamp, 
               isNew: true, 
               xpos: locItem.x, 
               ypos: locItem.y, 
               zpos: locItem.z, 
               xscale: locItem.xscale,
               yscale: locItem.yscale,
               zscale: locItem.zscale,
               mediaID: locItem.mediaID, 
               modelID: locItem.modelID};
   
   phEl.setAttribute('data-elData', JSON.stringify(data));
   SaveLocalData();
}


export function CreateLocation (filename, type, position) { //AFRAME New Location button, also addToScene button for localfiles
   console.log("trynsa createlocation with file " + filename + " type " + type + " position " + JSON.stringify(position));

   if (settings.hasBgMap) {
      console.log("NOPE, when there's a bg map do this only in VTT mode for now!");
      return;
   }
   let timestamp = null;
   let markertype = "placeholder";
   
   let modelID = "none";
   let mediaID = "none";
   if (filename && type) {
      markertype = type;
      if (type == "model") {
         modelID = filename;
      } else if (type == "picture") {
         mediaID = filename;
      }
   }
   // if (type) {
   //    markertype = type;
   // }
   
   console.log("tryna create new location type " + markertype);
   let newPosition = new THREE.Vector3(); 
   if (!position) { //if added from dialog instead of with picker
      let viewportHolder = document.getElementById('viewportPlaceholder');
      viewportHolder.object3D.getWorldPosition( newPosition );
   } else {
      newPosition = position;
   }  

   console.log("new position for placeholder " + JSON.stringify(newPosition));
   let phEl = document.createElement('a-entity');
   var sceneEl = document.querySelectorAll('a-scene')[0];
   
   phEl.setAttribute('skybox-env-map', '');
   timestamp = Date.now();
   timestamp = parseInt(timestamp);
   let locItem = {};
   locItem.x = newPosition.x.toString();
   locItem.eulerx = 0; //maybe get look vector?
   locItem.y = newPosition.y.toString();
   locItem.eulery = 0;
   locItem.z = newPosition.z.toString();
   locItem.eulerz = 0;
   locItem.type = "Worldspace";
   locItem.label = 'local ' + markertype;
   locItem.name =  'local ' + markertype;
   locItem.description = '';
   locItem.markerType = markertype;
   locItem.eventData = '';
   locItem.isNew = true;
   locItem.timestamp = timestamp;
   locItem.xscale = 1;
   locItem.yscale = 1;
   locItem.zscale = 1;
   locItem.locationTags = '';
   locItem.phID = timestamp;
   locItem.modelID = modelID;
   locItem.mediaID = mediaID;
   locItem.isLocal = true;
   if (!localData) {
      localData = {};
   }
   if (!localData.locations) {
      localData.locations = [];
      localData.locations.push(locItem);
   } else {
      localData.locations.push(locItem);
   }
   

   poiLocations.push(locItem);

   phEl.setAttribute('position', newPosition);
   phEl.setAttribute('local_marker', {markerType: locItem.markerType, 
                                       timestamp: timestamp, 
                                       isNew: true, 
                                       xpos: locItem.x, 
                                       ypos: locItem.y, 
                                       zpos: locItem.z, 
                                       xscale: locItem.xscale,
                                       yscale: locItem.yscale,
                                       zscale: locItem.zscale,
                                       mediaID: locItem.mediaID, 
                                       modelID: locItem.modelID} );

   sceneEl.appendChild(phEl);

   let nextbuttonEl = document.getElementById('nextButton');
   let prevbuttonEl = document.getElementById('previousButton');
   nextbuttonEl.style.visibility = "visible";
   prevbuttonEl.style.visibility = "visible";

   SaveLocalData();
   // if (locItem.modelID != "none" ) {
   //    // phEl.components.local_marker.loadModel(locItem.modelID);
   //    window.location.reload();
   // }
}

function ToggleCameraLock () {
   
   if (camLockButton) {
      allowCameraLock = !allowCameraLock;
      if (allowCameraLock) {
         console.log("allowCameraLock " + allowCameraLock);
         camLockButton.classList.add("camlock_button_locked");
         camLockButton.classList.remove("camlock_button_unlocked");
         let icon = camLockButton.getElementsByTagName('i')[0];
         icon.className = '';
         icon.classList.add("fa-solid", "fa-lock", "fa-2x");

      } else {
         console.log("allowCameraLock " + allowCameraLock);
         camLockButton.classList.add("camlock_button_unlocked");
         camLockButton.classList.remove("camlock_button_locked");
         let icon = camLockButton.getElementsByTagName('i')[0];
         icon.className = '';
         icon.classList.add("fa-solid", "fa-lock-open", "fa-2x");
      }
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

export function UpdateUserData(userData) {

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
            // if (settings.sceneType != "aframe" && settings.sceneType != "default") {
            InitIDB();  
            // }
            
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
                  userData.authLevel = data.authLevel;
                  console.log("userData " + JSON.stringify(userData));
                  // if (settings.sceneType != "aframe" && settings.sceneType != "default") {
                  //    InitIDB();  
                  // }
                  InitIDB();
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



export function InitSocket () {
if (settings && !socket) {
   const aColor = RandomHexColor();
   console.log ("tryna InitSocket with color " + aColor);

   socket = io.connect(socketHost, {
         query : {
            token: token,
            uname: avatarName,
            color: aColor,
            room: room
         },
         url: socketHost + "/socket.io/?EIO=4&transport=polling&t=NNjNltH",
         autoConnect: true,  //connection is opened if token checks out above
         reconnection: true,
         transports: ['websocket']
         });      
      }

   socket.on('connect', function() {
   
      isConnected = true;
      console.log("tryna join " + avatarName + " socketID " + socket.id);
      mySocketID = socket.id;
      socket.emit('join', room, avatarName, "web");
      const disconnectButton = document.getElementById("disconnectButton");
      disconnectButton.removeAttribute("hidden");
   
   });

   socket.on('user joined', function(data) {
      console.log("room user " + data + 'joined room ' + room);
      socket.emit('room users', room);
      UpdatePlayerAvatars(roomUsers);
      // EmitSelfPosition();
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
      let simpleUsers = [];
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
         
      //   $('#users').prepend($('<button class=\x22btn\x22 style=\x22margin: 5px 5px 5px 5px;\x22><h4><strong>').text( value ).append("</strong></h4></button>"));
         if (value.includes("~")) {
            let split = value.split("~"); //color is appended to username
            split[0] = split[0].replace("_", " ");
            roomUsersString += isMe + "<a href=\x22#\x22 class=\x22tooltip\x22 style=\x22color:"+split[1]+"\x22>"+ split[0]+"<span class=\x22tooltiptext\x22>"+split[0]+"</span></a>, ";
            let u = {};
            u.name = split[0];
            u.color = split[1];

            simpleUsers.push(u);
         } else {
            roomUsersString += value + ", ";
         } 

         // if (usercount == 0) { 
         //    simpleUsers = simpleUsers + value;  
         // } else {
         //    simpleUsers = simpleUsers + ", " + value;
         // }
         usercount++;
      }

      roomUsersString = roomUsersString.substring(0, roomUsersString.length - 2); //trim last comma and trailing space
      roomUsersString = usercount + " users connected: " + roomUsersString;
      // console.log(roomUsersString);
      $('#users').html(roomUsersString);
      stringRoomUsers = roomUsersString;

      if (usercount > 0) {
         const playerHudEl = document.getElementById("player_hud");
         if (playerHudEl) {
            if (playerHudEl.components.player_hud) {
            playerHudEl.components.player_hud.ShowConnectedUsersAndHide(usercount, simpleUsers);
            }
         }
      }
      // $('#users_2').html(roomUsersString);
      // EmitSelfPosition();
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
      // EmitSelfPosition();
   });

   socket.on('selfplayerposition', function() {
      let pAvatar = document.getElementById(mySocketID);
      if (pAvatar != null) {
         pAvatar.setAttribute('position', cameraPosition.x + " " + cameraPosition.y + " " + cameraPosition.z);
      }
   });

   socket.on('disconnect', function() {
      console.log("disconnect event! " + socket + "connected user count is now " + roomUsers.length);
      UpdatePlayerAvatars(roomUsers);
   });
   socket.on('user left', function(id) {
      console.log("user left with socket id " + id + " vs roomUsers " + JSON.stringify(roomUsers));


   });
} //InitSocket end
// } //end if settings.hideAvatars
function MoveElement(id,posRotObj) { //jesjus wweeeeped//nopr
   var element = document.getElementById(id);
   var iteration = 0;
   var interval = setInterval(function() {
      iteration++
      if (iteration < 10) { 
         var currentPos = element.getAttribute('position');
         var lerpedPos = {};
         lerpedPos.x = lerp(currentPos.x, posRotObj.position.x, .1).toFixed(2);
         lerpedPos.y = lerp(currentPos.y, posRotObj.position.y, .1).toFixed(2);
         lerpedPos.z = lerp(currentPos.z, posRotObj.position.z, .1).toFixed(2);
         var currentRot = element.getAttribute('rotation');
         var currentQuat = Quaternion.fromEuler(currentRot);
         var lerpedRot = {};
         // var lerpedQuat = {};
         var targetQuat = Quaternion.fromEuler(posRotObj.rotation);
         var lerpedQuat = currentQuat.slerp(targetQuat)(0), currentQuat;
         //(q1.slerp(q2)(0), q1);

         // lerpedRot.x = 
         // lerpedRot.x = lerp(currentRot.x, posRotObj.rotation.x, .1).toFixed(2);
         // lerpedRot.y = lerp(currentRot.y, posRotObj.rotation.y, .1).toFixed(2);
         // lerpedRot.z = lerp(currentRot.z, posRotObj.rotation.z, .1).toFixed(2);
         console.log("currentRot " + JSON.stringify(currentRot) + "updatedRot " + JSON.stringify(posRotObj.rotation), " lerpedRot " + JSON.stringify(lerpedQuat));
         element.setAttribute('position', lerpedPos);
         element.setAttribute('rotation', Quaternion.lerpedQuat.toVector());
      } else {
         clearInterval(interval);
      }
   }, 100);
}

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

// function SetLastPosition () {
//    setTimeout(function () {
//       lastPosition = cameraPosition;
//       lastRotation = cameraRotation;
//    }, 1000);
// }

export function UpdatePlayerPosRot (position, rotation) { //called from navigation when player moves
   playerPosition = position;
   playerRotation = rotation;
   EmitSelfPosition();
   
   if (profile) {
      UpdateLocalPlayerState(profile, room);
      // console.log("writing profile posrot to localdb");
   } 
}

function EmitSelfPosition() {

   if (!settings.hideAvatars) {   
      
      if (emitInterval == null && playerPosition && playerRotation) { 
         let count = 0;
         emitInterval = setInterval(function(){
               if (count <= 6) { 
                  count++;
                  if (socket) {
                     console.log("tryna emit self pos " + JSON.stringify(playerPosition) + " rot " +JSON.stringify(playerRotation));
                     socket.emit("updateplayerposition", room, avatarName, playerPosition.x, playerPosition.y, playerPosition.z, playerRotation.x, playerRotation.y, playerRotation.z, mySocketID, "aframe"); 
                     
                  }
                 
               } else {
                  clearInterval(emitInterval);
                  emitInterval = null;
               }
            }, 500);
         }
      }
   }
                  
                  
               // }
         // }
   //    } else {
   //       if (settings && (settings.sceneType.toLowerCase() == "aframe" || settings.sceneType.toLowerCase() == "default")) {
   //          console.log("caint fine no player!");
   //          posRotReader = document.getElementById("player").components.get_pos_rot; 
   //       } else { //for vtt maps



   //       }
   //    }
   // }
// }

// function EmitSelfPosition() {


//    if (!settings.hideAvatars) {   
      
//       if (posRotReader != null) {   //used by aframe
//          if (!posRotRunning) {
//             posRotRunning = true;
//             // if (emitInterval == null) { 
//             emitInterval = setInterval(function(){

//                var posRotObj = posRotReader.returnPosRot();
//                cameraPosition = posRotObj.pos;
//                cameraRotation = posRotObj.rot;
//                // console.log(cameraPosition.x.toString() + " vs " + window.playerPosition.x.toString());
//                // if (JSON.stringify(cameraPosition) != lastPosition && JSON.stringify(cameraRotation) != lastRotation) {
//                if (JSON.stringify(cameraPosition) != lastPosition) {
//                      // console.log('emitting!');
//                   // window.playerPosition = cameraPosition;
//                   if (socket) {
//                      socket.emit("updateplayerposition", room, avatarName, cameraPosition.x, cameraPosition.y, cameraPosition.z, cameraRotation.x, cameraRotation.y, cameraRotation.z, mySocketID, "aframe"); 
                     
//                   }
                  
//                   if (writeCount > 2) {
//                      console.log("tryna write " + writeCount);
//                      lastPosition = JSON.stringify(cameraPosition);
//                      // lastRotation = cameraRotation;
//                      if (profile) {

//                         // if (profile.lastPosition != lastPosition) {
//                            profile.lastPosition = cameraPosition;
//                            profile.lastRotation = cameraRotation;
//                            // console.log("userData with position " + JSON.stringify(profile));
//                            UpdateLocalPlayerState(profile);
//                         // }
//                      }   // lastRotation = JSON.stringify(cameraRotation);       
//                   }              
//                writeCount++;
//                }

//             }, 250);
//          // } else {
//          //    clearInterval(emitInterval);
//          //    emitInterval = null;
//          }
//       } else {
//          if (settings && (settings.sceneType.toLowerCase() == "aframe" || settings.sceneType.toLowerCase() == "default")) {
//             console.log("caint fine no player!");
//             posRotReader = document.getElementById("player").components.get_pos_rot; 
//          } else { //for vtt maps



//          }
//          // EmitSelfPosition();
//       }
//    }
// }

function shallowEqual(object1, object2) {
   const keys1 = Object.keys(object1);
   const keys2 = Object.keys(object2);
 
   if (keys1.length !== keys2.length) {
      lastPosition = cameraPosition;
      lastRotation = cameraRotation;
      return false;
     
   }
 
   for (let key of keys1) {
     if (object1[key] !== object2[key]) {
       return false;
     }
   }
 
   return true;
 } 

// $('form').submit(function(e){
//     e.preventDefault();
//     var message = $('#chat_input').val();
//     console.log("tryna send " + message);
//     $('#future').prepend($('<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightgreen\x22>').html( ">you:</span> " +  message).append("<hr>"));
//     socket.emit('user message', message); //but not to ourselfs
//     UpdateContentBox();
//     document.getElementById("chat_input").value = "";
// });
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
export function ReturnPlayerData() { //return my un/color to set marker at current map coordinates
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
export function Disconnect() {
   console.log("tryna disconnect..");
   socket.disconnect();
   if (sceneEl) {
      let roomAvatars = sceneEl.querySelectorAll('.avatar');
      for (var a=0; a<roomAvatars.length; a++) { //clean up disconnected avatars
         roomAvatars[a].remove();
      }
   }
   $('#users').html("disconnected");
      const disconnectButton = document.getElementById("disconnectButton");
      disconnectButton.style.display = "none";
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
            console.log("tryna remove duplicate " + roomAvatars[a].id)
            roomAvatars[a].remove();
         }
      }
   }
}

export function AvatarClicked(sid) {
   console.log("AvatarClicked " + sid);
   SceneManglerModal('Messages');
}

// function UpdatePlayerPosition(sid, px, py, pz) { //nevermind
//    var keys = Object.keys(roomUsers);
//    for(var i=0; i<keys.length; i++){
//       var key = keys[i];
//       console.log(key, roomUsers[key]);
//       if (keys[i] === sid) {
//          console.log(roomUsers[key] + " is moving!");
         
//       }
//    }
// }

InitContentBox();
// window.onload = init;
// if (document.querySelector(".avatarName")) {
//    avatarName = document.querySelector(".avatarName").id;
// }

var context;    // Audio context
var buf;        // Audio buffer

function InitSceneHooks(type) {
   // window.sceneType = type; //global that needs to get sniffed
   console.log("tryna InitSceneHooks window.sceneType " + window.sceneType);
   if (window.sceneType == "Default" || window.sceneType == "AFrame") {
      window.sceneType == "aframe";
      EmitSelfPosition();
   }   
}

function ShowARButton (usdzURL) { //for iOS only

   // $(".enter-ar").css('visibility',"visible");
   // "<div id=\x22arButton\x22 class=\x22ar-button-div\x22><button class=\x22a-enter-ar-button\x22></button></div>";
    //should only be true on recent ios devices
    console.log("tryna ShowARButton for " + usdzURL);
   let isIOS = (/iPad|iPhone|iPod/.test(navigator.platform) ||
   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
   !window.MSStream;
   // if (isIOS) {
   //    console.log("isIOS is true!");
   //    let vrButton = document.querySelector("")
   //    document.querySelector(".a-enter-vr-button").style.display = 'none';
   // }
   const a = document.createElement('a');
   supportsAR = a.relList.supports('ar') ? true : false;
   // supportsAR = true;
   if (isIOS || supportsAR) {
   console.log("tryna make an ar button for " +  usdzURL);
   // sceneEl.setAttribute("vr-mode-ui", "enabled", "false");
   // const bdiv = document.createElement('div');
      // bdiv.classList.add('a-enter-ar');
   // const button = document.createElement('a');
   const button = document.querySelector(".ar-button");
   button.id = "arButton";
   // button.classList.add('ar-button');
   // button.innerHTML = "AR";
   // button.setAttribute('href', usdzURL);
   button.href = usdzURL;
   button.style.display = "inline";
   // bdiv.appendChild(button);
   // document.body.appendChild(button);
   // button.addEventListener('click', function() {
   //    const anchor = document.createElement('a');
   //    anchor.setAttribute('rel', 'ar');
   //    anchor.appendChild(document.createElement('img'));//needs a fake img too
   //    anchor.setAttribute('href', usdzURL);
   //    anchor.click();
   //    });
      } else {
            console.log("platform doesn't support apple xr files");
            
      }


}

// function PreviewUSDZ(usdzSrc) { //or reality files
//    console.log("tryna load a usdz " + usdzSrc);
//    // check for AR support
//   const a = document.createElement('a'),
//        supportsAR = a.relList.supports('ar') ? true : false;

//    // if the host device supports AR Quick Look...
//    if ( supportsAR ) {
//        const anchor = document.createElement('a');
//        anchor.setAttribute('rel', 'ar');
//        anchor.appendChild(document.createElement('img'));
//        anchor.setAttribute('href', usdzSrc);
//        anchor.click();
//    } else {
//        console.log("unsupported environment for usdz (must be ios!)");
//    }

// }

// function 
// function 
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

export function InitCurves() {
   console.log("tryna InitCurves() " + JSON.stringify(settings.sceneTags));
   let curvePointEls = document.querySelectorAll(".curvepoint");
   if (curvePointEls.length) {
      let curvePoints = [];
     
      for (let i = 0; i < curvePointEls.length; i++) {
         let curvePointWithIndex = {};
         curvePointWithIndex.position = curvePointEls[i].getAttribute('position');
         let cloudMarkerComponent = curvePointEls[i].components.cloud_marker; //check for indexes at location.desc
         if (cloudMarkerComponent) {
           
            if (parseInt(cloudMarkerComponent.data.description)) {//hrm, use tags or eventData?
               console.log("curvepoint index is " + parseInt(cloudMarkerComponent.data.description));
               curvePointWithIndex.index = parseInt(cloudMarkerComponent.data.description);
               curvePoints.push(curvePointWithIndex);
            } else {
               console.log(" curvepoint index is " + i);
               curvePointWithIndex.index = i; //todo get from component
               curvePoints.push(curvePointWithIndex);
            }
         } else {
            let localMarkerComponent = curvePointEls[i].components.local_marker;
            if (parseInt(localMarkerComponent.description)) {
               console.log("local curvepoint index is " + parseInt(localMarkerComponent.data.description)); //kinda sad
               curvePointWithIndex.index = parseInt(localMarkerComponent.data.description);
               curvePoints.push(curvePointWithIndex);
            } else {
               console.log("local curvepoint index is " + i);
               curvePointWithIndex.index = i; //todo get from component
               curvePoints.push(curvePointWithIndex);
            }
         }
         
         if (i == curvePointEls.length - 1) {
            console.log("gots curvepoints " + JSON.stringify(curvePoints) + " with sceneTags " + JSON.stringify(settings.sceneTags) );
            let curveEl = document.createElement("a-entity");
            var scene = document.querySelector('a-scene');
            scene.appendChild(curveEl);
            curveEl.setAttribute("position", "0 0 0");
            let lookAt = "";
            if (settings.sceneTags.includes("look next") || settings.sceneTags.includes("lookat next")) {
               lookAt = "next";
               console.log("setting lookAtNext to "+ lookAt);
            } else if (settings.sceneTags.includes("look ahead")) {
               lookAt = "ahead";
               console.log("setting lookAtNext to " + lookAt);
            }
            let closeLoop = false;
            if (settings.sceneTags && (settings.sceneTags.includes("close loop") || settings.sceneTags.includes("closed") || settings.sceneTags.includes("close curve") || settings.sceneTags.includes("close path"))) {
               closeLoop = true;
               console.log("setting closeLoop to "+ closeLoop);
            }
            curveEl.setAttribute("mod_curve", {"useCurvePoints": true, "curvePoints": curvePoints, "isClosed": closeLoop, "lookAt": lookAt });
            
         }

      }
     

   } else {
      console.log("din't find no curvepoints");
   }
}

function InitContentBox () {
   console.log("tryna InitContentBox");
   var coll = document.getElementsByClassName("collapsible");
   var i;

   for (i = 0; i < coll.length; i++) {
   coll[i].addEventListener("click", function() {
      console.log("collapsible click");
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
         content.style.maxHeight = null;
      } else {
         content.style.maxHeight = content.scrollHeight + "px";
      }
   });
   }
}
function ShowHideContentBox () {
   var coll = document.getElementsByClassName("collapsible");
   
   coll[0].click();

}