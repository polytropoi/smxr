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
}