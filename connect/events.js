
import { sceneLocations, GoToNext, GoToPrevious, videoEl, localData } from "../../connect/connect.js";
import { primaryAudioEl, youtubePlayer, youtubeIsPlaying, primaryAudioHowl } from "../../connect/media.js";

let timeKeysIndex = 0;
let listenerInterval = null;
let pauseLoops = false;
let loopIntervals = [];
let eventTriggersSet = false;

let timed_event = new Event("timed-event");
export let eventEl = document.createElement("div");
eventEl.id = "eventEl";

export let selectedPosition = {};
export let timeKeysData = {};
export let tkStarttimes = [];
export let timedEventsListenerMode = "";
////////////////////////////////////// main method for timed events listening to all the things.../////////////////////////


export function SetSelectedPosition(tilename, xpos, ypos) { //for vtt/not aframe views
   selectedPosition.x = xpos;
   selectedPosition.y = ypos;
   selectedPosition.tilename = tilename; 
}


export function ResetTimedEvents () {
    timeKeysIndex = 0;
}
//    SetEventTriggers();
// function SetEventTriggers () {
//    eventTriggersSet = true;

//    beatEvent = new CustomEvent('beat-event', {
//    bubbles: true,
//    detail: {
//       message: 'Data passed with the event',
//       timestamp: Date.now()
//    }
// });
// }

function TimedEventListener () { 
//  console.log("TimedEventsListener " + timedEventsListenerMode + " isplaying " +primaryAudioHowl.playing());
 // let primaryAudioTime = 0;
 timeKeysIndex = 0;
 let timekey = 0;
//  let vidz = document.getElementsByTagName("video");
//  let videoEl = null;
//  if (vidz != null && vidz.length > 0) { //either video or audio, not both...?
//    videoEl = vidz[0];
//    console.log("videoEl " + videoEl.id);
//  }
 if (timeKeysData != null && timeKeysData.timekeys != undefined && timeKeysData.timekeys.length > 0) {
   
   let listenerInterval = setInterval(function () {
      timekey = parseFloat(tkStarttimes[timeKeysIndex]);
      //  console.log(timekey);
      if (timekey && timekey != NaN) {//not not a number
      if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
         // if (hasPrimaryAudio) {
            // if (timeKeysData.timekeys[timeKeysIndex].keytype == "Reset Timekeys") {
            //    timeKeysIndex = 0;
            // }

            if (primaryAudioHowl && primaryAudioHowl != undefined && primaryAudioHowl != null && primaryAudioHowl.playing()) {
               
               // primaryAudioEl.components.primary_audio_control.updateStatus(true);

               let primaryAudioTime = primaryAudioHowl.seek();
               // console.log(primaryAudioTime + " vs " + timekey);
               
               if (primaryAudioTime != 0 && primaryAudioTime < .2) { //fudge in case
                  timeKeysIndex = 0; 
                  console.log("resetting timekeysindex!");
               }
               if (primaryAudioTime != 0 && primaryAudioTime < timekey) {
                     // console.log(primaryAudioTime + "less than " + timekey);
                     //just waiting...
               } else {
                  if (timeKeysIndex < tkStarttimes.length) {
                     console.log("TRYNA PLAY TIMEKEY "+ JSON.stringify(timeKeysData.timekeys[timeKeysIndex]) +" at primaryAudioTime "+ primaryAudioTime.toString() );
                     PlayTimedEvent(timeKeysData.timekeys[timeKeysIndex]);
                     timeKeysIndex++;
                  } else {
                     console.log("end");
                     clearInterval(listenerInterval);
                     
                  }
               }
            }
            // }
         } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary video') {
            if (videoEl != null && !videoEl.paused && timekey > 0) {
             console.log(videoEl.currentTime + " timeKeysIndex " + timeKeysIndex + " type " + timeKeysData.timekeys[timeKeysIndex].keytype);
               // if (timeKeysData.timekeys[timeKeysIndex].keytype == "Reset Timekeys") {
               //    timeKeysIndex = 0;
               //    // videoEl.currentTime = 0;
               // }
               if (videoEl.currentTime < 1) {
                  timeKeysIndex = 0; 
                  console.log("resetting timekeysindex!");
               }
               if (videoEl.currentTime <= timekey) {
                  //prease stanby...
               } else {
                  if (timeKeysIndex < tkStarttimes.length) {
                     // console.log("vid event " + timeKeysData[timeKeysIndex]);
                     PlayTimedEvent(timeKeysData.timekeys[timeKeysIndex]);
                     timeKeysIndex++;
                  } else {
                     console.log("end");
                     clearInterval(listenerInterval);
                  }
               
               }
            }
         } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') { 
            // if (timeKeysData.timekeys[timeKeysIndex].keytype == "Reset Timekeys") {
            //    timeKeysIndex = 0;
            // }
            if (youtubePlayer != null && youtubeIsPlaying && timekey > 0) {
               if (youtubePlayer.getCurrentTime() <= .1) {
                  timeKeysIndex = 0; 
                  console.log("resetting timekeysindex!");
               }
            if (youtubePlayer.getCurrentTime() <= timekey) {
               //    wait a scootch
               //    console.log(youtubePlayer.getCurrentTime() + " vs " + timekey);
               } else { 
                  
                  if(timeKeysIndex < tkStarttimes.length) {
                        // console.log("FIRING " + youtubePlayer.time + " vs " + timekey);
                     //    console.log("youtube event index " + timeKeysIndex + " " + JSON.stringify(timeKeysData.timekeys[timeKeysIndex]));
                     PlayTimedEvent(timeKeysData.timekeys[timeKeysIndex]);
                     timeKeysIndex++;
                     } else {
                        console.log("end");
                        clearInterval(listenerInterval);
                     }
                  }
               }
            }
         }
      }, 50);
   }
}

