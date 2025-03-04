import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express");
const landing_router = express.Router();
const entities = require("entities");
const async = require('async');
// const ObjectID = require("bson-objectid");
const path = require("path");
const validator = require('validator');
const jwt = require("jsonwebtoken");
const requireText = require('require-text');
// const { Console } = require("console");
const minio = require('minio');

import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
// import { db } from "../server.js";
// import { s3 } from "../server.js";
import { ReturnPresignedUrl, saveTraffic } from "../server.js";
import { RunDataQuery } from "../connect/database.js";

const stripe = require('stripe')(process.env.STRIPE_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;



var minioClient = null;
if (process.env.MINIOKEY && process.env.MINIOKEY != "" && process.env.MINIOENDPOINT && process.env.MINIOENDPOINT != "") {
        minioClient = new minio.Client({
        endPoint: process.env.MINIOENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIOKEY,
        secretKey: process.env.MINIOSECRET
    });
}

const nonLocalDomains = ["regalrooms.tv", "bishopstudiosaustin.com"]; //TODO you know what! (put this in sceneDomain object)


function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

function convertStringToObjectID (stringID) {
    if (ObjectId.isValid(stringID)) {
        return ObjectId.createFromHexString(stringID);
    } else {
        return null;
    }
}

function UppercaseFirst(s) {
    if (s != undefined) {
    const ufirst = s.charAt(0).toUpperCase() + s.slice(1);
    return ufirst;
        } else {
            return "*";
        }
    };
    
// webxr_router.get("/test", function (req, res) {
//     res.send("OK!");
// });    

function hexToRgb(c){
    if(/^#([a-f0-9]{3}){1,2}$/.test(c)){
        if(c.length== 4){
            c= '#'+[c[1], c[1], c[2], c[2], c[3], c[3]].join('');
        }
        c= '0x'+c.substring(1);
        return ''+[(c>>16)&255, (c>>8)&255, c&255].join(',')+')';
        // return ""+(c>>16)&255+ ", "+(c>>8)&255+ ", "+ c&255+"";
    }
    return '';
}
function HexToRgbValues (c) {
    var aRgbHex = '1502BE'.match(/.{1,2}/g);
    var aRgb = parseInt(aRgbHex[0], 16) + " " + parseInt(aRgbHex[1], 16) + " " +  parseInt(aRgbHex[2], 16);
console.log(aRgb); //[21, 2, 190]
    return aRgb;
}


////////////////////PRIMARY SERVERSIDE LANDING ROUTE///////////////////
landing_router.get('/:_id', async (req, res) => { 
    
    var reqstring = entities.decodeHTML(req.params._id);
    console.log("landing scene req " + reqstring);
    if (reqstring == undefined || reqstring == 'undefined' || reqstring == null || reqstring.length < 5) {
        res.end("nope");
        return;
    }
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedPictureGroups = [];
    var requestedVideoGroups = [];
    var requestedAudioItems = [];
    var requestedVideoItems = [];
    var requestedTextItems = [];
    var sceneTextItemData = "";
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    var sceneOwnerID = "";
    let primaryAudioTitle = "";
    let primaryAudioObject = {};
    let primaryAudioWaveform = "";
    let scenePrimaryVolume = .8;
    let sceneAmbientVolume = .8;
    let sceneTriggerVolume = .8;
    let transportButtons = "";
    let dialogButton = "";
    let sceneManglerButtons = "";
    // let ambienturl = "";
    var mp3url = "";
    var oggurl = "";
    var pngurl = "";
    let pAudioWaveform = "";
    let ambientUrl = "";
    let triggerUrl = "";
    var vidUrl = "";
    var postcard1 = "";
    var image1url = "";
    var short_id = "";
    var picArray = [];
    var imageAssets = "";
    var modelAssets = "";
    var imageEntities = "";
    var skyboxUrl = "";
    var skyboxID = "";
    let skyboxIDs = [];
   
    let youtubes = [];

    var loopable = "";
    // let usdzs = [];
    // var gltfs = {};
    var sceneGLTFLocations = [];
    var sceneModelLocations = [];
    var sceneObjectLocations = [];
    var sceneTextLocations = [];

    var sceneWeblinkLocations = [];

    var playerPosition = "0 1.6 0";
   
    let htmltext = "";
    
    let socketHost = process.env.SOCKET_HOST;
    let avatarName = "guest";
    let textLocation = "";

    let picturegroupLocation = "-4 2 3";
    let scenesKeyLocation = null;
    let audioLocation = "-3 1.7 -4";
    let videoLocation = "10 2 15";
    let videoRotation = "0 0 0";
    let videoParent = "look-at=\x22#player\x22"; //billboard by default
    let weblinkLocation = "5 2 5";
    let locationLights = [];
    let particleLocations = [];
    let locationPlaceholders = [];
    let locationCallouts = [];
    let locationPictures = [];
    let curvePoints = [];
    let proceduralEntities = "";
    let textEntities = "";
    let attributionsTextEntity = "";
    let settingsData = "";
    let mapButtons = "";
    let mapStyleSelector = "";
    let attributions = [];
    let attributionsObject = {};

    let pictureGroupsData = "";
    let audioGroupsEntity = "";
    let audioGroupsData = "";
    let videoGroupsEntity = "";
    let videoElements = "";
    let hlsScript = "";
    // let loadPictureGroups = "";
    let tilepicUrl = "";
    let availableScenesInclude = "";
    let restrictToLocation = false;
    let isGuest = true;
    let socketScripts = "";
    let navmeshScripts = "";
    let hasSynth = false;
    let hasPrimaryAudio = false;
    let hasPrimaryAudioStream = false;
    let hasAmbientAudio = false;
    let ambientOggUrl = "";
    let ambientMp3Url = "";
    let triggerOggUrl = "";
    let triggerMp3Url = "";
    let hasTriggerAudio = true;

    let loadLocations = "";
    let nftIDs = "";
    let sceneBackground = " background ";
    let skyboxEnvMap = "";
    let geoEntities = "";
    let geoEntity = 'geo-location'; //may be set to "gps-entity-place" for arjs locationing
    let containers = "";
    // let navmarsh = "";
    let showTransport = false;
    let showDialog = false;
    let showSceneManglerButtons = false;
    let ethereumButton = "";
    let youtubeContent = "";
    let youtubeEntity = "";
  
    let logScripts = "";
    let sceneUnityWebDomain = "https://mvmv.us";
    let postcardImages = []; 

    const query = {"short_id": reqstring};
    const sceneData = await RunDataQuery("scenes","findOne",query,req.originalUrl);

    // db.scenes.findOne({"short_id": reqstring}, function (err, sceneData) { 
            if (!sceneData) {
                console.log("1 error getting scene data: " + err);
                res.end();
            } else { 
                // console.log("sceneData " + JSON.stringify(sceneData));
                saveTraffic(req, sceneData.sceneDomain, sceneData.short_id);
                let accessScene = true;
                // sceneData = sceneData;
                // async.waterfall([ 
                // function (callback) {
                //     //TODO use sceneNetworkSettings or whatever
                //     socketScripts = "<script src=\x22/connect/connect.js\x22 defer=\x22defer\x22></script>" +
                //     "<script src=\x22//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js\x22></script>" +
                //     "<script src=\x22https://strr.us/socket.io/socket.io.js\x22></script>" +
                //     "<script src=\x22/main/js/jquery.backstretch.min.js\x22></script>"; 
                if (req.session) {
                    if (req.session.user) {
                        avatarName = req.session.user.userName;
                        isGuest = false;
                    }
                }
                if (!sceneData.sceneShareWithPublic) { 
                    accessScene = false;
                    console.log("isGUest: " +isGuest+ " sceneShareWithSubscribers " + sceneData.sceneShareWithSubscribers);
                    if (sceneData.sceneShareWithSubscribers && !isGuest) {
                        console.log("welcome subscriber");
                        accessScene = true;
                    } else {
                        if (req.session.user != undefined) {
                            if (sceneData.user_id == req.session.user._id) {
                                console.log("welcome scene owner");
                                accessScene = true;
                            } else {
                                console.log("that's private!");
                                accessScene = false;
                            }
                        } else {
                            console.log("that's private!");
                            accessScene = false;
                        }
                    }
                }

                if (sceneData.sceneWebType == "Redirect to Unity Webplayer") {
                
                    db.apps.findOne({"appdomain": sceneData.sceneDomain}, function(err,app) {
                        if (err || !app) {
                            console.log("no apps for you!");
                            // res.json(domain);
                            res.redirect(process.env.ROOT_HOST);
                        } else {
                            // domain.apps = apps;
                            // res.json(domain);
                            if (app.appunitydomain) {
                                sceneUnityWebDomain = app.appunitydomain;
                            }
                            // console.log(sceneUnityWebDomain)
                            res.redirect(sceneUnityWebDomain + '/?scene=' + reqstring);
                        }
                    });
                                        
                } else {
                async.waterfall([  // async init
                
                function (callback) {
                    let pin = req.query.p;
                    if (pin != null) {
                        console.log('gotsa pin : ' + pin);
                        var timestamp = Math.round(Date.now() / 1000);
                        var query = {$and: [{pin : pin}, {validated : true}, {accessTimeWindow: {$gt : timestamp}}, {pinTimeout: {$gt: timestamp}}]}; 
                        console.log('pin query ' + JSON.stringify(query));
                        db.invitations.findOne (query, function (err, invitation) {
                            // db.invitations.find ({$and: [{sentToEmail : req.body.email}, {validated : true} ]}, function (err, invitations) {
                                console.log("invitation : " + JSON.stringify(invitation));
                            if (err || !invitation) {
                                console.log("error checking pin " + invitation);
                                callback(err);
                                // accessScene = false;
                            } else {
                                // console.log('invitations' + JSON.stringify(invitations) );
                                accessScene = true;
                                avatarName = invitation.sentToEmail.toString().split('@')[0];
                                console.log("pin checks out!!");
                                let action = {};

                                action.invitationSceneAccess = (timestamp * 1000) + "_" + invitation._id + "_" + invitation.invitedToSceneShortID;
                                db.people.updateOne({"_id": ObjectId.createFromHexString(invitation.sentToPersonID)}, {$addToSet: {activities: action}});
                                // db.invitations.update ( { pin: pin }, { $set: { pinTimeout : ''} }); //burn after reading once! //nm, just sniff the timestamp
                                callback(null);
                            }
                        });
                    } else {
                        callback(null);
                    }
                },
                function (callback) {
                    if (!accessScene) {
                        callback(true); //error is true, bail to the end!
                    } else {
                        callback(null); //elsewise go wid it now...
                    }
                },
                function (callback) {
                if (sceneData.sceneTags != null) {        
                    for (let i = 0; i < sceneData.sceneTags.length; i++) { //not ideal, but it's temporary... //no it isn't
                        if (sceneData.sceneTags[i].toLowerCase().includes("debug")) {
                            debugMode = true;
                        }
                        if (sceneData.sceneTags[i].toLowerCase().includes("timer")) { //uses css font @import... //no! 
                             proceduralEntities = proceduralEntities + "<a-plane live_canvas=\x22src:#flying_canvas\x22 id=\x22flying_info_canvas\x22 material=\x22shader: flat; transparent: true;\x22look-at=\x22#player\x22 width=\x221\x22 height=\x221\x22 position=\x220 1.5 -1\x22></a-plane>";

                        }
                        if (sceneData.sceneTags[i].toLowerCase().includes("stats")) {
                            // logScripts = "<script src=\x22https://cdn.jsdelivr.net/gh/kylebakerio/vr-super-stats@1.5.0/vr-super-stats.js\x22></script>";
                        }
                        if (sceneData.sceneTags[i].toLowerCase().includes("logs")) {
                            logScripts = logScripts + "<script src=\x22../main/src/component/a-console.js\x22></script>";
                        }
                        

                       
                        if (sceneData.sceneTags[i] == "instancing demo") {
                            
                            // instancingEntity = "<a-entity instanced_meshes_sphere_physics></a-entity>";
                        }
                        if (sceneData.sceneTags[i] == "show transport") {
                            // console.log("GOTS SCENE TAG: " + sceneData.sceneTags[i]);
                            showTransport = true;
                        }
                        if (sceneData.sceneTags[i] == "show dialog") {
                            // console.log("GOTS SCENE TAG: " + sceneData.sceneTags[i]);
                            showDialog = true;
                        }
                        if (sceneData.sceneTags[i] == "show buttons") {
                            // console.log("GOTS SCENE TAG: " + sceneData.sceneTags[i]);
                            showSceneManglerButtons = true;
                        }
                        if (sceneData.sceneTags[i] == "use navmesh") {
                            console.log("GOTS USENAVMESH TAG: " + sceneData.sceneTags[i]);
                            useNavmesh = true;
                        }

                        if (sceneData.sceneTags[i] == "show ethereum") {
                            ethereumButton = "<div class=\x22ethereum_button\x22 id=\x22ethereumButton\x22 style=\x22margin: 10px 10px;\x22><i class=\x22fab fa-ethereum fa-2x\x22></i></div>";
                        }
                        // if (sceneData.sceneTags[i].includes("synth")) {
                        //     synthScripts = "<script src=\x22../main/src/synth/Tone.js\x22></script><script src=\x22../main/js/synth.js\x22></script>";
                        // }

                    }
                }
                //TODO use sceneNetworkSettings or whatever
                // socketScripts = "<script src=\x22/connect/connect.js\x22 defer=\x22defer\x22></script>" +
                // "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                // socketScripts = "<script src=\x22https://strr.us/socket.io/socket.io.js\x22></script>";
                if (socketHost != null && socketHost != "NONE") {
                    socketScripts = "<script src=\x22/socket.io/socket.io.js\x22></script>"; //
                }
                
                // "<script src=\x22/main/vendor/jscookie/js.cookie.min.js\x22></script>" +
                    
                // TODO - backstretch include var!
                // "<script src=\x22/main/js/jquery.backstretch.min.js\x22></script>"; 
                if (avatarName == undefined || avatarName == null || avatarName == "guest") { //cook up a guest name if not logged in
                    let array1 = [];
                    let array2 = [];
                    let array3 = [];
                    let index1 = -1;
                    let index2 = -1;
                    let index3 = -1;
                    let name1 = "";
                    let name2 = "";
                    let name3 = "";
                    const min = 0;
                    db.lexicons.findOne({name: "nameArrays"}, function (err, items) {
                    if (err || !items) {
                        console.log("error getting scene 5: " + err);
                        callback (err);
                    } else {
                        array1 = items.adjectives;
                        array2 = items.colors;
                        array3 = items.animals;
                        // console.log("array 1" + array1);
                        index1 = Math.floor(Math.random() * array1.length);
                        name1 = UppercaseFirst(array1[index1]);
                        index2 = Math.floor(Math.random() * array2.length);
                        name2 = UppercaseFirst(array2[index2]);
                        index3 = Math.floor(Math.random() * array3.length);
                        name3 = UppercaseFirst(array3[index3]);
                        avatarName = name1 + "_" + name2 + "_" + name3;
                        callback();
                        }
                    });
                } else {
                    callback();
                }
            },
            function (callback) {
                if (sceneData.sceneUseDynCubeMap) {
                    skyboxEnvMap = "skybox-env-map";   
                    // console.log("skyboxEnvMap is " + skyboxEnvMap);
                }

                        sceneOwnerID = sceneData.user_id;
                        short_id = sceneData.short_id;
                        sceneResponse = sceneData;

                        let poiIndex = 0;

                      
                        if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                            sceneResponse.scenePictures.forEach(function (picture) {
                                // console.log("scenePIcture " + picture);
                                var p_id = ObjectId.createFromHexString(picture); //convert to binary to search by _id beloiw
                                requestedPictureItems.push(p_id); //populate array
                            });
                        }
                        
                        if (sceneResponse.sceneDebugMode != null && sceneResponse.sceneDebugMode != undefined && sceneResponse.sceneDebugMode != "") {
                            debugMode = true;
                        }
                        if (sceneResponse.sceneYouTubeIDs != null && sceneResponse.sceneYouTubeIDs.length > 0) {
                            youtubes = sceneResponse.sceneYouTubeIDs;
                        }
                        ////LOCATION FU
                        if (sceneResponse.sceneLocations != null && sceneResponse.sceneLocations.length > 0) {
                            
                            if (sceneResponse.sceneWebType == "AR Location Tracking") { //NOOPE
                                // geoEntity = 'gps-entity-place'; //default = 'geo-location'
                                geoEntity = "gps-position";
                            }
                            for (var i = 0; i < sceneResponse.sceneLocations.length; i++) {
                               
                                if ((sceneResponse.sceneLocationTracking != null && sceneResponse.sceneLocationTracking == true) || sceneResponse.sceneWebType == "AR Location Tracking") {  

                                    if (sceneResponse.sceneLocations[i].type.toLowerCase() == "geographic") { //just to set scripts and restrict to location
                                        // console.log("gotsa geo-location " + JSON.stringify(sceneResponse.sceneLocations[i]));
                                            // geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>";
                                            // locationScripts = "<script src=\x22../main/src/component/location-fu.js\x22></script>";
                                        if (sceneResponse.sceneWebType == "AR Location Tracking") {
                                            if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4 && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes("restrict")) {
                                                locationEntity = "<a-entity id=\x22youAreHere\x22 location_restrict_ar position=\x220 2 -5\x22>"+
                                                    "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                                                    "</a-entity>"+
                                                "</a-entity>";
                                                locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                                            } else {
                                                locationEntity = "<a-entity id=\x22youAreHere\x22 location_init_ar position=\x220 2 -5\x22>"+
                                                    "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                                                    "</a-entity>"+
                                                "</a-entity>"; 
                                                locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                                            }
                                            geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>";
                                            locationScripts = "<script src=\x22../main/src/component/location-fu.js\x22></script>";
                                            var buff = Buffer.from(JSON.stringify(sceneResponse.sceneLocations[i])).toString("base64");
                                            locationData = "<div id=\x22restrictToLocation\x22 data-location='"+buff+"'></div>";
                                        } else if (sceneResponse.sceneWebType == "Model Viewer") { 
                                            // console.log("sceneResponse.sceneLocations[i].eventData : " + sceneResponse.sceneLocations[i].eventData);
                                            if (sceneResponse.sceneLocations[i].eventData.toLowerCase().includes("restrict")) {
                                            geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>";
                                            locationScripts = "<script src=\x22../main/src/component/location-fu-noaframe.js\x22></script>";
                                            var buff = Buffer.from(JSON.stringify(sceneResponse.sceneLocations[i])).toString("base64");
                                            locationData = "<div id=\x22restrictToLocation\x22 data-location='"+buff+"'></div>";
                                            }
                                        } else if (sceneResponse.sceneWebType == "Mapbox") { //just location tracking, for any sceneWebType
                                            if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4 && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes("restrict")) {
                                                locationEntity = "<a-entity id=\x22youAreHere\x22 location_restrict position=\x220 2 -5\x22>"+
                                                    "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                                                    "</a-entity>"+
                                                "</a-entity>";
                                                locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                                            } else {
                                                locationEntity = "<a-entity id=\x22youAreHere\x22 location_init position=\x220 2 -5\x22>"+
                                                    "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                                                    "</a-entity>"+
                                                "</a-entity>"; 
                                                locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                                            }
                                        } else {
                                            console.log("tryna set geo loc " + sceneResponse.sceneLocations[i].eventData);
                                            if (sceneResponse.sceneLocations[i].eventData.toLowerCase().includes("restrict")) {
                                                geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>";
                                                locationScripts = "<script src=\x22../main/src/component/location-fu-noaframe.js\x22></script>";
                                                var buff = Buffer.from(JSON.stringify(sceneResponse.sceneLocations[i])).toString("base64");
                                                locationData = "<div id=\x22restrictToLocation\x22 data-location='"+buff+"'></div>";
                                                }
                                        }
                                        // if (sceneResponse.sceneLocations[i].markerType == "poi") {
                                        //     poiIndex++;
                                        //     // locationPOIs.push(sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix);
                                        //     geoEntities = geoEntities + "<a-entity look-at=\x22#player\x22 shadow=\x22cast:true; receive:true\x22 "+geoEntity+"=\x22latitude: "+sceneResponse.sceneLocations[i].latitude+
                                        //     "; longitude: "+sceneResponse.sceneLocations[i].longitude+";\x22 "+skyboxEnvMap+" class=\x22poi gltf\x22 gltf-model=\x22#poimarker\x22><a-entity scale=\x22.5 .5 .5\x22 position=\x22-.1 .5 0.1\x22 text-geometry=\x22value: "+poiIndex+"\x22></a-entity></a-entity>";
                                        //     console.log("geoEntities: " + geoEntities);
                                        // }
                                    }
                                }
                                if (sceneResponse.sceneLocations[i].type != undefined && sceneResponse.sceneLocations[i].type.toLowerCase() == "geographic") { //set actual locs below
                                    // let id = sceneResponse.sceneLocations[i]._id != undefined ? 
                                    if (sceneResponse.sceneLocations[i].markerType == "poi") {
                                        poiIndex++;
                                        if (sceneResponse.sceneWebType == "AR Location Tracking") {
                                            //TODO jack in models / objs here?
                                            geoEntities = geoEntities + "<a-entity look-at=\x22#player\x22 shadow=\x22cast:true; receive:true\x22 "+geoEntity+"=\x22latitude: "+sceneResponse.sceneLocations[i].latitude+
                                            "; longitude: "+sceneResponse.sceneLocations[i].longitude+";  _id: "+sceneResponse.sceneLocations[i].timestamp+"\x22 "+skyboxEnvMap+" class=\x22gltf poi envMap\x22 gltf-model=\x22#poi1\x22><a-entity scale=\x22.5 .5 .5\x22 position=\x22-.1 .5 0.1\x22 text-geometry=\x22value: "+poiIndex+"\x22></a-entity></a-entity>";
                                        
                                        } else if (sceneResponse.sceneWebType != "Mapbox") {
                                            geoEntities = geoEntities + "<a-entity look-at=\x22#player\x22 shadow=\x22cast:true; receive:true\x22 "+geoEntity+"=\x22latitude: "+sceneResponse.sceneLocations[i].latitude+
                                            "; longitude: "+sceneResponse.sceneLocations[i].longitude+";  _id: "+sceneResponse.sceneLocations[i].timestamp+"\x22 "+skyboxEnvMap+" class=\x22gltf poi envMap\x22 gltf-model=\x22#poi1\x22><a-entity scale=\x22.5 .5 .5\x22 position=\x22-.1 .5 0.1\x22 text-geometry=\x22value: "+poiIndex+"\x22></a-entity></a-entity>";
                                            // console.log(geoEntities);
                                        } else {
                                            //for mapbox just using aframe to pass data
                                            geoEntities = geoEntities + "<a-entity class=\x22geo poi\x22 "+geoEntity+"=\x22latitude: "+sceneResponse.sceneLocations[i].latitude+ 
                                            "; longitude: "+sceneResponse.sceneLocations[i].longitude+"; _id: "+sceneResponse.sceneLocations[i].timestamp+"\x22></a-entity>";
                                            // console.log("mapbox geoEntities: " + geoEntities);
                                        }
                                    } else {
                                        if (sceneResponse.sceneLocations[i].modelID != null) {
                                            console.log("gotsa modelID at a geographic location " + sceneResponse.sceneLocations[i].modelID );
                                            geoEntities = geoEntities + "<a-entity class=\x22geo\x22 "+geoEntity+"=\x22latitude: "+sceneResponse.sceneLocations[i].latitude+ 
                                            "; longitude: "+sceneResponse.sceneLocations[i].longitude+"; _id: "+sceneResponse.sceneLocations[i].timestamp+"\x22></a-entity>";
                                        } else {
                                            console.log("modelID is null at this location"); 
                                        }
                                    }
                                }
                                // let zFix = parseFloat(sceneResponse.sceneLocations[i].z) * -1; //nevermind? fix rots in Unity or whatever
                                let zFix = parseFloat(sceneResponse.sceneLocations[i].z); //does nothing    
                             

                                if (sceneResponse.sceneLocations[i].objectID != undefined && sceneResponse.sceneLocations[i].objectID != "none" && sceneResponse.sceneLocations[i].objectID.length > 8) { //attaching object to location 
                                    // console.log("pushinbg object locaition " + sceneResponse.sceneLocations[i]);
                                    sceneObjectLocations.push(sceneResponse.sceneLocations[i]);
                                    
                                }
                                if (sceneResponse.sceneLocations[i].model != undefined && sceneResponse.sceneLocations[i].model != "none" && sceneResponse.sceneLocations[i].model.length > 0) { //new way of attaching gltf to location w/out object
                                    // console.log("pushinbg model locaition " + sceneResponse.sceneLocations[i]);
                                    sceneModelLocations.push(sceneResponse.sceneLocations[i]);
                                    // if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4) {
                                    //     animationComponent = "<script src=\x22https://unpkg.com/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js\x22></script>"; //unused !NEEDS FIXING - this component could be added more than once
                                    // }
                                }
                                if (sceneResponse.sceneLocations[i].markerType != undefined && sceneResponse.sceneLocations[i].type.toLowerCase() != 'geographic') { //cloudmarkers, special type allows local mods
                                    if (sceneResponse.sceneLocations[i].markerType.toLowerCase() == "placeholder" 
                                        || sceneResponse.sceneLocations[i].markerType.toLowerCase().includes("trigger") 
                                        || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "poi" 
                                        || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "gate"
                                        || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "portal"  
                                        || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "mailbox") {
                                    //    locationPlaceholders.push(sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix);
                                        let tLoc = sceneResponse.sceneLocations[i];
                                        tLoc.phID = sceneResponse.short_id+"~cloudmarker~"+sceneResponse.sceneLocations[i].timestamp;
                                        // console.log("TRYNA SET PLACEHOLDER LOCATION : " + JSON.stringify(tLoc) );
                                        // sceneResponse.sceneLocations[i].phID = 
                                        if (!tLoc.markerObjScale) {
                                            tLoc.markerObjScale = 1;
                                        }
                                    
                                        locationPlaceholders.push(tLoc);
                                    }

                                }
                                if (sceneResponse.sceneLocations[i].markerType == "player") {
                                    
                                        playerPosition = sceneResponse.sceneLocations[i].x + " " +  sceneResponse.sceneLocations[i].y + " " +  sceneResponse.sceneLocations[i].z;
                               
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "text") {
                                    textLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix; //TODO - these must all be arrays, like sceneModelLocations above!
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "video") {
                                    hlsScript = "<script src=\x22../main/js/hls.min.js\x22></script>";//v 1.0.6 
                                    videoLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    if (sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined) {
                                        videoRotation = sceneResponse.sceneLocations[i].eulerx + " " + sceneResponse.sceneLocations[i].eulery + " " + sceneResponse.sceneLocations[i].eulerz;
                                        console.log("videoRotation "+ videoRotation);
                                    }
                                    
                                    
                                    if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4) {
                                        if (sceneResponse.sceneLocations[i].eventData.includes("target")) {
                                            //restrict to this geo
                                            console.log("tryna attach video to target!");
                                            videoParent = "parent-to=\x22tracking: target\x22";
                                        }
                                        if (sceneResponse.sceneLocations[i].eventData.includes("marker")) {
                                            //restrict to this geo
                                            console.log("tryna attach video to marker!");
                                            videoParent = "parent-to=\x22tracking: marker\x22";
                                        }
                                        if (sceneResponse.sceneLocations[i].eventData.includes("image")) {
                                            //restrict to this geo
                                            console.log("tryna attach video to image target!");
                                            videoParent = "parent-to=\x22tracking: image\x22";
                                        }
                                        if (sceneResponse.sceneLocations[i].eventData.includes("fixed")) { //by default it's billboarding
                                            //restrict to this geo
                                            // console.log("tryna attach video to image target!");
                                            videoParent = "";
                                        }
                                    }
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "youtube") {
                                    videoLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    if (sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined) {
                                        videoRotation = sceneResponse.sceneLocations[i].eulerx + " " + sceneResponse.sceneLocations[i].eulery + " " + sceneResponse.sceneLocations[i].eulerz;
                                        // console.log("yotube rotation "+ videoRotation);
                                    }
                                    
                                    if (youtubes.length > 0) {
                                        containers = containers + "<div class=\x22youtube\x22 id=\x22"+sceneResponse.sceneLocations[i].eventData+"\x22 data-location-id=\x22"+sceneResponse.sceneLocations[i].id+"\x22 data-attribute=\x22"+youtubes[0].toString()+"\x22></div>"; 
                                        // youtubes.splice(0, 1);
                                    }
    
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "car") {
                                    carLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                }
                              
                                if (sceneResponse.sceneLocations[i].markerType == "picturegroup") {
                                    
                                    picturegroupLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    console.log("gotsa picture geroup " + picturegroupLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "available scenes key") { 
                                    
                                    scenesKeyLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    console.log("gotsa sceneKye loc " + scenesKeyLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "audio") {
                                    audioLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    if (sceneResponse.sceneWebType == "ThreeJS") {
                                        audioLocation = sceneResponse.sceneLocations[i].x + ", " + sceneResponse.sceneLocations[i].y + ", " + zFix;
                                    }
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "link") {
                                    // console.log("pushing link location " + JSON.stringify(sceneResponse.sceneLocations[i]));
                                    let weblinkLocation = {};
                                    weblinkLocation = sceneResponse.sceneLocations[i];
                                    weblinkLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    weblinkLocation.data = sceneResponse.sceneLocations[i].eventData;
                                    sceneWeblinkLocations.push(weblinkLocation);

                                }
                                if (sceneResponse.sceneLocations[i].markerType == "callout" && sceneResponse.sceneLocations[i].eventData != undefined ) {
                                    let calloutLocation = {};
                                    calloutLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    calloutLocation.data = sceneResponse.sceneLocations[i].eventData;
                                    locationCallouts.push(calloutLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "light" && sceneResponse.sceneLocations[i].eventData != undefined) {
                                    let lightLocation = {};
                                    lightLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    lightLocation.data = sceneResponse.sceneLocations[i].eventData;
                                    locationLights.push(lightLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "particles" && sceneResponse.sceneLocations[i].eventData != undefined) {
                                    let particleLocation = {};
                                    particleLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    particleLocation.data = sceneResponse.sceneLocations[i].eventData;
                                    particleLocations.push(particleLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType != undefined && sceneResponse.sceneLocations[i].markerType.includes("picture")) { 
                                    
                                    let pictureLocation = {};
                                    pictureLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    let eulerx = sceneResponse.sceneLocations[i].eulerx != null ? sceneResponse.sceneLocations[i].eulerx : 0;
                                    let eulery = sceneResponse.sceneLocations[i].eulery != null ? sceneResponse.sceneLocations[i].eulery : 0;
                                    let eulerz = sceneResponse.sceneLocations[i].eulerz != null ? sceneResponse.sceneLocations[i].eulerz : 0;
                                    pictureLocation.rot = eulerx + " " + eulery + " " + eulerz;
                                    pictureLocation.type = sceneResponse.sceneLocations[i].markerType;
                                    pictureLocation.data = sceneResponse.sceneLocations[i].eventData; //should be the pic _id
                                    pictureLocation.scale = sceneResponse.sceneLocations[i].scale;
                                    pictureLocation.tags = sceneResponse.sceneLocations[i].tags;
                                    console.log("pictureLocation: " + JSON.stringify(pictureLocation));
                                    locationPictures.push(pictureLocation);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "curve point") {
                                    let curvePoint = {};
                                    curvePoint.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                                    curvePoint.data = sceneResponse.sceneLocations[i].eventData;
                                    curvePoints.push(curvePoint);
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "tunnel") {
                                    let scrollDirection = 'x';
                                    let scrollSpeed = .001;
                                    if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('scroll y')) {
                                        scrollDirection = 'y';
                                    }
                                    if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('speed')) {
                                        const speedSplit = sceneResponse.sceneLocations[i].eventData.toLowerCase().split('~');
                                        if (speedSplit.length > 1) {
                                            scrollSpeed = speedSplit[1];
                                        }
                                        
                                    }
                                    proceduralEntities = proceduralEntities + "<a-entity mod_tunnel=\x22init: true; scrollDirection: "+scrollDirection+"; scrollSpeed: "+scrollSpeed+"\x22></a-entity>";
                                }
                                let scale = 1;
                                if (sceneResponse.sceneLocations[i].markerObjScale && sceneResponse.sceneLocations[i].markerObjScale != undefined && sceneResponse.sceneLocations[i].markerObjScale != "" && sceneResponse.sceneLocations[i].markerObjScale != 0) {
                                // if (!parseFloat(sceneResponse.sceneLocations[i].markerObjScale).isNaN()) {    
                                    scale = sceneResponse.sceneLocations[i].markerObjScale;
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "svg canvas fixed") {
                                    sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                                    proceduralEntities = proceduralEntities + " <a-plane loadsvg=\x22description: "+sceneResponse.sceneLocations[i].description+"; eventdata: "+sceneResponse.sceneLocations[i].eventData+"; tags:  "+sceneResponse.sceneLocations[i].locationTags+"\x22 id=\x22svg_"+sceneResponse.sceneLocations[i].timestamp+
                                    "\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix+"\x22></a-plane>";
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "svg canvas billboard") {

                                    sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                                    // proceduralEntities = proceduralEntities + " <a-plane loadsvg=\x22description: "+sceneResponse.sceneLocations[i].description+"; eventdata: "+sceneResponse.sceneLocations[i].eventData+"; tags:  "+sceneResponse.sceneLocations[i].locationTags+"\x22 id=\x22svg_"+sceneResponse.sceneLocations[i].timestamp+
                                    // "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix+"\x22></a-plane>";
                                }
                                if (sceneResponse.sceneLocations[i].markerType == "text") {
                                    sceneTextLocations.push(sceneResponse.sceneLocations[i]);

                                }
                                if (sceneResponse.sceneLocations[i].markerType == "svg fixed") {
                                    sceneTextLocations.push(sceneResponse.sceneLocations[i]);

                                }
                                if (sceneResponse.sceneLocations[i].markerType == "svg billboard") {
                                    sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                                    // proceduralEntities = proceduralEntities + " <a-entity load_threesvg=\x22description: "+sceneResponse.sceneLocations[i].description+"; eventdata: "+sceneResponse.sceneLocations[i].eventData+"; tags:  "+sceneResponse.sceneLocations[i].locationTags+"\x22 id=\x22svg_"+sceneResponse.sceneLocations[i].timestamp+
                                    // "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix+"\x22></a-entity>";
                                }

                            }
                          
                            // var buff = Buffer.from(JSON.stringify(sceneResponse.sceneLocations)).toString("base64");
                            // loadLocations = "<a-entity location_data id=\x22locationData\x22 data-locations='"+buff+"'></a-entity>";
                            //SET CAMERA VAR BELOW, DEPENDING ON SCENETYPE

                            } if (sceneData.sceneWebType == 'Camera Background') {
                            
                        
                            } else { //"sceneWebType == "Default or AFrame"
                                    
                                transportButtons = "<div class=\x22transport_buttons\x22>"+

                                "<div class=\x22next_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22NextButton()\x22><i class=\x22fas fa-step-forward fa-2x\x22></i></div>"+
                                "<div class=\x22ffwd_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22FastForwardButton()\x22><i class=\x22fas fa-forward fa-2x\x22></i></div>"+
                                "<div class=\x22play_button\x22 id=\x22transportPlayButton\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22TransportPlayButton()\x22><i class=\x22fas fa-play-circle fa-2x\x22></i></div>" +
                                "<div class=\x22rewind_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22RewindButton()\x22><i class=\x22fas fa-backward fa-2x\x22></i></div>"+
                                "<div class=\x22previous_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22PreviousButton()\x22><i class=\x22fas fa-step-backward fa-2x\x22></i></div>"+
                                "<div id=\x22transportStats\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px; text-align: left\x22></div></div>";                                

                                // transportButtonsWithSlider = "<div class=\x22transport_buttons\x22><div class=\x22sslidecontainer\x22><input type=\x22range\x22 min=\x221\x22 max=\x22100\x22 value=\x221\x22 class=\x22sslider\x22 id=\x22mainTransportSlider\x22>"+
                                // "</div><div id=\x22transportStats\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: left; margin: 5px 5px; text-align: left\x22></div>"+
                                // "<div class=\x22next_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22NextButton()\x22><i class=\x22fas fa-step-forward fa-2x\x22></i></div>"+
                                // "<div class=\x22ffwd_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22FastForwardButton()\x22><i class=\x22fas fa-forward fa-2x\x22></i></div>"+
                                // "<div class=\x22play_button\x22 id=\x22transportPlayButton\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22TransportPlayButton()\x22><i class=\x22fas fa-play-circle fa-2x\x22></i></div>" +
                                // "<div class=\x22rewind_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22RewindButton()\x22><i class=\x22fas fa-backward fa-2x\x22></i></div>"+
                                // "<div class=\x22previous_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22PreviousButton()\x22><i class=\x22fas fa-step-backward fa-2x\x22></i></div></div>";
                                
                                dialogButton = "<div class=\x22dialog_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: left; margin: 10px 10px;\x22 onclick=\x22SceneManglerModal('Welcome')\x22><i class=\x22fas fa-info-circle fa-2x\x22></i></div>";
                               
                                sceneManglerButtons = "<div class=\x22show-ui-button\x22 onclick=\x22ShowHideUI()\x22><i class=\x22far fa-eye fa-2x\x22></i></div>";
                                if (!sceneResponse.sceneTextUseModals) {
                                   // renderPanel = "<a-entity visible=\x22false\x22 render_canvas id=\x22renderCanvas\x22 look-at=\x22#player\x22 geometry=\x22primitive: plane; width:1; height:1;\x22 scale=\x221 1 1\x22 position=\x220 3.5 -.25\x22 material=\x22shader: html; transparent: true; width:1024; height:1024; fps: 10; target: #renderPanel;\x22></a-entity>\n";
                                }
                            
                            }
                           
                            sceneResponse.scenePostcards = sceneData.scenePostcards;
                                                
                            // if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                            //     nextLink = "href=\x22../webxr/" + sceneResponse.sceneNextScene + "\x22";
                            // }
                            // if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                            //     prevLink = "href=\x22../" + sceneResponse.scenePreviousScene + "\x22";
                            // }
                            if (sceneResponse.sceneLoopPrimaryAudio) {
                                loopable = "loop: true";
                            }
                          
                            if (sceneData.scenePrimaryAudioID != null && sceneData.scenePrimaryAudioID.length > 4) {
                                // var pid = ObjectId.createFromHexString(sceneData.scenePrimaryAudioID);
                                // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneData.scenePrimaryAudioID));
                                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.scenePrimaryAudioID));
                                // if (sceneData.scenePrimaryAudioVisualizer) {
                                    
                                //     audioVizEntity = "<a-entity id=\x22audiovizzler\x22 position=\x22"+audioLocation+"\x22 data-audio-analyzer=\x22true\x22 data-beat=\x22true\x22></a-entity>";
                                //     // primaryAudioParams = primaryAudioParams + " data-audiovizzler=\x22beat\x22 ";
                                // }
                            }
                            if (sceneData.sceneAmbientAudioID != null && sceneData.sceneAmbientAudioID.length > 4) {
                                // var pid = ObjectID(sceneData.sceneAmbientAudioID);
                                // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneData.scenePrimaryAudioID));
                                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.sceneAmbientAudioID));

                            }
                            if (sceneData.sceneTriggerAudioID != null && sceneData.sceneTriggerAudioID.length > 4) {
                                // var pid = ObjectId.createFromHexString(sceneData.sceneAmbientAudioID);
                                // console.log("tryna get [ObjectId.createFromHexString(sceneData.scenePrimaryAudioID)]" + ObjectId.createFromHexString(sceneData.scenePrimaryAudioID));
                                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.sceneTriggerAudioID));

                            }
                            callback();
                            
                        // }
                        // callback();

                    // });
                },

                function (callback) {
                    // console.log("attributions 2" + JSON.stringify(attributions));
                    if (attributions != null && attributions != undefined && attributions.length > 0) {
                      
                        attributionsObject.attributions = attributions;

                    let attrib64 = Buffer.from(JSON.stringify(attributionsObject)).toString("base64");
                        attributionsTextEntity = attributionsTextEntity + "<a-entity id=\x22attributionsEntity\x22 data-attributions=\x22"+attrib64+"\x22 attributions_text_control></a-entity>";
                        callback();
                    } else {
                        callback();
                    } 
                },
               
                
                // function (callback) {
                //     // if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") { 
                //     //     db.scenes.findOne({$or: [ { short_id: sceneResponse.sceneNextScene }, { sceneTitle: sceneResponse.sceneNextScene } ]}, function (err, scene) {
                //     //         if (scene == err) {
                //     //             // console.log("didn't find next scene");
                //     //         } else {
                //     //             nextLink = "href=\x22../" + scene.short_id + "\x22";    
                               
                //     //         }
                //     //     }); 
                //     // } else {
                //     //     nextLink = "href=\x22#\x22";    
                        
                //     // }
                //     // if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                //     //     db.scenes.findOne({$or: [ { short_id: sceneResponse.scenePreviousScene }, { sceneTitle: sceneResponse.scenePreviousScene } ]}, function (err, scene) {
                //     //         if (scene == err) {
                //     //             // console.log("didn't find prev scene");
                //     //         } else {
                //     //             prevLink = "href=\x22../" + scene.short_id + "/index.html\x22";    
                //     //         }
                //     //     }); 
                //     // }
                //     callback();
                // },
                function (callback) {
                    if (sceneResponse.sceneText != null && sceneResponse.sceneText != "" && sceneResponse.sceneText.length > 0) {
                        // contentUtils = "<script src=\x22../main/src/component/content-utils.js\x22></script>"; 

                        if (!textLocation.length > 0) {textLocation = "-10 1 -5";}
                        // console.log("tryna get sceneText!");
                        let mainText = sceneResponse.sceneText.replace(/([\"]+)/gi, '\'');
                        mainText = mainText.replace(/([\;]+)/gi, '\:');

                        let maintext64 = Buffer.from(JSON.stringify(sceneResponse.sceneText)).toString("base64");
                        // let maintext64 = cleanbase64(sceneResponse.sceneText);
                        // let maintext64 = "<div id=\x22restrictToLocation\x22 data-location='"+buff+"'></div>";
                        // mainText = sceneResponse.sceneText;
                        textEntities = textEntities + "<a-entity look-at=\x22#player\x22 scale=\x22.25 .25 .25\x22 position=\x22"+textLocation+"\x22>"+
                                "<a-entity "+skyboxEnvMap+" id=\x22mainTextToggle\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1 .5\x22 toggle-main-text  gltf-model=\x22#exclamation\x22></a-entity>"+
                                "<a-entity id=\x22mainTextPanel\x22 visible='false' position=\x220 0 0\x22>" +
                                // "<a-entity id=\x22mainTextHeader\x22 visible='false' geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 7.25 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                // "text=\x22value:; wrap-count: 40;\x22></a-entity>" +
                                "<a-entity id=\x22mainTextHeader\x22 visible='false' position=\x225 9.75 0\x22></a-entity>" +
                                
                                // "<a-entity id=\x22mainText\x22 main-text-control=\x22mainTextString: "+mainText.replace(/([^a-z0-9\,\?\'\-\_\.\!\*\&\$\n\~]+)/gi, ' ')+"; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 geometry=\x22primitive: plane; width: 4.5; height: 6\x22 position=\x220 6.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                // "<a-entity id=\x22mainText\x22 data-maintext=\x22"+maintext64+"\x22 main-text-control=\x22mainTextString: "+mainText.replace(/([^a-z0-9\,\(\)\?\'\-\_\.\!\*\&\$\n\~]+)/gi, ' ')+"; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 geometry=\x22primitive: plane; width: 4.5; height: 6\x22 position=\x220 6.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                // "<a-entity id=\x22mainText\x22 data-maintext='"+maintext64+"' main-text-control=\x22mainTextString: ; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 geometry=\x22primitive: plane; width: 4.5; height: 6\x22 position=\x220 6.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                "<a-entity id=\x22mainText\x22 data-maintext='"+maintext64+"' main-text-control=\x22font: "+sceneResponse.sceneFontWeb1+"; mainTextString: ; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 position=\x22-5 9.25 0\x22></a-entity>" +

                                // "<a-entity id=\x22mainText\x22 main-text-control=\x22mainTextString: "+mainText+"; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 geometry=\x22primitive: plane; width: 4.5; height: 6\x22 position=\x220 6.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                // "text=\x22value:; wrap-count: 30;\x22>" +
                                // "text=\x22value:"+sceneResponse.sceneText+"; wrap-count: 25;\x22>" +
                                "<a-entity visible='false' class=\x22envMap activeObjexRay\x22 id=\x22nextMainText\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x223 -1 2\x22></a-entity>" +
                                "<a-entity visible='false' class=\x22envMap activeObjexRay\x22 id=\x22previousMainText\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-3 -1 2\x22></a-entity>" +
                                "<a-entity gltf-model=\x22#square_panel\x22 scale=\x226 6 6\x22 position=\x220 5 -.5\x22></a-entity>" +
                            "</a-entity></a-entity></a-entity>";
                        callback();
                    } else {
                        callback();
                    }
                },

                function (callback) { 
                    //hrm, get a list of text locations and spin through these...
                    if (sceneResponse.sceneTextItems != null && sceneResponse.sceneTextItems != undefined && sceneResponse.sceneTextItems != "") {


                        if (sceneResponse.sceneWebType != "HTML from Text Item") { //if it's not just a regular html page
                            for (let i = 0; i < sceneTextLocations.length; i++) {  //TODO ASYNC

                            console.log("cheking sceneLocation " + JSON.stringify(sceneTextLocations[i]));
                            // sceneTextItemData = "<div id=\x22sceneTextItems\x22 data-attribute=\x22"+sceneResponse.sceneTextItems+"\x22></div>"; 
                            // dialogButton = "<div class=\x22dialog_button\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22SceneManglerModal('Welcome')\x22><i class=\x22fas fa-info-circle fa-2x\x22></i></div>";
                            
                            //hrm...dunno....
                                // if (!sceneResponse.sceneTextUseModals) {
                                //     //renderPanel = "<a-entity visible=\x22false\x22 render_canvas id=\x22renderCanvas\x22 look-at=\x22#player\x22 geometry=\x22primitive: plane; width:1; height:1;\x22 scale=\x221 1 1\x22 position=\x220 3.5 -.25\x22 material=\x22shader: html; transparent: true; width:1024; height:1024; fps: 10; target: #renderPanel;\x22></a-entity>\n";
                                //     renderPanel = "<a-entity use-textitem-modals></a-entity>\n";
                                // } else {
                                //     renderPanel = "<a-entity use-textitem-modals></a-entity>\n";
                                // }
                            
                            let textID = sceneTextLocations[i].description; //check desc for id, if not then event data
                            if (!textID || textID.length < 5) {
                                textID = sceneTextLocations[i].eventData;
                            }
                            console.log("tryna get svg " + textID);
                            if (textID && textID.length > 5) { 
                                if (sceneTextLocations[i].markerType == "svg canvas billboard") {
                                   
                                    let oid = ObjectId.createFromHexString(textID);
                                    db.text_items.findOne({_id: oid}, function (err, text_item){
                                        if (err || !text_item) {
                                            console.log("error getting text_items: " + err);
                                            sceneTextItemData = "no data found";
                                            // callback(null);
                                        } else {
                                            //  = text_item;
    
                                            if (text_item.type == "SVG Document") {
                                                // console.log("gots svgItem : " + JSON.stringify(text_item));
                                                let scale = 1;
                                                if (sceneTextLocations[i].markerObjScale && sceneTextLocations[i].markerObjScale != "" && sceneTextLocations[i].markerObjScale != 0) {
                                                    scale = sceneTextLocations[i].markerObjScale;
                                                }
                    
                                                sceneTextItemData = sceneTextItemData + "<canvas class=\x22canvasItem\x22 id=\x22svg_canvas_"+textID+"\x22 style=\x22text-align:center;\x22 width=\x221024\x22 height=\x221024\x22></canvas>"+
                                                "<div style=\x22visibility: hidden\x22 class=\x22svgItem\x22 id=\x22svg_item_"+textID+"\x22 data-attribute=\x22"+text_item._id+"\x22>"+text_item.textstring+"</div>"; //text string is an svg
                                                proceduralEntities = proceduralEntities + " <a-plane loadsvg=\x22id:"+textID+"; description: "+sceneTextLocations[i].description+"; eventdata: "+sceneTextLocations[i].eventData+"; tags:  "+sceneTextLocations[i].locationTags+"\x22 id=\x22svg_"+sceneTextLocations[i].timestamp+
                                                "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneTextLocations[i].x + " " + sceneTextLocations[i].y + " " + sceneTextLocations[i].z+"\x22></a-plane>";
                                            }

                                            }
                                        });
                                    // }
                                } else if (sceneTextLocations[i].markerType == "svg billboard") {
                                   console.log("tryna get svg billboard " + textID);
                                    if (validator.isMongoId(textID)) {
                                    let oid = ObjectId.createFromHexString(textID);
                                    db.text_items.findOne({_id: oid}, function (err, text_item){
                                        if (err || !text_item) {
                                            console.log("error getting text_items: " + err);
                                            sceneTextItemData = "no data found";
                                            // callback(null);
                                        } else {
                                            //  = text_item;
    
                                            if (text_item.type == "SVG Document") {
                                                // console.log("gots svgItem : " + JSON.stringify(text_item));
                                                let scale = 1;
                                                if (sceneTextLocations[i].markerObjScale && sceneTextLocations[i].markerObjScale != "" && sceneTextLocations[i].markerObjScale != 0) {
                                                    scale = sceneTextLocations[i].markerObjScale;
                                                }
                                                // sceneTextItemData = sceneTextItemData + "<div style=\x22visibility: hidden\x22 class=\x22svgItem\x22 id=\x22svg_item_"+textID+"\x22 data-attribute=\x22"+text_item._id+"\x22>"+text_item.textstring+"</div>";
                                                proceduralEntities = proceduralEntities + " <a-entity load_threesvg=\x22id:"+textID+"; description: "+sceneTextLocations[i].description+"; eventdata: "+sceneTextLocations[i].eventData+"; tags:  "+sceneTextLocations[i].locationTags+"\x22 id=\x22svg_"+sceneTextLocations[i].timestamp+
                                                "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneTextLocations[i].x + " " + sceneTextLocations[i].y + " " + sceneTextLocations[i].z+"\x22></a-entity>";
                                            }

                                            }
                                        });
                                    } 
                                } 
                            }
                        } 
                        callback();
                       
                        } else { //if it's an html...
                            // if (sceneResponse.sceneTextItems != null && sceneResponse.sceneTextItems != undefined && sceneResponse.sceneTextItems.length > 0) {
                                console.log("Tryna fetch scenetextitgme " + sceneResponse.sceneTextItems);
                                let oid = ObjectId.createFromHexString(sceneResponse.sceneTextItems.toString());
                            db.text_items.findOne({_id: oid}, function (err, text_item){
                                if (err || !text_item) {
                                    console.log("error getting text_items: " + err);
                                    sceneTextItemData = "no data found";
                                    callback(null);
                                } else {
                                    sceneTextItemData = text_item.textstring; // html with the trimmings...
                                    // console.log("full on html: " + sceneTextItemData);
                                    // htmltext = sceneTextItemData;
                                    callback(null)
                                }
                            });
                        }
                        // }
                    } else { //no text items 
                        callback();
                    }             
                },
                function (callback) { //fethc audio items
                    
                    (async () => {
                        try {
                            const query = {_id: {$in: requestedAudioItems }};
                            const audio_items = await RunDataQuery("audio_items", "find", query, req.originalUrl);
                            if (!audio_items) {
                                audio_items = [];
                            }
                            callback(null, audio_items);
                        } catch (e) {
                            callback(null);
                        }
                    })();
                    // db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items) {
                    //     if (err || !audio_items) {
                    //         console.log("error getting audio items: " + err);
                    //         callback(null);
                    //     } else {
                    //         callback(null, audio_items) //send them along

                    //     }
                    // });
                },
                
                function (audio_items, callback) { //add the signed URLs to the obj array 
                    (async () => {
                        for (var i = 0; i < audio_items.length; i++) { //?? TODO do this async - if it's slow shit might get out of whack//NOTE gonna pull audioevents from client, rather than jack in from here
                            // console.log("audio_item: " + JSON.stringify(audio_items[i]));
                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            //console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            // primaryAudioTitle = audio_items[i].filename;

                            if (sceneResponse.scenePrimaryAudioID != undefined && audio_items[i]._id == sceneResponse.scenePrimaryAudioID) {
                                primaryAudioTitle = audio_items[i].title;
                                primaryAudioObject = audio_items[i];
                            // primaryAudioWaveform = 
                                // mp3url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, Expires: 6000});
                                // oggurl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, Expires: 6000});
                                // pngurl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName, Expires: 6000});

                                mp3url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                                oggurl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                                pngurl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName, 6000);
                                console.log("primary audio url is " + mp3url);
                                primaryAudioWaveform = pngurl;
                                pAudioWaveform = "<img id=\x22primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 src=\x22"+primaryAudioWaveform+"\x22>";
                            }
                            if (sceneResponse.sceneAmbientAudioID != undefined && audio_items[i]._id == sceneResponse.sceneAmbientAudioID) {

                                // ambientOggUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, Expires: 6000});
                                // ambientMp3Url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, Expires: 6000});
                                ambientOggUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                                ambientMp3Url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                            }                        
                            if (sceneResponse.sceneTriggerAudioID != undefined && audio_items[i]._id == sceneResponse.sceneTriggerAudioID) {
                                // triggerOggUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, Expires: 6000});
                                // triggerMp3Url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, Expires: 6000});
                                triggerOggUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                                triggerMp3Url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                            }

                            if (audio_items[i].sourceText != undefined && audio_items[i].sourceText != null && audio_items[i].sourceText != "") {
                                let newAttribution = {};
                                        
                                newAttribution.name = audio_items[i].title;
                                newAttribution._id = audio_items[i]._id;
                                
                                newAttribution.sourceTitle = audio_items[i].sourceTitle;
                                newAttribution.sourceLink = audio_items[i].sourceLink;
                                newAttribution.authorName = audio_items[i].authorName;
                                newAttribution.authorLink = audio_items[i].authorLink;
                                newAttribution.license = audio_items[i].license;
                                newAttribution.sourceText = audio_items[i].sourceText;
                                newAttribution.modifications = audio_items[i].modifications;
                                attributions.push(newAttribution);
                            }
                            // console.log("copying audio to s3...");
                        }
                        callback(null);
                    })();//async end
                },
                function (callback) {
                    
                    if (sceneResponse.scenePrimaryAudioID != null && sceneResponse.scenePrimaryAudioID.length > 4) {
                        hasPrimaryAudio = true;
                    }
                    if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 4) {
                        hasPrimaryAudioStream = true;
                        hasPrimaryAudio = false;
                    }
                    // console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    if (hasPrimaryAudioStream || hasPrimaryAudio) {
                        if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                            primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;    
                        } 
                        console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    }
                    if (sceneResponse.sceneAmbientAudioID != null && sceneResponse.sceneAmbientAudioID.length > 4) {
                        hasAmbientAudio = true;
                    }
                    if (sceneResponse.sceneTriggerAudioID != null && sceneResponse.sceneTriggerAudioID.length > 4) {
                        hasTriggerAudio = true;
                    }
                    if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                        primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;
                        console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    }
                    // if (sceneResponse.scenePrimaryVolume != null) {
                    //     scenePrimaryVolume = sceneResponse.scenePrimaryVolume;
                    // }
                    // if (sceneResponse.sceneAmbientVolume != null) {
                    //     sceneAmbientVolume = sceneResponse.sceneAmbientVolume;
                    // }
                    // if (sceneResponse.sceneTriggerVolume != null) {
                    //     sceneTriggerVolume = sceneResponse.sceneTriggerVolume;
                    // }
                    // if (hasSynth) {
                    //     synthScripts = "<script src=\x22../main/src/synth/Tone.js\x22></script><script src=\x22../main/js/synth.js\x22></script>";
                    // }
                    // if (hasPrimaryAudio) {

                    //     if (sceneResponse.sceneWebType == "ThreeJS") {
                                
                    //         // create an AudioListener and add it to the camera
                    //         primaryAudioScript = "var listener = new THREE.AudioListener();\n"+
                    //         "camera.add( listener );\n"+
                    //         // create the PositionalAudio object (passing in the listener)
                    //         "primaryAudio = new THREE.PositionalAudio( listener );\n"+
                    //         // load a sound and set it as the PositionalAudio object's buffer
                    //         "var primaryAudioLoader = new THREE.AudioLoader();\n"+
                    //         "var sphere = new THREE.SphereBufferGeometry( 1, 32, 32 );\n"+
                    //         "var material = new THREE.MeshPhongMaterial( { color: 'red' } );\n"+
                    //         "var primaryAudioMesh = new THREE.Mesh( sphere, material );\n"+
                    //         "primaryAudioLoader.load( \x22"+oggurl+"\x22, function( buffer ) {\n"+
                    //             "primaryAudio.setBuffer( buffer );\n"+
                    //             "primaryAudio.setRefDistance( 20 );\n"+
                    //             "primaryAudioMesh.material.color = new THREE.Color( 'green' );\n"+
                    //             "primaryAudioStatusText.set({content: \x22ready\x22, fontColor: new THREE.Color( 'green' )});\n"+
                                
                    //             // "primaryAudio.play();\n"+
                    //         "});\n"+
                    //         // create an object for the sound to play from

                    //         "primaryAudioMesh.userData.name = 'primaryAudioMesh';\n"+
                    //         "primaryAudioMesh.position.set("+audioLocation+");\n"+
                    //         "scene.add( primaryAudioMesh );\n"+
                    //         // finally add the sound to the mesh
                    //         "primaryAudioMesh.add( primaryAudio );\n";
                            
                    //     } else { //aframe below
                    //         if (mp3url.length > 8) {
                    //             let html5 = "html5: true,";
                    //             if (sceneResponse.scenePrimaryAudioVisualizer == true) {  //audio analysis won't work in html5 mode
                    //                 html5 = "html5: false,";
                    //             } 

                    //             primaryAudioScript = "<script>\n" +      
                    //             "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                    //                     "src: [\x22"+oggurl+"\x22,\x22"+mp3url+"\x22], "+html5+" ctx: true, volume: 0," + loopable +
                    //                 "});" +
                    //             "primaryAudioHowl.load();</script>";
                    //             // primaryAudioControl = "<script src=\x22../main/src/component/primary-audio-control.js\x22></script>";
                    //             primaryAudioEntity = "<a-entity audio-play-on-window-click id=\x22primaryAudioParent\x22 look-at=\x22#player\x22 position=\x22"+audioLocation+"\x22>"+ //parent
                            
                                
                    //             "<a-entity gltf-model=\x22#backpanel_horiz1\x22 position=\x220 -1.25 0\x22 material=\x22color: black; transparent: true;\x22></a-entity>" +
                    //             // "<a-image id=\x22primaryAudioWaveformImageEntity\x22 position = \x220 -.1 0\x22 width=\x221\x22 height=\x22.25\x22 src=\x22#primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 transparent=\x22true\x22></a-image>"+
                    //             // "</a-entity>"+
                    //             // "<a-entity gltf-model=\x22#audioplayer\x22 scale=\x221 1 1\x22 position=\x220 0 -.2\x22></a-entity>" +
                    //             "<a-entity position=\x220 -1.25 0\x22 primary_audio_player id=\x22primaryAudioPlayer\x22 gltf-model=\x22#audioplayer\x22></a-entity>"+
                    //             // "<a-entity id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .30\x22 position=\x22-.85 -.2 -1\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22"+
                    //             "<a-entity id=\x22primaryAudioText\x22 position=\x22.5 0 -1\x22 "+
                    //             "text=\x22value:Click to play;\x22></a-entity>"+
                    //             // "<a-entity id=\x22primaryAudio\x22 mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 entity-callout=\x22calloutString: 'play/pause'\x22 primary_audio_control=\x22oggurl: "+oggurl+"; mp3url: "+mp3url+"; audioID: "+sceneResponse.scenePrimaryAudioID+"; volume: "+scenePrimaryVolume+"; audioevents:"+sceneResponse.scenePrimaryAudioTriggerEvents+"; targetattach:"+sceneResponse.sceneAttachPrimaryAudioToTarget+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                    //             // "title: "+primaryAudioTitle+"\x22 geometry=\x22primitive: sphere; radius: .175;\x22 material=\x22shader: noise;\x22 position=\x220 -.5 -1\x22>"+
                    //             "<a-entity id=\x22primaryAudio\x22 primary_audio_control=\x22oggurl: "+oggurl+"; mp3url: "+mp3url+"; audioID: "+sceneResponse.scenePrimaryAudioID+"; volume: "+scenePrimaryVolume+"; audioevents:"+sceneResponse.scenePrimaryAudioTriggerEvents+"; targetattach:"+sceneResponse.sceneAttachPrimaryAudioToTarget+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                    //             "title: "+primaryAudioTitle+"\x22>"+
                                
                    //             "</a-entity>"+
                                
                    //             "</a-entity>";
                    //             modelAssets = modelAssets + "<a-asset-item id=\x22backpanel_horiz1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/backpanel_horiz1.glb\x22></a-asset-item>\n";
                    //             // "<a-entity gltf-model=\x22#play_button\x22 scale=\x22.15 .1 .1\x22 position=\x220 0 -.2\x22 material=\x22color: black; transparent: true; opacity: 0.1\x22></a-entity>" +
                    //             if (sceneResponse.scenePrimaryAudioTriggerEvents) {
                    //                 var buff = Buffer.from(JSON.stringify(primaryAudioObject)).toString("base64");
                    //                 loadAudioEvents = "<a-entity primary_audio_events id=\x22audioEventsData\x22 data-audio-events='"+buff+"'></a-entity>"; 
                    //             }
                    //         }
                    //     }
                    // }
                    // if (hasPrimaryAudioStream) {
                    //     mp3url = sceneResponse.scenePrimaryAudioStreamURL;   
                    //     oggurl = sceneResponse.scenePrimaryAudioStreamURL;                    
                    //     streamPrimaryAudio = true;
                    //     primaryAudioScript = "<script>Howler.autoUnlock = false;" + //override if streaming url
                    //     "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                    //             "src: \x22"+sceneResponse.scenePrimaryAudioStreamURL+"\x22, html5: true, volume: 0, format: ['mp3', 'aac']" +
                    //         "});" +
                    //     "</script>";
                    //     // primaryAudioControl = "<script src=\x22../main/src/component/primary-audio-control.js\x22></script>";
                    //     primaryAudioEntity = "<a-entity id=\x22primaryAudioParent\x22 look-at=\x22#player\x22 position=\x22"+audioLocation+"\x22>"+ //parent
                    //     "<a-entity id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .5\x22 position=\x220 .5 2.5\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22"+
                    //     "text=\x22value:Click to play;\x22></a-entity>"+
                    //     "<a-entity gltf-model=\x22#landscape_panel\x22 scale=\x220.075 0.05 0.05\x22 position=\x220 .5 2.4\x22 material=\x22color: black; transparent: true; opacity: 0.1\x22></a-entity>" +
                    //     "<a-entity id=\x22primaryAudio\x22 mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 entity-callout=\x22calloutString: 'play/pause'\x22 primary_audio_control=\x22oggurl: "+oggurl+"; mp3url: "+mp3url+"; volume: "+scenePrimaryVolume+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                    //     "title: "+primaryAudioTitle+"\x22  geometry=\x22primitive: sphere; radius: .25;\x22 material=\x22shader: noise;\x22 position=\x220 0 2.6\x22></a-entity></a-entity>";
                    //     if (sceneResponse.scenePrimaryAudioTriggerEvents) { //maybe pass a do not listen?
                    //         var buff = Buffer.from(JSON.stringify(primaryAudioObject)).toString("base64");
                    //         loadAudioEvents = "<a-entity primary_audio_events id=\x22audioEventsData\x22 data-audio-events='"+buff+"'></a-entity>"; 
                    //     }
                    // }
                    // if (hasAmbientAudio) {
                    //     // if (ambientMp3Url.length > 8) {
                    //         ambientAudioScript = "<script>" +      
                    //         "let ambientAudioHowl = new Howl({" + //inject howler for non-streaming
                    //                 "src: [\x22"+ambientOggUrl+"\x22,\x22"+ambientMp3Url+"\x22], volume: 0, loop: true" + 
                    //             "});" +
                    //         "ambientAudioHowl.load();</script>";
                    //         // ambientAudioControl = "<script src=\x22../main/src/component/ambient-audio-control.js\x22></script>";
                    //         let ambientPosAnim = "animation__yoyo=\x22property: position; to: -33 3 0; dur: 60000; dir: alternate; easing: easeInSine; loop: true;\x22 ";
                    //         let ambientRotAnim = "animation__rot=\x22property:rotation; dur:60000; to: 0 360 0; loop: true; easing:linear;\x22 ";        
                    //         // posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;";  
                    //         ambientAudioEntity = "<a-entity "+ambientRotAnim+"><a-entity id=\x22ambientAudio\x22 ambient_audio_control=\x22oggurl: "+ambientOggUrl+"; mp3url: "+ambientMp3Url+";\x22 volume: "+sceneAmbientVolume+"; "+
                    //         // "geometry=\x22primitive: sphere; radius: .5\x22 "+ambientPosAnim+" position=\x2233 3 0\x22>" +
                    //         ambientPosAnim+" position=\x2233 3 0\x22>" +
                    //         "</a-entity></a-entity>";
                    //     // }
                    // }
                    // if (hasTriggerAudio) {
                    //     // if (triggerMp3Url.length > 8) {
                    //         triggerAudioEntity = "<a-entity id=\x22triggerAudio\x22 trigger_audio_control=\x22volume: "+sceneTriggerVolume+"\x22>"+
                    //         "</a-entity>";
                    //         triggerAudioScript = "<script>" +      
                    //         "let triggerAudioHowl = new Howl({" + //inject howler for non-streaming
                    //                 "src: [\x22"+triggerOggUrl+"\x22,\x22"+triggerMp3Url+"\x22], volume: 1, loop: false" + 
                    //             "});" +
                    //         "triggerAudioHowl.load();</script>";
                    //     // }
                    // }
                    
                 
                        callback();
                    // }  
                },
                // function (callback) { //fethc video items
                //     if (sceneResponse.sceneVideos != null && sceneResponse.sceneVideos.length > 0) {
                //         sceneResponse.sceneVideos.forEach(function (vid) {
                //             // console.log("looking for sceneVideo : " + JSON.stringify(vid));
                //             var p_id = ObjectId.createFromHexString(vid); //convert to binary to search by _id beloiw
                //             requestedVideoItems.push(p_id); //populate array
                //         });
                //         db.video_items.find({_id: {$in: requestedVideoItems}}, function (err, video_items) {
                //             if (err || !video_items) {
                //                 console.log("error getting video items: " + err);
                //                 callback(null, new Array());
                //             } else {
                //                 //console.log("gotsome video items: " + JSON.stringify(video_items[0]));

                //                 callback(null, video_items) //send them along
                //             }
                //         });
                //     } else {
                //         callback(null, new Array());
                //     }
                // },

                // function (video_items, callback) { //add the signed URLs to the obj array
                //     let preloadVideo = true; //FOR NOW - testing on ios, need to set a toggle for this...
              
                //     if (video_items != null && video_items[0] != null) { //only single vid for now, need to loop array

                //         (async () => {
                //             console.log("video_item: " + JSON.stringify(video_items[0]));
                //             var item_string_filename = JSON.stringify(video_items[0].filename);
                //             item_string_filename = item_string_filename.replace(/\"/g, "");
                //             var item_string_filename_ext = getExtension(item_string_filename);
                //             var expiration = new Date();
                //             expiration.setMinutes(expiration.getMinutes() + 1000);
                //             var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                //             var namePlusExtension = baseName + item_string_filename_ext.toLowerCase();
                //             //console.log("mp4 video: " + mp4Name + " " + video_items[0]._id);
                //             console.log("gotsa vid with ext : "+item_string_filename_ext.toLowerCase()); 
                //             let mov = "";
                //             let webm = "";
                //             let vidSrc = "";
                //             var vid = video_items[0]._id;
                //             var ori = video_items[0].orientation != null ? video_items[0].orientation : "";
                //             if (item_string_filename_ext.toLowerCase() == ".mp4" || item_string_filename_ext.toLowerCase() == ".mkv") { //single src OK for these
                //                 // vidUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, Expires: 6000});
                //                 vidUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                //                 vidSrc = "<source src=\x22"+vidUrl+"\x22 type=\x22video/mp4\x22>";
                //             } else {
                //                 //for transparent video, need both mov + webm!
                //                 if (item_string_filename_ext.toLowerCase() == ".mov") {
                //                     // mov = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "video/" + vid + "/" + vid + "." + namePlusExtension, Expires: 6000});
                //                     mov = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                //                     for (let i = 0; i < video_items.length; i++) {
                //                         if (video_items[0]._id != video_items[i]._id) {
                //                             if (video_items[0].title == video_items[i].title) {
                //                                 console.log("found a webm to match the mov");
                //                                 // webm = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, Expires: 6000});
                //                                 webm = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, 6000);
                //                                 vidSrc = "<source src=\x22"+webm+"\x22 type=\x22video/webm\x22><source src=\x22"+mov+"\x22 type=\x22video/webm\x22>";
                //                             }
                //                         }
                //                     }
                                    
                //                 }
                //                 if (item_string_filename_ext.toLowerCase() == ".webm") {
                //                     // webm = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "/" + vid + "." + namePlusExtension, Expires: 6000});
                //                     webm = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                //                     for (let i = 0; i < video_items.length; i++) {
                //                         if (video_items[0]._id != video_items[i]._id) {
                //                             if (video_items[0].title == video_items[i].title) {
                //                                 console.log("found a mov to match the webm " + video_items[0]._id + " vs " + video_items[i]._id);
                //                                 // mov = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." + video_items[i].filename, Expires: 6000});
                //                                 mov = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, 6000);
                //                                 vidSrc = "<source src=\x22"+mov+"\x22 type=\x22video/webm\x22><source src=\x22"+mov+"\x22 type=\x22video/quicktime\x22>";
                //                             }
                //                         }
                //                     }  
                //                 }
                //             }
                        
                //             if (ori.toLowerCase() == "equirectangular") { //not on landing!
                //                 // videosphereAsset = "<video id=\x22videosphere\x22 autoplay loop crossOrigin=\x22anonymous\x22 src=\x22" + vidUrl + "\x22></video>";
                //                 // videoEntity = "<a-videosphere play-on-window-click play-on-vrdisplayactivate-or-enter-vr crossOrigin=\x22anonymous\x22 src=\x22#videosphere\x22 rotation=\x220 180 0\x22 material=\x22shader: flat;\x22></a-videosphere>";
                //                 //play hls instead!
                //             } else {
                //                 if (preloadVideo) {
                                
                //                     videoAsset = "<video id=\x22video1\x22 crossOrigin=\x22anonymous\x22>"+vidSrc+"</video>";
                //                 } else {
                //                     videoAsset = "<video autoplay muted loop=\x22true\x22 webkit-playsinline playsinline id=\x22video1\x22 crossOrigin=\x22anonymous\x22></video>"; 
                //                 }

                //                 videoEntity = "<a-entity "+videoParent+" class=\x22activeObjexGrab activeObjexRay\x22 vid_materials=\x22url: "+vidUrl+"\x22 gltf-model=\x22#movieplayer2.glb\x22 position=\x22"+videoLocation+"\x22 rotation=\x22"+videoRotation+"\x22 width='10' height='6'><a-text id=\x22videoText\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x22-.5 -1 1\x22 wrapCount=\x2240\x22 value=\x22Click to Play Video\x22></a-text>" +
                //                 "</a-entity>";
                //             }

                //             callback(null);
                //         })(); //async end
                //     } else {
                //         callback(null);
                //     }
                // },
                function (callback) {
                    console.log("videoGroups: " + sceneResponse.sceneVideoGroups);
                    if (sceneResponse.sceneVideoGroups != null && sceneResponse.sceneVideoGroups.length > 0) {
                        
                        (async () => {
                            try {
                                const vgID = sceneResponse.sceneVideoGroups[0]; //just get the first one
                                const oo_id = ObjectId.createFromHexString(vgID);
                                const query = {"_id": oo_id};
                                const group = await RunDataQuery("groups", "findOne", query, req.originalUrl);
                                if (group) {
                                    requestedVideoGroups.push(group);
                                    const buff = Buffer.from(JSON.stringify(requestedVideoGroups)).toString("base64");
                                    if (sceneResponse.sceneWebType == "Video Landing") {
                                        videoGroupsEntity = "<div id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></div>"; 
                                    } else {
                                        videoGroupsEntity = "<a-entity video_groups_data id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></a-entity>"; 
                                    }
                                   
                                    hlsScript = "<script src=\x22../main/js/hls.min.js\x22></script>"; //v 1.0.6 client hls player ref
                                    callback(null);
                                } else {
                                    callback(null);
                                }
                            } catch (e) {
                                console.log("error getting video group " + e);
                            }
                        })();
                        // const vgID = sceneResponse.sceneVideoGroups[0];
                        // let oo_id = ObjectId.createFromHexString(vgID);



                        // db.groups.find({"_id": oo_id}, function (err, groups) {
                        //     if (err || !groups) {
                        //         callback();
                        //     } else {
                        //     // console.log("gotsa group: "+ JSON.stringify(groups));
                        //     async.each(groups, function (groupID, callbackz) { 
                        //         let vidGroup = {};
                        //         vidGroup._id = groups[0]._id;
                        //         vidGroup.name = groups[0].name;
                        //         vidGroup.userID = groups[0].userID;
                        //         let ids = groups[0].items.map(convertStringToObjectID);
                        //         // let modImages =
                        //         db.video_items.find({_id : {$in : ids}}, function (err, videos) { // get all the image records in group
                        //             if (err || !videos) {
                        //                 callbackz();
                        //             } else {
                        //                 async.each(videos, function(video, cbimage) { //jack in a signed url for each
                        //                     (async () => {
                        //                         // video.url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video.userID + "/video/" + video._id + "/" + video._id + "." + video.filename, Expires: 6000}); //TODO: puthemsina video folder!
                        //                         video.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video.userID + "/video/" + video._id + "/" + video._id + "." + video.filename, 6000);
                                                
                        //                         cbimage();
                        //                     })();
                        //                 }, 
                        //                 function (err) {
                        //                     if (err) {
                        //                         vidGroup.videos = videos;
                        //                         console.log("vidgroup error " + err);
                                             
                        //                         callbackz();
                        //                     } else {
                        //                         vidGroup.videos = videos;
                        //                         requestedVideoGroups.push(vidGroup);

                        //                         callbackz();
                        //                     }
                        //                 });
                        //             }
                        //         });
                        //     },
                        //     function (err) {
                        //         if (err) {
                        //             console.log('A file failed to process');
                        //             callback(null);
                        //         } else {
                        //             console.log('All vidGroups processed successfully');
                        //             videoElements = ""; //jack in video elements, ios don't like them cooked up in script
                        //             for (let i = 0; i < requestedVideoGroups[0].videos.length; i++ ) {  //TODO spin first and second level array
                        //                 // videoElements = videoElements + "<video style=\x22display: none;\x22 loop=\x22true\x22 preload=\x22metadata\x22 type=\x22video/mp4\x22 crossOrigin=\x22anonymous\x22 src=\x22"+requestedVideoGroups[0].videos[i].url+"\x22 playsinline webkit-playsinline id=\x22"+requestedVideoGroups[0].videos[i]._id+"\x22></a-video>";
                        //                 videoElements = videoElements + "<video style=\x22display: none;\x22 loop=\x22true\x22 crossorigin=\x22use-credentials\x22 webkit-playsinline playsinline id=\x22"+requestedVideoGroups[0].videos[i]._id+"\x22></video>";
                                       
                        //             }

                        //             var buff = Buffer.from(JSON.stringify(requestedVideoGroups)).toString("base64");
                        //             if (sceneResponse.sceneWebType == "Video Landing") {
                        //                 videoGroupsEntity = "<div id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></div>"; 
                        //             } else {
                        //                 videoGroupsEntity = "<a-entity video_groups_data id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></a-entity>"; 
                        //             }
                                   
                        //             hlsScript = "<script src=\x22../main/js/hls.min.js\x22></script>"; //v 1.0.6 client hls player ref
                        //             callback(null);
                        //         }
                        //     });
                            // callback();
                            // }
                        // });
                    } else {
                        callback();
                    }

                },
               
                function (callback) { 
                    
   
                        let youtubeSniffer = "";
                        let iosIcon = "<span class=\x22apple_no\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
                        let androidIcon = "<span class=\x22android_no\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
                        let windowsIcon = "<span class=\x22windows_no\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
                        let getAppLink = "<span class=\x22smallfont\x22><a class=\x22btn\x22 href=\x22https://servicemedia.net/landing/builds\x22 target=\x22_blank\x22>Get the app</a></span>&nbsp;";

                        let connectLink = "<span class=\x22smallfont\x22><a class=\x22btn\x22 href=\x22https://strr.us/connect/?scene="+sceneResponse.short_id+"\x22 target=\x22_blank\x22>Connect</a></span>&nbsp;";
                        let loginLink = "<span class=\x22smallfont\x22><a class=\x22btn\x22 href=\x22https://servicemedia.net/main/sign_in.html\x22 target=\x22_blank\x22>Login</a></span>";
                        let primaryAudioSliderChunk = "";
                        let ambientAudioSliderChunk = "";
                        let triggerAudioSliderChunk = "";
                        let keynote = "<span class=\x22smallfont\x22>Keynote: "+sceneResponse.sceneKeynote+ "</span><hr>";
                        let desc = "<span class=\x22smallfont\x22>Description: "+sceneResponse.sceneDescription+ "</span><hr>";
                        let hasApp = false;
                        let appButtons = "";
                        if (!isGuest) {
                            loginLink = "";
                        }
                        if (sceneResponse.sceneIosOK) {
                            iosIcon = "<a href=\x22servicemedia://scene?" + sceneResponse.short_id + "\x22><span class=\x22apple_yes\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>";
                            hasApp = true;
                        } 
                        if (sceneResponse.sceneAndroidOK) {
                            androidIcon = "<a href=\x22servicemedia://scene?" + sceneResponse.short_id + "\x22><span class=\x22android_yes\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>";
                            hasApp = true;
                        }
                        if (sceneResponse.sceneWindowsOK) {
                            windowsIcon = "<a href=\x22servicemedia://scene?" + sceneResponse.short_id + "\x22><span class=\x22windows_yes\x22>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>";
                            hasApp = true;
                        } 
                        if (hasApp) {
                            appButtons = getAppLink + androidIcon +"&nbsp;&nbsp;"+ windowsIcon  +"&nbsp;&nbsp;"+ iosIcon + "&nbsp;&nbsp;<a href=\x22servicemedia://scene?" + sceneResponse.short_id + "\x22 class=\x22btn\x22 type=\x22button\x22>App Link</a><br><hr>"; 
                        }
                        if (sceneResponse.sceneYouTubeIDs != null && sceneResponse.sceneYouTubeIDs.length > 0) {
                            // yotubes = sceneResponse.sceneYouTubeIDs;
                            let youtubeVolume = sceneResponse.sceneMediaAudioVolume != undefined ? sceneResponse.sceneMediaAudioVolume : 80;
                            for (let i = 0; i < sceneResponse.sceneYouTubeIDs.length; i++) {
                                
                                youtubeContent = "<div width=\x22240\x22 id=\x22youtubeElement\x22 data-yt_id=\x22"+sceneResponse.sceneYouTubeIDs[i]+"\x22 data-sceneTitle=\x22"+sceneResponse.sceneTitle+"\x22></div>"+
                                
                                "<script>\n"+
                                    "var tag = document.createElement('script');\n"+
                                    "tag.src = \x22//www.youtube.com/iframe_api\x22;\n"+
                                    "var firstScriptTag = document.getElementsByTagName('script')[0];\n"+
                                    "firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);\n"+
                                "</script>";
                                
                                youtubeEntity = "<a-entity id=\x22youtubeParent\x22 look-at=\x22#player\x22 position=\x22-6 2 -6\x22>"+

                                "<a-entity id=\x22youtubePlayer\x22 position=\x220 -1 1\x22 gltf-model=\x22#youtubeplayer\x22 youtube_player=\x22yt_id: "+sceneResponse.sceneYouTubeIDs[i]+"; volume: "+youtubeVolume+"\x22></a-entity>"+
                                "<a-text wrapCount=\x2270\x22 value=\x22"+sceneResponse.sceneTitle+"\x22 width=\x222\x22 position=\x22-.95 .65 1.1\x22 id=\x22youtubeTitle\x22></a-text>"+
                                "<a-text width=\x223\x22 position=\x22-.95 -.3 1.1\x22 id=\x22youtubeState\x22></a-text>"+
                                "<a-text width=\x223\x22 position=\x22-.95 -.4 1.1\x22 id=\x22youtubeStats\x22></a-text>"+
                                "</a-entity>";
                            }
                        }
                        // if (hasPrimaryAudio || hasPrimaryAudioStream) {
                        //     primaryAudioSliderChunk = "<a href=\x22#\x22 style=\x22float: right;\x22 onclick=PlayPausePrimaryAudio() id=\x22primaryAudioPlayPause\x22 class=\x22btn tooltip\x22 type=\x22button\x22>"+
                        //     "Play/Pause Primary Audio<span class=\x22tooltiptext\x22>"+primaryAudioTitle+"</span></a></span><br>"+
                        //     "<span id=\x22primaryAudioVolume\x22>Primary Volume</span><div class=\x22slidecontainer\x22>"+
                        //     // "<a href=\x22#\x22 class=\x22btn\x22 type=\x22button\x22>Play</a>"+
                        //     "<input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+scenePrimaryVolume+"\x22 class=\x22slider\x22 id=\x22primaryAudioVolumeSlider\x22>" +
                        //     "</div>";
                        // }
                        // if (hasAmbientAudio) {
                        //     ambientAudioSliderChunk = "<span id=\x22ambientAudioVolume\x22>Ambient Volume</span><div class=\x22slidecontainer\x22><input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+sceneAmbientVolume+"\x22 class=\x22slider\x22 id=\x22ambientAudioVolumeSlider\x22></div>";
                        // }
                        // if (hasTriggerAudio) {
                        //     triggerAudioSliderChunk = "<span id=\x22triggerAudioVolume\x22>Trigger Volume</span><div class=\x22slidecontainer\x22><input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+sceneTriggerVolume+"\x22 class=\x22slider\x22 id=\x22triggerAudioVolumeSlider\x22></div>";
                        // }
                        // let userText = "<div class=\x22smallfont\x22><span id=\x22userName\x22 class=\x22\x22>Welcome " + avatarName+ "</span>!&nbsp;&nbsp;<button onclick=\x22Disconnect()\x22 type=\x22button\x22 class=\x22btn\x22>Disconnect</button></div><hr>";
                        // if (isGuest) {
                        //     userText = "<div><span id=\x22userName\x22 class=\x22smallfont\x22>Welcome Guest known as " + avatarName+ "</span>"+
                        //     //loginLink +
                        //     "<button onclick=\x22Disconnect()\x22 type=\x22button\x22 class=\x22btn\x22>Disconnect</button></div>\n"+
                        //     "<hr>";
                        // }
                        // let fromBy = "<div><span class=\x22smallfont\x22>From: <a href=\x22http://"+sceneResponse.sceneDomain+"\x22>" +sceneResponse.sceneDomain+ "</a><br><hr>By: " + sceneResponse.userName+ "</span></div><hr>\n";
                        // // 
                        // screenOverlay = "<div class=\x22screen-overlay\x22>" +
                        // "<button id=\x22screenOverlayCloseButton\x22 type=\x22button\x22 class=\x22screen-overlay-close-button\x22>Close View</button><br>"+


                        // "</div>";
                        // audioSliders = "<div id=\x22audioSliders\x22 style=\x22visibility: hidden\x22>"+primaryAudioSliderChunk + ambientAudioSliderChunk + triggerAudioSliderChunk+"</div>";
                        
                        // mapOverlay = "<div class=\x22map-overlay\x22 id=\x22mapElement\x22>" +
                        // "<button id=\x22mapOverlayCloseButton\x22 type=\x22button\x22 class=\x22screen-overlay-close-button\x22>Close Map</button><br>"+
                        // "</div>";
                        
                        // canvasOverlay = "<div id=\x22canvasOverlay\x22 class=\x22canvas-overlay\x22><button id=\x22sceneTitleButton\x22 type=\x22button\x22 class=\x22collapsible\x22>"+sceneResponse.sceneTitle+"</button>" +

                        // "<div id=\x22overlayContent\x22 class=\x22content\x22>" + youtubeContent +"<hr>"+ fromBy + keynote + desc + appButtons +
                        

                        // userText +
                        
                        // "<div class=\x22smallfont\x22><span id=\x22users\x22></span></div>"+ 
                      
                        // "<hr><div>"+
                        // "<div style=\x22float:right; margin: 5px 10px 5px; 0;\x22 onclick=\x22SceneManglerModal('Events')\x22><i class=\x22fas fa-stopwatch \x22></i></div>"+
                        // "<div style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Locations')\x22><i class=\x22fas fa-globe \x22></i></div>"+
                        // "<div style=\x22float:right; margin: 5px 10px 5px; 0;\x22 onclick=\x22SceneManglerModal('Tools')\x22><i class=\x22fas fa-tools \x22></i></div>"+
                        // "<div style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Messages')\x22><i class=\x22fas fa-comments \x22></i></div></div>"+
                        // "<div style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Inventory')\x22><i class=\x22fas fa-suitcase \x22></i></div>"+
                        // mapStyleSelector +
                        // "</div>"+
                       
                        // "<div>"+
                        // mapButtons +
                     
                        // "</div></div>";

                    
                        console.log("sceneShowAds: " + sceneResponse.sceneShowAds);
                        if (sceneResponse.sceneShowAds != null && sceneResponse.sceneShowAds != undefined && sceneResponse.sceneShowAds != false) { //put the ads if you must..//nevermind...
                            // adSquareOverlay = "<script async src=\x22https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\x22></script>"+
                            
                            // "<div id=\x22adSquareOverlay\x22 class=\x22ad-overlay\x22>" +
                        
                            // "<!-- square floater 1 -->"+
                            // "<ins class=\x22adsbygoogle\x22"+
                              
                            // "style=\x22display:inline-block;width:150px;height:400px\x22"+
                            //     "data-ad-client=\x22ca-pub-5450402133525063\x22"+
                            //     "data-ad-slot=\x225496489247\x22></ins>"+
                            //     // "<br><button id=\x22adSquareCloseButton\x22 type=\x22button\x22 class=\x22closeable\x22>Close Ad</button>"+
                            // "</div>" +
                            // "<br><br><button id=\x22adSquareCloseButton\x22 type=\x22button\x22 class=\x22closeable\x22>Close Ad</button>"+
                            // "<script>"+
                            //     "(adsbygoogle = window.adsbygoogle || []).push({});"+
                            // "</script>"+
                            // "<script>"+
                               
                            // "</script>";
                        }
                        callback(null);
                    
                },

                function (callback) { //undeprecate! need a static route or they timeout, duh...
                    var postcards = [];
                    console.log("sceneResponse.scenePostcards: " + JSON.stringify(sceneResponse.scenePostcards));
                    if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                        var postcard = sceneResponse.scenePostcards[sceneResponse.scenePostcards.length - 1];
                        (async () => {
                        //    console.log("LANDPAGE POSTCARD " + postcard);
                            try {
                                var oo_id = ObjectId.createFromHexString(postcard);
                                const query = {"_id": oo_id};
                                const picture_item = await RunDataQuery("image_items", "findOne", query, req.originalUrl);
                                if (picture_item) {
                                    const postcard1 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID +"/pictures/"+ picture_item._id + ".standard." + picture_item.filename)                                     
                                    postcardImages.push(postcard1);

                                }
                                callback();
                                
    
                            } catch (e) {   
                                console.log("error getting postcard " + e);
                            }
                        })();
                      
                    } else {
                        console.log("no postcard!");
                        callback();
                    }
                },
                
                function (callback) {
                    console.log("pictureGroups: " + sceneResponse.scenePictureGroups);
                    if (sceneResponse.scenePictureGroups != null && sceneResponse.scenePictureGroups.length > 0) {
                        // pgID = sceneResponse.scenePictureGroups[0];
                        
                        // let oo_id = ObjectID(pgID);
                        (async () => {
                            try {
                                const objectIDs = sceneResponse.scenePictureGroups.map(convertStringToObjectID);
                                const query = {"_id": {$in : objectIDs}};
                                const groups = await RunDataQuery("groups","find",query,req.originalUrl);
                                if (groups && groups.length) {
                                    for (var group of groups) {
                                        let picGroup = {};
                                        picGroup._id = group._id;
                                        picGroup.name = group.name;
                                        picGroup.userID = group.userID;
                                        const ids = group.items.map(convertStringToObjectID);
                                        const picquery = {"_id" : {$in : ids}};
                                        const images = await RunDataQuery("image_items", "find", picquery);
                                        if (images && images.length) {
                                            for (var image of images) {
                                                if (image.orientation != null && image.orientation != undefined && image.orientation.toLowerCase() == "equirectangular") { 
                                                    skyboxIDs.push(image._id);
                                                    // image.url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + image.userID + "/pictures/originals/" + image._id + ".original." + image.filename, Expires: 6000});
                                                    image.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + image.userID + "/pictures/originals/" + image._id + ".original." + image.filename, 6000);
                                                    // cbimage();
                                                } else {
                                                    // image.url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + image.userID + "/pictures/" + image._id + ".standard." + image.filename, Expires: 6000}); //i.e. 1024
                                                    image.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + image.userID + "/pictures/" + image._id + ".standard." + image.filename, 6000);
                                                    // cbimage();
                                                }
                                            }
                                        }
                                        picGroup.images = images;
                                        requestedPictureGroups.push(picGroup);
                                    }
                                    var buff = Buffer.from(JSON.stringify(requestedPictureGroups)).toString("base64");
                                    pictureGroupsData = "<div id=\x22pictureGroupsData\x22 data-picture-groups='"+buff+"'></a-entity>";
                                    callback();
                                } else {
                                    callback();
                                }
                            } catch (e) {
                                console.log("landing pic groups error " + e);
                            }
                        })();
                    } else {
                        callback();
                    }

                   

                },
                function (callback) {  //places scene pics (not in a group)
                    // var postcards = [];
                    // console.log("sceneResponse.scenePictures: " + JSON.stringify(sceneResponse.scenePictures));
                    if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                        var index = 0;
                        // let picItemsPlaced = [];
                        let picLocationsPlaced = [];
                        let picIndex = 0;
                        async.each(sceneResponse.scenePictures, function (picID, callbackz) { //nested async-ery!
                            (async () => {
                                try {                                       
                                    var oo_id = ObjectId.createFromHexString(picID);
                                    const query = {"_id": oo_id};
                                    const picture_item = await RunDataQuery("image_items", "findOne", query, req.originalUrl);
                                    if (picture_item) {
                                        var version = ".standard.";
                                        if (picture_item.orientation != undefined) {
                                        // if (picture_item.orientation.toLowerCase() == "equirectangular" && sceneResponse.sceneUseSkybox) {
                                            if (picture_item.orientation.toLowerCase() == "equirectangular") {
                                            // console
                                            skyboxID = picID;
                                            version = ".original.";
                                            // fogSettings = "";
                                            skyboxIDs.push(picID);
                                            // convertEquirectToCubemap = "<script src=\x22../main/ref/aframe/dist/equirect-to-cubemap.js\x22></script>";
                                            }
                                        }
                                    
                                    
                                        let max = 30;
                                        let min = -30;
                                        let x = Math.random() * (max - min) + min;
                                        // let y = Math.random() * (max.y - min.y) + min.y;
                                        let z = Math.random() * (max - min) + min;
                                        if (z >= -15 && z <= 15) {
                                            if (z < 0) {
                                                z = -20;
                                            } else {
                                                z = 20;
                                            }
                                        
                                        }
                                        if (x >= -15 && z <= 15) {
                                            if (x < 0) {
                                                x = -20;
                                            } else {
                                                x = 20;
                                            }
                                            
                                        }
                                        index++;
                                        let position = x + " " + 2 + " " + z;
                                        let rotation = "0 90 0";
                                        let scale = 1;
                                        // image1url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                        if (picture_item.orientation == "circle" || picture_item.orientation == "Circle" || picture_item.orientation == "square" || picture_item.orientation == "Square" ) {
                                            image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/originals/" + picture_item._id + ".original." + picture_item.filename, 6000);
                                            // 'users/' + picture_item.userID + '/pictures/originals/' + picture_item._id + '.original.' + picture_item.filename
                                        } else {
                                            image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, 6000);
                                        }
                                        if (picture_item.orientation == "Tileable") {

                                            tilepicUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/originals/" + picture_item._id + ".original." + picture_item.filename, 6000);
                                            console.log("GOTSA TILEABLE PIC! " + tilepicUrl);
                                        }
                                        // image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, 6000);
                                        picArray.push(image1url);
                                        
                                        imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 crossorigin=\x22anonymous\x22 src='" + image1url + "'>";
                                        let caption = "";
                                        if (picture_item.captionUpper != null && picture_item.captionUpper != undefined) {
                                            caption = "<a-text class=\x22pCap\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x220 1.3 -.1\x22 wrapCount=\x2240\x22 value=\x22"+picture_item.captionUpper+"\x22></a-text>";
                                        }
                                        let lowerCap = "";
                                        let actionCall = "";
                                        let link = "";
                                        let lookat = " look-at=\x22#player\x22 ";
                                        console.log("picLocations taken: " + picLocationsPlaced);
                                        
                                        if (picIndex < locationPictures.length) {
                                            position = locationPictures[picIndex].loc;
                                            rotation = locationPictures[picIndex].rot;
                                            if (locationPictures[picIndex].type.includes("fixed")) {
                                                console.log("fixed pic @ " + locationPictures[picIndex].loc);
                                                lookat = "";
                                            }
                                            if (locationPictures[picIndex].scale) {

                                            }
                                            picIndex++;
                                        } 
                                    
                                        if (picture_item.linkType != undefined && picture_item.linkType.toLowerCase() != "none") {
                                            if (picture_item.linkType == "NFT") { //never mind, these are old image target fu
                                            
                                            }
                                            if (picture_item.linkURL != undefined && !picture_item.linkURL.includes("undefined") && picture_item.linkURL.length > 6) {
                                                link = "basic-link=\x22href: "+picture_item.linkURL+";\x22 class=\x22activeObjexGrab activeObjexRay\x22";
                                            }
                                        }

                                        if (picture_item.hasAlphaChannel) {
                                            imageEntities = imageEntities + "<a-entity "+link+""+lookat+" geometry=\x22primitive: plane; height: 10; width: 10\x22 material=\x22shader: flat; transparent: true; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                            " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                        } else {
                                            // if (picture_item.linkType != undefined && picture_item.orientation != "equirectangular" && picture_item.orientation != "Equirectangular") {
                                            if (picture_item.orientation != "equirectangular" && picture_item.orientation != "Equirectangular") {  //what if linkType is undefined?

                                                if (picture_item.orientation == "portrait" || picture_item.orientation == "Portrait") {
                                                    //console.log("gotsa portrait!");
                                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+index+"\x22 gltf-model=\x22#portrait_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                                    modelAssets = modelAssets + "<a-asset-item id=\x22portrait_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5c.glb\x22></a-asset-item>\n";
                                                } else if (picture_item.orientation == "square" || picture_item.orientation == "Square") {
                                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+index+"\x22 gltf-model=\x22#square_panel\x22 scale=\x223 3 3\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                                    modelAssets = modelAssets + "<a-asset-item id=\x22square_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelsquare1.glb\x22></a-asset-item>\n";
                                                } else if (picture_item.orientation == "circle" || picture_item.orientation == "Circle") {
                                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+index+"\x22 gltf-model=\x22#circle_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                                    modelAssets = modelAssets + "<a-asset-item id=\x22circle_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelcircle1.glb\x22></a-asset-item>\n";
                                                } else {
                                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+index+"\x22 gltf-model=\x22#landscape_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                                    //modelAssets...
                                                    // modelAssets = modelAssets + 
                                                }
                                            }
                                        }
                                    }
                                    callbackz();

                                } catch (e) {
                                    // callback(e);
                                    console.log("picture group fetch error: " + e);
                                }
                            })();

                        },
                        function (err) {
                        
                            if (err) {
                                console.log('A file failed to process');
                                callback(null);
                            } else {
                                //console.log('All pictures processed successfully');
                                callback(null);
                            }
                        });
                    } else {
                        //                      callback(null);
                        callback(null);
                    }
                },

                function (callback) {
                    let settings = {};  //TODO move this lower down? 

                    settings._id = sceneResponse._id;
                    settings.sceneType = "landing";
                    settings.sceneTags = sceneResponse.sceneTags;
                    settings.sceneTitle = sceneResponse.sceneTitle;
                    settings.sceneKeynote = sceneResponse.sceneKeynote;
                    settings.sceneDescription = sceneResponse.sceneDescription;
                    settings.sceneEventStart = sceneResponse.sceneEventStart;
                    settings.sceneEventEnd = sceneResponse.sceneEventEnd;
                    settings.hideAvatars = true;
                    settings.sceneSkyRadius = sceneResponse.sceneSkyRadius != undefined ? sceneResponse.sceneSkyRadius : 202;
                    settings.sceneFontWeb1 = sceneResponse.sceneFontWeb1;
                    settings.sceneFontWeb2 = sceneResponse.sceneFontWeb2;
                    settings.sceneFontWeb3 = sceneResponse.sceneFontWeb3;
                    settings.sceneFontFillColor = sceneResponse.sceneFontFillColor;
                    settings.sceneFontOutlineColor = sceneResponse.sceneFontOutlineColor;
                    settings.sceneTextBackground = sceneResponse.sceneTextBackground;
                    settings.sceneTextBackgroundColor = sceneResponse.sceneTextBackgroundColor;
                    settings.sceneColor1 = sceneResponse.sceneColor1;
                    settings.sceneColor2 = sceneResponse.sceneColor2;
                    settings.sceneColor3 = sceneResponse.sceneColor3;
                    settings.sceneColor4 = sceneResponse.sceneColor4;
                    settings.sceneColor1Alt = sceneResponse.sceneColor1Alt;
                    settings.sceneColor2Alt = sceneResponse.sceneColor2Alt;
                    settings.sceneColor3Alt = sceneResponse.sceneColor3Alt;
                    settings.sceneColor4Alt = sceneResponse.sceneColor4Alt;
                    settings.volumePrimary = sceneResponse.scenePrimaryVolume;
                    settings.volumeAmbient = sceneResponse.sceneAmbientVolume;
                    settings.volumeTrigger = sceneResponse.sceneTriggerVolume; 
                    settings.sceneTimedEvents = sceneResponse.sceneTimedEvents; //could be big!?
                    settings.skyboxIDs = skyboxIDs;
                    settings.skyboxID = skyboxID;
                    settings.skyboxURL = skyboxUrl;
                    settings.useSynth = hasSynth;
                    settings.useMatrix = (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('matrix'));
                    settings.sceneWaterLevel = (sceneResponse.sceneWater != undefined && sceneResponse.sceneWater.level != undefined) ? sceneResponse.sceneWater.level : 0;
                    settings.sceneCameraMode = sceneResponse.sceneCameraMode != undefined ? sceneResponse.sceneCameraMode : "First Person"; 
                    settings.sceneCameraFlyable = sceneResponse.sceneFlyable != undefined ? sceneResponse.sceneFlyable : false;
                    let audioGroups = {};
                    audioGroups.triggerGroups = sceneResponse.sceneTriggerAudioGroups;
                    audioGroups.ambientGroups = sceneResponse.sceneAmbientAudioGroups;
                    audioGroups.primaryGroups = sceneResponse.scenePrimaryAudioGroups;
                    settings.audioGroups = audioGroups; 
                    settings.clearLocalMods = false;
                    settings.sceneVideoStreams = sceneResponse.sceneVideoStreamUrls;
                    settings.socketHost = process.env.SOCKET_HOST;
                    settings.networking = sceneResponse.sceneNetworking;
                    settings.playerStartPosition = playerPosition;

                    if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("show avatars")) {
                        settings.hideAvatars = false;
                    }
                    if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("clear localmods")) {
                        settings.clearLocalMods = true;
                    }
                    
                    if (sceneResponse.triggerAudioGroups != null && sceneResponse.triggerAudioGroups.length > 0) {
                        hasTriggerAudio = true;
                    }
                    if (sceneResponse.ambientAudioGroups != null && sceneResponse.ambientAudioGroups.length > 0) {
                        hasAmbientAudio = true;
                    }
                    if (sceneResponse.primayAudioGroups != null && sceneResponse.primayAudioGroups.length > 0) {
                        hasPrimaryAudio = true;
                    }

                    // settings.sceneAmbientAudioGroups = sceneResponse.sceneAmbientAudioGroups;
                    // settings.scenePrimaryAudioGroups = sceneResponse.scenePrimaryAudioGroups;
                    var sbuff = Buffer.from(JSON.stringify(settings)).toString("base64");
                    settingsData = "<div id=\x22settingsDataElement\x22 data-settings=\x22"+sbuff+"\x22></div>";
                    // settingsDataEntity = "<a-entity id=\x22settingsDataEntity\x22 data-settings=\x22"+sbuff+"\x22></a-entity>"; ? maybe

                    let picGroups = "";
                    let sceneGreeting = sceneResponse.sceneDescription;
                    if (sceneResponse.sceneGreeting != null && sceneResponse.sceneGreeting != undefined && sceneResponse.sceneGreeting != "") {
                        sceneGreeting = sceneResponse.sceneGreeting;
                    }      
                    let sceneQuest = "No quests for this scene... yet!";
                    if (sceneResponse.sceneQuest != null && sceneResponse.sceneQuest != undefined && sceneResponse.sceneQuest) {
                        sceneQuest = sceneResponse.sceneQuest;
                    }
                    

                   
                    
                   if (sceneResponse.sceneWebType != "Video Landinggggg") {
                        // if (!sceneGreeting || !sceneGreeting.length) {
                        //     sceneGreeting = "Welcome!";
                        // } 
                        // let hasTile = false;
                        // let bgstyle = "style=\x22height:100%; width:100%; overflow:auto; background-color: "+sceneResponse.sceneColor1+";\x22"

                        if (sceneResponse.sceneTags.includes("landing pics")) {
                            // if (requestedPictureGroups) {
                                
                                // picGroups = JSON.stringify(requestedPictureGroups);
                                // pictureGroupsData = "<div id=\x22pictureGroupsData\x22 data-picture-groups='"+buff+"'></div>"; 
                                // console.log(pictureGroupsData);
                            // }
                        }
                        let availableScenesHTML = ""; 
                        let bgstyle = "style=\x22height:100%; width:100%; overflow:auto;\x22";
                        let sceneAccess = "Access Open to Public"
                        // if (sceneResponse.sceneShareWithSubscribers) {
                        //     sceneAccess ="<span>Access Requires Subscription</span><br>";
                        // }
                        // bgcolor=\x22"+sceneResponse.sceneColor1+"\x22>\n
                        if (tilepicUrl != "") {
                            bgstyle = "style=\x22height:100%; width:100%; overflow:auto; background-color: "+sceneResponse.sceneColor1+"; background-image: url("+tilepicUrl+"); background-repeat: repeat;\x22";
                        }
                        let sceneOwner = "";
                        let sceneEditButton = "";
                        if (sceneOwner != "" || (!isGuest && req.session.user && req.session.user.authLevel.includes("domain_admin"))) { //hrm..
                           sceneEditButton = "<a class=\x22mx-auto btn btn-xl btn-primary float-right\x22 target=\x22_blank\x22 href=\x22../main/index.html?type=scene&iid="+sceneResponse._id+"\x22>Edit Scene</a>";
                        }

                        if (sceneResponse.sceneShareWithSubscribers) {
                            if (isGuest) {
                                sceneAccess ="<span>Access Requires Subscription</span><br>"+
                                // "<form action=\x22../create-checkout-session\x22 method=\x22POST\x22>"+
                                // "<button class=\x22mx-auto btn btn-xl btn-success \x22 type=\x22submit\x22>Become a Subscriber!</button>"+
                                // "</form>";
                                
                                "<a class=\x22mx-auto btn btn-xl btn-info \x22 href=\x22../main/sign_in.html\x22>Subscriber Login</a> "+
                                "<p>Login if you're a subscriber, or </p>" +
                                "<p><a class=\x22mx-auto btn btn-xl btn-success \x22 href=\x22https://buy.stripe.com/test_fZe6pdebx9vB7LO8wx\x22>Become a Subscriber!</a> </p>";
                            } else {
                                sceneAccess ="<span>Access Requires Subscription</span><br>"+
                                "<h4 class=\x22text-success\x22>Welcome <strong>" + avatarName + "</strong>!</h4>";
                            }
                            //  "Subscribe or Login to access this scene - "
                        } else {
                            if (!isGuest) {
                                sceneAccess += "<p><h4 class=\x22text-success\x22>Welcome <strong>" + avatarName + "</strong>!</h4></p>";
                            }
                            
                        // }
                        }
                        let styleTheme = "slate";
                        if (sceneResponse.sceneStyleTheme != null && sceneResponse.sceneStyleTheme != undefined && sceneResponse.sceneStyleTheme.length > 0 && sceneResponse.sceneStyleTheme != 'undefined') {
                            styleTheme = sceneResponse.sceneStyleTheme;
                        }

                        // platformButtons = "";
                        let buttonLabel = sceneResponse.sceneWebType == "Video Landing" ? "Watch Video" : "Enter WebXR Scene"

                        let platformButtons = "<a class=\x22mx-auto btn btn-xl btn-primary \x22 href=\x22../webxr/"+ sceneResponse.short_id + "\x22>"+buttonLabel+"</a>"+
                        "<a class=\x22mx-auto btn btn-xl btn-primary \x22 href=\x22https://www.oculus.com/open_url/?url=https://smxr.net/webxr/"+ sceneResponse.short_id + "\x22>Send to Quest</a>"
                        if (sceneResponse.sceneShareWithSubscribers) {
                            if (isGuest) {
                                platformButtons = "";
                            }
                            
                            //  "Subscribe or Login to access this scene - "
                        }
                        if (!sceneResponse.sceneShareWithSubscribers && sceneResponse.sceneWebGLOK) {
                           platformButtons += "<a class=\x22mx-auto btn btn-xl btn-primary \x22 href=\x22../unity/"+ sceneResponse.short_id + "\x22>Enter Unity Scene</a> ";
                        }
                        var audioHtml = "";
                        let uid = "0000000000000";
                        if (req.session.user) {
                            uid = req.session.user._id;
                        }
                        if (mp3url != undefined && mp3url.length > 6) {
                            audioHtml = '<div><audio controls><source src=\x22' + mp3url + '\x22 type=\x22audio/mp3\x22></audio></div>';
                        }
                        var token=jwt.sign({userId:uid,shortID:sceneResponse.short_id},process.env.JWT_SECRET, { expiresIn: '1h' }); 
                        // console.log("avatar name: " + avatarName + " token " + token);
                        htmltext = "<!DOCTYPE html>\n" +
                        "<head> " +
                        "<meta name=\x22viewport\x22 content=\x22width=device-width, initial-scale=1\x22 />"+
                        "<html lang=\x22en\x22 xml:lang=\x22en\x22 xmlns= \x22http://www.w3.org/1999/xhtml\x22>"+
                        "<meta charset=\x22UTF-8\x22>"+
                        "<meta name=\x22google\x22 content=\x22notranslate\x22>" +
                        "<meta http-equiv=\x22Content-Language\x22 content=\x22en\x22></meta>" +
                        // googleAnalytics +
                        
                        "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                        "<meta charset='utf-8'/>" +
                        "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                        "<meta property='og:url' content='" + process.env.ROOT_HOST + "/webxr/" + sceneResponse.short_id + "' /> " +
                        "<meta property='og:type' content='website' /> " +
                        // "<meta property='og:image' content='" + postcard1 + "' /> " +
                        "<meta property='og:image' content='" + postcard1 + "' /> " +
                        "<meta property='og:image:height' content='1024' /> " +
                        "<meta property='og:image:width' content='1024' /> " +
                        "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                        "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                        "<meta property='name' content='modelviewer' /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                        // "<meta name=\x22monetization\x22 content=\x22"+process.env.COIL_PAYMENT_POINTER+"\x22>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +                        
                        "<link href=\x22https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        // "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" + 
                        // "<link href=\x22https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css\x22 rel=\x22stylesheet\x22 integrity=\x22sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN\x22 crossorigin=\x22anonymous\x22></link>"+
                        "<link href=\x22https://cdn.jsdelivr.net/npm/bootswatch@5.3.1/dist/"+styleTheme.toLowerCase()+"/bootstrap.min.css\x22 rel=\x22stylesheet\x22 crossorigin=\x22anonymous\x22></link>"+
                        "<script src=\x22https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js\x22 integrity=\x22sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL\x22 crossorigin=\x22anonymous\x22></script>"+                       
                        
                        "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                        "<script src=\x22../main/js/dialogs.js\x22></script>" +
                        
                        "<script src=\x22/connect/connect.js\x22 defer=\x22defer\x22></script>" +
                        "<style> audio {"+
                                "filter: sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(92%);"+ 
                                "width: 100%;"+
                                "height: 66px;"+
                            "}"+
                        "</style>"+ 
                       
                        "</head>\n" +
                        "<body "+bgstyle+">" +
                      
                        "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                        "<div id=\x22token\x22 data-token=\x22"+token+"\x22></div>\n"+
                        settingsData +
                      
                        "<div class=\x22container px-4 px-lg-5 my-5\x22>"+
                            "<div class=\x22row gx-4 gx-lg-5 align-items-center\x22>"+
                                "<div class=\x22col-md-6\x22>"+
                                "<a href=\x22../webxr/"+ sceneResponse.short_id + "\x22>" +
                                "<img class=\x22img-fluid\x22 src=\x22"+postcardImages[0]+"\x22 alt=\x22...\x22 /></a>"+
                                audioHtml +
                                // "<img class=\x22card-img-top mb-5 mb-md-0\x22 src=\x22"+postcard1+"\x22 alt=\x22...\x22 />"+
                                "<p class=\x22lead\x22>"+sceneResponse.sceneDescription+"</p>"+
                               
                                        // "<p class=\x22lead\x22>"+sceneResponse.sceneText+"</p>"+                      
                               
                                "</div>"+
                                "<div class=\x22col-md-6\x22>"+
                                
                                    "<div class=\x22small mb-1\x22>"+sceneResponse.sceneKeynote+"</div>"+
                                    "<h1 class=\x22display-5 fw-bolder\x22>"+sceneResponse.sceneTitle+"</h1>"+
                                    "<div class=\x22fs-5 mb-5\x22>"+
                                       
                                    "<p class=\x22lead\x22>"+sceneAccess+"</p>"+
                                    
                                        "<p class=\x22lead\x22>"+sceneGreeting+"</p>"+ 
                                        
                                        "<p class=\x22lead\x22>"+sceneQuest+"</p>"+
                                        // "<span>"+sceneQuest+"</span>"+

                                    platformButtons +
                                    sceneEditButton + 
                                    "</div>"+
                                   
                                    "<div class=\x22d-flex\x22>"+
                                        // "<input class=\x22form-control text-center me-3\x22 id=\x22inputQuantity\x22 type=\x22num\x22 value=\x221\x22 style=\x22max-width: 3rem\x22 />"+
                                            // "<button class=\x22btn btn-outline-dark flex-shrink-0\x22 type=\x22button\x22>"+
                                            //     "<i class=\x22bi-cart-fill me-1\x22></i>"+
                                            //     "Add to cart"+
                                            // "</button>"+
                                            "<a href=\x22http://"+ sceneResponse.sceneDomain + "\x22>More at "+sceneResponse.sceneDomain+"!</a>" +

                                    "</div>"+
                                "</div>"+
                            "</div>"+
                            "<div class=\x22row gx-4 gx-lg-5 align-items-center\x22>"+
                                "<div class=\x22col-md-12\x22>"+
                                "<hr>"+
                                
                                "<p class=\x22lead\x22>"+sceneResponse.sceneText+"</p>"+
                                "</div>"+
                            "</div>"+
                            "<div class=\x22row gx-4 gx-lg-5 align-items-center\x22>"+
                                "<div id=\x22picGroupsContainer\x22 class=\x22col-md-12\x22>"+
                                // picGroups +
                                "</div>"+
                            "</div>"+
                            "<div class=\x22row gx-4 gx-lg-5 align-items-center\x22>"+
                                "<div class=\x22col-md-12\x22>"+
                                availableScenesHTML +
                                "</div>"+
                            "</div>"+
                        "</div>"+
                        pictureGroupsData +
                        
                       
                        
                        "</body>\n" +
                      
                        "</html>";
                                          
                    } 
                    callback(null);
                }
            
            ], 
            function (err, result) { // #last function, close async
                if (err != null) {
                    if (!accessScene) {
                        let noAccessHTML = "<html xmlns='http://www.w3.org/1999/xhtml'>" +
                        "<head> " +
                        // "<link href=\x22css/sb-admin-2.css\x22 rel=\x22stylesheet\x22>" +
                        "<style>"+
                        "body {background-color: #36393d;}"+
                        "h1   {color: white;}"+
                        "a   {color: powderblue;}"+
                        "p    {color: white; font-family: sans-serif; font-size: 150%;}"+
                        "</style>"+
                        "</head> " +
                        "<p>Access to this scene is restricted.</p><p>Click here to <a href=\x22/landing/invitereq.html?rq="+sceneData.short_id+"\x22>request an invitation</a></p>" +
                        "<body> " +
                        "</body>" +

                        "</html>";
                        res.send(noAccessHTML);
                    } else {
                        res.send("error!! " + err);
                    }
                } else {
                    res.send(htmltext).end();
                    // res.end();
                    //console.log("webxr gen done: " + result);
                    }
                }      
        );
    
        } //intial sceneData request, condition on type
    }//end else if not redirected
    
});
///// END PRIMARY SERVERSIDE /webxr/ ROUTE //////////////////////


export default landing_router;
// module.exports = landing_router;