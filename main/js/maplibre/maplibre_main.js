// import { SetTimeKeysData, eventEl } from '../connect/events.js';
// import { poiLocations } from '../connect/connect.js';
import {} from 'maplibre-gl';
import {ReturnPlayerData, sceneLocations, SetSceneLocations, GoToNext, GoToPrevious, poiLocations} from "../../../connect/connect.js";


const locstyle = "position:fixed;display:block;width:200px;height:400px;right:0px;bottom:0px;background-color:#ffffff;z-index:20;"
let mapZoomInt = "13";
let mapType = "hybrid";
let mapSize = "2048x2048";
let showGeoPanel = false;

let ipLookupData = null;
let currentLocation = [];
let geoEntity = 'geo-location';
// let mode = 'map';
let initialized = false;
let gpsElements = document.querySelectorAll(".poi,.geo");

// let sceneLocations;
let locationData;
let data_location_
// let doBuildings = false;
// let doTerrain = false;
let googleMapsKey = "";

      let latitude = 0;
      let longitude = 0;
      let restrict = false;
      let range = .1;
      let doBuildings = false;
      let doTerrain = false;
      let zoomLevel = 15;
    //   let mbid = settings.mbid;

      const mode = 'maplibre';

      setTimeout(() => {
        
            maplibreInit();           
      }, 3000);


$('.next_locbutton').on('click', function(e) {
    console.log("next button lat " + e.dataset.longitude);

});

$('.previous_locbutton').on('click', function(e) {
    console.log("previous button lat " + e.dataset.longitude);

});

$('#geoloc_button').on('click', function(e) {
    // console.log("color 1 changed " + e.target.value);
    ShowHideGeoPanel();
});

$('#popupLinkButton').on('click', function(e) {
    console.log("link button " + e.target.value);
    // ShowHideGeoPanel();
});
$('#nextButton').on('click', function(e) {
        console.log("next button " + e.target.value);
    // console.log("color 1 changed " + e.target.value);
    // ShowHideGeoPanel();
});
$('#previousButton').on('click', function(e) {
        console.log("previous button " + e.target.value);
    // console.log("color 1 changed " + e.target.value);
    // ShowHideGeoPanel();
});


function UpdateGeoPanel(nwString) {
    

    let d = document.querySelector('.geopanel');
    // d.style.visibility = "visible";
    // d.createElement('button')
    // d.setAttribute("style",locstyle);
    var p = d.querySelector('span');
    // p.setAttribute("style","text-align: left;margin:auto;font-size:14px Roboto;");
    p.innerHTML=nwString;
    UpdateButtons();  //reset events after repainting the geopanel
    // ShowHideGeoPanel();
}

function ShowHideGeoPanel () {
  showGeoPanel = !showGeoPanel;
  console.log("tryna showhidegeopanle " + showGeoPanel);
  if (showGeoPanel) { 
    if (initialized) {
      UpdateLocationInfo();
    }
    // 
  //  SwitchMapStyle();
    
    let d = document.querySelector('.geopanel');
    d.style.visibility = "visible";
    d.style.display = "block";
    // showGeoPanel = false;
    // UpdateLocationInfo();
  } else {
    let d = document.querySelector('.geopanel');
    d.style.visibility = "hidden";
    d.style.display = "none";
    // showGeoPanel = true;
  }
}

function PopupNextPreviousButtons(locstring) {
  console.log(locstring);
  // let lbData = loc;
  // console.log("lbData " + lbData );
  FlyToMapPosition(locstring.split("_")[0],locstring.split("_")[1], false);
  const popup = document.getElementsByClassName('maplibregl-popup');
  if ( popup.length ) {
      popup[0].remove();  
  }
}
function PopupLinkButtons (href) {
  if (href.length > 5) {
    var a = document.createElement('a');
    a.target="_blank";
    a.href=href;
    a.click();
  }
}

function UpdateButtons() {
  // console.log("sceneLOcations " + JSON.stringify(sceneLocations));
  var locbuttons = document.getElementsByClassName("locbutton");

  var locationClick = function() {
    let lbData = this.id;
    // console.log("lbData " + lbData );
    FlyToMapPosition(lbData.split("_")[0],lbData.split("_")[1], false); //the id is lng +_+ lat 
  };

  for (var i = 0; i < locbuttons.length; i++) {
    locbuttons[i].addEventListener('click', locationClick, false);
  }

  var locrotbuttons = document.getElementsByClassName("locrotbutton");

  var locrotClick = function() {
    RotateCamera(0);
  };

  for (var i = 0; i < locrotbuttons.length; i++) {
    locrotbuttons[i].addEventListener('click', locrotClick, false);
  }
}

// function geoip(json){
//   console.log("geoip : " +JSON.stringify(json));
//   ipLookupData = json;
  

// }