export function PauseIntervals (pauseBool) {
   
   pauseLoops = pauseBool;
   console.log("loops are paused " + pauseLoops);

}
export function ClearIntervals () {
   for (let i = 0; i < loopIntervals.length; i++) {
      console.log("clearing interval " + i);
      clearInterval(loopIntervals[i]);
   }
   // clearInterval(listenerInterval);
}



function LoopTimedEvent(keyType, duration, keydata, keytags) {
   
   console.log("tryna LoopTimedEvent pausedLoops " + pauseLoops );
   duration = parseFloat(duration).toFixed(2) * 1000;
   console.log("tryna looop " + keyType  + " " +duration);
   let beatElements = document.getElementsByClassName("beatme");
   let envEl = document.getElementById('enviroEl');
   let skyEl = document.getElementById('skyEl');
   
   let theInterval = setInterval(function () {
      if (!pauseLoops) {
         if (keyType == "Next") {
            console.log("next loop " + duration);
            GoToNext();
         } 
         if (keyType.toLowerCase().includes("beat")) {
            console.log("beat loop " + duration);
            if (beatElements != null) {
               // console.log("beat objex " + beatElements.length)
               
            for (let i = 0; i < beatElements.length; i++) {
               // if (Math.random() > .5) { //hrm, toggle how?
                  if (beatElements[i].components.mod_model != undefined) {
                     beatElements[i].components.mod_model.beat(.75, duration);
                  } else if (beatElements[i].components.mod_object != undefined) {
                     beatElements[i].components.mod_object.beat(.75, duration);
                  } else if (beatElements[i].components.cloud_marker != undefined) {
                     beatElements[i].components.cloud_marker.beat(.15, duration);
                  } else if (beatElements[i].components.mod_physics != undefined) {
                     beatElements[i].components.mod_physics.randomPush();
                  }
               // }
            }
            }
            if (envEl != null) {
               envEl.components.enviro_mods.beat(.5);
               
            }
         }
         if (keyType.toLowerCase().includes("random time")) {
            if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
               if (primaryAudioEl != null) {
                  // console.log("beat volume " + volume);
                  primaryAudioEl.components.primary_audio_control.randomTime();
               }
            } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary video') {
               var videoControllerEl = document.getElementById('primary_video_0');  
               if (videoControllerEl != null) {
                  console.log("gotsa video embedVideo");
                  let videoController = videoControllerEl.components.vid_materials_embed;
                  if (videoController) {
                     videoController.randomTime();
                  }
               }
            } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
               let youtube_player = document.getElementById("youtubePlayer").components.youtube_player;
               if (youtube_player) {
                  youtube_player.randomTime();
               }
            }
         }

         if (keyType.toLowerCase().includes("color tweak")) {
            console.log("tryna beat loop");
            if (envEl != null) {
               // console.log("beat volume " + volume);
               envEl.components.enviro_mods.colortweak();
            }
         }
         if (keyType.toLowerCase().includes("color lerp")) {
            console.log("tryna color lerp");
            if (envEl != null) {
               // console.log("beat volume " + volume);
               envEl.components.enviro_mods.colorlerp(duration);
            } else if (skyEl != null) {
               
               skyEl.components.mod_sky.colorlerp();
            }
         }
         if (keyType.toLowerCase().includes("picture next")) {
            let picGroupMangler = document.getElementById("pictureGroupsData");

            if (picGroupMangler != null && picGroupMangler != undefined && picGroupMangler.components.picture_groups_control) {
            console.log("picture next event!");
            //    document.querySelector("#pictureGroupPanel").setAttribute('visible', true);
            //   picGroupMangler.components.picture_groups_control.toggleOnPicGroup();
            //   picGroupMangler.components.picture_groups_control.NextButtonClick();
              // console.log(JSON.stringify(this.skyboxData));
            }
            let picGroupEls = document.querySelectorAll(".picgroup");
            for (let i = 0; i < picGroupEls.length; i++) {
               let cloudmarker = picGroupEls[i].components.cloud_marker;
               if (cloudmarker) {
                  cloudmarker.loadMedia();
               } else {
                  let localmarker = picGroupEls[i].components.local_marker;
                  if (localmarker) {
                     localmarker.loadMedia();
                  }
               }
               
            }
         }
         if (keyType == "Player Look") {

            if (keytags && keytags.length && keytags != "undefined") {
              //otherwise check the tags against classes
            //   camLockButton
               console.log("checking tags for Player Look timedevent " + keytags);
               let theQuery = "." + keytags;
               let taggedEls = document.querySelectorAll(theQuery);  //need to split!
               let randomIndex = Math.floor(Math.random()*taggedEls.length);
               
               if (taggedEls[randomIndex] && taggedEls[randomIndex].id) {
                  console.log("tryna get random index " + randomIndex +" of taggedEls "+ taggedEls.length + " id "+ taggedEls[randomIndex].id) ;
                  player.components.player_mover.lookAt(0, "#" +CSS.escape(taggedEls[randomIndex].id));
               }
               
               // for (let i = 0; i < taggedEls.length; i++) {

               // }
               
            }

         } 
      } else {
         console.log("loops are paused");
      }
   }, duration);
   loopIntervals.push(theInterval);
}  //end loop event

