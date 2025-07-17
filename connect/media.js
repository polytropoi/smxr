// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const {Howl, Howler} = require('../node_modules/howler/dist/howler.js');

import { timedEventsListenerMode, PauseIntervals, SetTimedEventsListenerMode, SetVideoEventsData} from "../../connect/events.js";
import { settings } from "../../connect/settings.js";
import { ResetTimedEvents } from "./events.js";
// import { Howl, Howler } from '../node_modules/howler/dist/howler.js';
// import {Howl} from '../main/vendor/howler/src/howler.js';

// import {Howl} from 'howler';

let triggerAudioHowl;
let mainTransportSlider = null;
let transportPlayButton = null;
let youtubePlayerEl = document.getElementById("youtubePlayer");
let youtube_player; //3d version
let youtubeTime = 0;
let youtubeDuration = 0;
let isCooling = false;
export let youtubePlayer; //spawned by embed api
export let youtubeIsPlaying = false;
export let fancyTimeString = "";
export let sceneTextItems = [];

// export let timedEventsListenerMode = "";
export var primaryAudioMangler = null; 
export let primaryAudioEl = document.querySelector('#primaryAudio');

export let primaryAudioHowl;

export let audioGroupsData = {};

let modalTimeStatsEl = null; //stats for timekeys modal
let transportTimeStatsEl = null;

