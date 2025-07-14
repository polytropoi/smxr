export let settings;

export let profile;

$(function() { 

    let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
    let theSettingsData = settingsEl.getAttribute('data-settings');

    settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed

});

export function UpdateUserProfile (userProfile) {
   profile = userProfile;
   console.log("userProfile is ready for " + profile.avatarName);
   // profileLoaded(profile);
}
