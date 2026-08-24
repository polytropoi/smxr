
import * as THREE from 'three';
// import * as Tone from 'tone';

import { player, camera } from './wgpu_controls.js';
import { scene } from './wgpu_main.mjs';
import { settings } from '../../../connect/settings.js';
import { videoEl } from '../../../connect/connect.js';
import { eventEl } from '../../../connect/events.js';
import { fancyTimeFormat, primaryAudioMangler, ReturnAudioGroupsData, createYouTubePlayer} from "../../../connect/media.js";
import { lookAtCameraObjects } from './wgpu_ui.js';
import { TagsToInstances } from './wgpu_instance.js';

import { animatedColor } from './wgpu_environment.js';
import { texture, color, float, uv, equirectUV, positionLocal, vec3, vec2, sin, mul, add, time, mx_noise_float } from 'three/tsl';


import { UpdateEnvMap } from './wgpu_environment.js';
import { pauseVideo, playVideo } from '../../connect/media.js';


export let primaryAudioGroups;
export let ambientAudioGroups;
export let triggerAudioGroups;

export let sceneTextController;
export let audioGroupsData;
export let pictureGroupsData;
export let scenePicturesData;
export let landscapePanel;

export let equirectPictures = [];
export let tileablePictures = [];

export let videoGroupsData;
export let sceneVideoPlayer;
export let mediaPlayersToUpdate = [];

createYouTubePlayer();
eventEl.addEventListener('sequence-event', SequenceEvent); 

export function SequenceEvent (event) {
    console.log("sequenceEvent " + JSON.stringify(event.details));
    const type = event.details;
    switch (type) {
        case "next":
            console.log("next event case!");
            UpdateEnvMap();
        break;
    }

    // const synth = new Tone.Synth().toDestination();

//play a middle 'C' for the duration of an 8th note
// synth.triggerAttackRelease("C4", "8n");
}


export function convertGltfToNodeMaterial(stdMaterial) {
    // if (stdMaterial.isNodeMaterial) {
    //     return stdMaterial
    // } else {
        const nodeMat = new THREE.NodeMaterial();
        
        // Copy basic properties
        nodeMat.color = stdMaterial.color;
        nodeMat.roughness = stdMaterial.roughness;
        // nodeMat.roughness = .5;
        nodeMat.metalness = stdMaterial.metalness;
        
        // Map textures via TSL if they exist
        if (stdMaterial.map) nodeMat.colorNode = texture(stdMaterial.map);
        if (stdMaterial.roughnessMap) nodeMat.roughnessNode = texture(stdMaterial.roughnessMap);
        if (stdMaterial.metalnessMap) nodeMat.metalnessNode = texture(stdMaterial.metalnessMap);
        if (stdMaterial.normalMap) nodeMat.normalNode = texture(stdMaterial.normalMap);
        if (stdMaterial.emissiveMap) nodeMat.emissiveNode = texture(stdMaterial.emissiveMap);

        nodeMat.transparent = stdMaterial.transparent;
        nodeMat.opacity = stdMaterial.opacity;
        nodeMat.envNode = scene.environmentNode;  
        // nodeMat.en
        return nodeMat;
    // }
}

export function InitPictureGroups () {
    const pictureGroupsDataEl = document.getElementById('pictureGroupsData');
   if (pictureGroupsDataEl) {
      const thePictureGroupsData = pictureGroupsDataEl.getAttribute('data-picture-groups');
      pictureGroupsData = JSON.parse(atob(thePictureGroupsData));
   }
//    console.log("pictureGroupsData length " + pictureGroupsData.length + " " + JSON.stringify(pictureGroupsData));


    for (let i = 0; i < pictureGroupsData.length; i++) {
        for (let p = 0; p < pictureGroupsData[i].images.length; p++) {
           
            if (pictureGroupsData[i].images[p].orientation == "Equirectangular") {
                 console.log("adding equirect: " +JSON.stringify(pictureGroupsData[i].images[p]));
                equirectPictures.push(pictureGroupsData[i].images[p]);
            } else if (pictureGroupsData[i].images[p].orientation == "Tileable") {
                 console.log("adding equirect: " +JSON.stringify(pictureGroupsData[i].images[p]));
                tileablePictures.push(pictureGroupsData[i].images[p]);
            }
            
        }
    }
    // const scenePicturesDataEl = document.getElementById('scenePicturesData');
    // if (scenePicturesDataEl) {
    // let theScenePicturesData = scenePicturesDataEl.getAttribute('data-scene-pictures');
    //   scenePicturesData = JSON.parse(atob(theScenePicturesData));
    //   console.log("scenePicturesData length " + scenePicturesData.length + " " + JSON.stringify(scenePicturesData));
    //   for (let s = 0; s < scenePicturesData.length; s++) {
    //     // if 
    //         if (scenePicturesData[s].orientation == "Tileable") {
    //              console.log("adding equirect: " +JSON.stringify(scenePicturesData[s]));
    //             tileablePictures.push(scenePicturesData[s]);
    //         }
    //     }
    // }
   
}

export function InitVideoGroups () {
    let videoGroupsDataEl = document.getElementById("videoGroupsData");
    
    if (videoGroupsDataEl) {
        console.log("tryna get videogroupsdata...");
        let theVideoGroupsData = videoGroupsDataEl.getAttribute('data-video-groups');
        videoGroupsData = JSON.parse(atob(theVideoGroupsData));
        console.log("videoGroupsData " + JSON.stringify(videoGroupsData));
    } else {
         console.log("cain't find videogroupsdata elelement");
    }
}

export function InitEquirectVideo(id, model) { //e.g. video skyboxen
    const locData = {};
    locData.isEquirect = true;
    console.log("tryna set equirect video " + id);
    const sceneVideo = new SceneVideo(id, model, locData);
    return sceneVideo;
}