let youtubeState = "";
let youtubeTitleEl = "";
let youtubeData;
// window.youtubeIsPlaying = youtubeIsPlaying;

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function onYouTubeIframeAPIReady () { //must be global, called when youtube embed api is loaded
  let youtubeEl = document.getElementById("youtubeElement");
  let yt_id = youtubeEl.getAttribute('data-yt_id');
  console.log("YOUTUBE API IS READY, tryna make a player with id " + yt_id ); 
    youtubePlayer = new YT.Player('youtubeElement', {
      height: '200',
      width: '240',
      videoId: yt_id,
      // playerVars: {
      //   'playsinline': 1
      // },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
    });
    // youtubePlayer.h.attributes.sandbox.value = "allow-presentation";
   
    //needs to wait... 
    // if (settings && (settings.sceneType == "aframe" || settings.sceneType == "AFrame" || settings.sceneType == "Default")) {
    //   if (youtubePlayerEl) {
    //     youtube_player = youtubePlayerEl.components.youtube_player;
    //     youtubeTitleEl = document.getElementById("youtubeTitle");
    //   }
    // }
    // https://stackoverflow.com/questions/55724586/youtube-iframe-without-allow-presentation
    // youtubePlayer.h.attributes.sandbox.value = "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation";
  }

  export function InitAFrameYouTubePlayer () {  
    console.log("tryna initaframeyoutubeplayer");

    if (youtubePlayer && settings && (settings.sceneType == "aframe" || settings.sceneType == "AFrame" || settings.sceneType == "Default")) {
      if (!youtube_player && youtubePlayerEl) {
        youtube_player = youtubePlayerEl.components.youtube_player;
        youtubeTitleEl = document.getElementById("youtubeTitle");
      }
    }
  }
  function onPlayerReady(event) {
    
    console.log("youtubePlayer is re4ady!");

    if (!timedEventsListenerMode || timedEventsListenerMode == "") {
        SetTimedEventsListenerMode("Youtube");
    }
    // document.getElementById('youtubeElement').style.borderColor = '#FF6D00';
    // youtube_player.player_status_update("ready");
    // youtube_player.set_duration(event.target.getDuration());
    // youtube_player.set_player(event.target);
    // youtube_player.update_stats("");
    // youtube_player.slider_update(0);
    mainTransportSlider = document.getElementById("mainTransportSlider");
    // changeBorderColor(5);
    // event.target.playVideo(); //TODO detect and toggle
    // let sniffer = setInterval()
    // if (youtube_player == null) {
      // youtube_player = document.getElementById("youtubePlayer").components.youtube_player;
    // }
    // if (youtube_player != null) {
    //     youtube_player.player_status_update("ready");
    // }
    youtubeData = youtubePlayer.getVideoData();
    if (youtubeData && youtubeTitleEl) {
      console.log("gots youtubedata for " + JSON.stringify(youtubeData));
      // let titlestring = youtubeData.author + "\n" + youtubeData.title;
      youtubeTitleEl.setAttribute('text', {'value': youtubeData.author + "\n" + youtubeData.title});
    }
    if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
      SetVideoEventsData();
    }
    if (youtube_player == null || youtube_player == undefined) {
      let interval = setInterval(() => {    
        if (youtube_player) {
          youtube_player.player_status_update("ready");
          clearInterval(interval);
        } else {
          // InitAFrameYouTubePlayer();
        }
      }, 1000); 
    } else {
      youtube_player.player_status_update("ready");
    }  
  }

  function changeBorderColor(playerStatus) { 
    if (youtube_player != null) {
      var color;
      if (playerStatus == -1) {
        color = "#37474F"; // unstarted = gray
        youtube_player.player_status_update("ready");
      } else if (playerStatus == 0) {
        color = "#FFFF00"; // ended = yellow
        youtube_player.player_status_update("ready");
      } else if (playerStatus == 1) {
        color = "#33691E"; // playing = green
        youtube_player.player_status_update("playing");
      } else if (playerStatus == 2) {
        color = "#DD2C00"; // paused = red
        youtube_player.player_status_update("paused");
      } else if (playerStatus == 2) {
      } else if (playerStatus == 3) {
        color = "#AA00FF"; // buffering = purple
        // youtube_player.player_status_update("loading");
      } else if (playerStatus == 5) {
        color = "#FF6DOO"; // video cued = orange
        youtube_player.player_status_update("ready");
      }
      if (color) {
        document.getElementById('youtubeElement').style.borderColor = color;
      }
    }
  }
  
  // function youtubeCurrentTime(isPlaying) {
  //   if (isPlaying) {
  //     this.interval = setInterval(() => {
  //       console.log(event.target.getCurrentTime());
  //     }, 100);    
  //   } else {
  //     clearInterval(this.interval);
  //   }
  // }

  function onPlayerStateChange(event) { //youtube player events

    // // let interval = null;
    // currentTime = event.target.getCurrentTime();
    // console.log("current time youtube " + currentTime + " listenrMode " + timedEventsListenerMode);
    let duration = event.target.getDuration();
    let interval;
    if (event.data == YT.PlayerState.PLAYING) {
      // alert('video started');
        console.log("youtube is playing");
        youtubeIsPlaying = true;
        youtubeTime = youtubePlayer.getCurrentTime();
        youtubeDuration = youtubePlayer.getDuration();


        console.log("youtube getVideoData " + JSON.stringify(youtubeData));
        // youtubePlayer(youtubeIsPlaying);
        let time = 0;
        // let statsDiv = document.getElementById("transportStats");
        
        // this.el.emit('youtubeToggle', {isPlaying : true}, true);

        interval = setInterval(() => {
          const time = event.target.getCurrentTime();
          // const currentTime = time.toFixed(2);
          // console.log(time.toFixed(2));
          let percent = time / duration;
          fancyTimeString = fancyTimeFormat(time)  + " / "+ fancyTimeFormat(duration.toFixed(2)) + " - " + (percent * 100).toFixed(2) +" %";
          // if (statsDiv != null) {
          //   statsDiv.innerHTML = timeString;
          //   }
          if (mainTransportSlider != null) {
            // console.log("tryna set slider to " + percent);
            mainTransportSlider.value = percent * 100;
          }  
          if (youtube_player != null) {
            youtube_player.update_stats(fancyTimeString);
            youtube_player.slider_update(percent);
          }
          MediaTimeUpdate(fancyTimeString);  //updates stats div and modal stats div
        }, 100); 
      } else if(event.data == YT.PlayerState.PAUSED) {
        //  alert('video paused');
        youtubeIsPlaying = false;
        console.log("youtube is not playing");
        clearInterval(interval);
        // this.el.emit('youtubeToggle', {isPlaying : false}, true);
      }
      // let interval = setInterval(() => {
      //   if (youtubeIsPlaying) {
      //     console.log(event.target.getCurrentTime());
      //   } else {
      //     clearInterval(interval);
      //   }
      // }, 100);
    changeBorderColor(event.data);
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

export function TransportPlayButton () {
  // console.log("TransportPlayButton clcik! " + JSON.stringify(youtubePlayer));
  console.log("TransportPlayButton clcik! " + primaryAudioMangler);
  if (youtubePlayer != null) {
    if (!youtubeIsPlaying) {
      console.log("tryna play youtube");
      youtubePlayer.playVideo();
      PauseIntervals(false);
    } else {
      console.log("tryna pauze youtube");
      youtubePlayer.pauseVideo();
      PauseIntervals(true);
    }
  } else if (primaryAudioMangler != null) {
    console.log("play button for audio");
    primaryAudioMangler.playPauseToggle();
  } else {
    PrimaryAudioPlayPauseToggle();
  }
}
export function FastForwardButton () {
  console.log("ffwdButton Clicked");
  if (youtubePlayer != null) {
    youtubeTime = youtubePlayer.getCurrentTime();
    youtubeDuration = youtubePlayer.getDuration();
    if (youtubeTime < youtubeDuration - 10) {
      youtubePlayer.seekTo(youtubeTime + 10);
    } else {
      youtubePlayer.seekTo(0);
    }
  } else if (primaryAudioMangler != null) {
    console.log("play button for audio");
    primaryAudioMangler.fastForward();
  } 

}
export function RewindButton () {
  console.log("rewindButton Clicked");

  if (youtubePlayer != null) {
    youtubeTime = youtubePlayer.getCurrentTime();
    youtubeDuration = youtubePlayer.getDuration();
    if (youtubeTime > 10) {
      youtubePlayer.seekTo(youtubeTime - 10);
    } else {
      youtubePlayer.seekTo(youtubeDuration - 10);
    }
  } else if (primaryAudioMangler != null) {
    console.log("play button for audio");
    primaryAudioMangler.rewind();
  }
  ClearIntervals();
  // timeKeysIndex = 0;
}

export function NextButton () {
  console.log("NextButton Clicked " + timedEventsListenerMode);
  if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
    if (youtubePlayer != null) {
      let youtubeDuration = youtubePlayer.getDuration();
      youtubePlayer.seekTo(youtubeDuration - 2);
    }
  } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
      if (primaryAudioMangler != null) {
      console.log("end button for audio");
      primaryAudioMangler.end();
    }
  }
}

