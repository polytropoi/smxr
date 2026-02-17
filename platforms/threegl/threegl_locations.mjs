
import {SetSceneLocations} from "./connect.js";

    let locationDataEl = document.getElementById('locationData');
   if (locationDataEl) {
      let theLocationData = locationDataEl.getAttribute('data-locations');

      locationData = JSON.parse(atob(theLocationData));
      SetSceneLocations(locationData);
      console.log("locationData " + JSON.stringify(locationData));

   }