export function InitLocationModelVideo(model, locData) { //attached to model
    console.log("tryna InitVideo");
    if (videoEl) {  
        const sceneVideo = new SceneVideo(videoEl.id, model, locData);
        mediaPlayersToUpdate.push(sceneVideo);
    } else {
        console.log("no video el!");
    }
}

export function ReturnPictureFromGroup (groupID, tags, groupIndex) {
    for (let i = 0; i < pictureGroupsData.length; i++) {
        if (pictureGroupsData[i]._id == groupID) {
            const imageIndex = Math.floor(Math.random() * pictureGroupsData[i].images.length);
            return pictureGroupsData[i].images[imageIndex];
        }
    }
}

export function ReturnAudioFromGroup (groupID, tags, groupIndex) {
    for (let i = 0; i < audioGroupsData.length; i++) {
        if (audioGroupsData[i]._id == groupID) {
            const audioIndex = Math.floor(Math.random() * audioGroupsData[i].items.length);
            return pictureGroupsData[i].items[audioIndex];
        }
    }
}


export function ReturnTaggedPictures (tag) {
    if (pictureGroupsData) {
      let matchedPics = [];
      for (let i = 0; i < pictureGroupsData.length; i++) {
        for (let j = 0; j < pictureGroupsData[i].images.length; j++) {
          if (pictureGroupsData[i].images[j].tags.includes(tag)) { //todo check tags
            
            // return picGroupArray[i].images[j];
            matchedPics.push(pictureGroupsData[i].images[j]);
          }
        }
      }
      return matchedPics;
    } else {
        return null;
    }
}

export async function InitAudioGroups() {
    if (settings && settings.audioGroups) {
        primaryAudioGroups = settings.audioGroups.primaryAudioGroups;
        ambientAudioGroups = settings.audioGroups.ambientAudioGroups;
        triggerAudioGroups = settings.audioGroups.triggerAudioGroups;
        audioGroupsData = await ReturnAudioGroupsData(settings.audioGroups);
        // console.log("audioGroupsData " + JSON.stringify(audioGroupsData));
    }
    // InitAmbientAudio(settings.ambient_mp3url);
        InitAmbientAudio();
}

export let ambientAudioController;
export let triggerAudioController;

export async function InitAmbientAudio () {
    console.log("tryna ambient and trigger audio");
    if (settings && settings.ambient_oggurl) {
        ambientAudioController = new AmbientAudioControl();
    }
    triggerAudioController = new TriggerAudioControl();
}
export function InitSceneText () {

    let textEl = document.getElementById("sceneTextData");
    if (textEl) {
        const textIDs = textEl.getAttribute("data-attribute");
         if (textIDs.length) {
            sceneTextController = new SceneTextData(textIDs);
        }
    }
   
}

