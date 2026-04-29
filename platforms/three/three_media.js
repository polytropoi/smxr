
import * as THREE from 'three';

import {player, camera } from './three_controls.js';

import { settings } from '../../../connect/settings.js';
import { fancyTimeFormat, primaryAudioMangler, ReturnAudioGroupsData} from "../../../connect/media.js";

export let primaryAudioGroups;
export let ambientAudioGroups;
export let triggerAudioGroups;

export let sceneTextController;
export let audioGroupsData;
export let pictureGroupsData;

export function InitPictureGroups () {
    let pictureGroupsDataEl = document.getElementById('pictureGroupsData');
   if (pictureGroupsDataEl) {
      let thePictureGroupsData = pictureGroupsDataEl.getAttribute('data-picture-groups');
      pictureGroupsData = JSON.parse(atob(thePictureGroupsData));
   }
   console.log("pictureGroupsData " + JSON.stringify(pictureGroupsData));
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

class SceneTextData {
    constructor(textIDs) {
        //  this.sceneTextData = document.getElementById("sceneTextData").dataset.attribute
        this.jsonData = [];
        this.textIDs = textIDs
       
       
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
                console.log('textData Success:', data);

                for (let i = 0; i < data.length; i++) { //check for text type?
                    this.popTextData(data[i]); //textstring should be a valid json, from defined template//not, just an array of objex saved in global
                }
            })
            .catch(error => console.error('Error:', error));
            
            // this.jsonData = sceneTextItems;
            // console.log("sceneTextData " + JSON.stringify(this.jsonData));
            
            
        
        }
        popTextData (data) {
            // const parsedText = JSON.stringify(data);
            this.jsonData.push(data);
            console.log("sceneTextItems " + JSON.stringify(this.jsonData));
        }
    
        loadTextData (data) {
        // console.log("loading sceneTextItems " + JSON.stringify(sceneTextItems));
        // this.textItems = data;
        }
        returnTextData (mediaID, index) {
            console.log("tryna get mediaID " + mediaID);
            // console.log("tryna get text media for " + mediaID);
            for (let i = 0; i < this.jsonData.length; i++) {
                console.log("mediaID " + mediaID + " vs " + this.jsonData[i]._id);
            if (mediaID == this.jsonData[i]._id) {

                const textObject = JSON.parse(this.jsonData[i].textstring);
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