function ipLookup () {
    console.log("tryna lookupIPdata has data " + ipLookupData);
    if (!ipLookupData) {
        fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            ipLookupData = data;
            currentLocation = [ipLookupData.longitude, ipLookupData.latitude]; 
            UseIPLocation();
            // return ipLookupData;
            // Access location details like data.city, data.country_name, data.latitude, data.longitude
        })
        .catch(error => console.error('Error fetching IP geolocation:', error));
    }
}





  
  function DistanceBetweenTwoCoordinates(lat1, lon1, lat2, lon2, unit) { // from https://www.geodatasource.com/developers/javascript
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      return dist;
    }
  } 


  function UpdateLocationInfo() {
    // ShowHideGeoPanel();

    gpsElements = document.querySelectorAll(".poi,.geo");
    console.log("MODE IS " + mode + " gpsElements : " + gpsElements.length);
    let index = 0; 
    let markers = "";
    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    let range = .05;
    if (navigator.geolocation) {
        console.log("gotsa navigator..");
      navigator.geolocation.getCurrentPosition(
      (position) => {
        
          let mostDistant = 0;
          console.log("locatiuon: "+ position.coords.longitude + " " + position.coords.latitude);

          currentLocation = [position.coords.longitude, position.coords.latitude]; //to match the order and form of the maplibre coords
          for (var i = 0; i < gpsElements.length; i++) {
            if (gpsElements[i].classList.contains('poi')) {
            console.log("element has poi class: " + gpsElements[i].id + " " + geoEntity);
            let lat = gpsElements[i].dataset.latitude;
            let lng = gpsElements[i].dataset.longitude;
            console.log("tryna get distance to " + lat + " " + lng);
            index++; //zero index is used for player position in mapURL below
            // console.log(currentLocString);

            let fromToValues = {};
            fromToValues.from = {};
            fromToValues.to = {};
            fromToValues.from.latitude = position.coords.latitude;
            fromToValues.from.longitude = position.coords.longitude;
            fromToValues.to.latitude = lat;
            fromToValues.to.longitude = lng;
            // if (geolocator != undefined) {
            //     fromToValues.formula = geolocator.DistanceFormula.HAVERSINE;
            //     fromToValues.unitSystem = geolocator.UnitSystem.METRIC;
            // }
          
            
            //var distance = geolocator.calcDistance(fromToValues);
            var distance = DistanceBetweenTwoCoordinates(position.coords.latitude, position.coords.longitude, lat, lng);
            console.log("distance " + distance);
            if (distance > mostDistant) {
              mostDistant = distance;
            }
            if (distance > range) {
              console.log("not cloese enough!");
              let data = {};
              data.lat = lat;
              data.lng = lng;
              data.range = range;
              data.distance = distance;
              let data64 = btoa(JSON.stringify(data));
              // window.location.href = "/landing/geo.html?ld=" + data64;
            }

            // let marker = new maplibregl
            // let eventdata = "";
            // let label = "";
            // for (let m = 0; m < sceneLocations.locations.length; m++) {
            //   if (gpsElements[i].dataset._id == sceneLocations.locations[m]._id) {//match the id to get the sceneLcoation data
            //     console.log("gotsa match " + sceneLocations.locations[m]);
            //     label = sceneLocations.locations[m].name; // to do : event data
            //   }
            // }
            // currentLocString = currentLocString + "\nLocation "+index +" distance: " +distance.toFixed(3)+ "<br>";
            // currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>"+index +" " + label + " "+distance.toFixed(2)+ " km</button><br>";
            console.log("mode is " + mode);
            // if (mode != "maplibre") {
            //   console.log("NOT maplibre");
            //   let currentLocString = "<button class=\x22locbutton\x22 id=\x22"+position.coords.longitude+"_"+position.coords.latitude+"\x22>0 You Are Here</button><br>";
            //   currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>position "+index +" "+distance.toFixed(2)+ " miles</button><br>";
            //   markers = markers + "&markers=color:red%7Clabel:"+index+"%7C" + gpsElements[i].dataset.latitude+ "," + gpsElements[i].dataset.longitude;
            //   // console.log(markers);
            //   let gpsThing = {};
            //   gpsThing.currentLatitude = position.coords.latitude;
            //   gpsThing.currentLongitude = position.coords.longitude;
            //   gpsThing.latitude = gpsElements[i].dataset.latitude;
            //   gpsThing.longitude = gpsElements[i].dataset.longitude;
            //   gpsThing.index = index;
            //   gpsThing.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + gpsThing.latitude + "," + gpsThing.longitude + 
            //   "&zoom=17&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:red%7Clabel:"+index+"%7C" + gpsThing.latitude + "," + gpsThing.longitude;
            //   // gps.data.push(gpsThing);
            //   let gpsPanel = document.createElement("a-entity");
            //   var sceneEl = document.querySelector('a-scene');
            //   sceneEl.appendChild(gpsPanel);
            //   // gpsElements[i].appendChild(gpsPanel);
            //   gpsPanel.setAttribute('poi-map-materials', 'jsonData', JSON.stringify(gpsThing));
            //   //                   let pos = gpsElements[i].getAttribute('position').x + " " + (gpsElements[i].getAttribute('position').y + 3) + " " + gpsElements[i].getAttribute('position').z;
            //   // gpsPanel.setAttribute('position', pos);
            //   // gpsPanel.setAttribute('position', gpsElements[i].getAttribute('position'));
            //   gpsPanel.setAttribute('look-at', '#player');
            // } else {
              UpdateMarkers();
              
            // }
          } else {
              console.log("non poi geoElement");
          }
        }
            // if (mode != "maplibre") {
            //   // UpdateGeoPanel(currentLocString);
            
            // let mapEl = document.getElementById('youAreHere');
            // let mapJSON = {};
            // mapJSON.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + position.coords.latitude + "," + position.coords.longitude + // shows everhthing, need to scale zoom by max distance
            // "&zoom="+ReturnMapZoom(mostDistant)+"&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:green%7Clabel:0%7C" + position.coords.latitude + "," + position.coords.longitude + markers;
            // mapEl.setAttribute('map-materials', 'jsonData', JSON.stringify(mapJSON));
            // // $(".map-overlay").css('visibility','visible');
            // // $(".map-overlay").backstretch(mapURL);
            // } else {
              SetYouAreHereMarker();
            // }


      },
      (error) => { //best location mode not available, try some other stuff if it timed out
        //   console.warn('ERROR(' + error.code + '): ' + error.message);
           ipLookup();
          switch(error.code) {
            case 1: //error.PERMISSION_DENIED:
              console.log("User denied the request for Geolocation.");
            //   UseIPLocation();
              break;
            case 2: //error.POSITION_UNAVAILABLE:
               
              console.log("Location information is unavailable.");
            //   if (ipLookupData != null) {
            //     UpdateGeoPanel("position 0 - \nlatitude: " + ipLookupData.latitude + " longitude: " + ipLookupData.longitude);
            //   }
            //   UseIPLocation();
              break;
            case 3: //error.TIMEOUT:
              console.log("The request to get user location timed out.");
            //   UseIPLocation();
            //   if (ipLookupData != null) {
            //     console.log("iplookup mode");
            //     gpsElements = document.querySelectorAll(".poi,.geo"); //these will have a different target attribute that needs getting, depending on if arjs or not (geo-location vs gps-entity-place), s the geoEntity var
            //     console.log(gpsElements.length + " IPLoikupDatas " + JSON.stringify(ipLookupData));
            //     let currentLocString = "Location 0 - You Are Here (via ip)<br>";
            //     UpdateGeoPanel(currentLocString);
            //     let mostDistant = 0;
            //     // console.log(JSON.stringify(gpsElements));
            //     currentLocation = [ipLookupData.longitude, ipLookupData.latitude]; 
            //     // SetYouAreHereMarker();
            //     for (var i = 0; i < gpsElements.length; i++) {
            //       if (gpsElements[i].classList.contains('poi')) {
            //         for (let name of gpsElements[i].getAttributeNames()) {
            //           let value = gpsElements[i].getAttribute(name);
            //           // console.log(name, value);
            //         }
            //         index++; //zero index is used for player position in mapURL below

            //         let fromToValues = {};
            //         fromToValues.from = {};
            //         fromToValues.to = {};
            //         fromToValues.from.latitude = ipLookupData.latitude;
            //         fromToValues.from.longitude = ipLookupData.longitude;
            //         fromToValues.to.latitude = gpsElements[i].dataset.latitude;
            //         fromToValues.to.longitude = gpsElements[i].dataset.longitude;
            //         fromToValues.formula = geolocator.DistanceFormula.HAVERSINE;
            //         fromToValues.unitSystem = geolocator.UnitSystem.METRIC;

            //         var distance = geolocator.calcDistance(fromToValues);
                    
            //         if (distance > mostDistant) {
            //           mostDistant = distance;
            //         }
            //         // if (distance > .05) {
            //         //   window.location.href = "/landing/gf_1.html";
            //         // }

            //           currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>Location "+index +"</button> distance: " +distance.toFixed(3)+ " miles<br>";

            //           markers = markers + "&markers=color:red%7Clabel:"+index+"%7C" + gpsElements[i].dataset.latitude+ "," + gpsElements[i].dataset.longitude;
            //           // console.log(markers);
            //           let gpsThing = {};
            //           gpsThing.currentLatitude = ipLookupData.latitude;
            //           gpsThing.currentLongitude = ipLookupData.longitude;
            //           gpsThing.latitude = gpsElements[i].dataset.latitude;
            //           gpsThing.longitude = gpsElements[i].dataset.longitude;
            //           gpsThing.index = index;
            //           gpsThing.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + gpsThing.latitude + "," + gpsThing.longitude + 
            //           "&zoom=14&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:red%7Clabel:"+index+"%7C" + gpsThing.latitude + "," + gpsThing.longitude;
            //           // gps.data.push(gpsThing);
            //         if (mode != 'maplibre') {
            //           let gpsPanel = document.createElement("a-entity");
            //           gpsElements[i].appendChild(gpsPanel);
            //           gpsPanel.setAttribute('poi-map-materials', 'jsonData', JSON.stringify(gpsThing));
            //           // let pos = gpsElements[i].getAttribute('position').x + " " + (gpsElements[i].getAttribute('position').y + 3) + " " + gpsElements[i].getAttribute('position').z;
            //           // gpsPanel.setAttribute('position', pos);
            //           // gpsPanel.setAttribute('position', gpsElements[i].getAttribute('position'));
            //           gpsPanel.setAttribute('look-at', '#player');
            //         } else {
            //           UpdateMarkers();
                      
            //         }
            //       }
            //     }
            //     SetYouAreHereMarker();
            //     UpdateGeoPanel(currentLocString);
            //     let mapEl = document.getElementById('youAreHere');
            //     mapJSON = {};
            //     mapJSON.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + ipLookupData.latitude + "," + ipLookupData.longitude + // shows everhthing, need to scale zoom by max distance
            //     "&zoom="+ReturnMapZoom(mostDistant)+"&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:green%7Clabel:0%7C" + ipLookupData.latitude + "," + ipLookupData.longitude + markers;
            //     mapEl.setAttribute('map-materials', 'jsonData', JSON.stringify(mapJSON));
            //   }
              break;
            case error.UNKNOWN_ERROR:
                UpdateGeoPanel("An unknown error occurred.");
                break;
          }
      });
    } else {
      //////////////////////////// this is for iplookup
        // UseIPLocation();
        ipLookup();
    //   console.log("NO NAVIGATOR");
      
    //   if (ipLookupData != null) { 
    //     console.log("NO NAVIGATOR iplookup mode");
    //     let currentLocString = "Location 0 - You Are Here (via ip)<br>";
    //     UpdateGeoPanel(currentLocString);
    //     let mostDistant = 0;
    //     currentLocation = [ipLookupData.longitude, ipLookupData.latitude]; 
    //     SetYouAreHereMarker();
    //     for (var i = 0; i < gpsElements[i].length; i++) {
    //       for (let name of gpsElements[i].getAttributeNames()) {
    //         let value = gpsElements[i].getAttribute(name);
    //         console.log(name, value);
    //       }
    //       index++; //zero index is used for player position in mapURL below
    //       let fromToValues = {};
    //       fromToValues.from = {};
    //       fromToValues.to = {};
    //       fromToValues.from.latitude = ipLookupData.latitude;
    //       fromToValues.from.longitude = ipLookupData.longitude;
    //       console.log("geoEntity.toString() is " + geoEntity.toString());
    //       fromToValues.to.latitude = gpsElements[i].dataset.latitude;
    //       fromToValues.to.longitude = gpsElements[i].dataset.longitude;
    //       fromToValues.formula = geolocator.DistanceFormula.HAVERSINE;
    //       fromToValues.unitSystem = geolocator.UnitSystem.METRIC;

    //       var distance = geolocator.calcDistance(fromToValues);
    //       if (distance > mostDistant) {
    //         mostDistant = distance;
    //       }

    //       currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>Location "+index +"</button> distance: " +distance.toFixed(3)+ " miles<br>";
    //       markers = markers + "&markers=color:red%7Clabel:"+index+"%7C" + gpsElements[i].dataset.latitude+ "," + gpsElements[i].dataset.longitude;
    //       // console.log(markers);
    //       let gpsThing = {};
    //       gpsThing.currentLatitude = location.coords.latitude;
    //       gpsThing.currentLongitude = location.coords.longitude;
    //       gpsThing.latitude = gpsElements[i].dataset.latitude;
    //       gpsThing.longitude = gpsElements[i].dataset.longitude;
    //       gpsThing.index = index;
    //       gpsThing.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + gpsThing.latitude + "," + gpsThing.longitude + 
    //       "&zoom=15&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:red%7Clabel:"+index+"%7C" + gpsThing.latitude + "," + gpsThing.longitude;
    //       // gps.data.push(gpsThing);
    //       if (mode != 'maplibre') {
    //         let gpsPanel = document.createElement("a-entity");
    //         gpsElements[i].appendChild(gpsPanel);
    //         gpsPanel.setAttribute('poi-map-materials', 'jsonData', JSON.stringify(gpsThing));
    //         // let pos = gpsElements[i].getAttribute('position').x + " " + (gpsElements[i].getAttribute('position').y + 3) + " " + gpsElements[i].getAttribute('position').z;
    //         // gpsPanel.setAttribute('position', gpsElements[i].getAttribute('position'));
    //         gpsPanel.setAttribute('look-at', '#player');
    //       } else {
    //         UpdateMarkers();
    //         SetYouAreHereMarker();
    //       }
    //     }
    //     UpdateGeoPanel(currentLocString);
    //     let mapEl = document.getElementById('youAreHere');
    //     mapJSON = {};
    //     mapJSON.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + location.coords.latitude + "," + location.coords.longitude + // shows everhthing, need to scale zoom by max distance
    //     "&zoom="+ReturnMapZoom(mostDistant)+"&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:green%7Clabel:0%7C" + location.coords.latitude + "," + location.coords.longitude + markers;
    //     mapEl.setAttribute('map-materials', 'jsonData', JSON.stringify(mapJSON));
    //     // $(".map-overlay").css('visibility','visible');
    //     // $(".map-overlay").backstretch(mapURL);
    //   }
    }
    // if (theModal == null) {
    //   theModal = document.getElementById('theModal');
    // }

  }

  function UseIPLocation () {

      console.log("NO NAVIGATOR");
      
    if (ipLookupData != null) { 
        console.log("NO NAVIGATOR iplookup mode " + JSON.stringify(ipLookupData));
        let currentLocString = "Location 0 - You Are Here (via ip)<br>";
        // UpdateGeoPanel(currentLocString);
        let mostDistant = 0;
        // currentLocation = [ipLookupData.longitude, ipLookupData.latitude]; 
        SetYouAreHereMarker();
        for (var i = 0; i < gpsElements[i].length; i++) {
          for (let name of gpsElements[i].getAttributeNames()) {
            let value = gpsElements[i].getAttribute(name);
            console.log(name, value);
          }
          index++; //zero index is used for player position in mapURL below
          let fromToValues = {};
          fromToValues.from = {};
          fromToValues.to = {};
          fromToValues.from.latitude = ipLookupData.latitude;
          fromToValues.from.longitude = ipLookupData.longitude;
          console.log("geoEntity.toString() is " + geoEntity.toString());
          fromToValues.to.latitude = gpsElements[i].dataset.latitude;
          fromToValues.to.longitude = gpsElements[i].dataset.longitude;
        //   fromToValues.formula = geolocator.DistanceFormula.HAVERSINE;
        //   fromToValues.unitSystem = geolocator.UnitSystem.METRIC;

        //   var distance = geolocator.calcDistance(fromToValues);\
            var distance = DistanceBetweenTwoCoordinates(gpsElements[i].dataset.latitude, gpsElements[i].dataset.longitude, parseFloat(ipLookupData.latitude), parseFloat(ipLookupData.longitude));
          if (distance > mostDistant) {
            mostDistant = distance;
          }

          currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>Location "+index +"</button> distance: " +distance.toFixed(3)+ " miles<br>";
          let markers = markers + "&markers=color:red%7Clabel:"+index+"%7C" + gpsElements[i].dataset.latitude+ "," + gpsElements[i].dataset.longitude;
          // console.log(markers);
          let gpsThing = {};
          gpsThing.currentLatitude = ipLookupData.latitude;
          gpsThing.currentLongitude = ipLookupData.longitude;
          gpsThing.latitude = gpsElements[i].dataset.latitude;
          gpsThing.longitude = gpsElements[i].dataset.longitude;
          gpsThing.index = index;
          gpsThing.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + gpsThing.latitude + "," + gpsThing.longitude + 
          "&zoom=15&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:red%7Clabel:"+index+"%7C" + gpsThing.latitude + "," + gpsThing.longitude;
          // gps.data.push(gpsThing);
        //   if (mode != 'maplibre') {
        //     let gpsPanel = document.createElement("a-entity");
        //     gpsElements[i].appendChild(gpsPanel);
        //     gpsPanel.setAttribute('poi-map-materials', 'jsonData', JSON.stringify(gpsThing));
        //     // let pos = gpsElements[i].getAttribute('position').x + " " + (gpsElements[i].getAttribute('position').y + 3) + " " + gpsElements[i].getAttribute('position').z;
        //     // gpsPanel.setAttribute('position', gpsElements[i].getAttribute('position'));
        //     gpsPanel.setAttribute('look-at', '#player');
        //   } else {
           
        //   }
        }
        console.log(currentLocation);
        // UpdateGeoPanel(currentLocString);
        let mapEl = document.getElementById('youAreHere');
        let mapJSON = {};
        mapJSON.mapURL = "https://maps.googleapis.com/maps/api/staticmap?center=" + ipLookupData.latitude + "," + ipLookupData.longitude + // shows everhthing, need to scale zoom by max distance
        "&zoom="+ReturnMapZoom(mostDistant)+"&size=2048x2048&maptype=hybrid&key="+googleMapsKey+"&markers=color:green%7Clabel:0%7C" + ipLookupData.latitude + "," + ipLookupData.longitude;
        // mapEl.setAttribute('map-materials', 'jsonData', JSON.stringify(mapJSON));
        // $(".map-overlay").css('visibility','visible');
        // $(".map-overlay").backstretch(mapURL);
         UpdateMarkers();
            SetYouAreHereMarker();

    } else {
        ipLookup();
    }
  }
  function ReturnMapZoom (mostDistant) {
    let zoom = 20;
    if (mostDistant > 1128.497220 ) {
      zoom = 19;
    } 
    if (mostDistant > 2256.994440 ) {
      zoom = 18;
    } 
    if (mostDistant > 4513.988880 ) {
      zoom = 17;
    } 
    if (mostDistant > 9027.977761 ) {
      zoom = 16;
    } 
    if (mostDistant > 18055.955520 ) {
      zoom = 15;
    } 
    if (mostDistant > 36111.911040 ) {
      zoom = 14;
    } 
    if (mostDistant < 72223.822090 ) {
      zoom = 13;
    } 
    if (mostDistant < 144447.644200 ) {
      zoom = 12;
    } 
    if (mostDistant < 288895.288400 ) {
      zoom = 11;
    } 
    if (mostDistant < 577790.576700 ) {
      zoom = 10;
    } 
    if (mostDistant < 1155581.153000 ) {
      zoom = 9;
    } 
    if (mostDistant < 2311162.307000 ) {
      zoom = 8;
    } 
    if (mostDistant < 4622324.614000 ) {
      zoom = 7;
    } 
    if (mostDistant < 9244649.227000 ) {
      zoom = 6;
    } 
    if (mostDistant < 18489298.450000 ) {
      zoom = 5;
    } 
    if (mostDistant > 36978596.910000) {
      zoom = 4;
    } 
    if (mostDistant > 73957193.820000 ) {
      zoom = 3;
    } 
    if (mostDistant > 147914387.600000 ) {
      zoom = 2;
    } 
    if (mostDistant > 295828775.300000 ) {
      zoom = 1;
    } //max zoom scale is 591657550.500000, found these at https://stackoverflow.com/questions/11454229/how-to-set-zoom-level-in-google-map/11454897

  }

  function ShowLocationMap() {

  }

  



  let theMap = null; //set on init below
  let flying = false;
  let shareLocation = false;
  // let styleIndex = 0;
  // let styleIDs = []
  let rotateOn = false;
  let dragPanEnabled = true;

  function ZoomIn () {
    if (theMap != null) {
      console.log("zoom " + theMap.getZoom());
      theMap.setZoom(theMap.getZoom() + .5);
      if (rotator != null) 
      cancelAnimationFrame(rotator);
    }
  }
  function ZoomOut () {
    if (theMap != null) {
      theMap.setZoom(theMap.getZoom() - .5);
      if (rotator != null) 
      cancelAnimationFrame(rotator);
    }
  }

  function ToggleDragPan () {
   
    if (theMap != null) {
      console.log("tryna ToggleDragPan" + dragPanEnabled);
    if (dragPanEnabled) {
      theMap.dragPan.disable();
      dragPanEnabled = false;
    } else {
      // theMap.setPitchBearing(0,90);
      theMap.easeTo({
        pitch:0
      });
      map.dragPan.enable({
        linearity: 0.3,
        // easing: bezier(0, 0, 0.3, 1),
        maxSpeed: 3,
        deceleration: 1.5,
        });
        dragPanEnabled = true;
      }
    }
  }

  let rotator = null;
  function RotateCamera(timestamp) {
    // rotateOn = !rotateOn;
    if (theMap != null) {
    // clamp the rotation between 0 -360 degrees
    // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    // if (rotateOn) { 
      // if (rotator == null) {
      theMap.rotateTo((timestamp / 1000) % 360, { duration: 0 });
      // }
      
      // Request the next frame of the animation.
      // if (rotateOn)
      rotator = requestAnimationFrame(RotateCamera);
      // } else {
      //   if (rotator != null) {
      //     cancelAnimationFrame(rotator);
      //   }
      // }
    }
  }
  function UpdatePlayerMarkers (){
    console.log("tryna UpdatePlayerMarkers");
  }
  
  // When the user clicks anywhere outside of the modal, close it

  function ShareLocation () {
    if (theModal) {

      theModal.style.display = "block";
    }
    shareLocation = !shareLocation;
    console.log("tryna sharelocation " + shareLocation);
  }

  function MapStyleSelectChange (style) {
    if (theMap != null) {

      console.log("tryna switch to style " + style);

      if (style == "Satellite") {
        theMap.setStyle('maplibre://styles/polytropoi/ckkfufmj103fq17k627oww4ez');
      }
      if (style == "Terrain") {
        theMap.setStyle('maplibre://styles/polytropoi/ckkftoa7x02np17rubtzwe8lj');
      }
      if (style == "Dark") {
        theMap.setStyle('maplibre://styles/polytropoi/ckkftume002vf17pdecs602bp');
      }
      if (style == "Light") {
        theMap.setStyle('maplibre://styles/polytropoi/ckkfvm7h504kx17tib6g7hsrb');
      }
    }
  }

  function UpdateMarkers() {
    console.log("tryna UpdateMarkers with currentLocaiton " + currentLocation)
    if (theMap && currentLocation != []) {

    // let gpsElements = document.querySelectorAll('.poi');

    let currentLocString = "<button class=\x22locbutton\x22 id=\x22"+currentLocation[0]+"_"+currentLocation[1]+"\x22>You Are Here</button><br><br><br>";
    // console.log(currentLocString);
    let index = 0; 
    // let poiMarkers = [];
    let isPoi = true; //fornow
    let eventData = "";
    for (let i = 0; i < gpsElements.length; i++) {
      
      index++; 
        // create a HTML element for each feature
      // var el = document.createElement('div');
      // el.className = 'marker';
      let lat = gpsElements[i].dataset.latitude;
      let lng = gpsElements[i].dataset.longitude;
      let eventData = "";
      let label = "";

      if (sceneLocations != undefined && sceneLocations.locations != undefined) {
        for (let m = 0; m < sceneLocations.locations.length; m++) {
          if (gpsElements[i].dataset._id == sceneLocations.locations[m].timestamp) {//match the timestamp to get the sceneLcoation data
            // console.log("gotsa match " + sceneLocations.locations[m].eventData);
            // label = sceneLocations.locations[m].label != undefined ? sceneLocations.locations[m].label : sceneLocations.locations[m].name; //whatever
            label = sceneLocations.locations[m].name;
            if (sceneLocations.locations[m].markerType == "poi" ) {
              isPoi = true;
            }
            if (sceneLocations.locations[m].eventData != undefined && sceneLocations.locations[m].eventData != null) {
              eventData = sceneLocations.locations[m].eventData;
            }
          }
        }
      }
      if (isPoi) {
        var distance = DistanceBetweenTwoCoordinates(currentLocation[1], currentLocation[0], lat, lng);
        console.log("updated marker distance " + distance);
        // if (distance > mostDistant) {
        //   mostDistant = distance;
        // }      
        
        let indexMinusOne = i > 0 ? i - 1 : gpsElements.length - 1;
        let indexPlusOne = i < gpsElements.length - 1 ? i + 1 : 0;
        let latlngStringPrevious = gpsElements[indexMinusOne].dataset.longitude+"_"+gpsElements[indexMinusOne].dataset.latitude;
        let latlngStringNext = gpsElements[indexPlusOne].dataset.longitude+"_"+gpsElements[indexPlusOne].dataset.latitude;

        let href = "";
            if (eventData != "" && eventData.includes("link")) {
              let splitchar = null;
              if (eventData.includes("=")) {
                splitchar = "=";
              }
              if (eventData.includes("~")) {
                splitchar = "~";
              }
              if (splitchar != null) {
                let split = eventData.split(splitchar);
                href = split[1].trim();
                
              }
            }

        currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>"+ label + " "+distance.toFixed(2)+ " miles</button><br>";
        // console.log("index " + i + " plusONe " + indexPlusOne +  " minus " + indexMinusOne);
        var popup = new maplibregl.Popup({className: "mode1-popup"})
        // .setText("loc " + (i + 1).toString() + ": " + label) //zero = you are here

        // .setHTML('<h4>' + (i + 1).toString() + ' ' + label + 
        .setHTML('<h4>' + label + 
        '<br>distance: '+distance.toFixed(2)+' miles</h4>'+
        '<div id=\x22'+gpsElements[indexPlusOne].dataset.longitude+'_'+gpsElements[indexPlusOne].dataset.latitude+'\x22 onclick=\x22PopupNextPreviousButtons(\x27'+latlngStringNext+'\x27)\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-arrow-circle-right fa-2x\x22></i><span class=\x22tooltiptext\x22>Next Location</span></div>'+
        
        // '</h4><div id=\x22'+gpsElements[indexMinusOne].dataset.longitude+'_'+gpsElements[indexMinusOne].dataset.latitude+'\x22 class=\x22locbutton tooltip\x22><i  style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-arrow-circle-left fa-2x\x22></i><span class=\x22tooltiptext\x22>Previous Location</span></div>'+
        // '<div id=\x22'+gpsElements[i].dataset.longitude+'_'+gpsElements[i].dataset.latitude+'\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-bullseye fa-2x\x22></i><span class=\x22tooltiptext\x22>Center</span></div>'+
        '<div onclick=\x22PopupLinkButtons(\x27'+href+'\x27)\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-link fa-2x\x22></i><span class=\x22tooltiptext\x22>Link</span></div>'+
        // '<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-envelope fa-2x\x22></i><span class=\x22tooltiptext\x22>Messages</span></div>'+
        // '<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-camera fa-2x\x22></i><span class=\x22tooltiptext\x22>Pictures</span></div>'+
        // '<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-walking fa-2x\x22></i><span class=\x22tooltiptext\x22>Directions</span></div>'+
        '</h4><div id=\x22'+gpsElements[indexMinusOne].dataset.longitude+'_'+gpsElements[indexMinusOne].dataset.latitude+'\x22 onclick=\x22PopupNextPreviousButtons(\x27'+latlngStringPrevious+'\x27)\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-arrow-circle-left fa-2x\x22></i><span class=\x22tooltiptext\x22>Previous Location</span></div>')
        
        .addTo(theMap);
        
        let marker = new maplibregl
          .Marker()
            .setLngLat([gpsElements[i].dataset.longitude, gpsElements[i].dataset.latitude])
            .addTo(theMap)
            .setPopup(popup);
          popup.remove();
          // HideMarkers();
      }
    }
    UpdateGeoPanel(currentLocString);
    }
  }
  
  let yahMarker = null;

  function SetYouAreHereMarker () {  //do this for all players
    if (theMap && currentLocation != []) {

      // console.log("SOCKETID IS  " + socket.id);
      let playerData = ReturnPlayerData(); //roomusers from socket connection
      let color = "blue";
      let un = "";
      if (playerData != null) {

        let userSplit = playerData.split("~"); //color appended to username after tilde on server

        if (userSplit.length > 1) {
          color = userSplit[1];
          if (!color.includes("#")) {
              color = "#" + color;
          }
          un = userSplit[0];
        }
      }
      if (yahMarker == null) {
        console.log("creating yahMarker");
        let gpsElementsLength = gpsElements.length - 1;
        var popup = new maplibregl.Popup({className: "mode1-popup"})
        
        .setHTML('<h4>' + un + ' - you are here' +
        '</h4>'+
        // '<div id=\x22'+currentLocation[0]+'_'+currentLocation[1]+'\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-bullseye fa-2x\x22></i><span class=\x22tooltiptext\x22>Center</span></div>'+
        '<div class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-link fa-2x\x22></i><span class=\x22tooltiptext\x22>Link</span></div>')
        // '<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-envelope fa-2x\x22></i><span class=\x22tooltiptext\x22>Messages</span></div>'+
        // '<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-camera fa-2x\x22></i><span class=\x22tooltiptext\x22>Pictures</span></div>')
        .addTo(theMap);
        yahMarker = new maplibregl
        .Marker({color: color})
          .setLngLat([currentLocation[0], currentLocation[1]])
          .addTo(theMap)
          .setPopup(popup);
        popup.remove();  
        // HideMarkers();
      } else {
        yahMarker.setLngLat([currentLocation[0], currentLocation[1]]);
      }

      var sharelocbutton = document.getElementById("sharelocation")
      var sharelocClick = function() {
        ShareLocation();
      };
      if (sharelocbutton != null)
      sharelocbutton.addEventListener('click', sharelocClick, false);
      // ShowHideGeoPanel();
    }
  }
  function FlyToMapPosition (lng, lat, rotate) {
    // console.log("tryna fly to " + lng + lat);
    // cancelAnimationFrame();
    // ShowHideGeoPanel();
    let coordinates = [lng, lat];
    if (theMap) {
      // console.log("gotsa map!");
      if (rotator != null) {
        cancelAnimationFrame(rotator);
      }
    
      theMap.flyTo({
        center: coordinates,
        essential: false
        });
      theMap.fire('flystart');
      theMap.on('moveend', function(e){
          if(flying) {
            theMap.fire('flyend');
            if (rotate) {
              RotateCamera(0);
            }
            //other things to do when ready
          }
        });
      }
  }
  function HideMarkers() {
    let markers = document.getElementsByClassName("marker");
    for (let i = 0; i < markers.length; i++) {
          markers[i].style.visibility = "hidden";
      }
  }