class SceneVideo { // converted from platforms/aframe/mod-materials.js vid_materials_embed component
    constructor (id, model, locData) {
        this.video = videoEl;
        this.video.muted = false;
        this.streamIndex = 0;
        this.video.playsInline = true;
        const vID = id.split("_")[1]; //element id should be "video_" + id
        this.id = vID;

        this.isEquirect = locData.isEquirect;

        // primaryVideo = video;
        let m3u8 = '/hls/'+this.id; //um, needs auth

        console.log("hls sceneVideo is " + this.video.id + " m3u8 " + m3u8 + " isEquirect " + this.isEquirect);

        //settings.sceneVideoStreams is set serverside for external streams, e.g. from mux.com
        if (settings != undefined && settings.sceneVideoStreams != null && settings.sceneVideoStreams.length > 0) {
            console.log("settings.sceneVideoStreams length is " + settings.sceneVideoStreams.length);
            m3u8 = settings.sceneVideoStreams[Math.floor((Math.random()*settings.sceneVideoStreams.length))];
            this.data.videoTitle = settings.sceneTitle;
        }
        if (Hls != undefined && Hls.isSupported()) {
            
            var hls = new Hls();
            hls.attachMedia(this.video);
            
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                console.log('video and hls.js are now bound together !');
                hls.loadSource(m3u8);
                hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                console.log(
                    'hls manifest loaded, found ' + data.levels.length + ' quality level'
                );
                });
            });
            // }
        } else {
            console.log("hls.js not supported (ios?), goiing native!");
            this.video.src = m3u8;
        }


        // this.meshName = "videoPlayerModel_" + this.id;
        // this.mesh = scene.getObjectByName(this.meshName);
        // this.mesh.userData.name = this.meshName;
        // this.mesh.userData.locationData = locData;

        // this.mesh.userData.sceneVideoInstance = this;

        this.screenMesh = null; 
        this.ffwdMesh = null; 
        this.rewindMesh = null; 
        this.isInitialized = false;
        let playButtonMesh = null;
        let pauseButtonMesh = null;
        this.playButtonMesh = null;
        this.pauseButtonMesh = null;
        this.play_button = null;  
        this.play_icon = null;
        this.pausematerial = null;
        this.playmaterial = null;
        
        this.vidtexture = new THREE.VideoTexture( this.video );

        this.slider_end = null;
        this.slider_begin = null;
        this.slider_handle = null;
        this.texture = null;
        this.durationtimeformat = 0;
        this.percent = 0;


        this.meshArray = [];
        this.flipY = false;
        this.mesh = model;
        if (!this.isEquirect && this.mesh) {
            // this.meshName = "videoLocationModel_" + this.id;
            // console.log("tryna get player " + this.meshName)
            // this.mesh = scene.getObjectByName(this.meshName);

            this.mesh.userData.name = this.meshName;
            this.mesh.userData.locationData = locData;

            this.mesh.userData.sceneVideoInstance = this; //to call the update(s) from main anim loop

            this.mesh.traverse(node => {
            // if (node instanceof THREE.Mesh) 
            // console.log(node.name);
              if ((node.name.toLowerCase().includes("screen") || node.name.toLowerCase().includes("hvid")) && node.material) {
                this.screenMesh = node; 

                console.log("gotsa screen mesh");
                // this.meshArray.push(this.screenMesh);
                    this.screenMesh.userData.name = "screen_videoPlayerModel_" + vID;
                    this.screenMesh.userData.locationData = locData;
                    this.screenMesh.userData.sceneVideoInstance = this;

              } 
         
              if (node.name.toLowerCase().includes("fastforward")) {
                this.ffwdMesh = node; 
                  this.ffwdMesh.userData.name = "fwd_videoPlayerModel_" + vID;
                    this.ffwdMesh.userData.locationData = locData;
                    this.ffwdMesh.userData.sceneVideoInstance = this;
              }
            //   if (node.name.toLowerCase().includes("frame")) {
            //     this.ffwdMesh = node; 
            //     this.meshArray.push(this.ffwdMesh);
            //   }
            //   if (node.name.toLowerCase().includes("background")) {
            //     this.ffwdMesh = node; 
            //     this.meshArray.push(this.ffwdMesh);
            //   }
              if (node.name.toLowerCase().includes("rewind")) {
                this.rewindMesh = node; 
                this.rewindMesh.userData.name = "rewind_videoPlayerModel_" + vID;
                this.rewindMesh.userData.locationData = locData;
                this.rewindMesh.userData.sceneVideoInstance = this;
              }
                if (node.name.toLowerCase().includes("next")) {
                this.nextMesh = node; 
                this.nextMesh.userData.name = "next_videoPlayerModel_" + vID;
                this.nextMesh.userData.locationData = locData;
                this.nextMesh.userData.sceneVideoInstance = this;
              }
            if (node.name.toLowerCase().includes("previous")) {
                this.previousMesh = node; 
                this.previousMesh.userData.name = "previous_videoPlayerModel_" + vID;
                this.previousMesh.userData.locationData = locData;
                this.previousMesh.userData.sceneVideoInstance = this;
              }
             
              if (node.name.toLowerCase().includes("play")) {
                this.playButtonMesh = node; 
                this.playButtonMesh.userData.name = "play_videoPlayerModel_" + vID;
                this.playButtonMesh.userData.locationData = locData;
                this.playButtonMesh.userData.sceneVideoInstance = this;
              }
              if (node.name.toLowerCase().includes("play_button")) {
                 this.playButtonMesh = node; 
                this.playButtonMesh.userData.name = "play_videoPlayerModel_" + vID;
                this.playButtonMesh.userData.locationData = locData;
                this.playButtonMesh.userData.sceneVideoInstance = this;
              }
              
             
              if (node.name.toLowerCase().includes("pause")) {
                this.pauseButtonMesh = node; 

                this.pauseButtonMesh.userData.name = "play_videoPlayerModel_" + vID;
                this.pauseButtonMesh.userData.locationData = locData;
                this.pauseButtonMesh.userData.sceneVideoInstance = this;
              }
              if (node.name.toLowerCase().includes("slider_end")) {
                this.slider_end = node; 
                this.slider_end.userData.name = "sliderend_videoPlayerModel_" + vID;
                this.slider_end.userData.locationData = locData;
                this.slider_end.userData.sceneVideoInstance = this;
              }
              if (node.name.toLowerCase().includes("slider_begin")) {
                this.slider_begin = node; 
                 this.slider_begin.userData.name = "sliderbegin_videoPlayerModel_" + vID;
                this.slider_begin.userData.locationData = locData;
                this.slider_begin.userData.sceneVideoInstance = this;
              }
              if (node.name.toLowerCase().includes("slider_handle")) {
                this.slider_handle = node; 
                  this.slider_handle.userData.name = "sliderhandle_videoPlayerModel_" + vID;
                this.slider_handle.userData.locationData = locData;
                this.slider_handle.userData.sceneVideoInstance = this;
              }
              if (node.name.toLowerCase().includes("slider_background")) {
                this.slider_background = node; 
                this.slider_background.userData.name = "sliderhandle_videoPlayerModel_" + vID;
                this.slider_background.userData.locationData = locData;
                this.slider_background.userData.sceneVideoInstance = this;
              }
              // if (this.pauseButtonMesh)
            // }
          }); 

        } else { //if 360
          playVideo(this.video);          
        //   this.mesh = this.el.getObject3D('mesh');
          this.screenMesh = this.mesh;
          this.meshArray.push(this.screenMesh);
          console.log("this.screenmesdh" + this.screenMesh);
          this.flipY = true;

        }
        // this.video.play().catch(err => console.error("Playback blocked:", err));

        // this.vidtexture = new THREE.VideoTexture( this.video );
        this.vidtexture.flipY = this.flipY; 
        this.vidtexture.colorSpace = THREE.SRGBColorSpace;
       
        // this.vidtexture.minFilter = THREE.LinearMipmapNearestFilter;
        // this.vidtexture.magFilter = THREE.LinearMipmapNearestFilter;
        // this.playmaterial = new THREE.MeshStandardMaterial( { map: this.vidtexture, side: THREE.DoubleSide, shader: THREE.FlatShading } ); 
        if (this.isEquirect) {
            // this.playmaterial = new THREE.MeshBasicMaterial( { map: this.vidtexture, side: THREE.BackSide, shader: THREE.FlatShading } ); 
            //  this.playmaterial  = new THREE.MeshBasicNodeMaterial();
            this.vidtexture.mapping = THREE.EquirectangularReflectionMapping;
            this.playmaterial = model.material;
            let tslVidTexture = texture(this.vidtexture,  equirectUV( positionLocal.normalize()));

            if (settings.sceneTags.includes("noise")) {
				const noiseCoord = vec3(uv().mul(33.0), time.mul(0.1));
				const noiseValue = mx_noise_float(noiseCoord);

				tslVidTexture = texture(this.vidtexture, uv().add(noiseValue.mul(0.05)));
				
			} else if (settings.sceneTags.includes("distort")) {
				const uvNode = uv();
				const distortion = sin(uvNode.y.mul(30).add(time)) .mul(.005);
				const distortion2 = sin(uvNode.x.mul(15).add(time)).mul(.01);
				const distortedUV = vec2(uvNode.x.add(distortion), uvNode.y.add(distortion2));
				tslVidTexture = texture(this.vidtexture, distortedUV);



			}
                // tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
            // this.colorNode = tslVidTexture.mul(1);
            // if (locData.locationTags && locData.locationTags.includes("tweak")) {
                this.colorNode = tslVidTexture.mul(animatedColor.add(1).mul(0.5)); 
            // } 
                // else {
                    // this.playmaterial.colorNode = tslVidTexture.mul(1);
                // }

            this.playmaterial.colorNode = this.colorNode;
                		// const textureEquirect = sceneEquirectVideo.returnVideoTexture();
                // textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
                // textureEquirect.colorSpace = THREE.SRGBColorSpace;


                // // tslTexture = texture(textureEquirect, uv());
                // // tslTexture = texture(textureEquirect, equirectUV());

                // const tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
                // let videoSkyboxColorNode = tslTexture.mul(3);
                // videoSkyboxMaterial.colorNode = videoSkyboxColorNode;
                scene.environmentNode = this.colorNode;
                scene.environment = this.vidtexture;
                scene.backgroundNode = this.colorNode;
                                
                                scene.background = this.vidtexture;

        } else {
            // this.playmaterial = new THREE.MeshBasicMaterial( { map: this.vidtexture, shader: THREE.FlatShading } ); 
              this.playmaterial  = new THREE.MeshBasicNodeMaterial();
                const tslVidTexture = texture(this.vidtexture, uv());
                if (locData.locationTags && locData.locationTags.includes("tweak")) {
                    this.playmaterial.colorNode = tslVidTexture.mul(animatedColor.add(1).mul(0.5)); 
                } else {
                    this.playmaterial.colorNode = tslVidTexture;
                }
        }
          

        console.log("tryna bind video material to mesh");

        // this.playmaterial.generateMipmaps = true;   
        // this.playmaterial.map.needsUpdate = true;   
        // this.playmaterial.needsUpdate = true;


        if (this.screenMesh != null) {
        this.screenMesh.material = this.playmaterial;
        this.isInitialized = true;
        console.log("video paused " + this.video.paused + "video readyState " + this.video.readyState);

        }

        this.video.addEventListener( 'canplay', this.player_status_update("ready"), false);
    }
    // returnVideoTexture () {
    //     // if (this.vidtexture) {
    //     console.log("tryna return videoTexture " + this.vidtexture);
    //         return this.vidtexture;
    //     // }
    // }

    player_status_update (state) {
        this.playerState = state;
        
        if (this.play_button != null) {
            if (state == "loading") {
            //   this.play_button.material = this.yellowmat;
                // if (this.transportPlayButton != null) {
                //     this.transportPlayButton.style.color = 'yellow';
                    
                // }
                // this.screen.material = this.loadingMaterial;
            
            } else if (state == "ready") {
                this.play_button.material = this.bluemat;
                playVideo(this.video);
                console.log("tryna play video, ispaused " + this.video.paused + "video readyState " + this.video.readyState);
                //   if (this.transportPlayButton != null) {
                //     this.transportPlayButton.style.color = 'blue';
                // }
                // this.screen.material = this.readyMaterial;
            } else if (state == "playing") {
                this.play_button.material = this.greenmat;
                //   if (this.transportPlayButton != null) {
                //     this.transportPlayButton.style.color = 'lightgreen';
                // }
                // this.screen.material = this.playingMaterial;
            } else if (state == "paused") {
                this.play_button.material = this.redmat;
                //   if (this.transportPlayButton != null) {
                //     this.transportPlayButton.style.color = 'red';
                // }
                // this.screen.material = this.pausedMaterial;
            }
            // }
        }
    }
    videoPlayerTogglePlayPause () {
        if (this.video.paused) {
            playVideo(this.video);
        } else {
            pauseVideo(this.video);
        }
    }
    videoRewind () {
        console.log("tryna rewind!");
        if ((this.video.currentTime - 10) > 0) {
            this.video.currentTime = this.video.currentTime - 10;
        }
    }
    videoForward () {
        if (this.video.currentTime + 10 < this.video.duration) {
            this.video.currentTime = this.video.currentTime + 10;
        }
    }
    videoNext () {

    }
    videoPrevious () {

    }
    videoSliderRead () {

    }
    videoSliderHandle(hitpoint) {
        this.hitpoint = hitpoint;
        let nStart = new THREE.Vector3();
        let nEnd = new THREE.Vector3();
        this.slider_begin.getWorldPosition( nStart );
        this.slider_end.getWorldPosition( nEnd );
        console.log("background hit at " + JSON.stringify(this.hitpoint) );
        let range = nEnd.x.toFixed(2) - nStart.x.toFixed(2);
        let correctedStartValue = 0;
        correctedStartValue = this.hitpoint.x.toFixed(2) - nEnd.x.toFixed(2);
        let percentage = 0;
        percentage = (((correctedStartValue * 100) / range) + 100).toFixed(2); 
        let time = (percentage * (this.video.duration / 100)).toFixed(2);

        let touchPosition = (((this.hitpoint.y.toFixed(2) - this.slider_begin.position.y.toFixed(2)) * 100) / (this.slider_end.position.y.toFixed(2) - this.slider_begin.position.y.toFixed(2)));
        console.log("bg touch % " + percentage +  " touchPosition " + + JSON.stringify(this.hitpoint) + " vs start " +  JSON.stringify(nStart) + " vs end " +  JSON.stringify(nEnd));
        // this.slider_handle.position.x = intersects[i].point.x; 
        // this.slider_handle.position.z =  nStart.z;
        // this.slider_handle.position.z =  nStart.y; 
        this.slider_handle.position.lerpVectors(this.slider_begin.position, this.slider_end.position, percentage * .01);
        this.video.currentTime = time;
    }
    videoSliderBackground () {
        let nStart = new THREE.Vector3();
        let nEnd = new THREE.Vector3();
        this.slider_begin.getWorldPosition( nStart );
        this.slider_end.getWorldPosition( nEnd );
        console.log("background hit at " + JSON.stringify(this.hitpoint) );
        let range = nEnd.x.toFixed(2) - nStart.x.toFixed(2);
        let correctedStartValue = 0;
        correctedStartValue = this.hitpoint.x.toFixed(2) - nEnd.x.toFixed(2);
        let percentage = 0;
        percentage = (((correctedStartValue * 100) / range) + 100).toFixed(2); 
        let time = (percentage * (this.video.duration / 100)).toFixed(2);

        let touchPosition = (((intersects[i].point.y.toFixed(2) - this.slider_begin.position.y.toFixed(2)) * 100) / (this.slider_end.position.y.toFixed(2) - this.slider_begin.position.y.toFixed(2)));
        console.log("bg touch % " + percentage +  " touchPosition " + + JSON.stringify(this.hitpoint) + " vs start " +  JSON.stringify(nStart) + " vs end " +  JSON.stringify(nEnd));
        // this.slider_handle.position.x = intersects[i].point.x; 
        // this.slider_handle.position.z =  nStart.z;
        // this.slider_handle.position.z =  nStart.y; 
        this.slider_handle.position.lerpVectors(this.slider_begin.position, this.slider_end.position, percentage * .01);
        this.video.currentTime = time;
                    
    }
    update () {
        if (this.video != null && this.video != undefined) {
            if (this.durationtimeformat = null) {
                this.durationtimeformat = fancyTimeFormat(this.video.duration)
            }
            if (!this.video.paused && this.slider_handle != null) {
                // this.playmaterial.map.needsUpdate = true;  
                let currentTime = this.video.currentTime.toFixed(2);
                this.percent = this.video.currentTime / this.video.duration;
                // console.log(this.percent);
                this.slider_handle.position.lerpVectors(this.slider_begin.position, this.slider_end.position, this.percent);
                
                    // this.fancyTimeString = fancyTimeFormat(this.video.currentTime)  + " / "+ fancyTimeFormat(this.video.duration)  + " : " + (this.percent * 100).toFixed(2) +" %\n"+currentTime;
                    // this.videoStatus.setAttribute('text', {
                    // // width: 4, 
                    // align: "left",
                    // value: this.fancyTimeString,
                    // font: "/fonts/etc/Exo2Bold.fnt",
                    // anchor: "center",
                    // wrapCount: 100,
                    // color: "white", 
                    // });
                    // MediaTimeUpdate(this.fancyTimeString);
            }
        }
    }
}