export function PreviousButton () {
  console.log("PrevButton Clicked " + timedEventsListenerMode);
  if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
    if (youtubePlayer != null) {
    youtubePlayer.seekTo(0);
    // timeKeysIndex = 0;
    ResetTimedEvents();
  }
  } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
      if (primaryAudioMangler != null) {
        console.log("start button for audio");
        primaryAudioMangler.start();
        // timeKeysIndex = 0;
        ResetTimedEvents();
      }
    }
    ClearIntervals();
  }

  export function fancyTimeFormat(duration) {   
  // Hours, minutes and seconds
  var hrs = ~~(duration / 3600);
  var mins = ~~((duration % 3600) / 60);
  var secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  var ret = "";

  if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;
  return ret;
}



function PlayPausePrimaryAudio() {
   
   var primaryAudioController = document.getElementById("primaryAudio").components.primary_audio_control; 
   primaryAudioController.playPauseToggle(); 
}

export function InitPrimarySlider() {
// let modal = document.getElementById('modalContent');
let primaryAudioSlider = document.getElementById("primaryAudioVolumeSlider");
   if (primaryAudioSlider != undefined) {
      // let storedPrimaryVolume = localStorage.getItem(room+"_primaryVolume");
      // if (storedPrimaryVolume != null) {
      //    primaryAudioSlider.value = storedPrimaryVolume;
      // }

      UpdatePrimaryAudioVolume(primaryAudioSlider.value);
      primaryAudioSlider.oninput = function() {
      // output.innerHTML = this.value;
      UpdatePrimaryAudioVolume(this.value);
      volumePrimary = this.value;
      // localStorage.setItem(room+"_primaryVolume", this.value);
      }
   }
}
export function InitAmbientSlider () {
   // let modal = document.getElementById('modalContent');
 let ambientAudioSlider = document.getElementById("ambientAudioVolumeSlider");
   if (ambientAudioSlider != null) {
      // let storedAmbientVolume = localStorage.getItem(room+"_ambientVolume");
      // if (storedAmbientVolume != null) {
      //    ambientAudioSlider.value = storedAmbientVolume;
      // }
      // UpdateAmbientAudioVolume(ambientAudioSlider.value);
         ambientAudioSlider.oninput = function() {
         UpdateAmbientAudioVolume(this.value);
         volumeAmbient = this.value;
         // localStorage.setItem(room+"_ambientVolume", this.value);
      }
   }
}
export function InitTriggerSlider () {
   // let modal = document.getElementById('modalContent');
 let triggerAudioSlider = document.getElementById("triggerAudioVolumeSlider");
   if (triggerAudioSlider != null) {
      // let storedTriggerVolume = localStorage.getItem(room+"_triggerVolume");
      // if (storedTriggerVolume != null) {
      //    triggerAudioSlider.value = storedTriggerVolume;
      // }
      UpdateTriggerAudioVolume(triggerAudioSlider.value);
      triggerAudioSlider.oninput = function() {
         volumeTrigger = this.value;
         UpdateTriggerAudioVolume(this.value);
         // localStorage.setItem(room+"_triggerVolume", this.value);
      } 
   }
}