function PlayTimedEvent(timeKey) {
 console.log("tryna play timed event: " + JSON.stringify(timeKey));

 let duration = 1;
 if (timeKey.keyduration) {
   duration = timeKey.keyduration * 1000;
 }

      // console.log("tryna displatch beatz");
   timed_event.details = timeKey;
   eventEl.dispatchEvent(timed_event);

 let posObj = {};
 let rotObj = {};
 let tempLabel = "";
   if (timeKey.keydata.toLowerCase().includes('loop')) {
      LoopTimedEvent(timeKey.keytype, timeKey.keyduration, timeKey.keydata, timeKey.keytags); //above
      // return null;
      if (timeKey.keytype.toLowerCase().includes("color lerp")) {
         console.log("tryna beat loop");
         let envEl = document.getElementById('enviroEl');
         if (envEl != null && envEl.components.enviro_mods) {
            // console.log("beat volume " + volume);
            duration = timeKey.keyduration * 1000;
            envEl.components.enviro_mods.colorlerp(duration); //does loop on arg
         }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("Player Follow Path")) {
      let curveDriver = document.getElementById("cameraCurve");
      if (curveDriver && settings && timedEventsListenerMode ) {
        let modCurveComponent = curveDriver.components.mod_curve;
        if (modCurveComponent) {
          modCurveComponent.toggleMove(true);
          // PlayPauseMedia();
        }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("beat")) {
      if (primaryAudioEl != null) { //i.e. aframe
         // console.log("beat volume " + volume);
         primaryAudioEl.components.primary_audio_control.timekey_beat(.5);
      } else {
         // console.log("tryna displatch beatz");
         // timed_event.details = {"beat"}
         // eventEl.dispatchEvent(timed_event);
      }
      let beatElements = document.getElementsByClassName("beatme");
      let envEl = document.getElementById('enviroEl');
      // let skyEl = document.getElementById('skyEl');
      console.log("beat loop " + duration);
      if (beatElements != null) {
         // console.log("beat objex " + beatElements.length)
         
      for (let i = 0; i < beatElements.length; i++) {
         // if (Math.random() > .5) { //hrm, toggle how?
            if (beatElements[i].components.mod_model != undefined) {
               beatElements[i].components.mod_model.beat(.75, duration);
            } else if (beatElements[i].components.mod_object != undefined) {
               beatElements[i].components.mod_object.beat(.75, duration);
            } else if (beatElements[i].components.cloud_marker != undefined) {
               beatElements[i].components.cloud_marker.beat(.15, duration);
            } else if (beatElements[i].components.mod_physics != undefined) {
               beatElements[i].components.mod_physics.randomPush();
            }
         // }
      }
      }
      if (envEl != null) {
         envEl.components.enviro_mods.beat(.5);
         
      }
   }
   if (timeKey.keytype.toLowerCase().includes("stop trigger audio")) {
      var triggerAudioController = document.getElementById("triggerAudio");
      if (triggerAudioController != null) {
        triggerAudioController.components.trigger_audio_control.stopTriggerAudio();
      }
   }

   if (timeKey.keytype.toLowerCase().includes("random time")) {
      if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
         if (primaryAudioEl != null) {
            // console.log("beat volume " + volume);
            primaryAudioEl.components.primary_audio_control.randomTime();
         }
      } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary video') {
         var videoControllerEl = document.getElementById('primary_video_0');  
         if (videoControllerEl != null) {
            console.log("gotsa video embedVideo");
            let videoController = videoControllerEl.components.vid_materials_embed;
            if (videoController) {
               videoController.randomTime();
            }
         }
      } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
         let youtube_player = document.getElementById("youtubePlayer").components.youtube_player;
         if (youtube_player) {
            youtube_player.randomTime();
         }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("goto time")) {
      if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
         if (primaryAudioEl != null) {
            // console.log("beat volume " + volume);
            primaryAudioEl.components.primary_audio_control.gotoTime(timeKey.keydata);
         }
      } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary video') {
         if (settings.sceneType == "Default" || settings.sceneType == "AFrame") {
            var videoControllerEl = document.getElementById('primary_video_0');  
            if (videoControllerEl != null) {
               console.log("gotsa video embedVideo");
               let videoController = videoControllerEl.components.vid_materials_embed;
               if (videoController) {
                  videoController.gotoTime(timeKey.keydata);
               }
            }
         } else { //normal html, just ?
            video.currentTime = timeKey.keydata;
         }
      } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
         let youtube_player = document.getElementById("youtubePlayer").components.youtube_player;
         if (youtube_player) {
            youtube_player.goToTime(timeKey.keydata);
         }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("text show")) {
      console.log("tryna text show ");
      let greetingDialogEl = document.getElementById("sceneGreetingDialog");
      if (greetingDialogEl) {
         let dialogComponent = greetingDialogEl.components.scene_greeting_dialog;
         if (dialogComponent) {
            console.log("tryna modGreeting " + timeKey.keydata);
            dialogComponent.setLocation();
            dialogComponent.modQuest(timeKey.keydata);
         } else {
            console.log("caint find no dangblurn dialog component!");
         }
      } else {
         console.log("sceneGreetingDialog element missing!");
      }
   }
   if (timeKey.keytype.toLowerCase().includes("text index")) {
      let greetingDialogEl = document.getElementById("sceneGreetingDialog");
      if (greetingDialogEl) {
         let dialogComponent = greetingDialogEl.components.scene_greeting_dialog;
         if (dialogComponent) {
            console.log("tryna modGreeting " + timeKey.keydata);
            dialogComponent.setLocation();
            dialogComponent.modQuest(timeKey.keydata);
         } else {
            console.log("caint find no dangblurn dialog component!");
         }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("text next")) {
      let greetingDialogEl = document.getElementById("sceneGreetingDialog");
      if (greetingDialogEl) {
         let dialogComponent = greetingDialogEl.components.scene_greeting_dialog;
         if (dialogComponent) {
            console.log("tryna modGreeting " + timeKey.keydata);
            dialogComponent.setLocation();
            dialogComponent.modQuest(timeKey.keydata);
         } else {
            console.log("caint find no dangblurn dialog component!");
         }
      }
   }
   if (timeKey.keytype.toLowerCase().includes("clear")) {
      ClearIntervals();
   } 
   if (timeKey.keytype == "Next") {
      GoToNext();
   } 
   if (timeKey.keytype == "Previous") {
      GoToPrevious();
   } 
   if (timeKey.keytype == "Player Look") {
      let tkElID = null;
      if (timeKey.keydata) {
         tkElID = document.getElementById(timeKey.keydata.toString());
      }
      if (tkElID) { //has a specific element ID (timestamp)
         posObj = tkElID.getAttribute("position");
         player.components.player_mover.lookAt(duration, "#" +CSS.escape(timeKey.keydata.toString()));
      } else if (timeKey.tags && timeKey.keytags.length) { //otherwise check the tags against classes
         console.log("checking tags for Player Look timedevent " + timeKey.keytags);
         
      } else { //try to match element name
         console.log("caint find el " + timeKey.keydata);
         for (let s = 0; s < sceneLocations.locations.length; s++) {
            if (timeKey.keydata.toString() == sceneLocations.locations[s].name) {
               tkElID = document.getElementById(sceneLocations.locations[s].timestamp);
               if (tkElID) {
                  posObj = tkElID.getAttribute("position");
                  player.components.player_mover.lookAt(duration, "#" +CSS.escape(timeKey.keydata.toString())); // bc ids aren't supporsed to have leading number! ok then...
               }
            }
         }  
      }
   } 
   if (timeKey.keytype == "Player Snap") {
      console.log("tryna play a Player Snap event " + timeKey.keydata.toString());
    
      let tkElID = document.getElementById(timeKey.keydata.toString());
      if (tkElID) {
         posObj = tkElID.getAttribute("position");
         player.components.player_mover.move('player', posObj, rotObj, 0, "#" +CSS.escape(timeKey.keydata.toString()));
      } else {
         console.log("caint find el " + timeKey.keydata);
         for (let s = 0; s < sceneLocations.locations.length; s++) {
            if (timeKey.keydata.toString() == sceneLocations.locations[s].name) {
               tkElID = document.getElementById(sceneLocations.locations[s].timestamp);
               if (tkElID) {
                  posObj = tkElID.getAttribute("position");
                  player.components.player_mover.move('player', posObj, rotObj, 0, "#" +CSS.escape(timeKey.keydata.toString())); // bc ids aren't supporsed to have leading number! ok then...
               }
            }
         }  
      }
   } 
   if (timeKey.keytype == "Player Lerp") {
      console.log("trynba lerp to " + timeKey.keydata.toString());
      let tkElID = document.getElementById(timeKey.keydata.toString());
      // duration = timeKey.keyduration;
      if (tkElID) {
         posObj = tkElID.getAttribute("position");
         player.components.player_mover.move('player', posObj, rotObj, timeKey.keyduration, "#" +CSS.escape(timeKey.keydata.toString())); // bc ids aren't supporsed to have leading number! ok then...
      } else {
         console.log("caint find timeKey.keyData el " + timeKey.keydata);
         for (let s = 0; s < sceneLocations.locations.length; s++) {
            if (timeKey.keydata.toString() == sceneLocations.locations[s].name) {
               tkElID = document.getElementById(sceneLocations.locations[s].timestamp);
               if (tkElID) {
                  posObj = tkElID.getAttribute("position");
                  player.components.player_mover.move('player', posObj, rotObj, timeKey.keyduration, "#" +CSS.escape(timeKey.keydata.toString())); // bc ids aren't supporsed to have leading number! ok then...
               }
            }
         }
      }
   } 
}