class SceneTextData {
    constructor(textIDs) {
        //  this.sceneTextData = document.getElementById("sceneTextData").dataset.attribute
        this.jsonData = [];
        this.textIDs = textIDs;
        this.dataFetched = false;
       
        console.log("textData AHOY!" + textIDs + " length " + textIDs.length);
        // let tempArray = []; 
        if (!textIDs.indexOf(",") == -1) { //make sure to send request with an array
            this.textIDs[0] = textIDs;
            } else {
            this.textIDs = textIDs.split(",");
            }
            this.textDataArray = [];
            this.fetchTextData(this.textIDs);
            this.textItems = null;
        }



        //xhr
        fetchTextData (data) {
            console.log("tryna fetch text data " + data);
            fetch('/scene_text_items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                textIDs: data           
            })
            })
            .then(response => response.json())
            .then(data => {
                console.log('textData Success:', data.length);

                
                for (let i = 0; i < data.length; i++) { //check for text type?
                    this.popTextData(data[i]); //textstring should be a valid json, from defined template//not, just an array of objex saved in global
                }
                // this.dataHasBeenFetched();
                // AssignTagsToInstances()

            })
            .catch(error => console.error('Error:', error));
            
            // this.jsonData = sceneTextItems;
            // console.log("sceneTextData " + JSON.stringify(this.jsonData));
            
            
        
        }
        popTextData (data) {
            // const parsedText = JSON.stringify(data);
            this.jsonData.push(data);
            console.log("sceneTextItems " + this.jsonData.length);
        }
    
        loadTextData (data) {
        // console.log("loading sceneTextItems " + JSON.stringify(sceneTextItems));
        // this.textItems = data;
        }
        async returnAllTextDataFromMediaID (mediaID) {
            await this.jsonData;
            // console.log(JSON.stringify(this.jsonData));
            for (let i = 0; i < this.jsonData.length; i++) {
                console.log("mediaID " + mediaID + " vs " + this.jsonData[i]._id);
                if (mediaID.toString() == this.jsonData[i]._id.toString()) {
                    return this.jsonData[i];
                }
            }
        }
        dataHasBeenFetched () {
            this.dataFetched = true;
        }
        async dataIsReady () {
            await this.dataFetched == true;

            return true;
        }
        returnTextData (mediaID, tag) {
            console.log("tryna get mediaID " + mediaID);
            // console.log("tryna get text media for " + mediaID);
            for (let i = 0; i < this.jsonData.length; i++) {
                console.log("mediaID " + mediaID + " vs " + this.jsonData[i]._id);
            if (mediaID == this.jsonData[i]._id) {

                const textObject = JSON.parse(this.jsonData[i].textstring);

                if (!tag) {
                    // console.log("textstring " + this.jsonData[i].textstring);
                    if (textObject.data && textObject.data.length) {    
                        // console.log("textstring " + this.jsonData[i].textstring.data);            
                        // const textData = JSON.parse(this.jsonData[i].textstring.data);
                        const rindex = Math.floor(Math.random() * textObject.data.length);

                        return textObject.data[rindex];
                    } else {
                        // console.log("textstring " + this.jsonData[i].textstring);
                        // const textData = JSON.parse(this.jsonData[i].textstring);
                        const rindex = Math.floor(Math.random() * textObject.length);

                        return textObject[rindex];
                    }
                } else {
                    for (let i = 0; i < textObject.data.length; i++) {
                         //match the first element in child array
                        tag = tag.split("~")[0];
                        tag = tag.toLowerCase();
                        console.log(textObject.data[i][0].toLowerCase() + " vs "+  tag);
                        if (textObject.data[i][0].toLowerCase() == tag) {
                            return textObject.data[i];
                        }
                    }
                }

                

            }
        }
    }
}

