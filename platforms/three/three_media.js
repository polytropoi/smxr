import { settings } from '../../../connect/settings.js';
import { fancyTimeFormat, primaryAudioMangler, ReturnAudioGroupsData} from "../../../connect/media.js";

export let primaryAudioGroups;
export let ambientAudioGroups;
export let triggerAudioGroups;



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

    ambientAudioController = new AmbientAudioControl();
    
    
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
        }
        
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
            this.ambientAudioHowl.load();
            this.ambientAudioHowl.play();
        }
        this.modVolume();
    }
    modVolume() {
                // console.log("tryna mod primaryAUdioStreamVolume to " + newVolume);
                // primaryAudioHowl.volume(normalizedVolume);
                const newVolume = .1;
                const normalizedVolume = ((newVolume - -80) * 100) / (20 - -80) * .01;
                console.log("normalizedVolume is " + normalizedVolume);
                this.ambientAudioHowl.volume(.25);
    
    }
    modPosition() {
        
    }
}