//////////////////////////////////////////////// set events data //////////////

export function SetPrimaryAudioEventsData () {

   // timeKeysData = JSON.parse(localStorage.getItem(room+ "_timeKeys"));
   // let timekeysData = settings.sceneTimedEvents;
   // console.log("setting primary audio events data! " + JSON.stringify(timeKeysData));
   tkStarttimes = [];
   if (timeKeysData != undefined && timeKeysData != null && timeKeysData.timekeys != undefined && timeKeysData.timekeys.length > 0 )
      timeKeysData.timekeys.forEach(function (timekey) {
      tkStarttimes.push(parseFloat(timekey.keystarttime).toFixed(2));
   });
   tkStarttimes.sort(function(a, b){
      return a - b;
   });
   SetTimedEventsListenerMode("Primary Audio");
   
   TimedEventListener();

}

export function SetVideoEventsData (type) { 
   console.log("tryna SetVideoEventsData");
   tkStarttimes = []; //either audio or video, not both

   
   if (timeKeysData != undefined && timeKeysData != null && timeKeysData.timekeys != undefined && timeKeysData.timekeys.length > 0 ) {
     timeKeysData.timekeys.forEach(function (timekey) {
     tkStarttimes.push(parseFloat(timekey.keystarttime).toFixed(2));
   });
   tkStarttimes.sort(function(a, b){
     return a - b;
   });
   

   if (tkStarttimes.length > 0) {
      let teMode = "Primary Video";
         if (!timedEventsListenerMode) {
            teMode = timedEventsListenerMode;
         }
      console.log("tryna run video events listenr with timedEventsListenerMode : " + teMode);
      TimedEventListener();
      }
   }
}
function SetYoutubeEventsData() {

}


export function SetTimedEventsListenerMode(mode) {
   timedEventsListenerMode = mode;
}

export function SetTimeKeysData (tkData) {
   if (tkData && tkData.timekeys && tkData.timekeys.length) {
      timeKeysData = tkData;
      console.log("SetTimeKeysData !" + timeKeysData.listenTo);
      // 
      
      localData.timedEvents = timeKeysData;

      if (timeKeysData.listenTo) {
         timedEventsListenerMode = timeKeysData.listenTo;
      }
      if (timedEventsListenerMode == "Primary Audio") {
         SetPrimaryAudioEventsData();
      }
   }
   // if (timedEventsListenerMode) 
   // SetEventTriggers();
  
}