function maplibreInit() {
      
    let locationDataEl = document.getElementById('locationData');
    if (locationDataEl) {
        let theLocationData = locationDataEl.getAttribute('data-locations');

        locationData = JSON.parse(atob(theLocationData));
        SetSceneLocations(locationData);
        // console.log("locationData " + JSON.stringify(locationData));

    }
    
      window.sceneType = mode;


      // InitSceneHooks();
      UpdateLocationInfo();

    //   console.log("tryna maplibre with toik,e mn " + maplibre_config.accessToken);
      const gpsElements = document.querySelectorAll(".poi,.geo");
      if (gpsElements.length > 0) {
        let latitude = gpsElements[0].dataset.latitude;
        let longitude = gpsElements[0].dataset.longitude;
        console.log("lat " + latitude + " long " + longitude);
        var map = new maplibregl.Map({
            // style: 'maplibre://styles/maplibre/light-v10',
            // style: 'maplibre://styles/maplibre-map-design/ckhqrf2tz0dt119ny6azh975y',
            // style: 'maplibre://styles/polytropoi/ckke5tnp40mrt17ohfhkxy29q',
            
            container: 'map',
            zoom: zoomLevel,
            center: [longitude, latitude],
            style: '../../main/ref/openstreetmap.json',
            // style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            // style: 'https://americanamap.org/style.json',
            // style: 'https://tiles.versatiles.org/assets/styles/colorful.json',
            pitch: 75,
            bearing: 90,
            antialias: true


        });
        map.scrollZoom.enable();
        theMap = map;

        map.on('error', e => {
            // Hide those annoying non-error errors
            if (e && e.error !== 'Error: Not Found')
                console.error(e);
        });
        // window.tb = new Threebox(
        //   map,
        //   map.getCanvas().getContext('webgl'),
        //   {
        //     defaultLights: true,

        //   }
        // );

        doBuildings = true;
        doTerrain = true;

        // let that = this;
        console.log("do builtings " + doBuildings + " do terrain " + doTerrain);

        map.on('load', function () {
            
        
         const layers = map.getStyle().layers;

        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }

        map.addSource('openfreemap', {
            url: `https://tiles.openfreemap.org/planet`,
            type: 'vector',
        });

        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'openfreemap',
                'source-layer': 'building',
                'type': 'fill-extrusion',
                'minzoom': 14,
                'filter': ['!=', ['get', 'hide_3d'], true],
                'paint': {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                    ],
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        14,
                        0,
                        17,
                        ['get', 'render_height']
                    ],
                    'fill-extrusion-base': ['case',
                        ['>=', ['get', 'zoom'], 13],
                        ['get', 'render_min_height'], 0
                    ]
                }
            },
            labelLayerId
        );

    }); //map load end


            map.dragPan.enable({
            linearity: 0.3,
            // easing: bezier(0, 0, 0.3, 1),
            maxSpeed: 3,
            deceleration: 1.5,
            });
                    // map.dragPan.disable();
                    map.scrollZoom.enable();
                    // map['doubleClickZoom'].disable();
            map['dragRotate'].enable();
            map.touchPitch.enable();
            map.touchZoomRotate.enable({ around: 'center' });
            // map.on('style.load', () => {
            //   map.setConfigProperty('basemap', 'lightPreset', 'dusk');
        // });

        map.addControl(
            new maplibregl.NavigationControl({
                visualizePitch: true,
                showZoom: true,
                showCompass: true
            })
            );

            map.addControl(
                new maplibregl.TerrainControl({
                    source: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
                    exaggeration: 1
                })
            );


            map.on('mousemove', (e) => {
                // document.getElementById('info').innerHTML =
                // // `e.point` is the x, y coordinates of the `mousemove` event
                // // relative to the top-left corner of the map.
                // JSON.stringify(e.point) +
                // '<br />' +
                // `e.lngLat` is the longitude, latitude geographical position of the event.
                //   console.log(JSON.stringify(e.lngLat.wrap()));
                });
            
            let currentLocString = "<button class=\x22locbutton\x22 id=\x22"+currentLocation[0]+"_"+currentLocation[1]+"\x22>You are here</button><br><br><br>";
            // console.log(currentLocString);
            let index = 0; 
            for (let i = 0; i < gpsElements.length; i++) {
            
            //   console.log("gpsElements: " + gpsElements[i].id);
            index++; 
                // create a HTML element for each feature
            // var el = document.createElement('div');
            // el.className = 'marker';
            let lat = gpsElements[i].dataset.latitude;
            let lng = gpsElements[i].dataset.longitude;
            // let eventdata = "";
            let label = "";
            let scale = 10;
            let eventData = null;
            if (sceneLocations && sceneLocations.locations != undefined) {
                for (let m = 0; m < sceneLocations.locations.length; m++) {
                    // console.log(sceneLocations.locations[m].name +" " + sceneLocations.locations[m].timestamp);
                if (gpsElements[i].id == sceneLocations.locations[m].timestamp) { //match the id to get the sceneLcoation data
                    let modelUrl = 'https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb';
                    if (sceneLocations.locations[m].modelID != null) {
                    console.log("Looking for model id: " + sceneLocations.locations[m].modelID);   

                    let locationModel = document.getElementById(sceneLocations.locations[m].modelID.toString());               
                    // console.log("Looking for model : " + locationModel.getAttribute('src'));
                    if (locationModel) {
                        modelUrl = locationModel.getAttribute('src');
                    }
                    
                    }
                    if (sceneLocations.locations[m].markerObjScale != null && sceneLocations.locations[m].markerObjScale != undefined) {
                    scale = parseFloat(sceneLocations.locations[m].markerObjScale);
                    console.log("parsing scale " + scale);
                    }

                    if (sceneLocations.locations[m].eventData != null && sceneLocations.locations[m].eventData != undefined) {
                    eventData = sceneLocations.locations[m].eventData;
                    }
                    label = sceneLocations.locations[m].name; // to do : event data
                        //maybe this inside the map.addLayer below...
                                // let modelEntity = document.createElement("a-entity");
                                //     modelEntity.setAttribute('gltf-model', modelUrl);
                                    
                                //     sceneEl.appendChild(modelEntity);
                                //     const convertedLocation = maplibregl.MercatorCoordinate.fromLngLat({
                                //       lng: sceneLocations.locations[m].longitude,
                                //       lat: sceneLocations.locations[m].latitude,
                                //       });
                                //     console.log("tryna set model " + modelUrl + " at " + JSON.stringify(convertedLocation));
                                //     modelEntity.setAttribute('position', convertedLocation);


                        // modelEntity.setAttribute('scale', 100, 100, 100);

                        // gpsElements[i].appendChild(gpsPanel);

                    /*
                    map.addLayer({
                    id: 'custom_layer'+index.toString(),
                    type: 'custom',
                    renderingMode: '3d',
                    onAdd: function (map, mbxContext) {
                        var options = {
                        obj: modelUrl,
                        type: 'gltf',
                        scale: scale,
                        units: 'meters',
                        rotation: { x: 90, y: 180, z: 0}, //default rotation
                        anchor: 'bottom'
                        }
                        tb.loadObj(options, function (model) {
                        // if (model != undefined && model != null) {
                        let theModel = model.setCoords([sceneLocations.locations[m].longitude, sceneLocations.locations[m].latitude]);

                        // theModel.addEventListener('ObjectMouseOver', onObjectMouseOver, false);
                        let obj = null;
                        tb.add(theModel);
                        // let modelEntity = document.createElement("a-entity");
                        // modelEntity.setAttribute("mod-model");
                        // modelEntity.setObject3D("Object3D", model);
                        // modelEntity.classList.add("activeObjexRay");
                        // gpsElements[i].appendChild(gpsPanel);
                        // }
                        });
                    },
                    render: function (gl, matrix) {
                    tb.update();
                    }
                    });
                    */
                }
                }
            }
            if (gpsElements[i].classList.contains('poi')) { //only show poi markers in list
                var distance = DistanceBetweenTwoCoordinates(currentLocation[1], currentLocation[0], lat, lng);
                // console.log("distance " + distance);
                // if (distance > mostDistant) {
                //   mostDistant = distance;
                // }
                // let latlngString = gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude;
                let indexMinusOne = i > 0 ? i - 1 : gpsElements.length - 1;
                let indexPlusOne = i < gpsElements.length - 1 ? i + 1 : 0;
            
                let latlngStringPrevious = gpsElements[indexMinusOne].dataset.longitude+"_"+gpsElements[indexMinusOne].dataset.latitude;
                let latlngStringNext = gpsElements[indexPlusOne].dataset.longitude+"_"+gpsElements[indexPlusOne].dataset.latitude;

                currentLocString = currentLocString + "\n<button class=\x22locbutton\x22 id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22>" + label + " "+distance.toFixed(2)+ " miles</button><br>";
                // console.log("gpsElements index " + i + " " + currentLocString);
                let href = "";
                if (eventData != null && eventData != "" && eventData.toString().includes("link")) {
                console.log("gotsa link " +eventData);
                let splitchar = null;
                if (eventData.toString().includes("=")) {
                    splitchar = "=";
                }
                if (eventData.toString().includes("~")) {
                    splitchar = "~";
                }
                if (splitchar != null) {
                    let split = eventData.toString().split(splitchar);
                    href = split[1].trim();
                    
                }
                }
                if (gpsElements[i].classList.contains("poi")) {

                    // let marker = new Marker({
                    //     color: "#FFFFFF",
                    //     draggable: true
                    // }).setLngLat([gpsElements[i].dataset.longitude, gpsElements[i].dataset.longitude])
                    // .addTo(map);

                //     let markerHeight = 50, markerRadius = 10, linearOffset = 25;
                //     let popupOffsets = {
                //     'top': [0, 0],
                //     'top-left': [0,0],
                //     'top-right': [0,0],
                //     'bottom': [0, -markerHeight],
                //     'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
                //     'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
                //     'left': [markerRadius, (markerHeight - markerRadius) * -1],
                //     'right': [-markerRadius, (markerHeight - markerRadius) * -1]
                //     };
                //     let popup = new Popup({offset: popupOffsets, className: 'my-class'})
                //     .setLngLat(e.lngLat)
                //     .setHTML("<h1>Hello World!</h1>")
                //     .setMaxWidth("300px")
                //     .addTo(map);

                var popup = new maplibregl.Popup( {className: "mode1-popup", offset: 25})
                // .setText(
                //     'Poppoin'
                // );
                
                  .setHTML("<h4>" + label + 
                  "<br>distance: "+distance.toFixed(2)+" miles</h4>"+
                
                  //   "<div id=\x22"+gpsElements[indexPlusOne].dataset.longitude+"_"+gpsElements[indexPlusOne].dataset.latitude+"\x22"+
                "<div id=\x22"+gpsElements[indexPlusOne].dataset.longitude+"_"+gpsElements[indexPlusOne].dataset.latitude+"\x22"+
                "class=\x22next_locbutton tooltip\x22 data-longitude=\x22"+ gpsElements[indexPlusOne].dataset.longitude+"\x22 data-latitude=\x22"+ gpsElements[indexPlusOne].dataset.latitude+"\x22"+
                // " onclick=\x22PopupNextPreviousButtons(\x22"+latlngStringNext+"\x22)\x22>
                "<i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-arrow-circle-right fa-2x\x22></i><span class=\x22tooltiptext\x22>Next Location</span></div>"+
                
                  // "<div id=\x22"+gpsElements[indexMinusOne].dataset.longitude+"_"+gpsElements[indexMinusOne].dataset.latitude+"\x22 class=\x22locbutton tooltip\x22><i  style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-arrow-circle-left fa-2x\x22></i><span class=\x22tooltiptext\x22>Previous Location</span></div>"+
                  // // id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22 
                  // "<div id=\x22"+gpsElements[i].dataset.longitude+"_"+gpsElements[i].dataset.latitude+"\x22 class=\x22locbutton tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-bullseye fa-2x\x22></i><span class=\x22tooltiptext\x22>Center</span></div>"+
                  "<div onclick=\x22PopupLinkButtons(\x22"+href+"\x22)\x22 class=\x22locbutton tooltip\x22><i style=\x22 margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-link fa-2x\x22></i><span class=\x22tooltiptext\x22>Link</span></div>"+
                  // "<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-envelope fa-2x\x22></i><span class=\x22tooltiptext\x22>Messages</span></div>"+
                  // "<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-camera fa-2x\x22></i><span class=\x22tooltiptext\x22>Pictures</span></div>"+
                  // "<div class=\x22tooltip\x22><i style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-walking fa-2x\x22></i><span class=\x22tooltiptext\x22>Directions</span></div>"+
                  // "<div id=\x22"+gpsElements[indexPlusOne].dataset.longitude+"_"+gpsElements[indexPlusOne].dataset.latitude+"\x22"+
                  // "class=\x22locbutton tooltip\x22><i  style=\x22margin-left: 10px; margin-right: 10px;\x22class=\x22fas fa-arrow-circle-right fa-2x\x22></i><span class=\x22tooltiptext\x22>Next Location</span></div>"
                  "<div id=\x22"+gpsElements[indexMinusOne].dataset.longitude+"_"+gpsElements[indexMinusOne].dataset.latitude+"\x22" +
                  "class=\x22previous_locbutton tooltip\x22 data-longitude=\x22"+ gpsElements[indexPlusOne].dataset.longitude+"\x22 data-latitude=\x22"+ gpsElements[indexPlusOne].dataset.latitude+"\x22"+  
                //   "onclick=\x22PopupNextPreviousButtons(\x22"+latlngStringPrevious+"\x22)\x22>"
                  "<i style=\x22margin-left: 10px; margin-right: 10px;\x22 class=\x22fas fa-arrow-circle-left fa-2x\x22></i><span class=\x22tooltiptext\x22>Previous Location</span></div>");
                // //   .addTo(theMap);

                    const el = document.createElement('div');
                    el.id = 'marker';
                    let lngLat = [parseFloat(gpsElements[i].dataset.longitude), parseFloat(gpsElements[i].dataset.latitude)];
                    console.log("tryna set marker at " + lngLat);
                    let marker = new maplibregl.Marker({element: el})
                            .setLngLat(lngLat)
                            // .addTo(map)
                            .setPopup(popup)
                        //   popup.remove();  
                            .addTo(map);
                        }
                    // HideMarkers();
                    }
                }

            
                UpdateGeoPanel(currentLocString);
                initialized = true;

                map.on('flystart', function(){
                flying = true;
                });
                map.on('flyend', function(){
                flying = false;
                });
                map.on('click', function(e) {
                if (rotator != null) {
                    cancelAnimationFrame(rotator); //stop rotation on click if needed
                    // rotateOn = false;
                }
                });

                // let mapStyle = document.getElementById('mapStyle');
                // console.log(mapStyle)
                // if (mapStyle != null) {
                //   console.log(mapStyle.value);

                // // map['touchZoomRotate'].enable();
                
                //   mapStyle.addEventListener('change', (event) => {
                //     // MapStyleSelectChange(event.target.value);
                //   });

                //   // mapStyle.addEventListener("change", MapStyleSelectChange(mapStyle.value));
                // }
                // UpdateMarkers();
        // }); //map load end

      // UpdateGeoPanel(currentLocString);
      
    }//gpsElements is empty
    
    
  } // end maplibre init