export let settings;

$(function() { 

    let settingsEl = document.getElementById('settingsDataElement'); //volume, color, etc...
    let theSettingsData = settingsEl.getAttribute('data-settings');

    settings = JSON.parse(atob(theSettingsData)); //gets copied to localdata ifn mods are 'llowed

});