const clampNumber = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

class TriggerAudioControl {
    constructor(options) {
        this.triggerAudioGroups = triggerAudioGroups;
        
        if (!this.triggerAudioHowl) {
        console.log("triggerAudioHowl is null, creating");
        // if (settings.hasPrimaryAudioStream) {
        //   primaryAudioHowl = new Howl({
        //       src: [settings.primary_mp3url], html5: true
        //   });
        // } else {
            this.triggerAudioHowl = new Howl({
                src: [""],
                loop: true
            });
        }

        this.volMod = 1;
        if (settings && settings.volumeTrigger) {
            this.volMod = ((parseFloat(settings.volumeTrigger) - -80) * 100) / (20 - -80) * .01;
            console.log("this.volMod trigger " + this.volMod);
        }
    }
    playTriggerAudioWithTags (tagstring, distance, pos) {
        if (tagstring) {
            let tags = tagstring.toString().split(',');
            for (let i = 0; i < tags.length; i++) {
                // console.log("looking fo rtag " + tags[i].trim());
                const audioItemID = this.returnTriggerAudioIDWithTag(tags[i].trim());
                if (audioItemID) {

                    
                    this.audioItem = this.returnAudioItem(audioItemID);

                    if (this.audioItem != null) { 
                        this.triggerAudioHowl = null;
  
                        this.triggerAudioHowl = new Howl({
                            src: this.audioItem.URLogg,
                            format: "ogg",
                            // sprite: {trigger: [0, 5000]}
                        }); 

                        // // if (this.audioItem != null) {
                        // console.log("gotsa audioItem with tag "+tags[i]+ ", tryna set trigger to src " + this.audioItem.URLogg);
                        // triggerAudioHowl = null;
                        // triggerAudioHowl = new Howl({
                        //     src: [this.audioItem.URLogg, this.audioItem.URLmp3],
                        //     format: ["ogg", "mp3"]
                        // });
                        // triggerAudioHowl.format = ["ogg", "mp3"];
                        // triggerAudioHowl.src = [audioItem.URLogg, audioItem.URLmp3];
                        this.triggerAudioHowl.load();
                        // triggerAudioHowl.play();

                        //umm, maybe split the diff with this.data.volume (scene setting) and the distance driven volume below?
                        let volume = Math.min(Math.max(0, 1000 - (distance * 25)), 1000) * .001; //clamp between 0-1
                        // let volume = clamp(100 - distance) * .01; //hrm..
                        if (volume < .1) {
                            volume = .1;
                        }
                        if (this.volMod != null) {
                            volume = volume * this.volMod;
                        }
                        if (volume < .1) {
                            volume = .1;
                        }
                        console.log("gotsa audioItem "  + audioItemID + " from tag " + tags[i] + " volMod " + this.volMod + " final volume " + volume);
                        this.triggerAudioHowl.volume(volume);
                        
                            
                        const clamp = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
                        const rate = clamp(Math.random() + .25, .75, 1.25); //fudge pitch a bit slower or faster
                        this.triggerAudioHowl.rate(rate);
                        // console.log("tryna play at hitpoint " + pos);
                        // if (this.id == 0) {
                        this.id = this.triggerAudioHowl.play();
                    // } else {
                    //     triggerAudioHowl.play();
                    // }
                    
                    // console.log("tryna play trigger at volume " + volume + " distance " + distance + " id " + this.id); //calling id here is needed
                        this.triggerAudioHowl.pos(pos.x / 100, pos.y / 100, pos.z / 100, this.id);  //HOLY SHIT howler needs small values for position, * .01
                    
                        this.triggerAudioHowl.play();
                    }
                }
            }
        }
    }
    returnTriggerAudioIDWithTag (tag) {
        if (tag && audioGroupsData && audioGroupsData.triggerGroupItems) {
            // console.log("looking for audio trigger with tag " + tag + " in groups " + audioGroupsData.triggerGroupItems.length);
            let matchingItems = [];
            // let triggerGroup = this.data.audioGroupsData.triggerGroupItems[0];

            // (async () => {
            //     try {
            for (const triggerGroup of audioGroupsData.triggerGroupItems) {
            // for (let a = 0; a < this.data.audioGroupsData.triggerGroupItems.length; a++) {
                for (let i = 0; i < triggerGroup.items.length; i++) {
                    // console.log("looking for triggerGroup.item " + triggerGroup.items[i]);
                    for (let j = 0; j < audioGroupsData.audioItems.length; j++) { //MAYBE SHUFFLE?
                        // console.log("Ccchekin trigger group item " +triggerGroup.items[i]+ " vs " + audioGroupsData.audioItems[j]._id);
                        if (triggerGroup.items[i] === audioGroupsData.audioItems[j]._id) {
                            // console.log(triggerGroup._id + " match trigger group item " +triggerGroup.items[i]+ " vs " + audioGroupsData.audioItems[j]._id);
                            //not ideal, maybe the groupitems can store tags? or cache them when loaded below?
                            
                            //TODO need to split the string and match eggzackly!!!!!
                            if (audioGroupsData.audioItems[j].tags && audioGroupsData.audioItems[j].tags.toString().toLowerCase().includes(tag)) {
                                // console.log("tag match to " + tag);  
                                // return triggerGroup.items[i];
                                // console.log("matched triggeraudiotem w/ tag " + tag);
                                matchingItems.push(triggerGroup.items[i]);
                                // return triggerGroup.items[i]; //ok to not return?
                            }
                        }
                    }

                }
            }
            if (matchingItems.length) {
                const rIndex = Math.floor(Math.random() * matchingItems.length);
                return matchingItems[rIndex];
            }
                 
        }
    }
    returnAudioItem (id) {
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
}

class AmbientAudioControl {
    constructor(options){
        this.ambientURL = "";
        if (settings && settings.ambient_oggurl) {
            this.ambientURL = settings.ambient_oggurl;
            console.log("ambient url " + this.ambientURL);
            // ambientAudioHowl.play();
        } else {
            console.log("no ambient url!");
        } //else if ambientAudioGroups...
        
        // if (!this.ambientAudioHowl) {
        //     this.ambientAudioHowl = globalThis.ambientAudioHowl; //for aframe, howl don't module
        //     console.log("ambientAudioHowl is global!");
        // }

        if (!this.ambientAudioHowl && this.ambientURL != "") {
        console.log("ambientAudioHowl is null, creating");
        // if (settings.hasPrimaryAudioStream) {
        //   primaryAudioHowl = new Howl({
        //       src: [settings.primary_mp3url], html5: true
        //   });
        // } else {
            this.ambientAudioHowl = new Howl({
                src: [this.ambientURL],
                loop: true
            });
            this.ambientAudioHowl.volume(0);
            this.ambientAudioHowl.load();
            this.ambientAudioHowl.play();
        }
        this.volMod = 1;
        // if (settings && settings.volumeAmbient) {
        //     this.volMod = parseFloat(settings.volumeAmbient);
        //     console.log("this.volMod "+ this.volMod);
        // }
        this.distance = 10;
        this.time = 0;
        this.soundPositionParent = new THREE.Object3D();
        this.soundPosition = new THREE.Vector3();
        this.cameraPosition = new THREE.Vector3();
        this.cameraRotation = new THREE.Vector3();
        const geometry = new THREE.SphereGeometry(.1,16,16);
        const material = new THREE.MeshBasicNodeMaterial({color: 'red', wireframe: true});
        this.soundPositionChild = new THREE.Mesh(geometry, material);
        this.soundPositionParent.add(this.soundPositionChild);
        this.soundPositionParent.visible = false;
        player.add(this.soundPositionParent);
        this.soundPositionParent.position.set(0,0,0);
        this.soundPositionChild.position.set(0,0,2);
        this.count = 0;
        this.rotateLeft = true;
        
        this.interval = setInterval(() => {
            if (Howler) {
            this.modPosition(performance.now());
            this.count++;
            if (this.count % 100 === 0) {
                this.rotateLeft = !this.rotateLeft;
            }
        }
        }, 100);
        this.modVolume();
    }
    modVolume() {
                // console.log("tryna mod primaryAUdioStreamVolume to " + newVolume);
                // primaryAudioHowl.volume(normalizedVolume);
                const newVolume = .1;
                const normalizedVolume = ((newVolume - -80) * 100) / (20 - -80) * .01;

                 if (settings && settings.volumeAmbient) {
                // this.volMod = parseFloat(settings.volumeAmbient);
                this.volMod = ((parseFloat(settings.volumeAmbient) - -80) * 100) / (20 - -80) * .01;
                console.log("this.volMod "+ this.volMod);
            }
                // console.log("normalizedVolume is " + normalizedVolume);
                
    
    }
    modPosition(time) {
        
        if (camera && Howler) {
        //  return;
        // }
        camera.getWorldPosition(this.cameraPosition);
        camera.getWorldDirection(this.cameraRotation);
        // if (this.cameraPosition.x) {
        Howler.pos(this.cameraPosition.x/100, this.cameraPosition.y/100, this.cameraPosition.z/100); //listener position
        Howler.orientation(this.cameraRotation.x, 0, this.cameraRotation.z, 0, 1, 0);
        this.soundPositionChild.position.z = 1 + (.01 * Math.sin(time));//10 * Math.random(); //lerp me
        if (this.rotateLeft) {
            this.soundPositionParent.rotation.y += .1;
        } else {
            this.soundPositionParent.rotation.y -= .1;
        }
        
        this.soundPositionChild.getWorldPosition(this.soundPosition);

        // this.volMod = this.volMod + (.1 * Math.sin(time));
        this.distance = this.cameraPosition.distanceTo(this.soundPosition);
        // console.log(JSON.stringify(this.soundPosition) + " distance: " + this.distance);
        if (this.distance) {
           const rate = clampNumber(1 - (this.distance/2), .25, 1.25);
           this.ambientAudioHowl.rate(rate + .1);
           const vol = clampNumber(1 - (this.distance/2), .25, .75);
           this.ambientAudioHowl.volume(vol * this.volMod);
        //    console.log("rate " + rate + " vol " + (vol * this.volMod));
        }
        this.ambientAudioHowl.pos(this.soundPosition.x/100, this.soundPosition.y/100, this.soundPosition.z/100);
        // this.ambientAudioHowl.volume(1);
    // }
    }
    }
}

export class ScenePicture {
    constructor(locationGroupID, locationMediaID, instanceId, position, visible, lookAtCamera){
   
        this.isVisible;
        this.locationGroupID = locationGroupID;
        this.locationMediaID = locationMediaID;
  
            // console.log("creating a landscape panel " + position.x + " " + position.y + " " + position.z);
            const landscapeGeometry = new THREE.PlaneGeometry(6, 4, 4, 4);
            // const planeGeometry = new THREE.BoxGeometry(10, 10, 10); 
            const planeMaterial = new THREE.MeshStandardMaterial({ color: 'white', side: THREE.FrontSide, metalness: 0, roughness: 1, transparent: true });
            // planeMaterial.envMap = null;
            
            planeMaterial.envMapIntensity = 0;
            this.landscapePanel = new THREE.Mesh(landscapeGeometry, planeMaterial);
            this.landscapePanel.name = "landscapePanel";
            scene.add(this.landscapePanel);
            // this.landscapePanel
            this.landscapePanel.position.set(position.x, position.y + 3,position.z );
            // this.landscapePanel.lookAt(camera);
            this.landscapePanel.visible = false;
            // landscapePanel.updateMatrixWorld();
            if (lookAtCamera) {
                lookAtCameraObjects.push(this.landscapePanel);
            }
          
            // console.log("creating a portrait panel " + position.x + " " + position.y + " " + position.z);
            const portraitGeometry = new THREE.PlaneGeometry(4, 6, 4, 4);
            // const planeGeometry = new THREE.BoxGeometry(10, 10, 10); 
            // const planeMaterial = new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide });
            this.portraitPanel = new THREE.Mesh(portraitGeometry, planeMaterial);
            this.portraitPanel.name = "portraitPanel";
            scene.add(this.portraitPanel);
            this.portraitPanel.position.set(position.x, position.y + 4,position.z );
            // landscapePanel.lookAt(player);
            // this.portraitPanel.lookAt(camera);
            if (lookAtCamera) {
                lookAtCameraObjects.push(this.portraitPanel);
            }
            this.portraitPanel.visible = false;

                        // console.log("creating a portrait panel " + position.x + " " + position.y + " " + position.z);
            const squareGeometry = new THREE.PlaneGeometry(6, 6, 4, 4);
            // const planeGeometry = new THREE.BoxGeometry(10, 10, 10); 
            // const planeMaterial = new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide });
            this.squarePanel = new THREE.Mesh(squareGeometry, planeMaterial);
            this.squarePanel.name = "squarePanel";
            scene.add(this.squarePanel);
            this.squarePanel.position.set(position.x, position.y + 4,position.z );
            this.squarePanel.visible = false;
            if (lookAtCamera) {
                lookAtCameraObjects.push(this.squarePanel);
            }

            const circleGeometry = new THREE.CircleGeometry(6,32);
               this.circlePanel = new THREE.Mesh(circleGeometry, planeMaterial);
            this.circlePanel.name = "circlePanel";
            scene.add(this.circlePanel);
            this.circlePanel.position.set(position.x, position.y + 4,position.z );
            this.circlePanel.visible = false;
            if (lookAtCamera) {
                lookAtCameraObjects.push(this.circlePanel);
            }
            
            this.updatePicture();

    }
    updatePosition(position) {

        if (this.pictureItem.orientation == "Landscape") {
    
            if (this.landscapePanel) {
                // console.log("showing a landscape panel " + position.x + position.y + position.z);
                this.landscapePanel.position.set(position.x, position.y + 2, position.z );
            }

        } else if (this.pictureItem.orientation == "Portrait") {
    
            if (this.portraitPanel) {
                // console.log("showing a landscape panel " + position.x + position.y + position.z);
                this.portraitPanel.position.set(position.x, position.y + 2, position.z );
                
            }
        } else if (this.pictureItem.orientation == "Square") {
    
            if (this.squarePanel) {
                // console.log("showing a landscape panel " + position.x + position.y + position.z);
                this.squarePanel.position.set(position.x, position.y + 2, position.z );
                
            }
        } else {
    
            if (this.circlePanel) {
                // console.log("showing a landscape panel " + position.x + position.y + position.z);
                this.circlePanel.position.set(position.x, position.y + 2, position.z );
                
            }
        }
    }

