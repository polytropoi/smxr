
import * as THREE from 'three';

import {player, camera } from './three_controls.js';

import { settings } from '../../../connect/settings.js';
import { fancyTimeFormat, primaryAudioMangler, ReturnAudioGroupsData} from "../../../connect/media.js";

export let primaryAudioGroups;
export let ambientAudioGroups;
export let triggerAudioGroups;

export let sceneTextController;



export async function InitAudioGroups() {
    if (settings && settings.audioGroups) {
        primaryAudioGroups = settings.audioGroups.primaryAudioGroups;
        ambientAudioGroups = settings.audioGroups.ambientAudioGroups;
        triggerAudioGroups = settings.audioGroups.triggerAudioGroups;
        const audioGroupsData = await ReturnAudioGroupsData(settings.audioGroups);
        console.log("audioGroupsData " + JSON.stringify(audioGroupsData));
    }
    InitAmbientAudio(settings.ambient_mp3url);
}

export let ambientAudioController;
export async function InitAmbientAudio () {
    if (settings && settings.ambient_oggurl) {
        ambientAudioController = new AmbientAudioControl();
    }
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
       
       
        console.log("TEXtITEMS AHOY!" + textIDs + " length " + textIDs.length);
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
        //     // this.textData = [];
        //      let sceneTextItems = [];
        //     if (data.length > 0) {
        //     this.textData = JSON.stringify({
        //         textIDs: data //just send the ids
        //     }),
            // $.ajax({
            // url: "/scene_text_items",
            // type: 'POST',
            // contentType: "application/json; charset=utf-8",
            // dataType: "json",
            // data: JSON.stringify({
            //         textIDs: this.textIDs //just send the ids
            //     }),
            //     success: function( data, textStatus, xhr ){           
            //         for (let i = 0; i < data.length; i++) { //check for text type?
            //         // 
            //          this.popTextData(data[i]); //textstring should be a valid json, from defined template//not, just an array of objex saved in global
            //         // console.log("sceneTextData " + JSON.stringify(data[i]));
            //         }
            //         //  this.jsonData = sceneTextItems;
            //         // console.log("sceneTextItems " + JSON.stringify(this.jsonData));
            //     },
            //     // then: function () {
                   
            //     // },
            //     error: function( xhr, textStatus, errorThrown ){
            //         console.log( "error fetching text: " + xhr.responseText );
            //     }
            // });
            // if (data.length > 0) {
            // this.textData = JSON.stringify({
            //     textIDs: data //just send the ids
            // })
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
                console.log('Success:', data);

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
            console.log(JSON.stringify(this.jsonData));
            // console.log("tryna get text media for " + mediaID);
            for (let i = 0; i < this.jsonData.length; i++) {
            if (mediaID == this.jsonData[i]._id) {

                console.log("textstring " + this.jsonData[i].textstring);
                const textData = JSON.parse(this.jsonData[i].textstring);
                const rindex = Math.floor(Math.random() * textData.length);

                return textData[rindex];

                

            }
        }
    }
}

const clampNumber = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
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
        
        this.distance = 10;
        this.time = 0;
        this.soundPositionParent = new THREE.Object3D();
        this.soundPosition = new THREE.Vector3();
        this.cameraPosition = new THREE.Vector3();
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
        
            this.modPosition(performance.now());
            this.count++;
            if (this.count % 100 === 0) {
                this.rotateLeft = !this.rotateLeft;
            }
        }, 500);
        this.modVolume();
    }
    modVolume() {
                // console.log("tryna mod primaryAUdioStreamVolume to " + newVolume);
                // primaryAudioHowl.volume(normalizedVolume);
                const newVolume = .1;
                const normalizedVolume = ((newVolume - -80) * 100) / (20 - -80) * .01;
                // console.log("normalizedVolume is " + normalizedVolume);
                
    
    }
    modPosition(time) {
        
        camera.getWorldPosition(this.cameraPosition);
        Howler.pos(this.cameraPosition.x/100, this.cameraPosition.y/100, this.cameraPosition.z/100); //listener position
        this.soundPositionChild.position.z = 1+ (.05 * Math.sin(time));//10 * Math.random(); //lerp me
        if (this.rotateLeft) {
            this.soundPositionParent.rotation.y += .1;
        } else {
            this.soundPositionParent.rotation.y -= .1;
        }
        
        this.soundPositionChild.getWorldPosition(this.soundPosition);

        this.distance = this.cameraPosition.distanceTo(this.soundPosition);
        // console.log(JSON.stringify(this.soundPosition) + " distance: " + this.distance);
        if (this.distance) {
           const rate = clampNumber(1 - (this.distance/2), .25, 1.25);
           this.ambientAudioHowl.rate(rate + .1);
           const vol = clampNumber(1 - (this.distance/2), .1, .9);
           this.ambientAudioHowl.volume(vol);
        //    console.log("rate " + rate + " vol " + vol);
        }
        this.ambientAudioHowl.pos(this.soundPosition.x/100, this.soundPosition.y/100, this.soundPosition.z/100);
        // this.ambientAudioHowl.volume(1);
    }
}