export function UpdatePrimaryAudioVolume(newVolume) {
   var primaryAudio = document.getElementById("primaryAudio");
   if (primaryAudio != null) {
      var primaryAudioController = document.getElementById("primaryAudio").components.primary_audio_control; 
      if (primaryAudioController != null) {
         primaryAudioController.modVolume(newVolume);
      }   
   }
   // localStorage.setItem(room+"_primaryVolume", newVolume);
}
export function UpdateAmbientAudioVolume(newVolume) {
   var ambientAudioController = document.getElementById("ambientAudio").components.ambient_audio_control; 
   if (ambientAudioController != null) {
      ambientAudioController.modVolume(newVolume);
   }
}
export function UpdateTriggerAudioVolume(newVolume) {
   var triggerAudioEl = document.getElementById("triggerAudio");
   if (triggerAudioEl) {
      var triggerAudioController = triggerAudioEl.components.trigger_audio_control;
      if (triggerAudioController != null) {
         triggerAudioController.modVolume(newVolume);
      }
   }
}

export function PrimaryAudioPlayPauseToggle () {

  if (primaryAudioHowl && primaryAudioHowl != undefined) {
    // primaryAudioHowl;
    if (!primaryAudioHowl.playing()) {
            console.log("tryna play " + settings.primary_mp3url);
        primaryAudioHowl.play();
        // this.el.emit('primaryAudioToggle', {isPlaying : true}, true);
        // this.isPlaying = true;
        PauseIntervals(false);
        return true;
    } else {    
        console.log("tryna pause");
        primaryAudioHowl.pause();
        // this.el.emit('primaryAudioToggle', {isPlaying : false}, true);
        // this.isPlaying = false;
        PauseIntervals(true);
        return false;
    }
  } else {
    console.log("tryna load " + settings.primary_mp3url);
    primaryAudioHowl = new Howl({
      src: [settings.primary_mp3url]
    });
  }
}


export function PrimaryAudioInit() {
  console.log("PRIMARY AUDIO INIT()");
  // primaryAudioEl = 
  if (primaryAudioEl != null) {
    primaryAudioMangler = document.getElementById("primaryAudio").components.primary_audio_control;
    
    if (primaryAudioMangler && primaryAudioMangler.data && primaryAudioMangler.data.autoplay) {
      console.log("PRIMARY AUDIO INIT() autoplay " + primaryAudioMangler.data.autoplay );
      if (primaryAudioHowl != null) {
        if (!primaryAudioHowl.playing()) {
          primaryAudioMangler.playPauseToggle();
        }
      }
    }
  }
  let avz = document.getElementById("audiovizzler");
  if (avz != null) {
    vidz = document.getElementsByTagName("video"); //vidz declared in content-utils?
    if (vidz != null && vidz.length > 0) { //either video or audio, not both...?
      videoEl = vidz[0];
      console.log("videoEl " + videoEl.src);
        AudioAnalyzer();
    } else {
        if (primaryAudioMangler != null) {
        AudioAnalyzer();
      } 
    }
  } else {
    console.log("didn't find no audiovizzler");
  }
}

export function FetchAudioGroupsData(groupArray) { //sets data in aframe component
    console.log("tryna fetch audioGroups: " +JSON.stringify(groupArray));
    var posting = $.ajax({
        url: "/return_audiogroups",
        type: 'POST',
          contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(groupArray),
            success: function( data, textStatus, xhr ){
                // console.log("audiogroups data: " + JSON.stringify(data));
                // return  JSON.stringify(data);
                // if (settings && settings.sceneType == "aframe") {
                    let audioGroupsControllerEl = document.getElementById('audioGroupsEl');
                    let audioGroupsController = audioGroupsControllerEl.components.audio_groups_control;
                    audioGroupsController.SetAudioGroupsData(data);
                // }
                // audioGroupsData = data;

            },
            error: function( xhr, textStatus, errorThrown ){
                console.log("error! " + errorThrown);
                // return null;
                // document.cookie = "expires=Thu, 01 Jan 1970 00:00:00"; //set to expired date to delete?
                }
            });

}