    updatePicture() {
        
        console.log("tryna update picture from group " + this.locationGroupID);

        this.hideAllPanels();
        this.pictureItem = ReturnPictureFromGroup(this.locationGroupID);
        console.log("pictureITem " + JSON.stringify(this.pictureItem));

        if (this.pictureItem.orientation == "Landscape") {
                      
            if (this.landscapePanel) {
                this.landscapePanel.visible = true;
                const map = new THREE.TextureLoader().load( this.pictureItem.url );
                map.colorSpace = THREE.LinearSRGBColorSpace;
                this.landscapePanel.material.map = map;

                map.offset.set(0, .15);
                map.repeat.set(1, .7);
                this.landscapePanel.material.needsUpdate = true;
            }

        } else if (this.pictureItem.orientation == "Portrait") {
    
            if (this.portraitPanel) {
                this.portraitPanel.visible = true;
                const map = new THREE.TextureLoader().load( this.pictureItem.url );
                this.portraitPanel.material.map = map;
                map.colorSpace = THREE.LinearSRGBColorSpace;
                map.offset.set(.15, 0);
                map.repeat.set(.7, 1);
                this.portraitPanel.material.needsUpdate = true;
                
            }
        // } else if (this.pictureItem.orientation == "Square") {
        } else {
            if (this.squarePanel) {
                this.squarePanel.visible = true;
                const map = new THREE.TextureLoader().load( this.pictureItem.url );
                map.colorSpace = THREE.LinearSRGBColorSpace;
                this.squarePanel.material.map = map;

                // map.offset.set(0, 0);
                // map.repeat.set(0, 1);
                this.squarePanel.material.needsUpdate = true;
                
            }
        }
        
        // else {
        //     if (this.circlePanel) {
        //         this.circlePanel.visible = true;
        //         const map = new THREE.TextureLoader().load( this.pictureItem.url );
        //         this.circlePanel.material.map = map;
        //         // map.offset.set(.15, 0);
        //         // map.repeat.set(.7, 1);
        //         this.circlePanel.material.needsUpdate = true;
                
        //     }
        // }
    }


    hideAllPanels () {
        if (this.landscapePanel) {
            this.landscapePanel.visible = false;
        }
        if (this.portraitPanel) {
            this.portraitPanel.visible = false;
        }
        if (this.squarePanel) {
            this.squarePanel.visible = false;
        }
    }

    toggleVis () {
        this.isVisible = !this.isVisible;
        if (!this.isVisible) {
            this.hideAllPanels();
        }
        return this.isVisible;
    }
}
