
import { timedEventsListenerMode, PauseIntervals, SetTimedEventsListenerMode, SetVideoEventsData} from "../../connect/events.js";
import { settings } from "../../connect/connect.js";

let mainTransportSlider = null;
let transportPlayButton = null;
let youtubePlayerEl = document.getElementById("youtubePlayer");
let youtube_player; //3d version
let youtubeTime = 0;
let youtubeDuration = 0;
export let youtubePlayer; //spawned by embed api
export let youtubeIsPlaying = false;
export let fancyTimeString = "";
export let sceneTextItems = [];

// export let timedEventsListenerMode = "";
export var primaryAudioMangler = null; 
export let primaryAudioEl = document.querySelector('#primaryAudio');

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
    // if (timedEventsListenerMode == null) {
    //   timedEventsListenerMode = "Youtube";
    // }
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
            // console.log("youtube_player is null " + youtube_player == null);
            // youtube_player = document.getElementById("youtubePlayer").components.youtube_player;
            InitAFrameYouTubePlayer();
            if (youtube_player != null) {
              youtube_player.player_status_update("ready");
              clearInterval(interval);
            }
          }, 500); 
        } else {
          youtube_player.player_status_update("ready");
        }  
        // } else {
        //   clearInterval(this.interval);
        // }

  }
      // youtube_player.player_status_update("ready");
    // }

  // }

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
  }
}
function FastForwardButton () {
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
function RewindButton () {
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

function NextButton () {
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

function PreviousButton () {
  console.log("PrevButton Clicked " + timedEventsListenerMode);
  if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'youtube') {
    if (youtubePlayer != null) {
    youtubePlayer.seekTo(0);
    timeKeysIndex = 0;
  }
  } else if (timedEventsListenerMode != null && timedEventsListenerMode.toLowerCase() == 'primary audio') {
      if (primaryAudioMangler != null) {
        console.log("start button for audio");
        primaryAudioMangler.start();
        timeKeysIndex = 0;
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
   // function SetLocationData(locationData) {
   //    console.log("locationData " + JSON.stringify(locationData));
   //    // let locations = locationData;
   //    sceneLocations.locations = locationData;
      
   //    // console.log("locationData " + JSON.stringify(sceneLocations));
   // }

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


export function PrimaryAudioInit() {
  console.log("PRIMARY AUDIO INIT()");
  // primaryAudioEl = 
  if (primaryAudioEl != null) {
    primaryAudioMangler = document.getElementById("primaryAudio").components.primary_audio_control;
    
    if (primaryAudioMangler && primaryAudioMangler.data.autoplay) {
      console.log("PRIMARY AUDIO INIT() autoplay " + primaryAudioMangler.data.autoplay +  " isplaying " + primaryAudioHowl.playing());
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