export async function ReturnAudioGroupsData() { //use outside aframe 
  await settings;
  let groupArray = settings.audioGroups;
    console.log("tryna fetch audioGroups: " +JSON.stringify(groupArray));

    try {
      const response = await fetch('/return_audiogroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(groupArray)
        });
        const data = await response.json();
        console.log(data);
        audioGroupsData = data;
        return data;
      } catch(error) {
        console.log("error returning audiogroups " +error);
      } 
}

function cooldown () {
  setTimeout( () => {
      isCooling = false;
      // this.calloutText.setAttribute("troika-text", {
      //   value: "",
      // });
    }, 1000);
    
}
export function PlayTriggerWithTag(tag) {
  if (!isCooling) {
    isCooling = true;
    cooldown();
    console.log("tryna play trigger with tag " + tag);
    const audioID = returnTriggerAudioIDWithTag(tag);
    if (audioID) {
        console.log("gotsa trigger audio id " + audioID);
      const audioItem = returnAudioItem(audioID);
      triggerAudioHowl = null;
      triggerAudioHowl = new Howl({
          src: [audioItem.URLogg, audioItem.URLmp3],
          format: ["ogg", "mp3"]
      });
      // triggerAudioHowl.format = ["ogg", "mp3"];
      // triggerAudioHowl.src = [audioItem.URLogg, audioItem.URLmp3];
      triggerAudioHowl.load();
      triggerAudioHowl.play();
    }
  }
}
export function returnTriggerAudioIDWithTag (tag) { //find an audio item in audiogroup with specified tag
                    
    if (tag && audioGroupsData && audioGroupsData.triggerGroupItems) {
        console.log("looking for audio trigger with tag " + tag + " in groups " + audioGroupsData.triggerGroupItems.length);
        for (const triggerGroup of audioGroupsData.triggerGroupItems) {
        // for (let a = 0; a < this.data.audioGroupsData.triggerGroupItems.length; a++) {
          for (let i = 0; i < triggerGroup.items.length; i++) {
              // console.log("looking for triggerGroup.item " + triggerGroup.items[i]);
            for (let j = 0; j < audioGroupsData.audioItems.length; j++) { //MAYBE SHUFFLE?
                // console.log("Ccchekin trigger group item " +triggerGroup.items[i]+ " vs " + this.data.audioGroupsData.audioItems[j]._id);
              if (triggerGroup.items[i] === audioGroupsData.audioItems[j]._id) {
                  // console.log(triggerGroup._id + " match trigger group item " +triggerGroup.items[i]+ " vs " + this.data.audioGroupsData.audioItems[j]._id);
                  //not ideal, maybe the groupitems can store tags? or cache them when loaded below?
                  //TODO need to split the string and match eggzackly!!!!!
                if (audioGroupsData.audioItems[j].tags && audioGroupsData.audioItems[j].tags.toString().toLowerCase().includes(tag)) {
                    // console.log("tag match to " + tag);  
                    // return triggerGroup.items[i];
                    console.log("matched triggeraudiotem w/ tag " + tag);
                    // matchingItems.push(triggerGroup.items[i]);
                    return triggerGroup.items[i]; //ok to not return?
                }
              }
            }
          }
        } 
      }
  }


export function returnAudioItem (id) {
        let index = -1;
        // console.log("tryna get audio item id " + id);
        if (id && audioGroupsData && audioGroupsData.audioItems) {
            for (var i = 0; i < audioGroupsData.audioItems.length; i++){
                if (id == audioGroupsData.audioItems[i]._id) {
                    index = i;

                    break;
                }
            }
        } else {
            // console.log("cain't find audioItem with id " + id);
        }
        // console.log("tryna get audio index " + index);
        if (index != -1) {
            // console.log("gotsa audio item from object_audio_group at index " + index);
            return audioGroupsData.audioItems[index];
            // return null;
        } else {
            return null;
        }
       
  }