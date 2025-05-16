import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express");
const webxr_router = express.Router();
const entities = require("entities");
// const async = require('async'); ///goodbye to you my confusing friend...

const path = require("path");
const validator = require('validator');
const jwt = require("jsonwebtoken");
const requireText = require('require-text');

import { saveTraffic} from "../server.js";
import { RunDataQuery } from "../connect/database.js";
import { ReturnPresignedUrl } from "../connect/objectStore.js";

import { ObjectId } from "mongodb";

var minioClient = null;
if (process.env.MINIOKEY && process.env.MINIOKEY != "" && process.env.MINIOENDPOINT && process.env.MINIOENDPOINT != "") {
        const minio = require('minio');
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
    stringID = stringID.toString();
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
    
webxr_router.get("/test", function (req, res) {
    res.send("OK!");
});    

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

 
////////// test / example of aframe response
webxr_router.get('/simple_aframe', function (req, res) { 

    let response =
        "<!DOCTYPE html> <html lang=\x22en\x22>" +
        "<head>"+
        "<script src=\x22https://aframe.io/releases/1.7.1/aframe.min.js\x22></script>"+
        "</head>"+
        "<body>"+
            "<a-scene>"+
            "<a-box position=\x22-1 0.5 -3\x22 rotation=\x220 45 0\x22 color=\x22#4CC3D9\x22></a-box>"+
                "<a-sphere position=\x220 1.25 -5\x22 radius=\x221.25\x22 color=\x22#EF2D5E\x22></a-sphere>"+
                "<a-cylinder position=\x221 0.75 -3\x22 radius=\x220.5\x22 height=\x221.5\x22 color=\x22#FFC65D\x22></a-cylinder>"+
                "<a-plane position=\x220 0 -4\x22rotation=\x22-90 0 0\x22 width=\x224\x22 height=\x224\x22 color=\x22#7BC8A4\x22></a-plane>"+
                "<a-sky color=\x22#ECECEC\x22></a-sky>"+
            "</a-scene>"+
        "</body>"+
        "</html>";
    
        res.send(response);
    }
);

////////////////////PRIMARY /WEBXR ROUTE  e.g. /webxr/<short_id> ///////////////////
webxr_router.get('/:_id', function (req, res) { 
    
    var reqstring = entities.decodeHTML(req.params._id);
    console.log("NEW WEBXR SCENE REQUEST : " + reqstring);
    if (!reqstring || reqstring == undefined || reqstring == '') {
        return null;
    }
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedPictureGroups = [];
    let scenePictureItems = [];
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
    let objectAudioGroups = []; //audio groups attached to objex, not scene (i.e. primary, ambient, trigger)
    // let ambienturl = "";
    var mp3url = "";
    var oggurl = "";
    var pngurl = "";
    let ambientUrl = "";
    let triggerUrl = "";
    var vidUrl = "";
    var postcard1 = "";
    var image1url = "";
    var short_id = "";
    var picArray = [];
    var imageAssets = "";
    var modelAssets = "";
    var externalAssets = "";
    var externalEntities = "";
    var handEntities = "";
    var imageEntities = "";
    var skyboxUrl = "";
    var skyboxID = "";
    let skyboxIDs = [];
    let convertEquirectToCubemap = "";
    let skyboxAsset = "";
    var skySettings = "";
    var fogSettings = "";
    // var shadowLight = "";
    var hemiLight = "";
    var groundPlane = "";
    var ocean = "";
    let terrain = "";
    let enviroScripts = "";
    var cameraRigEntity = "";
    var oceanScript = "";
    var ARScript = "";
    var locationScripts = "";
    let geoScripts = "";
    var ARSceneArg = "";
    let AREntities = "";
    var debugMode = false;
    var ARMarker = "";
    var arMode = "position";
    
    var skyParticles;
    var videoAsset = "";
    var videoEntity = "";
    let youtubes = [];
    let mapOverlay = "";
    let canvasOverlay = "";
    let audioSliders = "";
    let screenOverlay = "";
    let adSquareOverlay = "";
    var nextSceneLink = "";
    var prevSceneLink = "";
    var loopable = "";
  
    var sceneGLTFLocations = [];
    var sceneModelLocations = [];
    var sceneObjectLocations = [];
    var sceneTextLocations = [];

    var sceneWeblinkLocations = [];
  
    var gltfsAssets = "";
    var gltfsEntities = "";
    let weblinkAssets = "";
    let weblinkEntities = "";
    let shaderScripts = "";
    // var gltfItems = [];
    var bucketFolder = "eloquentnoise.com";
    var playerPosition = "0 1.6 0";
    let playerPositions = [];
    var playerRotation = "0 0 0";
    let aframeEnvironment = "";
    let ambientLight = "";
    let htmltext = "";
    let styleIncludes = "";
    let synthScripts = "";
    let streamPrimaryAudio = false;
    let audioControl = "<script type=\x22module\x22 src=\x22../main/src/component/audio_control.js\x22></script>";
    let primaryAudioScript = "";
    let primaryAudioParams = "";
    let primaryAudioEntity = "";
    let ambientAudioEntity = "";
    let ambientAudioScript = "";
    let triggerAudioScript = "";
    let triggerAudioEntity = "";
    let pAudioWaveform = "";
    let networkedscene = "";
    let socketHost = process.env.SOCKET_HOST;
    let avatarName = "guest";
    let textLocation = "";
    let picturegroupLocation = "-15 2 -10";
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
    let curveEntities = "";
    let extraEntities = ""; //matrix.org comms
    let lightEntities = "";
    let placeholderEntities = "";
    let proceduralEntities = "";
    let calloutEntities = "";
    let carLocation = "";
    let cameraEnvMap = "";
    // let cubeMapAsset = ""; //deprecated, all at runtime now..
    let contentUtils = "<script type=\x22module\x22 src=\x22../main/src/component/content-utils.js\x22 defer=\x22defer\x22></script>"; 
    let modObjex = "<script type=\x22module\x22 src=\x22../main/src/component/mod_objex.js\x22 defer=\x22defer\x22></script>"; 
    let modModels = "<script type=\x22module\x22 src=\x22../main/src/component/mod_models.js\x22 defer=\x22defer\x22></script>"; 
    let videosphereAsset = "";
    let webcamAsset = "";
    let textEntities = "";
    let attributionsTextEntity = "";
    let audioVizScript = "";
    let audioVizEntity = "";
    let trackLocation = false;
    let trackImage = false;
    let trackMarker = false;
    let joystickScript = "";
    let settingsData = "";
    let sceneTimedEventsData = "";
    let carScript = "";
    let networkingEntity = "";
    let locationEntity = "";
    let locationButton = "";
    let mapButtons = "";
    let mapStyleSelector = "";
    let dialogButton = "";
    let transportButtons = "";
    let sceneManglerButtons = "";
    let pool_target = "";
    let pool_launcher = "";
    let renderPanel = "";
    var assetNumber = 1;
    let sceneWebLinx = [];
    let attributions = [];
    let attributionsObject = {};
    let loadAttributions = "";
    let loadAudioEvents = "";
    let loadLocations = "";
    let loadUSDZ = "";
    let loadAvailableScenes = "";
    let availableScenesResponse = {};
    let availableScenesEntity = "";
    let pictureGroupsEntity = "";
    let pictureGroupsData = "";
    let scenePictureData = "";
    let sceneTextData = "";
   
    let videoGroupsEntity = "";
    let videoElements = "";
    let hlsScript = "";
    // let loadPictureGroups = "";
    let tilepicUrl = "";
   
    let isGuest = true;
    let socketScripts = "";
    let navmeshScripts = "";
    let threeDeeTextComponent = "";
    let hasSynth = false;
    let hasPrimaryAudio = false;
    let hasPrimaryAudioStream = false;
    let hasAmbientAudio = false;
    let ambientOggUrl = "";
    let ambientMp3Url = "";
    let triggerOggUrl = "";
    let triggerMp3Url = "";
    let hasTriggerAudio = true;
    let wasd = "";
    let sceneData = "";
    let nftIDs = "";
    let sceneBackground = " background ";
    let skyboxEnvMap = "";
    let geoEntities = "";
    let geoEntity = 'geo-location'; //may be set to "gps-entity-place" for arjs locationing
    let usdzModel = "";
    let gltfModel = "";
    let cameraScripts = "";
    let containers = "";
    let navmeshAsset = "";
    let navmeshEntity = "";
    let surfaceEntity = "";
    let showTransport = false;
    let useNavmesh = false;
    let useSimpleNavmesh = false;
    let useStarterKit = false;  //load the libs as from https://github.com/AdaRoseCannon/aframe-xr-boilerplate - movement controls, simple navmesh, handy work, physx etc.
    let useSuperHands = false;  //or instead load the superhands stuff https://github.com/c-frame/aframe-super-hands-component
    let usePhysicsType = "none";
    let showDialog = false;
    let showSceneManglerButtons = false;
    let ethereumButton = "";
    let cameraLockButton = "";
    let youtubeContent = "";
    let youtubeEntity = "";
    let instancingEntity = "";
    let meshUtilsScript = "<script type=\x22module\x22 src=\x22../main/src/component/mesh-utils.js\x22 defer=\x22defer\x22></script>";
    let physicsScripts = "";
    let blinkScript = "<script type=\x22module\x22 src=\x22../main/vendor/aframe/aframe-blink-controls.min.js\x22></script>"
    let brownianScript = "";
    let aframeExtrasScript = "<script type=\x22module\x22 src=\x22https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.5.4/dist/aframe-extras.min.js\x22 defer=\x22defer\x22></script>";
    let logScripts = "";
    let enviromentScript = ""; //for aframe env component
    let aframeScript = "<script src=\x22https://aframe.io/releases/1.7.1/aframe.min.js\x22></script>";
    let threejsVersion = "173";
    let surfaceScatterScript = "";
    let locationData = "";
    let modelData = "";
    let objectData = "";
    let inventoryData = "";
    let joystickContainer  = "";
    let arImageTargets = [];
    let arChildElements = "";
    let useArParent = false;
    let sceneUnityWebDomain = "http://smxr.net";
    let activityPubScripts = "";

    let xrmode =  "xr-mode-ui=\x22XRMode: xr\x22";

    let importMap = "<script type=\x22importmap\x22> {\x22imports\x22: {" + //TODO use new aframe module, and externalize this !!!!!!!
                            //still causes duplicate engine loading, but...
                        "\x22three\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.173.4/build/three.module.js\x22,"+
                        "\x22three/addons/\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.173.4/examples/jsm/\x22"+                
                    
                        "}"+
                    "}</script>";
    (async () => {
        try {

            const scenequery = {"short_id": reqstring};
            let sceneData = await RunDataQuery("scenes", "findOne", scenequery);

            // console.log("sceneData is " + sceneData._id);
            if (!sceneData) {
                throw ("scene not found!");
            }
            let accessScene = true;
            //TODO conditional on ?
            saveTraffic(req, sceneData.sceneDomain, sceneData.short_id);

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
            let pin = req.query.p;
            if (pin != null) {  //old unity thing, I don't know if its...
                console.log('gotsa pin : ' + pin); 
                var timestamp = Math.round(Date.now() / 1000);
                var pinquery = {$and: [{pin : pin}, {validated : true}, {accessTimeWindow: {$gt : timestamp}}, {pinTimeout: {$gt: timestamp}}]}; 
                console.log('pin query ' + JSON.stringify(pinquery));
                const invquery = {$and: [{sentToEmail : req.body.email}, {validated : true} ]};
                const invitation = await RunDataQuery("invitations", "find", invquery);
                accessScene = true;
                avatarName = invitation.sentToEmail.toString().split('@')[0];
                console.log("pin checks out!!");
                let action = {};
                action.invitationSceneAccess = (timestamp * 1000) + "_" + invitation._id + "_" + invitation.invitedToSceneShortID;
                const pquery = {"_id": ObjectId.createFromHexString(invitation.sentToPersonID)};
                const updoc = {$addToSet: {activities: action}};
                const updated = await RunDataQuery("people", "updateOne", pquery, updoc);
                console.log("updated person with valid invitation " + JSON.stringify(updated));
            } 
            // if (!accessScene) { //catch it at the end...?
            //     res.end("you are not authorized to view this resource...");
            // } 
            if (sceneData.sceneTags != null) {        
                for (let i = 0; i < sceneData.sceneTags.length; i++) { //not ideal, but it's temporary... //no it isn't
                    if (sceneData.sceneTags[i].toLowerCase().includes("show camera")) {
                        sceneResponse.showCameraIcon = true;
                    } else {
                        sceneResponse.showCameraIcon = false;
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("debug")) {   
                        debugMode = true;
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("ar parent") || sceneData.sceneTags[i].toLowerCase().includes("arparent")) {   
                        useArParent = true;
                    } 
                    if (sceneData.sceneTags[i].toLowerCase().includes("webcam")) {
                        webcamAsset = "<video id=\x22webcam\x22 src=\x22''\x22 playsinline></video>";
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("physics")) { 
                        usePhysicsType = "ammo";
                        physicsScripts =  "<script src=\x22https://cdn.jsdelivr.net/gh/MozillaReality/ammo.js@8bbc0ea/builds/ammo.wasm.js\x22></script>"+
                        "<script src=\x22../main/vendor/aframe/aframe-physics-system.min.js\x22></script>";     
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("brownian")) {
                        brownianScript =  "<script type=\x22module\x22 src=\x22../main/src/component/aframe-brownian-motion.js\x22></script>";
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("instancing")) {
                        meshUtilsScript = "<script type=\x22module\x22 src=\x22../main/src/component/mesh-utils.js\x22></script>"; //imports MeshSurfaceScatter
                        instancingEntity = "";
                    } 
                    if (sceneData.sceneTags[i].toLowerCase().includes("grid effects" )) {
                        meshUtilsScript = meshUtilsScript + "<script src=\x22../main/src/shaders/grid_shaders.js\x22></script><script src=\x22../main/src/component/grid_effects.js\x22></script>"; //imports MeshSurfaceScatter
                    } 
                    if (sceneData.sceneTags[i] == "show transport") {
                        showTransport = true;
                    }
                    if (sceneData.sceneTags[i] == "show dialog") {
                        showDialog = true;
                    }
                    if (sceneData.sceneTags[i] == "show buttons") {
                        showSceneManglerButtons = true;
                    }
                    if (sceneData.sceneTags[i] == "use navmesh") {
                        console.log("GOTS USENAVMESH TAG: " + sceneData.sceneTags[i]);
                        useNavmesh = true;
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("simplenav") || sceneData.sceneTags[i].toLowerCase().includes("simple navmesh")) {
                        console.log("GOTS SimpleNavmesh TAG: " + sceneData.sceneTags[i]);
                        useSimpleNavmesh = true;
                    } else if (sceneData.sceneTags[i].toLowerCase().includes("navmesh")) {
                        console.log("GOTS USENAVMESH TAG: " + sceneData.sceneTags[i]);
                        useNavmesh = true;
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("ammo test")) {
                        externalEntities = externalEntities + requireText('../main/includes/ammoTestEntities.html', require);
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("ammo no nav")) {
                        externalEntities = externalEntities + requireText('../main/includes/ammoTestEntities2.html', require);
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("cannon test")) {
                        externalEntities = externalEntities + requireText('../main/includes/cannonTestEntities.html', require);
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("physx test")) {
                        externalEntities = externalEntities + requireText('../main/includes/physxTestEntities.html', require);
                    }
                    if (sceneData.sceneTags[i] == "show ethereum") {
                        ethereumButton = "<div class=\x22ethereum_button\x22 id=\x22ethereumButton\x22 style=\x22margin: 10px 10px;\x22><i class=\x22fab fa-ethereum fa-2x\x22></i></div>";
                    }
                    if (sceneData.sceneTags[i] == "show camera lock") {
                        cameraLockButton = "<div class=\x22camlock_button_locked\x22 id=\x22camLockToggleButton\x22 style=\x22margin: 10px 10px;\x22><i class=\x22fa-solid fa-lock fa-2x\x22></i></div>";
                    }
                    if (sceneData.sceneTags[i].includes("synth")) {
                        synthScripts = "<script src=\x22../main/src/synth/Tone.js\x22></script><script src=\x22../main/js/synth.js\x22></script>";
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("aframe 1.6")) {
                        aframeScript = "<script src=\x22https://aframe.io/releases/1.6.0/aframe.min.js\x22></script>";
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("aframe master")) {
                        // aframeScript = "<script src=\x22https://cdn.jsdelivr.net/gh/aframevr/aframe@744e2b869e281f840cff7d9cb02e95750ce90920/dist/aframe-master.min.js\x22></script>"; //ref 20220715// nope!
                        aframeScript = "<script src=\x22https://cdn.jsdelivr.net/gh/aframevr/aframe@388a47f384feccad2b0d38985f67c441222388e2/dist/aframe-master.min.js\x22></script>"; //ref 20231103 (integrated hands!)
                        threejsVersion = "173";
                    }
                    if (sceneData.sceneTags[i].toLowerCase().includes("webgpu")) {
                        aframeScript = "";
                       importMap = "<script type=\x22importmap\x22> {\x22imports\x22: {" + 
                            
                            "\x22aframe\x22: \x22https://cdn.jsdelivr.net/npm/aframe@1.7.1/dist/aframe-master.module.min.js\x22,"+
                            "\x22three\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.176.0/build/three.webgpu.js\x22,"+
                            "\x22three/webgpu\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.176.0/build/three.webgpu.js\x22,"+
                            "\x22three/tsl\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.176.0/build/three.tsl.js\x22,"+
                            "\x22three/addons/\x22: \x22https://cdn.jsdelivr.net/npm/super-three@0.176.0/examples/jsm/\x22"+                
                        
                            "}"+
                        "}</script>"+
                        "<script type=\x22module\x22>import AFRAME from 'aframe';import THREE from 'three';"+
                                                    "import { color, cos, float, mix, range, sin, time, uniform, uv, vec3, vec4, PI2 } from 'three/tsl';"+
                        "</script>";
                        
                    }
                    
                }
            }
            if (socketHost != null && socketHost != "NONE") {
                if (sceneData.sceneNetworking == "SocketIO") {
                    socketScripts = "<script src=\x22/socket.io/socket.io.js\x22></script>"; //TODO naf, etc..
                } else if (sceneData.sceneNetworking == "WebRTC") {
                    socketScripts = "<script src=\x22https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js\x22></script>";
                }
            }
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
                const query = {name: "nameArrays"};
                const items = await RunDataQuery("lexicons", "findOne", query);
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
            }
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
                    console.log("scenePIcture " + picture + sceneResponse.sceneTags);
                    
                    var p_id = ObjectId.createFromHexString(picture.toString()); //convert to binary to search by _id beloiw
                    requestedPictureItems.push(p_id); //populate array //hrm, unused atm...

                });//includes
            }
            if ((sceneResponse.sceneTags && sceneResponse.sceneTags != undefined && sceneResponse.sceneTags != "null" && sceneResponse.sceneTags.includes("debug")) || sceneResponse.sceneDebugMode != null && sceneResponse.sceneDebugMode != undefined && sceneResponse.sceneDebugMode != "") {
                debugMode = true;
            }
            
            if (sceneResponse.sceneYouTubeIDs != null && sceneResponse.sceneYouTubeIDs.length > 0) {
                youtubes = sceneResponse.sceneYouTubeIDs;
            }
            ////LOCATION FU
            if (sceneResponse.sceneLocations != null) {
                for (var i = 0; i < sceneResponse.sceneLocations.length; i++) {       
                    
                    if (sceneResponse.sceneLocations[i].eventData == null || sceneResponse.sceneLocations[i].eventData == undefined || sceneResponse.sceneLocations[i].eventData == "undefined") { //old scenes...
                        sceneResponse.sceneLocations[i].eventData = "";
                    }                  
                    if (sceneResponse.sceneLocations[i].tags == null || sceneResponse.sceneLocations[i].tags == undefined || sceneResponse.sceneLocations[i].tags == "undefined") { //old scenes...
                        sceneResponse.sceneLocations[i].tags = [];
                    }
                    if (sceneResponse.sceneLocations[i].locationTags == null || sceneResponse.sceneLocations[i].locationTags == undefined || sceneResponse.sceneLocations[i].locationTags == "undefined") { //old scenes...
                        sceneResponse.sceneLocations[i].locationTags = [];
                    }

                    // console.log("sceneResponse.sceneLocations[i].eventData "+ sceneResponse.sceneLocations[i].eventData);
                    if ((sceneResponse.sceneLocationTracking != null && sceneResponse.sceneLocationTracking == true) || sceneResponse.sceneWebType == "AR Location Tracking") {  
                        if (sceneResponse.sceneLocations[i].type.toLowerCase() == "geographic") { //just to set scripts and restrict to location
                            if (sceneResponse.sceneWebType == "AR Location Tracking") {
                                if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4 && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes("restrict")) {
                                    locationEntity = "<a-entity id=\x22youAreHere\x22 location_restrict_ar position=\x220 2 -5\x22>"+
                                        "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                                        "</a-entity>"+
                                    "</a-entity>";
                                    locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 ><i class=\x22fas fa-globe fa-2x\x22></i></div>";
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
                                console.log("sceneResponse.sceneLocations[i].eventData : " + sceneResponse.sceneLocations[i].eventData);
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
                    let zFix = parseFloat(sceneResponse.sceneLocations[i].z); //does nothing    
                    
                    if (sceneResponse.sceneLocations[i].objectID != undefined && sceneResponse.sceneLocations[i].markerType != "spawn" && //spawn type not loaded until spawn event
                        sceneResponse.sceneLocations[i].objectID != "none" && sceneResponse.sceneLocations[i].objectID.length > 8) { //attaching object to location 
                        sceneObjectLocations.push(sceneResponse.sceneLocations[i]);
                    }
                    if (sceneResponse.sceneLocations[i].model != undefined && sceneResponse.sceneLocations[i].model != "none" && sceneResponse.sceneLocations[i].model) { //new way of attaching gltf to location w/out object
                        sceneModelLocations.push(sceneResponse.sceneLocations[i]);
                    } 
                    if (sceneResponse.sceneLocations[i].model == "none" || sceneResponse.sceneLocations[i].model == null) {
                        if (sceneResponse.sceneLocations[i].markerType == "navmesh") { 
                            console.log("PUSSHING A CANNED NAVMESH!");
                            sceneModelLocations.push(sceneResponse.sceneLocations[i]); // if no model will set a primitive default below
                        }
                        if (sceneResponse.sceneLocations[i].markerType == "surface") { 
                            console.log("PUSSHING A CANNED SURFACE!");
                            sceneModelLocations.push(sceneResponse.sceneLocations[i]); // if no model will set a primitive default below
                        }
                    }
                    
                    if (sceneResponse.sceneLocations[i].markerType != undefined && sceneResponse.sceneLocations[i].markerType == "dataviz") { 
                        if (sceneResponse.sceneLocations[i].locationTags.includes("traffic")) {
                            
                        }
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "model" && sceneResponse.sceneLocations[i].modelID == "none") {
                            
                        sceneResponse.sceneLocations[i].markerType = "placeholder";
                        console.log("Switching markertype from model to placeholder!@");
                    }
                    if (sceneResponse.sceneLocations[i].markerType != undefined && sceneResponse.sceneLocations[i].type.toLowerCase() != 'geographic') { //cloudmarkers, special type allows local mods
                        // console.log(JSON.stringify(sceneResponse.sceneLocations[i]));
                        if (//sceneResponse.sceneLocations[i].markerType.toLowerCase() == "none" 
                            sceneResponse.sceneLocations[i].markerType.toLowerCase() == "placeholder" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase().includes("trigger") 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase().includes("collider") 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "poi" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "gate"
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "portal"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "waypoint" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "player"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "spawn"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "3D text" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "text" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "light"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "link"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "dataviz" 
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "picture"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "picture group"
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "audio"
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "curve"    
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "curve point"  
                            || sceneResponse.sceneLocations[i].markerType.toLowerCase() == "mailbox") {
                            
                            let tLoc = sceneResponse.sceneLocations[i];
                            tLoc.phID = sceneResponse.sceneLocations[i].timestamp; //just use location timestamp, ditch the "*_marker" stuff...
                            if (!tLoc.markerObjScale) {
                                tLoc.markerObjScale = 1;
                            }
                            locationPlaceholders.push(tLoc);
                        }
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "3D text") { //unused
                        threeDeeTextComponent = "<script src=\x22../main/src/component/aframe-text-geometry-component.min.js\x22></script>"; //TODO - these must all be arrays, like sceneModelLocations above!
                        externalAssets = externalAssets + "<a-asset-item id=\x22optimerBoldFont\x22 src=\x22https://rawgit.com/mrdoob/three.js/dev/examples/fonts/optimer_bold.typeface.json\x22></a-asset-item>";
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "player") {
                        playerPosition = sceneResponse.sceneLocations[i].x + " " +  sceneResponse.sceneLocations[i].y + " " +  sceneResponse.sceneLocations[i].z;
                        if (sceneResponse.sceneLocations[i].eulerx && sceneResponse.sceneLocations[i].eulery && sceneResponse.sceneLocations[i].eulerz) {
                            playerRotation = sceneResponse.sceneLocations[i].eulerx + " " + sceneResponse.sceneLocations[i].eulery + " " + sceneResponse.sceneLocations[i].eulerz;
                        }
                        playerPositions.push(playerPosition);
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "text") {
                        if (sceneResponse.sceneLocations[i].locationTags && sceneResponse.sceneLocations[i].locationTags.includes("main")) {
                           textLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix; //single location that will use main text
                        } else if (sceneResponse.sceneLocations[i].mediaID && sceneResponse.sceneLocations[i].mediaID.length > 4) {
                            console.log("text mediaID is " + sceneResponse.sceneLocations[i].mediaID);
                        }
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
                                console.log("tryna attach video to target!");
                                videoParent = "parent-to=\x22tracking: target\x22";
                            }
                            if (sceneResponse.sceneLocations[i].eventData.includes("marker")) {
                                console.log("tryna attach video to marker!");
                                videoParent = "parent-to=\x22tracking: marker\x22";
                            }
                            if (sceneResponse.sceneLocations[i].eventData.includes("image")) {
                                console.log("tryna attach video to image target!");
                                videoParent = "parent-to=\x22tracking: image\x22";
                            }
                            if (sceneResponse.sceneLocations[i].eventData.includes("fixed")) { //by default it's billboarding
                                videoParent = "";
                            }
                        }
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "youtube") {
                        videoLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                        if (sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined && sceneResponse.sceneLocations[i].eulerx != undefined) {
                            videoRotation = sceneResponse.sceneLocations[i].eulerx + " " + sceneResponse.sceneLocations[i].eulery + " " + sceneResponse.sceneLocations[i].eulerz;
                        }
                        
                        if (youtubes.length > 0) {
                            containers = containers + "<div class=\x22youtube\x22 id=\x22"+sceneResponse.sceneLocations[i].eventData+"\x22 data-location-id=\x22"+sceneResponse.sceneLocations[i].id+"\x22 data-attribute=\x22"+youtubes[0].toString()+"\x22></div>"; 
                        }

                    }
                    if (sceneResponse.sceneLocations[i].markerType == "car") {
                        carLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "picture group") {

                        if (sceneResponse.sceneLocations[i].tags && 
                            (sceneResponse.sceneLocations[i].tags.includes("camera") ||  
                            sceneResponse.sceneLocations[i].tags.includes("default") ||
                            sceneResponse.sceneLocations[i].tags.includes("icon")
                            )) {
                            sceneResponse.showCameraIcon = true;
                            picturegroupLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix;
                            console.log("gotsa picture geroup " + picturegroupLocation);
                        }
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
                    if (sceneResponse.sceneLocations[i].markerType == "weblink") {
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
                        console.log("pictureLocation is: " + JSON.stringify(pictureLocation));
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
                        // let tunnelOrigin = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                        let tunnelOrientation = "horizontal";
                        if (sceneResponse.sceneLocations[i].eulery && sceneResponse.sceneLocations[i].eulery.toString() == "90") {
                            tunnelOrientation = "vertical";
                        } 
                        if (sceneResponse.sceneLocations[i].eulerz && sceneResponse.sceneLocations[i].eulerz.toString() == "90") {
                            tunnelOrientation = "sideways";
                        } 
                        if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('scroll y')) {
                            scrollDirection = 'y';
                        }
                        if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('scroll -y')) {
                            scrollDirection = '-y';
                        }
                        if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('scroll -x')) {
                            scrollDirection = '-x';
                        }
                        if (sceneResponse.sceneLocations[i].eventData && sceneResponse.sceneLocations[i].eventData.toLowerCase().includes('speed')) {
                            const speedSplit = sceneResponse.sceneLocations[i].eventData.toLowerCase().split('~');
                            if (speedSplit.length > 1) {
                                scrollSpeed = speedSplit[1];
                            } else {
                                scrollSpeed = .001;
                            }   
                        }
                        proceduralEntities = proceduralEntities + "<a-entity mod_tunnel=\x22init: true; tunnelOrientation: "+tunnelOrientation+"; tunnelOriginZ: "+sceneResponse.sceneLocations[i].z+"; tunnelOriginY: "+sceneResponse.sceneLocations[i].y+"; tunnelOriginX: "+sceneResponse.sceneLocations[i].x+"; scrollDirection: "+scrollDirection+"; scrollSpeed: "+scrollSpeed+"\x22></a-entity>";
                    }
                    let scale = 1;
                    if (sceneResponse.sceneLocations[i].markerObjScale && sceneResponse.sceneLocations[i].markerObjScale != undefined && sceneResponse.sceneLocations[i].markerObjScale != "" && sceneResponse.sceneLocations[i].markerObjScale != 0) {
                        scale = sceneResponse.sceneLocations[i].markerObjScale;
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "svg canvas fixed") {
                        sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                        proceduralEntities = proceduralEntities + " <a-plane loadsvg=\x22description: "+sceneResponse.sceneLocations[i].description+"; eventdata: "+sceneResponse.sceneLocations[i].eventData+"; tags:  "+sceneResponse.sceneLocations[i].locationTags+"\x22 id=\x22svg_"+sceneResponse.sceneLocations[i].timestamp+
                        "\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + zFix+"\x22></a-plane>";
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "svg canvas billboard") {
                        sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "text") {
                        sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                    }
                    if (sceneResponse.sceneLocations[i].markerType == "svg fixed") {
                        sceneTextLocations.push(sceneResponse.sceneLocations[i]);

                    }
                    if (sceneResponse.sceneLocations[i].markerType == "svg billboard") {
                        sceneTextLocations.push(sceneResponse.sceneLocations[i]);
                    }
                    // console.log(JSON.stringify(sceneResponse.sceneLocations[i]));
                } //end location loop
                // console.log("sceneResponse " + JSON.stringify(sceneResponse));
                var buff = Buffer.from(JSON.stringify(sceneResponse.sceneLocations)).toString("base64");
                loadLocations = "<a-entity location_data id=\x22locationData\x22 data-locations='"+buff+"'></a-entity>";
            } else {
                var buff = Buffer.from(JSON.stringify([])).toString("base64");
                loadLocations = "<a-entity location_data id=\x22locationData\x22 data-locations='"+buff+"'></a-entity>";
            } //end locations

            ///scene types/////////
            if (sceneData.sceneWebType == 'AR Location Tracking') {

                geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>";
                ARScript = "<script src=\x22https://raw.githack.com/MediaComem/LBAR.js/main/dist/lbar-v0.2.min.js\x22></script>";
                locationScripts = "<script src=\x22../main/src/component/location-fu.js\x22></script>";
                // locationScripts = "<script>window.onload = () => { navigator.geolocation.getCurrentPosition((position) => {"+ //put this where?
                // "document.querySelector('a-text').setAttribute('"+geoEntity+"', `latitude: ${position.coords.latitude}; longitude: ${position.coords.longitude};`)});}</script>";
                ARSceneArg = "gps-position webxr=\x22referenceSpaceType: unbounded; requiredFeatures: unbounded;\x22 xr-mode-ui=\x22enabled: false\x22 arjs=\x22sourceType: webcam; debugUIEnabled: false;\x22";
                cameraRigEntity = "<a-entity id=\x22player\x22 position=\x220 0 0\x22 camera pitch-roll-look-controls>"+ 
                    "<a-entity class=\x22hiddenPlaceholders\x22 id=\x22equipPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 -.5 -.65\x22"+ //these seemed to need actual geometry to get a worldspace loc
                    "material=\x22opacity: 0\x22></a-entity>"+
                    "<a-entity class=\x22hiddenPlaceholders\x22 id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -1\x22"+
                    "material=\x22opacity: 0\x22></a-entity>"+
                    "<a-entity class=\x22hiddenPlaceholders\x22 id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                    "material=\x22opacity: 0\x22></a-entity>"+
                "</a-entity>";
                locationEntity = "<a-entity id=\x22youAreHere\x22 location_init_ar position=\x220 2 -5\x22>"+
                    "<a-entity class=\x22gltf\x22 gltf-model=\x22#globe\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1.5 0\x22>"+
                    "</a-entity>"+
                "</a-entity>";
                locationButton = "<div style=\x22float: right; margin: 10px 10px;\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                            
            } else if (sceneData.sceneWebType == 'Mapbox') { 
                
                dialogButton = "<div id=\x22dialog_button\x22 class=\x22dialog_button\x22 style=\x22float: left; margin: 10px 10px; width: 50px; height: 50px\x22 ><i class=\x22fas fa-info-circle fa-2x\x22></i></div>";
                locationButton = "<div id=\x22loc_button\x22 class=\x22dialog_button\x22 style=\x22float: left; margin: 10px 10px; width: 50px; height: 50px\x22 onclick=\x22ShowHideGeoPanel()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                if (!sceneData.sceneTextUseModals) {
                    //renderPanel = "<a-entity visible=\x22false\x22 render_canvas id=\x22renderCanvas\x22 look-at=\x22#player\x22 geometry=\x22primitive: plane; width:1; height:1;\x22 scale=\x221 1 1\x22 position=\x220 3.5 -.25\x22 material=\x22shader: html; transparent: true; width:1024; height:1024; fps: 10; target: #renderPanel;\x22></a-entity>\n";
                }
                transportButtons = "<div class=\x22transport_buttons\x22><div class=\x22previous_button\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22PreviousButton()\x22><i class=\x22fas fa-step-backward fa-2x\x22></i></div>"+
                "<div class=\x22transport_play_button\x22 style=\x22float: left; margin: 10px 10px;\x22 ><i class=\x22fas fa-play-circle fa-2x\x22></i></div>" +
                // "<div visible=\x22false\x22 class=\x22pause_button\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22PauseButton()\x22><i class=\x22fas fa-pause-circle fa-2x\x22></i></div>" +

                "<div class=\x22next_button\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22NextButton()\x22><i class=\x22fas fa-step-forward fa-2x\x22></i></div></div>";
                geoScripts = "<script async src=\x22https://get.geojs.io/v1/ip/geo.js\x22></script><script src=\x22/main/js/geolocator.js\x22></script>" +
                
                // "<script src=\x22https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js\x22></script>"+
                // "<link href=\x22https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css\x22 rel=\x22stylesheet\x22/>";
                "<script src=\x22https://api.mapbox.com/mapbox-gl-js/v3.0.0-beta.1/mapbox-gl.js\x22></script>"+
                "<link href=\x22https://api.mapbox.com/mapbox-gl-js/v3.0.0-beta.1/mapbox-gl.css\x22 rel=\x22stylesheet\x22/>";

                locationScripts = "<script src=\x22../main/src/component/location-fu.js\x22></script>";
                
                cameraRigEntity = "<a-camera id=\x22player\x22 look-controls-enabled=\x22false\x22 listen-from-camera gps-camera rotation-reader><a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
                // "<a-entity id=\x22player\x22 networked=\x22template:#avatar-template;attachTemplateToLocal:false;\x22 spawn-in-circle=\x22radius:3;\x22>" + //ENABLE LATER
                        "</a-camera>";
                let doBuildings = false;
                let doTerrain = false;        
                if (sceneData.sceneTags != null && sceneData.sceneTags.includes("buildings")) {
                    doBuildings = true;
                } 
                if (sceneData.sceneTags != null && sceneData.sceneTags.includes("terrain")) {
                    doTerrain = true;
                }
                locationEntity = "<a-entity id=\x22youAreHere\x22 location_init_mapbox=\x22zoomLevel: "+sceneData.sceneMapZoom+"; doBuildings: "+doBuildings+"; doTerrain: "+doTerrain+"; mbid: "+process.env.MAPBOX_KEY+";\x22 position=\x220 2 -5\x22>"+
                "</a-entity>";
            
                mapButtons = "<div id=\x22button_left_1\x22 style=\x22float: left; margin: 10px 10px;\x22 class=\x22\x22 onclick=\x22ToggleDragPan()\x22><i class=\x22fas fa-level-down-alt fa-2x\x22></i></div>"+
                "<div id=\x22button_left_2\x22 class=\x22\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22ZoomOut()\x22 class=\x22tooltip\x22><i class=\x22fas fa-search-minus  fa-2x\x22></i><span class=\x22tooltiptext\x22></span></div>"+
                "<div id=\x22button_left_3\x22 class=\x22\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22ZoomIn()\x22 class=\x22tooltip\x22><i class=\x22fas fa-search-plus fa-2x\x22></i><span class=\x22tooltiptext\x22></span></div>" +
                "<div id=\x22button_left_4\x22 class=\x22\x22 style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22RotateCamera(0)\x22 class=\x22tooltip\x22><i class=\x22fas fa-sync-alt fa-2x\x22></i><span class=\x22tooltiptext\x22></span></div>";
                
                mapStyleSelector = "<div id=\x22button_left_5\x22 class=\x22\x22>" +   
                    "<select id=\x22mapStyle\x22>" +
                        "<option value=\x22\x22 selected>Select Map Style:</option>" +
                            "<option>Satellite</option>" +
                            "<option>Terrain</option>" +
                            "<option>Dark</option>" +
                            "<option>Light</option>" +
                    "</select>" +
                "</div>";
            } else { //"sceneWebType == "Default or AFrame"
                                
                joystickContainer = "<div id=\x22joystickContainer\x22 class=\x22JoystickRegionUI\x22 style=\x22z-index: 1000; visibility: hidden\x22>" + //initialized in navigation / content-utils
                "<div class=\x22JoystickButtonUI\x22 style=\x22width: 128px; opacity:0.50;\x22>" +
                    "<img src=\x22/css/joystick-base.png\x22/>" +
                    "<div id=\x22joystickEl\x22 style=\x22position: absolute; left:32px; top:32px;\x22>" +
                    "<img src=\x22/css/joystick-red.png\x22/>" +
                    "</div>" +
                    "</div>" +
                "</div>";
               
                wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: 5; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:.1;\x22";
                let physicsMod = "";
                
                if (useSimpleNavmesh) {
                    wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: 5; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:.1;\x22";                 
                } 
                
                if (physicsScripts.length > 0 && !useSuperHands && !useStarterKit) { //inject into player for collider
                    physicsMod = "geometry=\x22primitive: cylinder; height: 2; radius: 0.5;\x22 ammo-body=\x22type: kinematic;\x22 ammo-shape=\x22type: capsule\x22"                 
                }
                 if (physicsScripts.length > 0 && useNavmesh && !useSuperHands && !useStarterKit) {
                    physicsMod = "geometry=\x22primitive: cylinder; height: 2; radius: 0.5;\x22 ammo-body=\x22type: kinematic;\x22 ammo-shape=\x22type: capsule\x22";
                }

                transportButtons = "<div class=\x22transport_buttons\x22>"+

                "<div class=\x22next_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22NextButton()\x22><i class=\x22fas fa-step-forward fa-2x\x22></i></div>"+
                "<div class=\x22ffwd_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22FastForwardButton()\x22><i class=\x22fas fa-forward fa-2x\x22></i></div>"+
                "<div class=\x22play_button\x22 id=\x22transport_play_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 ><i class=\x22fas fa-play-circle fa-2x\x22></i></div>" +
                "<div class=\x22rewind_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22RewindButton()\x22><i class=\x22fas fa-backward fa-2x\x22></i></div>"+
                "<div class=\x22previous_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px;\x22 onclick=\x22PreviousButton()\x22><i class=\x22fas fa-step-backward fa-2x\x22></i></div>"+
                "<div id=\x22transportStats\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: right; margin: 5px 5px; text-align: left\x22></div></div>";                                

                dialogButton = "<div id=\x22dialog_button\x22 class=\x22dialog_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: left; margin: 10px 10px;\x22 ><i class=\x22fas fa-info-circle fa-2x\x22></i></div>";
               
                sceneManglerButtons = "<div class=\x22show-ui-button\x22 onclick=\x22ShowHideUI()\x22><i class=\x22far fa-eye fa-2x\x22></i></div>";
                if (!sceneResponse.sceneTextUseModals) {
                   // renderPanel = "<a-entity visible=\x22false\x22 render_canvas id=\x22renderCanvas\x22 look-at=\x22#player\x22 geometry=\x22primitive: plane; width:1; height:1;\x22 scale=\x221 1 1\x22 position=\x220 3.5 -.25\x22 material=\x22shader: html; transparent: true; width:1024; height:1024; fps: 10; target: #renderPanel;\x22></a-entity>\n";
                }
                if (sceneResponse.sceneFlyable) {
                    wasd = "extended_wasd_controls=\x22flyEnabled: true; moveSpeed: 4; inputType: keyboard\x22";
                }
               
                if (sceneResponse.sceneCameraMode == "Orbit") {
                    // joystickScript = "<script src=\x22../main/vendor/aframe/aframe-orbit-controls.min.js\x22></script>";
                    // joystickScript = "<script src=\x22../main/src/component/aframe-orbit-controls.min.js\x22></script>";
                    joystickScript = "<script src=\x22../main/vendor/aframe/aframe-orbit-controls.min.js\x22></script>";
                    
                    // wasd = "orbit-controls=\x22target: 0 0 0; minDistance: .5; maxDistance: 100; initialPosition: 0 1 -5; enableDamping: true;\x22";
                }
                if (sceneResponse.sceneCameraMode == "Fixed") {
                    joystickScript = "";
                    joystickContainer = "";
                    wasd = "";
                }
                if (sceneResponse.sceneCameraMode == "Fixed Rotate") {
                    joystickScript = "";
                    joystickContainer = "";
                    wasd = " rotate_player_camera ";
                }
              
                
                let spawnInCircle = "";
                if (sceneResponse.sceneNetworking != "None") {
                    spawnInCircle = "spawn-in-circle=\x22radius:3;\x22";
                }

                //AFRAME CAMERA
                let blinkMod = "blink-controls=\x22cameraRig: #cameraRig\x22";
                // sceneResponse.scenePlayer.playerHeight = 10;
                if (useSimpleNavmesh || useNavmesh) {
                    blinkMod = "blink-controls=\x22cameraRig: #cameraRig; collisionEntities: #nav-mesh;\x22"; //only one navmesh for now
                    wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:"+
                    sceneResponse.scenePlayer.playerHeight+"\x22";
                }
                console.log("sceneResponse.sceneTags " + sceneResponse.sceneTags);
                if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("webgpu")) {
                    blinkMod = "";
                    blinkScript = "";
                } 
                // if (useSimpleNavmesh) { //this lives in navigation.js
                //     //simple navmesh can use 
                //     wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:"+sceneResponse.scenePlayer.playerHeight+"\x22";
                //     // wasd = "wasd-controls=\x22fly: true; acceleration: 35\x22 ";
                    
                // } 
                // let follower = "";
                if (playerPositions.length) {
                    playerPosition = playerPositions[Math.floor(Math.random() * playerPositions.length)];
                }
                ////////////////////////// - THIRD PERSON CAMERA SETUP - //////////////////////////////
                console.log("sceneCameraMode " + sceneResponse.sceneCameraMode);
                if (sceneResponse.sceneCameraMode != null && sceneResponse.sceneCameraMode != undefined && sceneResponse.sceneCameraMode.toLowerCase().includes("third person")) {
                    let lookcontrols = "look-controls=\x22magicWindowTrackingEnabled: false; reverseTouchDrag: true\x22";
                    if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('magicwindow') || sceneResponse.sceneTags.includes('magic window'))) {
                        lookcontrols = "look-controls=\x22reverseTouchDrag: true\x22"; // because magicwinders enabled by default
                    }
                    // wasd = "wasd-controls=\x22fly: true; acceleration: "+sceneResponse.scenePlayer.playerSpeed+"\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:0;\x22";
                    // wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: 4; inputType: keyboard\x22";
                    // let navConstraint = "";
                    wasd = "extended_wasd_thirdperson=\x22fly: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22";
                    if (useSimpleNavmesh) {
                        wasd = "extended_wasd_thirdperson=\x22fly: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height: 0\x22";
                    } else if (useNavmesh) { //well just use them both!
                        // let navConstraint = "constrainToNavMesh: true; enabled: true; speed:0.2;\x22";
                        // wasd = "extended_wasd_thirdperson=\x22fly: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard constrainToNavMesh: true; enabled: true; speed:0.2;\x22";
                        wasd = "extended_wasd_thirdperson=\x22fly: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height: 0\x22";
                    }
                   
                    // wasd = "extended_wasd_thirdperson=\x22fly: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 " + navConstraint;
                    cameraRigEntity = "<a-entity id=\x22lookControls\x22 "+lookcontrols+" follow-camera=\x22target: #player\x22>" +
                        "<a-entity id=\x22thirdPersonCamera\x22 camera position=\x220 5 7\x22 >" +
                        // "<a-entity id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -1.5\x22 material=\x22opacity: 0\x22></a-entity>"+
                        "</a-entity>" +
                       
                    "</a-entity>"+
                    "<a-entity id=\x22cameraRig\x22 initializer "+
                
                        " id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22>"+
                        
                       
                        "<a-entity get_pos_rot id=\x22player\x22 "+wasd+" "+ physicsMod +" rotation=\x22"+playerRotation+"\x22 position=\x22"+playerPosition+"\x22>"+
                            "<a-entity id=\x22equipPlaceholder\x22 geometry=\x22primitive: box; height: .1; width: .1; depth: .1\x22 position=\x220 -.65 -.75\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "<a-entity id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 5 5\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "<a-entity id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "<a-entity id=\x22thirdPersonPlaceholder\x22 position=\x220 0 0\x22></a-entity>"+
                            "<a-entity id=\x22playCaster\x22 position=\x220 .5 .5\x22></a-entity>"+
                            // "<a-sphere visible=\x22true\x22 scale=\x220.45 0.5 0.4\x22 random-color></a-sphere>"+
                        "</a-entity>"+
                        //TODO - hands?
                       
                        "</a-entity></a-entity>";

                ///////////////// - Orbit camera - /////////////////
                } else if (sceneResponse.sceneCameraMode != null && sceneResponse.sceneCameraMode != undefined && sceneResponse.sceneCameraMode.toLowerCase().includes("orbit")) { //hrm..
                    wasd = "";
                    cameraRigEntity = "<a-entity camera look-controls id=\x22player\x22 orbit-controls=\x22target: 0 0 0; minDistance: 0.5; maxDistance: 180; initialPosition: "+playerPosition+"\x22>"+
                    "<a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
                    "</a-entity>";
                    joystickScript = "<script src=\x22https://cdn.jsdelivr.net/gh/diarmidmackenzie/superframe@fix-orbit-controls/components/orbit-controls/dist/aframe-orbit-controls.min.js\x22></script>";
                
                ///////////////// - Fixed camera - /////////////////
                } else if (sceneResponse.sceneCameraMode != null && sceneResponse.sceneCameraMode != undefined && sceneResponse.sceneCameraMode.toLowerCase() == "fixed rotate") { //hrm..
                    let lookcontrols = "look-controls=\x22magicWindowTrackingEnabled: false; reverseTouchDrag: true\x22";
                    if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('magicwindow') || sceneResponse.sceneTags.includes('magic window'))) {
                        lookcontrols = "look-controls=\x22reverseTouchDrag: true\x22"; // because magicwinders enabled by default
                    }
                    wasd = "";
                    cameraRigEntity = "<a-entity "+lookcontrols+" follow-camera=\x22target: #player\x22>" +
                        "<a-entity camera rotation=\x22"+playerRotation+"\x22 position=\x22"+playerPosition+"\x22 ></a-entity>" +
                    "</a-entity>"+
                    "<a-entity id=\x22cameraRig\x22 initializer "+
                    " id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22>"+
                    // "<a-entity id=\x22player\x22 "+wasd+" "+ physicsMod +" position=\x22"+playerPosition+"\x22>"+
                    "<a-entity id=\x22player\x22 >"+
                        "<a-entity id=\x22equipPlaceholder\x22 geometry=\x22primitive: box; height: .1; width: .1; depth: .1\x22 position=\x220 -.65 -.75\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -1.5\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22thirdPersonPlaceholder\x22 position=\x220 0 0\x22></a-entity>"+
                        "<a-entity id=\x22playCaster\x22 position=\x220 .5 .5\x22></a-entity>"+
                        // "<a-sphere visible=\x22true\x22 scale=\x220.45 0.5 0.4\x22 random-color></a-sphere>"+
                    "</a-entity>"+
                    
                    "</a-entity></a-entity>";
                } else if (sceneResponse.sceneCameraMode  != null && sceneResponse.sceneCameraMode != undefined && sceneResponse.sceneCameraMode.toLowerCase() == "fixed") { //hrm..
                    let lookcontrols = "look-controls=\x22magicWindowTrackingEnabled: false; reverseTouchDrag: true\x22";
                    if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('magicwindow') || sceneResponse.sceneTags.includes('magic window'))) {
                        lookcontrols = "look-controls=\x22reverseTouchDrag: true\x22"; // because magicwinders enabled by default
                    }
                    wasd = "";
                    
                    cameraRigEntity = "<a-entity camera position=\x22"+playerPosition+"\x22></a-entity>"+
                    "<a-entity id=\x22cameraRig\x22 initializer "+
                    " id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22>"+
                    "<a-entity id=\x22player\x22 >"+
                        "<a-entity id=\x22equipPlaceholder\x22 geometry=\x22primitive: box; height: .1; width: .1; depth: .1\x22 position=\x220 -.65 -.75\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -1.5\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                        "material=\x22opacity: 0\x22></a-entity>"+
                        "<a-entity id=\x22thirdPersonPlaceholder\x22 position=\x220 0 0\x22></a-entity>"+
                        "<a-entity id=\x22playCaster\x22 position=\x220 .5 .5\x22></a-entity>"+
                        // "<a-sphere visible=\x22true\x22 scale=\x220.45 0.5 0.4\x22 random-color></a-sphere>"+
                    "</a-entity>"+
                    
                    
                    "</a-entity></a-entity>";

                ///////////////// - First Person camera - /////////////////        
                } else { 
                    
                    let lookcontrols = "look-controls=\x22magicWindowTrackingEnabled: false;\x22";
                    let console = "";
                    if (logScripts != "") {
                        console = "<a-console id=\x22consoleEntity\x22 position=\x220\ .13 -.36\x22 scale=\x22.33 .33 .33\x22 rotation=\x22-70.7 -1.77\x22></a-console>";   
                    }
                    if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('magicwindow') || sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('magic window'))) {
                        lookcontrols = "look-controls"; // because magicwinders enabled by default
                    }
                    let ammoHands = "";
                    let hapticsHands = ""; //grab?
                    if (usePhysicsType == "ammo") {
                        ammoHands = " ammo-body=\x22type: kinematic; emitCollisionEvents: true;\x22 ammo-shape=\x22type: sphere\x22 ";
                        hapticsHands = "haptics"
                    }
                    
                    if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("hand controls")  || sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("hand controllers")) {
                        handEntities = "<a-entity id=\x22left-hand\x22 hand-controls=\x22hand: left\x22 left_controller_buttons></a-entity>" +
                        "<a-sphere color=\x22blue\x22 opacity=\x220.1\x22 radius=\x220.06\x22 "+ammoHands+"></a-sphere></a-entity>" +
                        "<a-entity id=\x22right-hand\x22 hand-controls=\x22hand: right\x22>" +
                        "<a-sphere color=\x22orange\x22 opacity=\x220.1\x22 radius=\x220.06\x22 "+ammoHands+"></a-sphere>"+
                        "<a-entity id=\x22rightHandEquip\x22 equip_controller rotation=\x22-80 0 0\x22 position=\x22-0.02 0 -0.01\x22></a-entity>" +
                        "</a-entity>";
                    } else if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("hand tracking")) { 
                        handEntities = "<a-entity id=\x22left-hand\x22 hand-tracking-controls=\x22hand: left; hoverEnabled: true;\x22 pinch_fu>" +
                        "<a-sphere color=\x22blue\x22 opacity=\x221\x22 radius=\x220.05\x22 "+ammoHands+"></a-sphere>"+
                        "</a-entity>" +
                        "<a-entity id=\x22right-hand\x22 hand-tracking-grab-controls=\x22hand: right; hoverEnabled: true;\x22 anchor-grabbed-entity>" +
                        "<a-sphere color=\x22orange\x22 opacity=\x221\x22 radius=\x220.05\x22 "+ammoHands+"></a-sphere>"+
                        "</a-entity>";
                    } else {
                        let rightHandEquip = "";
                        let leftHandEquip = "";
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("blaster")) {
                            rightHandEquip = " equip_controller rotation=\x22-80 0 0\x22 position=\x22-0.02 0 -0.01\x22"
                        }
                        handEntities = "<a-entity id=\x22left-hand\x22 "+blinkMod+" meta-touch-controls=\x22hand: left;\x22 left_controller_thumb left_controller_buttons>"+
                        
                        "<a-sphere color=\x22blue\x22 opacity=\x220.1\x22 radius=\x220.06\x22 "+ammoHands+"></a-sphere></a-entity>" +
                        // "<a-entity id=\x22right-hand\x22 hand-tracking-grab-controls=\x22hand: right\x22 oculus-touch-controls=\x22hand: right\x22 laser-controls=\x22hand: right;\x22 handModelStyle: lowPoly; color: #ffcccc\x22 raycaster=\x22objects: .activeObjexRay;\x22 grab "+hapticsHands+">"+
                        "<a-entity id=\x22right-hand\x22 laser-controls=\x22hand: right;\x22 raycaster=\x22objects: .activeObjexRay;\x22 meta-touch-controls=\x22hand: right\x22 >"+
                        "<a-entity id=\x22right_hand_attach\x22 "+rightHandEquip+"></a-entity>" +
                        "<a-sphere color=\x22orange\x22 opacity=\x220.1\x22 radius=\x220.06\x22 "+ammoHands+"></a-sphere>"+
                        "</a-entity>";       
                    }
                    //////////////////////////////////// FP cameraRig
                    // cameraRigEntity = "<a-entity id=\x22cameraRig\x22 "+movementControls+" initializer "+
                    if (!sceneResponse.scenePlayer) {
                        sceneResponse.scenePlayer = {};
                        sceneResponse.scenePlayer.playerSpeed = 2;
                    }

                    wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22";
                    if (useSimpleNavmesh || useNavmesh) {
                        wasd = "extended_wasd_controls=\x22flyEnabled: false; moveSpeed: "+sceneResponse.scenePlayer.playerSpeed+"; inputType: keyboard\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height: "+sceneResponse.scenePlayer.playerHeight+"\x22";
                    } 
                    cameraRigEntity = "<a-entity id=\x22cameraRig\x22 initializer "+
                        " id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22>"+
                        "<a-entity id=\x22player\x22 "+lookcontrols+" get_pos_rot obb-collider=\x22size: 1 1 1\x22 camera=\x22near: .1\x22 "+wasd+" "+ physicsMod +" rotation=\x22"+playerRotation+"\x22 position=\x22"+playerPosition+"\x22>"+
                            "<a-entity id=\x22equipPlaceholder\x22 geometry=\x22primitive: box; height: 0; width: 0; depth: 0;\x22 position=\x220 -.65 -.75\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "<a-entity id=\x22viewportPlaceholder\x22 geometry=\x22primitive: plane; height: 0; width: 0\x22 position=\x220 0 -1.5\x22"+
                            "material=\x22opacity: 0\x22>"+
                            
                            "</a-entity>"+
                            "<a-entity id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0; width: 0\x22 position=\x220 0 -3\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                        "</a-entity>"+
                        handEntities +
                        "</a-entity></a-entity>";

                    if (useStarterKit) { //can't do starterkit + superhands! // maybe later...
                        usePhysicsType = "physx";
                        physicsScripts = "<script src=\x22https://cdn.jsdelivr.net/gh/c-frame/physx@v0.1.0/dist/physx.min.js\x22></script>"+
                        "<script src=\x22https://cdn.jsdelivr.net/npm/handy-work@3.1.10/build/handy-controls.min.js\x22></script>"+
                        "<script src=\x22https://cdn.jsdelivr.net/npm/handy-work@3.1.10/build/magnet-helpers.min.js\x22></script>";
                        if (useSimpleNavmesh || useNavmesh) {
                            cameraRigEntity = "<a-entity id=\x22cameraRig\x22 rotation=\x22"+playerRotation+"\x22 position=\x22"+playerPosition+"\x22 initializer cursor=\x22rayOrigin: mouse\x22 simple-navmesh-constraint=\x22navmesh:#nav-mesh;fall:50; height:"+
                            sceneResponse.scenePlayer.playerHeight+"\x22 raycaster=\x22objects: .activeObjexRay\x22  movement-controls=\x22speed:0.15;camera:#head;\x22"+
                            "position=\x22-1 0 1\x22 rotation=\x220 45 0\x22 origin-on-ar-start> <a-entity id=\x22head\x22 camera=\x22near:0.01;\x22 look-controls=\x22pointerLockEnabled: false\x22 position=\x220 1.65 0\x22>"+
                            "<a-entity id=player get_pos_rot></a-entity>"+
                            "<a-entity class=\x22hiddenPlaceholders\x22 id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "</a-entity>"+ handEntities +"</a-entity>";
                        } else { //no navmesh
                            cameraRigEntity = "<a-entity id=\x22cameraRig\x22 initializer cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22 id=\x22cameraRig\x22 rotation=\x22"+playerRotation+"\x22 position=\x22"+
                            playerPosition+"\x22 movement-controls=\x22speed:0.15;camera:#head;\x22"+
                            "position=\x22-1 0 1\x22 rotation=\x220 45 0\x22 origin-on-ar-start> <a-entity id=\x22head\x22 camera=\x22near:0.01;\x22 look-controls=\x22pointerLockEnabled: false\x22 position=\x220 1.65 0\x22>"+
                            "<a-entity id=player get_pos_rot></a-entity>"+ //el w/ id=player is always tracked for ranging
                            "<a-entity class=\x22hiddenPlaceholders\x22 id=\x22viewportPlaceholder3\x22 geometry=\x22primitive: plane; height: 0.01; width: .01\x22 position=\x220 0 -3\x22"+
                            "material=\x22opacity: 0\x22></a-entity>"+
                            "</a-entity>"+ handEntities +"</a-entity>";
                        }
                        
                    }

                }
            } //end AFrame scene variations
            let webxrEnv = "default";
            let shadow = "";
            let sunVector = "0 -.5 -.5";
            let intensity = "2";
            let envLighting = "lighting: distant"; //default
            //default lights, 

            /////////////////////// environmental conf /////////////////////////////////////
            if (!sceneResponse.sceneEnvironmentPreset && sceneResponse.sceneWebXREnvironment) {
                sceneResponse.sceneEnvironmentPreset = sceneResponse.sceneWebXREnvironment; //the old setting is still out there!
            }
            if (sceneResponse.sceneEnvironmentPreset != null && sceneResponse.sceneEnvironmentPreset != "none" && sceneResponse.sceneEnvironmentPreset != "" ) {

                webxrEnv = sceneResponse.sceneEnvironmentPreset;
                enviromentScript = "<script type=\x22module\x22 src=\x22../main/src/component/aframe-environment-component_m3.js\x22></script>";
                let ground = "ground: hills;";
                let dressing = "";
                let skycolor = "";
                let groundcolor = "";
                let groundcolor2 = "";
                let dressingcolor = "";
                let horizoncolor = "";
                
                let fog = "";
                let tweakColors = "";
                let hasColorMods = false;
                //if any of the default colors have changed, use them
                if (sceneResponse.sceneColor1 != "#808080" || sceneResponse.sceneColor2 != "#808080" || sceneResponse.sceneColor3 != "#808080" || sceneResponse.sceneColor1 != "#808080") {
                    hasColorMods = true;
                }
                if (webxrEnv == "none") {
                    ground = "ground: none;"
                }

                if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('no dressing')) {
                    dressing = "dressing: none;"
                }
                
                if (sceneResponse.sceneUseFloorPlane && sceneResponse.sceneFloorplaneTexture.toLowerCase() == "none") {
                    ground = "ground: none;"
                    dressing = "dressing: none;"
                } else if (sceneResponse.sceneUseFloorPlane && sceneResponse.sceneFloorplaneTexture != null && sceneResponse.sceneFloorplaneTexture.toLowerCase() == "flat") {
                    ground = "ground: flat; dressing: none;"
                    dressing = "dressing: none;"
                } else if  (sceneResponse.sceneFloorplaneTexture != null && sceneResponse.sceneFloorplaneTexture.length > 3) {
                    ground = "ground: " + sceneResponse.sceneFloorplaneTexture.toLowerCase() +"; "; //needs refactor to...?
                }

                if (sceneResponse.sceneUseDynamicShadows) {
                    shadow = "shadow: true; shadowSize: 10;"
                } else {
                    shadow = " shadow: false ";
                }
                
                if (sceneResponse.sceneTweakColors) {
                    // tweakColors = "mod-colors"; //need to animate
                    // envLighting = "lighting: none";
                }
                
                if (!sceneResponse.sceneUseDynamicSky) {
                    envLighting = "lighting: none";
                }
                
                if (sceneResponse.sceneUseSceneFog) {
                    let fogDistance = sceneResponse.sceneSkyRadius / 2 
                    fogSettings = "fog=\x22type: exponential; density:" +sceneResponse.sceneGlobalFogDensity+ "; near: 1; far: "+fogDistance+"; color: " +sceneResponse.sceneColor2 + "\x22";
                    fog = "fog: " +sceneResponse.sceneGlobalFogDensity+ ";";
                } else {
                    fogSettings = "";
                    fog = "";
                }
                
                if (hasColorMods && sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3 && sceneResponse.sceneColorizeSky) {
                    skycolor = "skyColor: " + sceneResponse.sceneColor1 + ";";
                }
                
                if (hasColorMods && sceneResponse.sceneColor2 != null && sceneResponse.sceneColor2.length > 3 && sceneResponse.sceneColorizeSky) {  
                    horizoncolor = "horizonColor: " + sceneResponse.sceneColor2 + ";";
                } 
                if (hasColorMods && sceneResponse.sceneColor3 != null && sceneResponse.sceneColor3.length > 3) { 
                    groundcolor = "groundColor: " + sceneResponse.sceneColor3 + ";";
                }
                if (hasColorMods && sceneResponse.sceneColor4 != null && sceneResponse.sceneColor4.length > 3) {
                    dressingcolor = "dressingColor: " + sceneResponse.sceneColor4 + ";";
                    groundcolor2 = "groundColor2: " + sceneResponse.sceneColor4 + ";";
                }

                aframeEnvironment = "<a-entity id=\x22enviroEl\x22 environment=\x22preset: "+webxrEnv+"; groundYScale: 5; playArea: 1.5; "+ground+" "+groundcolor+" "+groundcolor2+" "+dressing+" "+fog+" "+shadow+" "+dressingcolor+" "+skycolor+" "+horizoncolor+
                " "+envLighting+";\x22 hide-on-enter-ar "+tweakColors+"></a-entity>";

            } else {
                if (sceneResponse.sceneUseDynamicSky) {
                    if (sceneResponse.sceneUseDynamicShadows) {
                        shadow = " light=\x22castShadow: true\x22 ";
                    }

                    if (sceneResponse.sceneSunVector) {
                        sunVector = sceneResponse.sceneSunVector;
                    }
                    if (sceneResponse.sceneSunIntensity) {
                        intensity = sceneResponse.sceneSunIntensity;
                    }

                    let skyRad = parseInt(sceneResponse.sceneSkyRadius) - (parseInt(sceneResponse.sceneSkyRadius) * .2);
                    skySettings =  "<a-sky hide-on-enter-ar id=\x22skyEl\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 radius=\x22" + skyRad + "\x22 mod_sky=\x22enabled: true; color: "+sceneResponse.sceneColor1+";\x22></a-sky>";
                    lightEntities = "<a-light visible=\x22true\x22 show-in-ar-mode id=\x22real-light\x22 type=\x22directional\x22 "+shadow+" position=\x221 1 1\x22 color=\x22"+sceneResponse.sceneColor1+"\x22 "+
                    "groundColor=\x22"+sceneResponse.sceneColor2+"\x22 intensity=\x221.5\x22 target=\x22#directionaltarget\x22><a-entity id=\x22directionaltarget\x22 position=\x22"+sunVector+"\x22></a-entity></a-light>" +
                    "<a-light type='ambient' intensity=\x22.5\x22 color='" + sceneResponse.sceneColor2 + "'></a-light>";    
                }
            }
            sceneResponse.scenePostcards = sceneData.scenePostcards;
            if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3) {
                //
            } 
            if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3 && sceneResponse.sceneColor2 != null && sceneResponse.sceneColor2.length > 3)   {

            }

            if (sceneResponse.sceneUseSceneFog) {

                let fogDensity = sceneResponse.sceneGlobalFogDensity != null ? sceneResponse.sceneGlobalFogDensity : '.01';
                let skyRadius = parseInt(sceneResponse.sceneSkyRadius - 100);
                fogSettings = "fog=\x22type: exponential; density:"+fogDensity+"; near: 1; far: "+skyRadius+"; color: " +sceneResponse.sceneColor1 + "\x22";
            } else {
                fogSettings = "";
            }
            
            if (sceneResponse.sceneSkyParticles != undefined && sceneResponse.sceneSkyParticles != null && sceneResponse.sceneSkyParticles != "None") { 
                if (sceneResponse.sceneSkyParticles.toLowerCase() == "dust") {
                    skyParticles = "<a-entity position=\x220 0 0\x22 sky_particle_points=\x22type: dust\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22sparkle1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/sparkle.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "rain") {
                    skyParticles = "<a-entity position=\x220 0 0\x22 rotation=\x220 0 90\x22 scale=\x221 1 1\x22 sky_particles=\x22type: rain; size: .1; src: http://servicemedia.s3.amazonaws.com/assets/pics/raindrop2.png\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22raindrop2\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/raindrop2.png\x22 crossorigin=\x22anonymous\x22>";
                
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "rain/fog") {
                    skyParticles = "<a-entity scale=\x2220 10 20\x22 position=\x220 10 0\x22 sprite-particles=\x22texture: #raindrop; color: " +sceneResponse.sceneColor2 + "; position: -1 1 -1..1 1 1; spawnRate: 1000; velocity: 0 -.75 0; lifeTime: 10; scale: .15,.25; opacity: 1\x22></a-entity>"+
                    "<a-entity scale=\x2250 10 50\x22 position=\x220 10 0\x22 sprite-particles=\x22texture: #cloud1; color: " +sceneResponse.sceneColor2 + "; blending: additive; position: -1 -1 -1..1 1 1; velocity: -.05 -.025 -.05 .. .05 .025 .05; spawnRate: 5; lifeTime: 20; scale: 200,400; opacity: 0,.3,0; rotation: 0..360\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22raindrop2\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/raindrop.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "rain/fog/add") {
                    skyParticles = "<a-entity scale=\x2220 10 20\x22 position=\x220 10 0\x22 sprite-particles=\x22texture: #raindrop; color: " +sceneResponse.sceneColor2 + "; blending: additive; position: -1 1 -1..1 1 1; spawnRate: 1000; velocity: 0 -.75 0; lifeTime: 10; scale: .15,.25; opacity: 1\x22></a-entity>"+
                    "<a-entity scale=\x2250 10 50\x22 position=\x220 10 0\x22 sprite-particles=\x22texture: #cloud1; color: " +sceneResponse.sceneColor2 + "; blending: additive; position: -1 -1 -1..1 1 1; velocity: -.05 -.025 -.05 .. .05 .025 .05; spawnRate: 5; lifeTime: 20; scale: 100,200; opacity: 0,.3,0; rotation: 0..360\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22cloud1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/cloud_lg.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "snow") {
                    skyParticles = "<a-entity position=\x220 0 0\x22 rotation=\x220 0 90\x22 scale=\x221 1 1\x22 sky_particles=\x22type: rain; size: .2; src: https://servicemedia.s3.amazonaws.com/assets/pics/snowflake.png\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22snowflake\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/snowflake.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "smoke") {
                    skyParticles = "<a-entity position=\x220 0 0\x22 sky_particle_points=\x22type: smoke\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22cloud1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/cloud_lg.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "explosions") {
                    skyParticles = "<a-entity scale=\x2220 20 20\x22 position=\x220 20 0\x22 sprite-particles=\x22texture: #explosion1; textureFrame: 8 8; blending: additive; color: black..white;"+
                    " position: -1 -1 -1..1 1 1; velocity: -.1 -.05 -.1 .. .1 .05 .1; spawnRate: 20; lifeTime: 1; scale: 50,200; opacity: 0,1,0; rotation: 0..360\x22></a-entity>";
                    
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "fireworks") {
                    skyParticles = "<a-entity scale=\x2240 10 40\x22 position=\x220 40 0\x22 sprite-particles=\x22texture: #fireworksanim1; textureFrame: 5 5; blending: additive; color: black..white;"+
                    " position: -1 -1 -1..1 1 1; velocity: -.1 -.05 -.1 .. .1 .05 .1; spawnRate: 10; lifeTime: 1; scale: 50,200; opacity: 0,1,0; rotation: 0..360\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22fireworksanim1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/fireworks_sheet.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "fog") {
                    skyParticles = "<a-entity position=\x220 0 0\x22 sky_particle_points=\x22type: fog\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22cloud1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/cloud_lg.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "fog/add") {
                    skyParticles = "<a-entity scale=\x2250 10 50\x22 position=\x220 10 0\x22 sprite-particles=\x22texture: #cloud1; blending: additive; color: " +sceneResponse.sceneColor2 + "; position: -1 -1 -1..1 1 1; velocity: -.05 -.025 -.05 .. .05 .025 .05; spawnRate: 5; lifeTime: 20; scale: 100,200; opacity: 0,.3,0; rotation: 0..360\x22></a-entity>";
                    imageAssets = imageAssets + "<img id=\x22cloud1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/cloud_lg.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "clouds") {
                    // skyParticles = "<a-entity scale='15 5 15' position='0 10 0' particle_mangler particle-system=\x22preset: dust; maxAge: 25; velocityValue: 0 -.01 0; direction: -.01; positionSpread: 30 15 30; opacity: .2; particleCount: 50; size: 1000; blending: 2; texture: https://realitymangler.com/assets/textures/cloud_lg.png; color: " + sceneResponse.sceneColor1 + "," + sceneResponse.sceneColor2 +"\x22></a-entity>";
                } else if (sceneResponse.sceneSkyParticles.toLowerCase() == "stars") {    
                    // skyParticles = "<a-entity scale='2 2 2' position='0 15 0' particle_mangler particle-system=\x22preset: stars; particleCount: 3000; texture: https://realitymangler.com/assets/textures/star2b.png; color: " + sceneResponse.sceneColor1 + "," + sceneResponse.sceneColor2 +"\x22></a-entity>";
                }
                
            }
            if (sceneResponse.sceneUseFloorPlane) {
                groundPlane = "<a-plane rotation='-90 0 0' visible=\x22false\x22 position='0 0 0' width='100' height='100' mod_physics=\x22type: static; model: collider;\x22 color=\x22" + sceneResponse.sceneColor2+ "\x22></a-plane>"; //deprecated for environment component
            }
            if (sceneResponse.sceneWater != null) {
                if (sceneResponse.sceneWater.name == "water2") {
                    ocean = "<a-plane position=\x220  "+sceneResponse.sceneWater.level+" 0\x22 width=\x22300\x22 height=\x22300\x22 rotation=\x22-90 180 -90\x22 segments-height=\x22100\x22 segments-width=\x22100\x22 "+skyboxEnvMap+" material=\x22color: "+sceneResponse.sceneColor3+"; shader:makewaves; uMap: #water; repeat: 500 500;\x22></a-plane>";
                    imageAssets = imageAssets + "<img id=\x22water\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/water2c.jpeg\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneWater.name == "water1") {
                    ocean = "<a-plane position=\x220 "+sceneResponse.sceneWater.level+" 0\x22 width=\x22256\x22 height=\x22256\x22 rotation=\x22-90 180 -90\x22 segments-height=\x2264\x22 segments-width=\x2264\x22 "+skyboxEnvMap+" material=\x22shader:makewaves_small; color: "+sceneResponse.sceneColor4+";uMap: #water2; repeat: 500 500; transparent: true\x22></a-plane>";
                    imageAssets = imageAssets + "<img id=\x22water2\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/water2.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneWater.name == "water3") {
                    ocean = "<a-plane position=\x220 "+sceneResponse.sceneWater.level+" 0\x22 width=\x22256\x22 height=\x22256\x22 rotation=\x22-90 180 -90\x22 segments-height=\x2216\x22 segments-width=\x2216\x22 "+skyboxEnvMap+" material=\x22shader:makewaves_small; color: "+sceneResponse.sceneColor4+";uMap: #water; repeat: 50 50; transparent: false\x22></a-plane>";
                    imageAssets = imageAssets + "<img id=\x22water\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/watertile3.png\x22 crossorigin=\x22anonymous\x22>";
                } else if (sceneResponse.sceneWater.name == "water4") {
                    ocean = "<a-ocean></a-ocean>";
                }
            }
            if (sceneResponse.sceneUseHeightmap != null && sceneResponse.sceneUseHeightmap) {
                terrain = "<a-plane class=\x22surface activeObjexRay\x22 position=\x220 -20 0\x22 width=\x22512\x22 height=\x22512\x22 rotation=\x22-90 180 -90\x22 segments-height=\x22512\x22 segments-width=\x22512\x22 terrain-mangler></a-plane>";
            }
            
            if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                nextSceneLink = "href=\x22../webxr/" + sceneResponse.sceneNextScene + "\x22";
            }
            if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                prevSceneLink = "href=\x22../" + sceneResponse.scenePreviousScene + "\x22";
            }
            if (sceneResponse.sceneLoopPrimaryAudio) {
                loopable = "loop: true";
            }
            
            if (sceneData.scenePrimaryAudioID != null && sceneData.scenePrimaryAudioID.length > 4) {
                var pid = ObjectId.createFromHexString(sceneData.scenePrimaryAudioID);
                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.scenePrimaryAudioID));
                if (sceneData.scenePrimaryAudioVisualizer) {    
                    audioVizEntity = "<a-entity id=\x22audiovizzler\x22 position=\x22"+audioLocation+"\x22 data-audio-analyzer=\x22true\x22 data-beat=\x22true\x22></a-entity>";
                }
            }
            if (sceneData.sceneAmbientAudioID != null && sceneData.sceneAmbientAudioID.length > 4) {
                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.sceneAmbientAudioID));
            }
            if (sceneData.sceneTriggerAudioID != null && sceneData.sceneTriggerAudioID.length > 4) {
                requestedAudioItems.push(ObjectId.createFromHexString(sceneData.sceneTriggerAudioID));
            }
            if (particleLocations.length > 0) {
                for (let i = 0; i < particleLocations.length; i++) {
                    let color = "";
                    let distance = 10;
                    // let mods = "";
                    if (particleLocations[i].data != null && particleLocations[i].data.length > 3) {
                        if (particleLocations[i].data.indexOf("~") != -1) {
                            let split = particleLocations[i].data.split("~");
                            color = split[0];
                            distance = split[1];
                        } else {
                            color = locationLights[i].data;
                        }
                    }
                }
            }
            if (curvePoints.length > 0) {
                for (let i = 0; i < curvePoints.length; i++) {   
                    curveEntities = curveEntities + "<a-curve-point position=\x22"+curvePoints[i].loc+"\x22></a-curve-point>";
                }
            }

            ///////////////////// location "placeholders" used for "cloud markers" /////////////////////////////////
            if (locationPlaceholders.length > 0) {
                for (let i = 0; i < locationPlaceholders.length; i++) {
                    //use the "cloud_marker" component for certain markertypes () TODO rename it to mod_location // nope
                    let scale = 1;
                    let rot = 0;
                    if (locationPlaceholders[i].markerObjScale && locationPlaceholders[i].markerObjScale != 0 && locationPlaceholders[i].markerObjScale != "") { //deprecated, using non-u scaling now..
                        scale = locationPlaceholders[i].markerObjScale; 
                    }
                    const xscale = locationPlaceholders[i].xscale != null ? locationPlaceholders[i].xscale : scale;
                    const yscale = locationPlaceholders[i].yscale != null ? locationPlaceholders[i].yscale : scale;
                    const zscale = locationPlaceholders[i].zscale != null ? locationPlaceholders[i].zscale : scale;   
                    const xrot = locationPlaceholders[i].eulerx != null ? locationPlaceholders[i].eulerx : rot;
                    const yrot = locationPlaceholders[i].eulery != null ? locationPlaceholders[i].eulery : rot;
                    const zrot = locationPlaceholders[i].eulerz != null ? locationPlaceholders[i].eulerz : rot;

                    if (useArParent || (locationPlaceholders[i].tags && (locationPlaceholders[i].tags.includes("ar child") ||  locationPlaceholders[i].tags.includes("archild")))) { //used for hit test
                            
                        arChildElements = arChildElements + "<a-entity data-isvisible=\x22yes\x22 id=\x22"+locationPlaceholders[i].timestamp+"\x22 class=\x22activeObjexGrab activeObjexRay envMap "+
                        "placeholders\x22 cloud_marker=\x22phID: "+locationPlaceholders[i].phID+"; xpos: "+locationPlaceholders[i].x+"; ypos: "+locationPlaceholders[i].y+"; zpos: "+locationPlaceholders[i].z+";" +
                        "xrot: "+xrot+"; yrot: "+yrot+"; zrot: "+zrot+"; targetElements: "+locationPlaceholders[i].targetElements+"; " +
                        "mediaID: "+locationPlaceholders[i].mediaID+"; mediaName: "+locationPlaceholders[i].mediaName+"; "+
                        "xscale: "+xscale+"; yscale: "+yscale+"; zscale: "+zscale+"; objectID: "+locationPlaceholders[i].objectID+"; modelID: "+locationPlaceholders[i].modelID+"; model: "+
                        locationPlaceholders[i].model+"; markerType: "+locationPlaceholders[i].markerType+";  tags: "+locationPlaceholders[i].locationTags+"; isNew: false; name: "+
                        locationPlaceholders[i].name+"; description: "+locationPlaceholders[i].description+";eventData: "+locationPlaceholders[i].eventData+"; timestamp: "+locationPlaceholders[i].timestamp+";\x22 "+
                        skyboxEnvMap+ " position=\x22"+locationPlaceholders[i].x+" "+locationPlaceholders[i].y+ " " +locationPlaceholders[i].z+"\x22 rotation=\x22"+locationPlaceholders[i].eulerx+" "+locationPlaceholders[i].eulery+ " " +locationPlaceholders[i].eulerz+"\x22></a-entity>";
                    } else {
                        placeholderEntities = placeholderEntities + "<a-entity data-isvisible=\x22yes\x22 id=\x22"+locationPlaceholders[i].timestamp+"\x22 class=\x22activeObjexGrab activeObjexRay envMap "+
                        "placeholders\x22 cloud_marker=\x22phID: "+locationPlaceholders[i].phID+"; xpos: "+locationPlaceholders[i].x+"; ypos: "+locationPlaceholders[i].y+"; zpos: "+locationPlaceholders[i].z+";" +
                        "xrot: "+xrot+"; yrot: "+yrot+"; zrot: "+zrot+"; targetElements: "+locationPlaceholders[i].targetElements+"; " +
                        "mediaID: "+locationPlaceholders[i].mediaID+"; mediaName: "+locationPlaceholders[i].mediaName+"; "+
                        "xscale: "+xscale+"; yscale: "+yscale+"; zscale: "+zscale+"; objectID: "+locationPlaceholders[i].objectID+"; modelID: "+locationPlaceholders[i].modelID+"; model: "+
                        locationPlaceholders[i].model+"; markerType: "+locationPlaceholders[i].markerType+";  tags: "+locationPlaceholders[i].locationTags+"; isNew: false; name: "+
                        locationPlaceholders[i].name+"; description: "+locationPlaceholders[i].description+";eventData: "+locationPlaceholders[i].eventData+"; timestamp: "+locationPlaceholders[i].timestamp+";\x22 "+
                        skyboxEnvMap+ " position=\x22"+locationPlaceholders[i].x+" "+locationPlaceholders[i].y+ " " +locationPlaceholders[i].z+"\x22 rotation=\x22"+locationPlaceholders[i].eulerx+" "+locationPlaceholders[i].eulery+ " " +locationPlaceholders[i].eulerz+"\x22></a-entity>";
                    }
                }
            }
            //////// items in scene inventory //////////////
            const invquery = {"sceneID": sceneData._id};
            const inventoryitems = await RunDataQuery("inventory_items", "find", invquery);
            // console.log("gots inventory items: " + JSON.stringify(inventoryitems));
            var buff = Buffer.from(JSON.stringify(inventoryitems)).toString("base64");
            inventoryData = "<a-entity mod_scene_inventory id=\x22sceneInventory\x22 data-inventory='"+buff+"'></a-entity>";
            
            ///////////////// scene models //////////////////
            var modelz = [];
            console.log("sceneModelss : " + JSON.stringify(sceneResponse.sceneModels));
             if (sceneResponse.sceneModels != null && sceneResponse.sceneModels.length) {
                const m_ids = sceneResponse.sceneModels.map(convertStringToObjectID);
                const query = {"_id": m_ids};
                const models = await RunDataQuery("models", "find", query);
                for (let model of models) {
                    const url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                    model.url = url;
                    modelz.push(model);
                }
                // for (let i = 0; i < sceneResponse.sceneModels.length; i++) {
                //     var oo_id = ObjectId.createFromHexString(sceneResponse.sceneModels[i].toString());
                //     const query = {"_id": oo_id};
                //     const model = await RunDataQuery("models", "findOne", query);
                //     if (model && model.userID) {
                //         const url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                //         model.url = url;
                //         modelz.push(model);
                //     }
                // }
                var buff = Buffer.from(JSON.stringify(modelz)).toString("base64");
                modelData = "<div id=\x22sceneModels\x22 data-models='"+buff+"'></div>";
            }
            ///////////////// available scenes /////////////////////
            const query = {$and: [{ "sceneDomain": sceneResponse.sceneDomain}, {sceneShareWithPublic: true }]};
            const scenes = await RunDataQuery("scenes", "find", query);

            let availableScenes = [];
            availableScenesResponse.availableScenes = availableScenes;
            // async.each(scenes, function (scene, cb) {
            for (let scene in scenes) {
                let availableScene = {};
                if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                    var postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                    var i_id = ObjectId.createFromHexString(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                    const imgquery = {"_id": i_id};
                    let picture_item = await RunDataQuery("image_items", "findOne", imgquery);
                    var item_string_filename = JSON.stringify(picture_item.filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));

                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                    var urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000); //just send back thumbnail urls for list
                    var urlQuarter = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + quarterName, 6000); //just send back thumbnail urls for list
                    
                    availableScene = {
                        sceneTitle: scene.sceneTitle,
                        sceneKey: scene.short_id,
                        sceneType: scene.sceneType,
                        sceneLastUpdate: scene.sceneLastUpdate,
                        sceneDescription: scene.sceneDescription,
                        sceneKeynote: scene.sceneKeynote,
                        sceneAndroidOK: scene.sceneAndroidOK,
                        sceneIosOK: scene.sceneIosOK,
                        sceneWindowsOK: scene.sceneWindowsOK,
                        sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                        sceneOwner: scene.userName ? "" : scene.userName,
                        scenePostcardQuarter: urlQuarter,
                        scenePostcardHalf: urlHalf
                    };
                    availableScenesResponse.availableScenes.push(availableScene);
                }
            }

            if (availableScenes != null && availableScenes != undefined && availableScenes.length > 0) { //need it for random gates, etc...
                const buff = Buffer.from(JSON.stringify(availableScenesResponse)).toString("base64");
                availableScenesEntity = "<a-entity scale=\x22.75 .75 .75\x22 look-at=\x22#player\x22 position=\x22"+scenesKeyLocation+"\x22>"+ 
                "<a-entity available_scenes_control position=\x220 -2.5 0\x22 scale=\x22.75  .75 .75\x22 id=\x22availableScenesControl\x22 data-availablescenes='"+buff+"' class=\x22envMap activeObjexRay\x22 toggle-available-scenes "+skyboxEnvMap+" gltf-model=\x22#key\x22></a-entity>"+
                "<a-entity id=\x22availableScenesPanel\x22 visible='false' position=\x220 -1 0\x22>"+
                "<a-entity id=\x22availableScenesHeaderText\x22 geometry=\x22primitive: plane; width: 3.25; height: 1\x22 position=\x220 1.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                "text=\x22value:; wrap-count: 35;\x22></a-entity>" +

                "<a-entity id=\x22availableScenePic\x22 class=\x22envMap activeObjexRay\x22 visible=\x22true\x22 position=\x220 3 -.1\x22 gltf-model=\x22#widelandscape_panel\x22 scale=\x22.5 .5 .5\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                "rotation='0 0 0'></a-entity>"+
                "<a-entity gltf-model=\x22#square_panel\x22 scale=\x222.25 2.25 2.25\x22 position=\x220 2.1 -.25\x22></a-entity>" +
                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22availableScenesNextButton\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x221.5 -.75 0\x22></a-entity>" +
                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22availableScenesPreviousButton\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-1.5 -.75 0\x22></a-entity>" +
                "</a-entity></a-entity>";
                console.log('processed availablescenes ' + availableScenes.length);
                modelAssets = modelAssets + "<a-asset-item id=\x22widelandscape_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5b.glb\x22></a-asset-item>\n";  
            }
            //////////////////////// weblinks /////////////////////////
            if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                let index = 0;
                
                for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                    if (ObjectId.isValid(sceneResponse.sceneWebLinks[i])) {
                    const w_id = ObjectId.createFromHexString(sceneResponse.sceneWebLinks[i]);
                    const query = {'_id': w_id};    
                    const weblink = await RunDataQuery("weblinks", "findOne", query);

                    let position = "-5 2 5";
                    let scale = "2 2 2";
                    if (sceneWeblinkLocations.length > index) {
                        if (sceneWeblinkLocations[index].data != undefined) {
                            if (sceneWeblinkLocations[index].data.indexOf("_") != -1) {
                                //TODO don't add to scattered/layout versions
                            }
                        }
                        position = sceneWeblinkLocations[index].loc;
                        if (sceneWeblinkLocations[index].markerObjScale != null && sceneWeblinkLocations[index].markerObjScale != undefined) {
                            scale = sceneWeblinkLocations[index].markerObjScale.toString() + " " + sceneWeblinkLocations[index].markerObjScale.toString() + " " + sceneWeblinkLocations[index].markerObjScale.toString();
                        }
                    } else {
                        let max = 20;
                        let min = -20;
                        let x = Math.random() * (max - min) + min;
                        // let y = Math.random() * (max.y - min.y) + min.y;
                        let z = Math.random() * (max - min) + min;
                        if (z >= -1 && z <= 1) {
                            z = -3;
                        }
                        if (x >= -1 && z <= 1) {
                            x = -3;
                        }
                        position = x + " " + 1.5 + " " + z;
                    }
                    index++;
                    var urlStandard = await ReturnPresignedUrl(process.env.WEBSCRAPE_BUCKET_NAME, weblink._id +"/"+ weblink._id + ".standard.jpg", 6000);
                    weblinkAssets = weblinkAssets + "<img id=\x22wlimage" + index + "\x22 crossorigin=\x22anonymous\x22 src='" + urlStandard + "'>";
                    let link = "basic-link=\x22href: "+weblink.link_url+";\x22 class=\x22activeObjexGrab activeObjexRay\x22";
                    let caption = "<a-troika-text class=\x22pCap\x22 align=\x22center\x22 rotation=\x220 0 0\x22 font=\x22../fonts/web/Acme.woff\x22 outlineWidth=\x222%\x22 outlineColor=\x22black\x22  fontSize=\x221\x22 anchor=\x22top\x22 maxWidth=\x2210\x22 position=\x220 1.1 .1\x22 value=\x22"+weblink.link_title+"\x22></a-troika-text>";
                    weblinkEntities = weblinkEntities + "<a-entity "+link+" position=\x22"+position+"\x22 weblink-materials=\x22index:"+index+"\x22 look-at=\x22#player\x22 gltf-model=\x22#flatsquare\x22 scale=\x22"+scale+"\x22 material=\x22shader: flat; src: #wlimage" + index + "; alphaTest: 0.5;\x22"+
                    " visible='true'>"+caption+"</a-entity>";   
                    }
                }
            }
            //////////////////////// objects ////////////////////////
            let objex = [];
            let actionModels = [];
            console.log("tryna get all sceneObjects " + JSON.stringify(sceneResponse.sceneObjects));
            let objectIDs = []; //to prevent dupes in objex response below
            for (let i = 0; i < sceneResponse.sceneObjects.length; i++) {
                let objectID = sceneResponse.sceneObjects[i].toString();
                // if (objectID != undefined && objectID != "none" && sceneResponse.sceneObjects.indexOf(objectID) != -1 && objectIDs.indexOf(objectID) == -1) {
                objectIDs.push(objectID);
                console.log("objectID " + objectID);
                const o_id = ObjectId.createFromHexString(objectID);
                const objquery = {"_id": o_id};
                let objekt = await RunDataQuery("obj_items", "findOne", objquery);

                ///////////// actions associated with this object ///////////
                if (objekt && objekt.actionIDs && objekt.actionIDs != undefined && objekt.actionIDs.length > 0) {
                    // console.log("tryna add obj actions " + objekt.actionIDs);
                    const aids = objekt.actionIDs.map(item => {
                        return ObjectId.createFromHexString(item.toString());
                    });
                    const actionquery = {"_id": {$in: aids }};
                    const actions = await RunDataQuery("actions", "find", actionquery);
                    objekt.actions = actions;
                    for (let a = 0; a < actions.length; a++) { //whew, now actions may have models, check for that and get urls below
                        if (actions[a].modelID != undefined && actions[a].modelID != null && actions[a].modelID != "") {
                            actionModels.push(actions[a]);
                        }
                    }
                }

                ////////// audiogroup associated with this object
                if (objekt && objekt.audiogroupID && objekt.audiogroupID.length > 4) {
                    console.log("AUDIO OBJECT GROUP!!!! " + objekt.audiogroupID);
                    objectAudioGroups.push(objekt.audiogroupID);
                    const groupquery = {"_id": ObjectId.createFromHexString(objekt.audiogroupID.toString())};
                    const group = await RunDataQuery("groups", "findOne", groupquery);
                    requestedAudioItems.push(group.items);    //TODO whatabout DUPES?!?!
                }   

                ////sprite sheets for object particle system // 
                if (objekt && objekt.particles != undefined && objekt.particles != null && objekt.particles != "None" ) { //maybe a "use flames" tag?
                    if (objekt.particles.toString().includes("Fire")) {
                        imageAssets = imageAssets + "<img id=\x22fireanim1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/fireanim3.png\x22 crossorigin=\x22anonymous\x22></img>";
                    }
                    if (objekt.particles.toString().includes("Candle")) {
                        imageAssets = imageAssets + "<img id=\x22candle1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/candle_flame_8x8.png\x22 crossorigin=\x22anonymous\x22></img>";
                    }
                    if (objekt.particles.toString().includes("Smoke")) {
                        imageAssets = imageAssets + "<img id=\x22smoke1\x22 src=\x22http://servicemedia.s3.amazonaws.com/assets/pics/smokeanim2.png\x22 crossorigin=\x22anonymous\x22>";
                    }
                }
                /////// get the model associated with this object, if any ////////////////
                if (objekt && objekt.modelID != undefined && objekt.modelID != null) {
                    const m_id = ObjectId.createFromHexString(objekt.modelID.toString());
                    const modelquery = {"_id": m_id};
                    const model = await RunDataQuery("models", "findOne", modelquery);

                    if (model && model.item_type == "glb") {
                        let modelURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                        objekt.modelURL = modelURL;
                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + objekt.modelID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                        
                    }
                }

                
                // console.log("pushing ojekt " + JSON.stringify(objekt));
                if (objekt) {
                   objex.push(objekt);
                }
            }
            var buff = Buffer.from(JSON.stringify(objex)).toString("base64");
            var buff2 = Buffer.from(JSON.stringify(sceneObjectLocations)).toString("base64");
            objectData = "<a-entity mod_objex id=\x22sceneObjects\x22 data-objex-locations='"+buff2+"' data-objex='"+buff+"'></a-entity>"; //doublebuff

            //////// get models associated with the actions on the objects //////////
            if (actionModels.length > 0) {
                for (let i = 0; i < actionModels.length; i++) {
                    let actionModel = actionModels[i];
                    const m_id = ObjectId.createFromHexString(actionModel.modelID.toString());
                    const mquery = {"_id": m_id};
                    const model = await RunDataQuery("models", "findOne", mquery);
                    if (model && model.userID && model.item_type && model.item_type == "glb") {
                        let modelURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                        gltfsAssets = gltfsAssets + "<a-asset-item class=\x22gltfAssets\x22 crossorigin=\x22anonymous\x22 response-type=\x22arraybuffer\x22 id=\x22" + 
                        actionModel.modelID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";  
                        console.log("adding actionModel :" + actionModel.modelName);
                    }
                }
            }

            for (let i = 0; i < sceneModelLocations.length; i++) {
                let locMdl = sceneModelLocations[i];
                var scale = 1;
                var offsetPos = "";
                var rotAnim = "";
                var posAnim = "";
                var ambientChild = "";
                // var ambientOffset = "";
                // let objAnim = "animation-mixer"; //to blend the canned ones, and/or obj anims set below
                let objAnim = ""; //no, must do this from component
                let cannedAnim = "";
                var rightRot = true;
                var rotVal = 360;
                let max = .6;
                let min = 1.2;
                let speed = Math.random() * (max - min) + min;
                let maxR = 0;
                let minR = 360;
                let randomR = Math.random() * (maxR - minR) + minR;
                let assetUserID = "";
                let entityType = ""; //used to set entity id
                let followCurve = "";

                let usdzFiles = '';
                let modelParent = "";
                let locationTags = locMdl.locationTags;
                if (sceneResponse.sceneUseDynCubeMap) {
                    skyboxEnvMap = "skybox-env-map shadow=\x22cast:true; receive:true\x22";   
                }
                if (locMdl.eventData == undefined) {
                    locMdl.eventData = "";
                }

                // if ((locMdl.eventData != null && locMdl.eventData != undefined && locMdl.eventData.length > 1) && (!locMdl.eventData.includes("noweb"))) {

                //filter out cloudmarker types
                // console.log(locMdl.modelID + " locname " + locMdl.name + " timestamp " + locMdl.timestamp + " markerType " + locMdl.markerType + " sceneModels " + JSON.stringify(sceneResponse.sceneModels));
                if (locMdl.modelID != undefined && locMdl.modelID != "undefined" && locMdl.modelID != "none" && locMdl.modelID != "" && locMdl.markerType != "placeholder"
                    && ObjectId.isValid(locMdl.modelID) //easier to say what it is rather than isn't...
                    && locMdl.markerType != "poi"
                    && locMdl.markerType != "waypoint"                                
                    && locMdl.markerType != "trigger"
                    && locMdl.markerType != "spawntrigger"
                    && locMdl.markerType != "gate"
                    && locMdl.markerType != "mailbox"
                    && locMdl.markerType != "portal" 
                    && locMdl.markerType != "collider"
                    && locMdl.markerType != "text") { 
                    
                    const m_id = ObjectId.createFromHexString(locMdl.modelID.toString());
                    const locmdlquery = {"_id": m_id};
                    
                    let model = await RunDataQuery("models", "findOne", locmdlquery);
                    console.log("tryna find model " + m_id + " " + JSON.stringify(model));
                    if (model != null && model.item_type && model.item_type == "glb") {
                        let modelURL = "";
                        modelURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                        
                        // console.log("lodMdl.eventData " + locMdl.eventData);
                        assetNumber++;
                        let newAttribution = {};
                        newAttribution.name = model.name;
                        newAttribution._id = model._id;
                        newAttribution.contentType = model.item_type;
                        newAttribution.sourceTitle = model.sourceTitle;
                        newAttribution.sourceLink = model.sourceLink;
                        newAttribution.authorName = model.authorName;
                        newAttribution.authorLink = model.authorLink;
                        newAttribution.license = model.license;
                        newAttribution.sourceText = model.sourceText;
                        newAttribution.modifications = model.modifications;
                        attributions.push(newAttribution);
                    
                        var navmesh = "";
                        var m_assetID = "gltfasset" + assetNumber;
                        let rx = locMdl.eulerx != null ? locMdl.eulerx : 0; 
                        let ry = locMdl.eulery != null ? locMdl.eulery : 0; 
                        let rz = locMdl.eulerz != null ? locMdl.eulerz : 0; 
                        let rotation = rx + " " + ry + " " + rz;
                        if (ry == 99) {
                            ry = randomR;
                            rotation = rx + " " + ry + " " + rz;
                        }
                        if (locMdl.markerObjScale != null) {
                            scale = locMdl.markerObjScale;  //deprecated for non-u scale factors, but maybe not unused...
                        }
                        if (locMdl.markerType == "follow ambient")  {
                            ambientChild = "ambientChild"; //follow ambient obj
                        }
                        if (locMdl.markerType == "follow curve" || (locMdl.eventData != null && locMdl.eventData != undefined && locMdl.eventData.length > 1 && locMdl.eventData.toString().toLowerCase().includes("follow curve")))  {
                            followCurve = "mod_curve=\x22init: true\x22";  //hrm, add a bunch of params here...
                            if (locMdl.markerType == "picture group") {
                                //?
                            }
                        }
                        if (locMdl.markerType == "follow random path") {
                            followCurve = "mod_random_path=\x22init: true\x22"  //hrm, add a bunch of params here...
                        }
                        if (locMdl.markerType == "follow parametric curve") {
                            let reverse = false;
                            if (locMdl.eventData && locMdl.eventData.toLowerCase().includes("reverse")) {
                                reverse = true;
                            }
                            followCurve = "curve-follow=\x22curveData: #p_path; type: parametric_curve; reverse: "+reverse+"; duration: 64; loop: true;\x22";
                        }
                        if (locMdl.markerType && locMdl.markerType == "navmesh") { //use the same one for simple and pathfinding modes
                            console.log("gotsa navmesh WITH MODEL !!!!!");
                            let visible = false;
                            if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                                visible = true;
                            }
                            navmeshAsset = "<a-asset-item id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";        
                            navmeshEntity = "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller visible=\x22"+visible+"\x22 gltf-model=\x22#" + m_assetID + "\x22></a-entity>"; //simple navmesh uses it too!
                        }   
                        if (locMdl.eventData != null && locMdl.eventData != undefined && locMdl.eventData.length > 1) { //eventData has info
                            
                            if (locMdl.eventData.toLowerCase().includes("marker")) {
                                modelParent = "parent-to=\x22tracking: marker\x22";
                            }
                            if (locMdl.eventData.toLowerCase().includes("spawn")) {
                                arMode = "spawn";
                            }
                            if (locMdl.eventData.toLowerCase().includes("navmesh")) { //use the same one for simple and pathfinding modes
                                    let visible = false;
                                    if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                                        visible = true;
                                    }
                                    navmeshAsset = "<a-asset-item id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";        
                                    navmeshEntity = "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller visible=\x22"+visible+"\x22 gltf-model=\x22#" + m_assetID + "\x22></a-entity>"; //maybe id=nav-mesh so simple navmesh can use it too?
                            }
                            
                            rightRot = !rightRot;
                            if (rightRot == true) {
                                rotVal = -360;
                            }
                            var eSplit = locMdl.eventData.split("~");
                            if (eSplit[0] == "orbit") { 
                                offsetPos =  "<a-entity position=\x22"+ eSplit[1] + " 0 0\x22></a-entity>";
                                cannedAnim = "animation=\x22property: rotation; to: 0 " + (ry - 360) + " 0; loop: true; dur: 10000\x22";

                            } else if (locMdl.eventData.includes("rotate")) {
                                let duration = 50000;
                                if (locMdl.eventData.includes("slow"))
                                duration = 100000;
                                if (locMdl.eventData.includes("fast"))
                                duration = 10000;
                                cannedAnim = "animation=\x22property: rotation; to: 0 360 0; loop: true; dur: "+duration+"\x22";
                                if (locMdl.eventData.includes("-rotate"))
                                cannedAnim = "animation=\x22property: rotation; to: 0 -360 0; loop: true; dur: "+duration+"\x22";
                            } else {
                                objAnim = "";
                            }
                            if (locMdl.eventData.includes("ground")) {
                                locMdl.y = 0; //hrm, get the scene ground level...
                            }
                            if (eSplit[0] == "yoyo" || eSplit[1] == "yoyo") {
                                cannedAnim = "animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true; to: "+locMdl.x+" "+(parseFloat(locMdl.y) + 2)+" "+locMdl.z+"\x22";
                            }
                            posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;";
                            if (locMdl.eventData.toLowerCase().includes("ambientchild"))  {
                                ambientChild = "ambientChild"; //follow ambient obj
                            }
                            // if (locMdl.eventData.toLowerCase().includes("beat"))  {
                            //     ambientChild = ambientChild + " beatscale "; //follow ambient obj
                            // }
                            if (locMdl.eventData.toLowerCase().includes("scatter"))  {
                                // ambientChild = "ambientChild"; //follow ambient obj
                            }
                        }

                        /////////////////////////////// marker types and filters /////////////////////////////////
                        if (locMdl.markerType != null && locMdl.markerType != undefined && locMdl.markerType.length > 1) {  
                            entityType = locMdl.markerType; //e.g. "target"
                            if (entityType == "poi") { //bc location-fu looks for this class to get gpsElements, so this causes dupes
                                entityType = "model";
                            }
                            if (locMdl.markerType == "surface") {
                                entityType = "surface";
                            }
                            if (locMdl.markerType == "navmesh") {
                                // entityType = "navmesh";
                                useNavmesh = true;
                            }

                        }
                        /////////////////////////////// Geographic location types w/ lat/lng
                        if (locMdl.type.toLowerCase() == "geographic" && locMdl.latitude != null && locMdl.longitude != null && locMdl.latitude != 0 && locMdl.longitude != 0) { 
                            console.log(" lat/lng model " + JSON.stringify(locMdl));
                            gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + locMdl.modelID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                            gltfsEntities = gltfsEntities + "<a-entity class=\x22geo\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 data-scale=\x22"+scale+"\x22 mod_model=\x22markerType: "+
                            locMdl.markerType+"; timestamp: "+locMdl.timestamp+"; tags: "+locationTags+"; scale:"+scale;+"; name:"+locMdl.name+"; eventData:"+locMdl.eventData+";\x22 class=\x22gltf "+entityType+" "+ambientChild+" activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+geoEntity+"=\x22latitude: "+locMdl.latitude+
                            "; longitude: "+locMdl.longitude+";\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+" rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";

                        } else { ///NOT positioned by lat/lng

                            let zFix = parseFloat(locMdl.z); //nope
                            if (!locMdl.markerObjScale || locMdl.markerObjScale == undefined || locMdl.markerObjScale == "") {
                                locMdl.markerObjScale = 1;
                            }
                            if (!locMdl.xscale || locMdl.xscale == undefined || locMdl.xscale == "") {
                                locMdl.xscale = locMdl.markerObjScale;
                            }
                            if (!locMdl.yscale || locMdl.yscale == undefined || locMdl.yscale == "") {
                                locMdl.yscale = locMdl.markerObjScale;
                            }
                            if (!locMdl.zscale || locMdl.zscale == undefined || locMdl.zscale == "") {
                                locMdl.zscale = locMdl.markerObjScale;
                            }

                            gltfsAssets = gltfsAssets + "<a-asset-item class=\x22gltfAssets\x22 id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                            
                            // let yRot 
                            let scatterSurface = "";
                            let brownian = "";
                            // let id = "gltf_" + m_assetID;  /////THIS CHANGE COULD BREAK THINGS??? don't think so, but....
                            let id = locMdl.timestamp;
                            if (locMdl.markerType == "surface" || locMdl.eventData.toLowerCase().includes("surface")) {
                                scatterSurface = "scatter-surface";
                                id = 'scatterSurface';
                                entityType = "surface";
                            }

                            let modModel = "mod_model=\x22markerType: "+locMdl.markerType+"; modelName: "+locMdl.model+"; xscale:"+locMdl.xscale+"; yscale:"+locMdl.yscale+"; zscale:"+locMdl.zscale+"; xpos:"+
                            locMdl.x+"; ypos:"+locMdl.y+"; zpos:"+locMdl.z+"; timestamp: "+locMdl.timestamp+"; tags: "+locMdl.locationTags+"; scale:"+locMdl.markerObjScale+"; name:"+
                            locMdl.name+"; description:"+locMdl.description+"; eventData:"+locMdl.eventData+"; modelID:"+m_assetID+";\x22";
                            
                            //////////   DEFAULT not instanced, normal placement
                            if (!locMdl.eventData.toLowerCase().includes("instanc")) {  //NOT "scatter" anymore, see mod_models
                                let physicsMod = "";
                                let shape = 'hull';
                                let groundMod = "";
                                // console.log("locMdl deets " + JSON.stringify(locMdl));
                                if (locMdl.eventData.toLowerCase().includes('physics')){ //ammo for now // no add in mod_model (where model isloaded)
                                    //hrm, maybe 
                                }
                                if (locMdl.eventData.toLowerCase().includes("shader")) {
                                    if (locMdl.eventData.toLowerCase().includes("noise")) {
                                        console.log("TRYNA PUT A SHADER@@");
                                        // modMaterial = "material=\x22shader: noise;\x22";
                                        modModel = "mod_model=\x22markerType: "+locMdl.markerType+"; timestamp: "+locMdl.timestamp+"; tags: "+locMdl.locationTags+"; name: "+locMdl.name+"; eventData:"+locMdl.eventData+"; shader: noise\x22";
                                        let vertexShader  = requireText('../main/src/shaders/noise1_vertex.glsl', require);
                                        let fragmentShader = requireText('../main/src/shaders/noise1_fragment.glsl', require);
                                        shaderScripts = "<script type=\x22x-shader/x-vertex\x22 id=\x22noise1_vertex\x22>"+vertexShader+"</script>"+
                                        "<script type=\x22x-shader/x-fragment\x22 id=\x22noise1_fragment\x22>"+fragmentShader+"</script>";
                                    }
                                }
                                if (locMdl.markerType == "brownian path" || locMdl.markerType == "brownian motion") {
                                    scale = locMdl.yscale != null ? locMdl.yscale : 1;
                                    if (locMdl.markerType == "brownian path") {

                                        brownian = "brownian_path=\x22lineEnd:100000;lineStep:100;count:33;object:#thing-to-clone;positionVariance:88 33 86;spaceVectorOffset:101.1,100,100.2,101.2,100,100.3;rotationFollowsAxis:x;speed:0.01;\x22";
                                        
                                        gltfsEntities = gltfsEntities + "<a-gltf-model shadow src=\x22#"+m_assetID+"\x22 id=\x22thing-to-clone\x22 visible=\x22true\x22></a-gltf-model>"+
                                        "<a-entity "+brownian+
                                        " shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" position=\x22"+locMdl.x+" "+locMdl.y+" "+zFix+"\x22 scale=\x22"+scale+
                                        " "+scale+" "+scale+"\x22 data-scale=\x22"+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                    } else if (locMdl.markerType == "brownian motion") {
                                        brownian = "brownian-motion=\x22speed:0.1;rotationVariance:.2 .2 .2;positionVariance:2.5 5 2.5;spaceVector:10.1,20.1,30.1,10.1,20.1,30.1;\x22";
                                        
                                        gltfsEntities = gltfsEntities + "<a-entity id=\x22"+id+"\x22 "+brownian+" "+followCurve+" "+physicsMod+" "+modelParent+" "+scatterSurface+" "+modModel+" class=\x22envMap gltf "+entityType+" "+ambientChild+
                                        " activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+
                                        " position=\x22"+locMdl.x+" "+locMdl.y+" "+zFix+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 data-scale=\x22"+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>"; 
                                        gltfModel = modelURL;
                                    }
                                    
                                } else { //DEFAULT entity conf (doesn't use brownian)

                                    if (useArParent || (locMdl.locationTags && (locMdl.locationTags.includes("ar child") || locMdl.locationTags.includes("archild")))) {
                                        console.log("GOTSA AR TARGET ELEMENT");
                                        arChildElements = arChildElements + "<a-entity id=\x22"+id+"\x22 "+followCurve+" "+physicsMod+" "+modelParent+" "+scatterSurface+" "+modModel+" class=\x22envMap gltf "+entityType+" "+ambientChild+
                                        " activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+
                                        " position=\x22"+locMdl.x+" "+locMdl.y+" "+zFix+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 data-scale=\x22"+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>"; 
                                        gltfModel = modelURL;
                                    } else {
                                        gltfsEntities = gltfsEntities + "<a-entity id=\x22"+id+"\x22 "+followCurve+" "+physicsMod+" "+modelParent+" "+scatterSurface+" "+modModel+" class=\x22envMap gltf "+entityType+" "+ambientChild+
                                        " activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+
                                        " position=\x22"+locMdl.x+" "+locMdl.y+" "+zFix+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 data-scale=\x22"+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>"; 
                                        gltfModel = modelURL;
                                    }
                                }
                                //INSTANCING (cloned) placement instancing + surface scattering
                            } else { 
                                console.log("!!!!tryna instance so0methings!@ " + JSON.stringify(locMdl));
                                let instancing = "instanced_meshes_mod=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+";\x22";

                                let interaction = "";
                                if ((locMdl.locationTags && locMdl.locationTags.includes("select")) || (locMdl.locationTags && locMdl.locationTags.includes("click"))){
                                    interaction = " interaction: select; ";
                                }
                                console.log("instancing interaction " + interaction + " TAGS " + locMdl.locationTags);
                                let objectRef = "";
                                scale = locMdl.yscale != null ? locMdl.yscale : 1;

                                //TODO if there's a mediaID w/ tagMap, do that length... and use locations?
                                if (locMdl.objectID) {
                                    console.log("locMdl WITH OBJECT ID!!!" + locMdl.objectID);
                                } 
                                if (locMdl.eventData.toLowerCase().includes("everywhere")) {
                                    
                                    if (locMdl.tags && locMdl.tags.includes('growpop')) { //tags not eventdata?
                                        interaction = " interaction: growpop; ";
                                    } else if (locMdl.tags && locMdl.tags.includes('shrinkpop')) {
                                        interaction = " interaction: shrinkpop; ";
                                    } else if (locMdl.tags && locMdl.tags.includes('wiggle')) {
                                        interaction = " interaction: wiggle; ";
                                    }
                                }
                                if (locMdl.eventData.toLowerCase().includes("grass") || (locMdl.locationTags && locMdl.locationTags.includes("grass")) ) {
                                    instancing = "instanced_surface_meshes=\x22_id: "+locMdl.modelID+"; tags: grass; modelID: "+m_assetID+"; yMod: "+locMdl.y+"; count: 3000; scaleFactor: "+scale+"\x22";
                                } else if (locMdl.eventData.toLowerCase().includes("plants")) {
                                    instancing = "instanced_surface_meshes=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+"; yMod: "+locMdl.y+"; count: 500; scaleFactor: 8\x22";
                                } else if (locMdl.eventData.toLowerCase().includes("shrooms")) {
                                    instancing = "instanced_surface_meshes=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+"; yMod: "+locMdl.y+"; count: 50; scaleFactor: 2\x22";
                                } else if (locMdl.eventData.toLowerCase().includes("rocks")) {
                                    instancing = "instanced_surface_meshes=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+"; yMod: "+locMdl.y+"; count: 200; scaleFactor: 32\x22";
                                } else if (locMdl.eventData.toLowerCase().includes("~")) {
                                    let split = locMdl.eventData.split("~");
                                    if (split.length) {
                                        instancing = "instanced_surface_meshes=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+"; "+interaction+" objectID: "+locMdl.objectID+"; yMod: "+locMdl.y+"; count: "+split[1]+"; scaleFactor: "+scale+"; tags: "+locMdl.locationTags+"\x22";
                                        // console.log("!!!tryna spoolit scatter dasta..." + instancing);
                                        if (locMdl.eventData.toLowerCase().includes("everywhere")) {
                                            instancingEntity = instancingEntity + "<a-entity instanced_meshes_sphere=\x22_id: "+locMdl.modelID+"; modelID: "+m_assetID+"; "+interaction+" tags: "+locMdl.locationTags+"\x22></a-entity>";
                                        }
                                        if (locMdl.eventData.toLowerCase().includes("physics")) {
                                            instancingEntity = instancingEntity + "<a-entity scatter_physics=\x22_id: "+locMdl.modelID+"; count: "+split[1]+"; scaleFactor: "+scale+"; modelID: "+m_assetID+"; "+interaction+" tags: "+locMdl.locationTags+"\x22></a-entity>";
                                    
                                        }
                                    }
                                    let modelString = "gltf-model=\x22#" + m_assetID + "\x22";
                                    let jsonDataBuff = "";
                                    let jsonID = "";
                                    if (locMdl.mediaID) {
                                        jsonID = locMdl.mediaID;
                                        // const mID = convertStringToObjectID(locMdl.mediaID);
                                        // const mediaquery = {"_id": mID};
                                        // let mediaData = await RunDataQuery("text_items", "findOne", mediaquery);

                                        // console.log("mediaData " + JSON.stringify(mediaData));
                                        // jsonDataBuff = Buffer.from(JSON.stringify(mediaData)).toString("base64");
                                    }
                                    // let jsonData = "data-json=" + buff
                                    gltfsEntities = gltfsEntities + "<a-entity id=\x22"+id+"\x22 "+modelString+" "+instancing+" class=\x22"+entityType+
                                    " activeObjexGrab activeObjexRay\x22 data-json=\x22"+jsonID+"\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+
                                    " position=\x220 -200 0\x22></a-entity>";//scatter model below //nm, just load it from here w/ modelString
                                    gltfModel = modelURL;
                                    
                                }
                            }

                            // if (locMdl.markerType == "navmesh") {
                            //     let visible = false;
                            //     if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                            //         visible = true;
                            //     }
                            //     if (useArParent || (locMdl.locationTags && (locMdl.locationTags.includes("ar child") || locMdl.locationTags.includes("archild")))) {
                            //         arChildElements = arChildElements + "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller=\x22useDefault: true;\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                            //     } else {
                            //         navmeshEntity = "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller=\x22useDefault: true;\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                            //     }
                            // }
                            // if (locMdl.markerType == "surface") {
                            //     let visible = false;
                            //     if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                            //         visible = true;
                            //     }
                            //     if (useArParent || (locMdl.locationTags && (locMdl.tags.includes("ar child") || locMdl.tags.includes("archild")))) {
                            //         arChildElements = arChildElements + "<a-entity class=\x22surface\x22 id=\x22scatterSurface\x22 scatter-surface-default=\x22arChild: true;\x22 rotation=\x22-90 0 0\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                            //     } else {
                            //         surfaceEntity = "<a-entity class=\x22surface\x22 id=\x22scatterSurface\x22 scatter-surface-default rotation=\x22-90 0 0\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                            //     }
                            // }   
                        } //not geo

                    } else {
                        
                     
                        if (model != null && model.item_type == "usdz") {//not locmdl glb
                        
                            let modelURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/usdz/" + model.filename, 6000);
                            console.log("non-gltf modelURL " + modelURL + " modelType " + model.item_type);
                            usdzFiles = modelURL;
                            
                            loadUSDZ = "ready(function(){\n" +
                            "let usdzDataEntity = document.getElementById(\x22usdzData\x22);\n"+
                            "usdzDataEntity.setAttribute(\x22usdz\x22, \x22usdzData\x22, \x22"+usdzFiles+"\x22);\n"+ 
                            "});";
                            usdzModel = modelURL;
                            
                        } else if (model != null && model.item_type == "splat") {//not locmdl glb
                        
                            //TODO SPLATTING!
                        }

                        
                    }
                
                } else {//end locmdl valid 

                    ///////////// set default navmesh and surface ///////////////

                    } if ((locMdl.model == null || locMdl.modelID == "none") && locMdl.markerType == "navmesh") {
                        let visible = false;
                        if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                            visible = true;
                        }
                        if (useArParent || (locMdl.locationTags && (locMdl.locationTags.includes("ar child") || locMdl.locationTags.includes("archild")))) {
                            arChildElements = arChildElements + "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller=\x22useDefault: true;\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                        } else {
                            console.log("TRYNA COOK A CANNNED NAVMESH");
                            navmeshEntity = "<a-entity id=\x22nav-mesh\x22 nav-mesh nav_mesh_controller=\x22useDefault: true;\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                        }
                    }
                    if ((locMdl.model == null || locMdl.modelID == "none") && locMdl.markerType == "surface") {
                      
                        let visible = false;
                        if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('debug'))) {
                            visible = true;
                        }
                        if (useArParent || (locMdl.locationTags && (locMdl.tags.includes("ar child") || locMdl.tags.includes("archild")))) {
                            arChildElements = arChildElements + "<a-entity class=\x22surface\x22 id=\x22scatterSurface\x22 scatter-surface-default=\x22arChild: true;\x22 rotation=\x22-90 0 0\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                        } else {
                            // console.log("TRYNA COOK A CANNED SURFACE");
                            surfaceEntity = "<a-entity class=\x22surface\x22 id=\x22scatterSurface\x22 scatter-surface-default rotation=\x22-90 0 0\x22 visible=\x22"+visible+"\x22></a-entity>"; //use big circle if no defined navmesh
                        }
                    } 
            } //end locmdl for loop
            
            ///////////////////////////////
            if (attributions != null && attributions != undefined && attributions.length > 0) {
                attributionsObject.attributions = attributions;
                let attrib64 = Buffer.from(JSON.stringify(attributionsObject)).toString("base64");
                attributionsTextEntity = attributionsTextEntity + "<a-entity id=\x22attributionsEntity\x22 data-attributions=\x22"+attrib64+"\x22 attributions_text_control></a-entity>";
            }
            ///////////
            // if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") { 
               
            //             nextSceneLink = "href=\x22../" + scene.short_id + "\x22";    
                
            // } else {
            //     nextSceneLink = "href=\x22#\x22";    
            //     // sceneNextScene = "4K94Gjtw7";
            // }
            // if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
            //     db.scenes.findOne({$or: [ { short_id: sceneResponse.scenePreviousScene }, { sceneTitle: sceneResponse.scenePreviousScene } ]}, function (err, scene) {
            //         if (scene == err) {
            //             // console.log("didn't find prev scene");
            //         } else {
            //             prevSceneLink = "href=\x22../" + scene.short_id + "/index.html\x22";    
            //         }
            //     }); 
            // }
            ////////////////
            if (sceneResponse.sceneText != null && sceneResponse.sceneText != "" && sceneResponse.sceneText.length > 0) {
                
                if (!textLocation.length > 0) {textLocation = "-10 1 -5";}
                let mainText = sceneResponse.sceneText.replace(/([\"]+)/gi, '\'');
                mainText = mainText.replace(/([\;]+)/gi, '\:');
                let maintext64 = Buffer.from(JSON.stringify(sceneResponse.sceneText)).toString("base64");
                textEntities = textEntities + "<a-entity look-at=\x22#player\x22 scale=\x22.25 .25 .25\x22 position=\x22"+textLocation+"\x22>"+
                "<a-entity "+skyboxEnvMap+" id=\x22mainTextToggle\x22 class=\x22envMap activeObjexRay\x22 position=\x220 -1 .5\x22 toggle-main-text  gltf-model=\x22#exclamation\x22></a-entity>"+
                "<a-entity id=\x22mainTextPanel\x22 visible='false' position=\x220 0 0\x22>" +
                "<a-entity id=\x22mainTextHeader\x22 visible='false' position=\x225 9.75 0\x22></a-entity>" +
                "<a-entity id=\x22mainText\x22 data-maintext='"+maintext64+"' main-text-control=\x22font: "+sceneResponse.sceneFontWeb1+"; mainTextString: ; mode: "+sceneResponse.scenePrimaryTextMode+"\x22 position=\x22-5 9.25 0\x22></a-entity>" +
                "<a-entity visible='false' class=\x22envMap activeObjexRay\x22 id=\x22nextMainText\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x223 -1 2\x22></a-entity>" +
                "<a-entity visible='false' class=\x22envMap activeObjexRay\x22 id=\x22previousMainText\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-3 -1 2\x22></a-entity>" +
                "<a-entity gltf-model=\x22#square_panel\x22 scale=\x226 6 6\x22 position=\x220 5 -.5\x22></a-entity>" +
                "</a-entity></a-entity></a-entity>"; 
            }
            if (sceneResponse.sceneTextItems != null && sceneResponse.sceneTextItems != undefined && sceneResponse.sceneTextItems != "") {

                sceneTextData = "<a-entity scene_text_control id=\x22sceneTextData\x22 data-attribute=\x22"+sceneResponse.sceneTextItems+"\x22></a-entity>"; //this does a fetch clientside using the IDs in data-attribute

                if (sceneResponse.sceneWebType != "HTML from Text Item") { //if it's not just a regular html page...
                    for (let i = 0; i < sceneTextLocations.length; i++) {  
                        let textID = sceneTextLocations[i].description; //check desc for id, if not then event data
                        if (!textID || textID.length < 5) {
                            textID = sceneTextLocations[i].eventData;
                        }
                        console.log("tryna get svg " + textID);
                        if (textID && textID.length > 5) { 
                            if (sceneTextLocations[i].markerType == "svg canvas billboard") {
                            
                                let oid = ObjectId.createFromHexString(textID.toString());
                                const query = {"_id": oid};
                                const text_item = await RunDataQuery("text_items", "findOne", query);    
                                if (text_item.type == "SVG Document") {
                                    // console.log("gots svgItem : " + JSON.stringify(text_item));
                                    let scale = 1;

                                    sceneTextItemData = sceneTextItemData + "<canvas class=\x22canvasItem\x22 id=\x22svg_canvas_"+textID+"\x22 style=\x22text-align:center;\x22 width=\x221024\x22 height=\x221024\x22></canvas>"+
                                    "<div style=\x22visibility: hidden\x22 class=\x22svgItem\x22 id=\x22svg_item_"+textID+"\x22 data-attribute=\x22"+text_item._id+"\x22>"+text_item.textstring+"</div>"; //text string is an svg

                                    proceduralEntities = proceduralEntities + " <a-plane loadsvg=\x22id:"+textID+"; description: "+sceneTextLocations[i].description+"; eventdata: "+sceneTextLocations[i].eventData+"; tags:  "+sceneTextLocations[i].locationTags+"\x22 id=\x22svg_"+sceneTextLocations[i].timestamp+
                                    "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneTextLocations[i].x + " " + sceneTextLocations[i].y + " " + sceneTextLocations[i].z+"\x22></a-plane>";
                                }
                            } else if (sceneTextLocations[i].markerType == "svg billboard") {
                                console.log("tryna get svg billboard " + textID);
                                let oid = ObjectId.createFromHexString(textID.toString());
                                const query = {"_id": oid};
                                const text_item = await RunDataQuery("text_items", "findOne", query);
                                

                                if (text_item.type == "SVG Document") {
                                    let scale = 1;
                                    proceduralEntities = proceduralEntities + " <a-entity load_threesvg=\x22id:"+textID+"; description: "+sceneTextLocations[i].description+"; eventdata: "+sceneTextLocations[i].eventData+"; tags:  "+sceneTextLocations[i].locationTags+"\x22 id=\x22svg_"+sceneTextLocations[i].timestamp+
                                    "\x22 look-at=\x22#player\x22 width=\x22"+scale+"\x22 height=\x22"+scale+"\x22 position=\x22"+sceneTextLocations[i].x + " " + sceneTextLocations[i].y + " " + sceneTextLocations[i].z+"\x22></a-entity>";
                                }
                            } else { //just "plain" text for now...//TODO markup? urdf? //nm do it clientside
                            
                            }
                        }
                    } 
                } else { //if it's an html...
                    console.log("Tryna fetch scenetextitem " + sceneResponse.sceneTextItems);
                    let oid = ObjectId.createFromHexString(sceneResponse.sceneTextItems.toString());
                    const query = {"_id": oid};
                    const text_item = await RunDataQuery("text_items", "findOne", query);
                    sceneTextItemData = text_item.textstring; // html with the trimmings...
                }
            }

            ////////////// audio //////////////////
            const audioquery = {"_id": {$in: requestedAudioItems }};
            const audio_items = await RunDataQuery("audio_items", "find", audioquery);
            
            for (var i = 0; i < audio_items.length; i++) { 
                var item_string_filename = JSON.stringify(audio_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 1000);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                
                var mp3Name = baseName + '.mp3';
                var oggName = baseName + '.ogg';
                var pngName = baseName + '.png';
                
                if (sceneResponse.scenePrimaryAudioID != undefined && audio_items[i]._id == sceneResponse.scenePrimaryAudioID) {
                    primaryAudioTitle = audio_items[i].title;
                    primaryAudioObject = audio_items[i];
                    mp3url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                    oggurl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                    pngurl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName, 6000);
                    primaryAudioWaveform = pngurl;
                    pAudioWaveform = "<img id=\x22primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 src=\x22"+primaryAudioWaveform+"\x22>";
                }
                if (sceneResponse.sceneAmbientAudioID != undefined && audio_items[i]._id == sceneResponse.sceneAmbientAudioID) {
                    ambientOggUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                    ambientMp3Url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                }                        
                if (sceneResponse.sceneTriggerAudioID != undefined && audio_items[i]._id == sceneResponse.sceneTriggerAudioID) {
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
            } //end for audio_items loop

            if (sceneResponse.scenePrimaryAudioID != null && sceneResponse.scenePrimaryAudioID.length > 4) {
                hasPrimaryAudio = true;
            }
            if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 4) {
                console.log("hasPrimaryAudioStream " + sceneResponse.scenePrimaryAudioStreamURL);
                hasPrimaryAudioStream = true;
                hasPrimaryAudio = false;
                transportButtons = "<div id=\x22transport_play_button\x22 class=\x22dialog_button\x22 style=\x22color: rgba(255, 255, 255, 0.75); float: left; margin: 10px 50px;\x22 ><i class=\x22fas fa-play-circle fa-2x\x22></i></div>";

            }
            if (hasPrimaryAudioStream || hasPrimaryAudio) {
                if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                    primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;    
                } 
                
            }
            if (sceneResponse.sceneAmbientAudioID != null && sceneResponse.sceneAmbientAudioID.length > 4) {
                hasAmbientAudio = true;
            }
            if (sceneResponse.sceneTriggerAudioID != null && sceneResponse.sceneTriggerAudioID.length > 4) {
                hasTriggerAudio = true;
            }
            if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;
               
            }
            if (sceneResponse.scenePrimaryVolume != null) {
                scenePrimaryVolume = sceneResponse.scenePrimaryVolume;
            }
            if (sceneResponse.sceneAmbientVolume != null) {
                sceneAmbientVolume = sceneResponse.sceneAmbientVolume;
            }
            if (sceneResponse.sceneTriggerVolume != null) {
                sceneTriggerVolume = sceneResponse.sceneTriggerVolume;
            }
            if (hasSynth) {
                synthScripts = "<script src=\x22../main/src/synth/Tone.js\x22></script><script src=\x22../main/js/synth.js\x22></script>";
            }
            if (hasPrimaryAudio) {
                if (mp3url.length > 8) {
                    let html5 = "html5: true,";
                    if (sceneResponse.scenePrimaryAudioVisualizer == true) {  //audio analysis won't work in html5 mode
                        html5 = "html5: false,";
                    } 
                    primaryAudioScript = "<script>\n" +      
                    "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                            "src: [\x22"+oggurl+"\x22,\x22"+mp3url+"\x22], "+html5+" ctx: true, volume: 0," + loopable +
                        "});" +
                    "primaryAudioHowl.load();</script>";
                    primaryAudioEntity = "<a-entity id=\x22primaryAudioParent\x22 look-at=\x22#player\x22 position=\x22"+audioLocation+"\x22>"+ //parent, no window click
                    
                    "<a-entity gltf-model=\x22#backpanel_horiz1\x22 position=\x220 0 0\x22 material=\x22color: black; transparent: true;\x22></a-entity>" +
                    "<a-entity position=\x220 -1.25 0\x22 primary_audio_player id=\x22primaryAudioPlayer\x22 gltf-model=\x22#audioplayer\x22></a-entity>"+
                    "<a-entity id=\x22primaryAudioText\x22 position=\x22.75 .6 -1\x22 "+
                    "text=\x22value:Click to play;\x22></a-entity>"+
                    "<a-entity id=\x22primaryAudio\x22 primary_audio_control=\x22oggurl: "+oggurl+"; mp3url: "+mp3url+"; audioID: "+sceneResponse.scenePrimaryAudioID+"; volume: "+scenePrimaryVolume+"; audioevents:"+sceneResponse.scenePrimaryAudioTriggerEvents+"; targetattach:"+sceneResponse.sceneAttachPrimaryAudioToTarget+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                    "title: "+primaryAudioTitle+"\x22>"+
                    
                    "</a-entity>"+
                    
                    "</a-entity>";
                    modelAssets = modelAssets + "<a-asset-item id=\x22backpanel_horiz1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/backpanel_horiz1.glb\x22></a-asset-item>\n";
                    if (sceneResponse.scenePrimaryAudioTriggerEvents) {
                        var buff = Buffer.from(JSON.stringify(primaryAudioObject)).toString("base64");
                        loadAudioEvents = "<a-entity primary_audio_events id=\x22audioEventsData\x22 data-audio-events='"+buff+"'></a-entity>"; 
                    }
                }
            }
            if (hasPrimaryAudioStream) {
                mp3url = sceneResponse.scenePrimaryAudioStreamURL;   
                oggurl = sceneResponse.scenePrimaryAudioStreamURL;                    
                streamPrimaryAudio = true;
                primaryAudioScript = "<script>Howler.autoUnlock = false;" + //override if streaming url
                "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                        "src: \x22"+sceneResponse.scenePrimaryAudioStreamURL+"\x22, html5: true, volume: 0, format: ['mp3', 'aac']" +
                    "});" +
                "</script>";
                primaryAudioEntity = "<a-entity id=\x22primaryAudioParent\x22 look-at=\x22#player\x22 position=\x22"+audioLocation+"\x22>"+ //parent
                "<a-entity id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .5\x22 position=\x220 .5 2.5\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22"+
                "text=\x22value:Click to play;\x22></a-entity>"+
                "<a-entity id=\x22primaryAudioTextBackground\x22 gltf-model=\x22#landscape_panel\x22 scale=\x22.2 .1 .1\x22 position=\x220 .5 2.4\x22 material=\x22color: black; transparent: true; opacity: 0.1\x22></a-entity>" +
                "<a-entity id=\x22primaryAudio\x22 mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 entity-callout=\x22calloutString: play/pause\n" + primaryAudioTitle+ ";\x22 primary_audio_control=\x22oggurl: "+oggurl+"; mp3url: "+mp3url+"; volume: "+scenePrimaryVolume+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                "title: "+primaryAudioTitle+"\x22  geometry=\x22primitive: sphere; radius: .25;\x22 material=\x22shader: noise;\x22 position=\x220 0 2.6\x22></a-entity></a-entity>";
                if (sceneResponse.scenePrimaryAudioTriggerEvents) { //maybe pass a do not listen?
                    var buff = Buffer.from(JSON.stringify(primaryAudioObject)).toString("base64");
                    loadAudioEvents = "<a-entity primary_audio_events id=\x22audioEventsData\x22 data-audio-events='"+buff+"'></a-entity>"; 
                }
            }
            if (hasAmbientAudio) {
                ambientAudioScript = "<script>" +      
                "let ambientAudioHowl = new Howl({" + //inject howler for non-streaming
                        "src: [\x22"+ambientOggUrl+"\x22,\x22"+ambientMp3Url+"\x22], volume: 0, loop: true" + 
                    "});" +
                "ambientAudioHowl.load();</script>";
                let ambientPosAnim = "animation__yoyo=\x22property: position; to: -25 1 0; dur: 60000; dir: alternate; easing: easeInSine; loop: true;\x22 ";
                let ambientRotAnim = "animation__rot=\x22property:rotation; dur:60000; to: 0 360 0; loop: true; easing:linear;\x22 ";        
                ambientAudioEntity = "<a-entity "+ambientRotAnim+"><a-entity id=\x22ambientAudio\x22 ambient_audio_control=\x22oggurl: "+ambientOggUrl+"; mp3url: "+ambientMp3Url+";\x22 volume: "+sceneAmbientVolume+"; "+
                ambientPosAnim+" position=\x2225 1 0\x22>" +
                "</a-entity></a-entity>";
                
            }
            if (hasTriggerAudio) {
                triggerAudioEntity = "<a-entity id=\x22triggerAudio\x22 trigger_audio_control=\x22volume: "+sceneTriggerVolume+"\x22>"+
                "</a-entity>";
                triggerAudioScript = "<script>" +      
                "let triggerAudioHowl = new Howl({" + //inject howler for non-streaming
                        "src: [\x22"+triggerOggUrl+"\x22,\x22"+triggerMp3Url+"\x22], volume: 1, loop: false" + 
                    "});" +
                "triggerAudioHowl.load();</script>";
            }

            ///////////// video //////////////
            let video_items = [];
            if (sceneResponse.sceneVideos != null && sceneResponse.sceneVideos.length > 0) {
                const v_ids = sceneResponse.sceneVideos.map(item => {
                    item = item.toString();
                    return ObjectId.createFromHexString(item);
                });
                const vquery = {_id: {$in: v_ids}};
                video_items = await RunDataQuery("video_items", "find", vquery);
            }
            if (video_items != null && video_items[0] != null) { //only single vid for now, need to loop array // HLS is better, but now only work through a vidgroup
                console.log("video_item: " + JSON.stringify(video_items[0]));
                var item_string_filename = JSON.stringify(video_items[0].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 1000);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                var namePlusExtension = baseName + item_string_filename_ext.toLowerCase();
                //console.log("mp4 video: " + mp4Name + " " + video_items[0]._id);
                console.log("gotsa vid with ext : "+item_string_filename_ext.toLowerCase()); 
                let mov = "";
                let webm = "";
                let vidSrc = "";
                const vid = video_items[0]._id;
                const ori = video_items[0].orientation != null ? video_items[0].orientation : "";
                if (item_string_filename_ext.toLowerCase() == ".mp4" || item_string_filename_ext.toLowerCase() == ".mkv") { //single src OK for these
                    // vidUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, Expires: 6000});
                    vidUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                    vidSrc = "<source src=\x22"+vidUrl+"\x22 type=\x22video/mp4\x22>";
                } else {
                    //for transparent video, need both mov + webm!
                    if (item_string_filename_ext.toLowerCase() == ".mov") {
                        // mov = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "video/" + vid + "/" + vid + "." + namePlusExtension, Expires: 6000});
                        mov = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                        for (let i = 0; i < video_items.length; i++) {
                            if (video_items[0]._id != video_items[i]._id) {
                                if (video_items[0].title == video_items[i].title) {
                                    console.log("found a webm to match the mov");
                                    // webm = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, Expires: 6000});
                                    webm = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, 6000);
                                    vidSrc = "<source src=\x22"+webm+"\x22 type=\x22video/webm\x22><source src=\x22"+mov+"\x22 type=\x22video/webm\x22>";
                                }
                            }
                        }
                        
                    }
                    if (item_string_filename_ext.toLowerCase() == ".webm") {
                        // webm = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "/" + vid + "." + namePlusExtension, Expires: 6000});
                        webm = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[0].userID + "/video/" + vid + "/" + vid + "." + namePlusExtension, 6000);
                        for (let i = 0; i < video_items.length; i++) {
                            if (video_items[0]._id != video_items[i]._id) {
                                if (video_items[0].title == video_items[i].title) {
                                    console.log("found a mov to match the webm " + video_items[0]._id + " vs " + video_items[i]._id);
                                    // mov = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." + video_items[i].filename, Expires: 6000});
                                    mov = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video_items[i].userID + "/" + video_items[i]._id + "." +  video_items[i].filename, 6000);
                                    vidSrc = "<source src=\x22"+mov+"\x22 type=\x22video/webm\x22><source src=\x22"+mov+"\x22 type=\x22video/quicktime\x22>";
                                }
                            }
                        }  
                    }
                }
                if (ori.toLowerCase() == "equirectangular") {
                    if (video_items[0].tags.includes("hls")) {
                        let vProps = {};
                        vProps.id = video_items[0]._id;

                        vProps.videoTitle = video_items[0].title;
                    
                        videoEntity = "<a-sphere id=\x22primary_video\x22 shadow=\x22receive: false\x22 class=\x22activeObjexGrab activeObjexRay\x22 scale=\x22-50 -50 50\x22 vid_materials_embed=\x22id:"+vProps.id+"; isSkybox: true;\x22 play-on-vrdisplayactivate-or-enter-vr crossOrigin=\x22anonymous\x22 rotation=\x220 180 0\x22 material=\x22shader: flat;\x22></a-sphere>";
                        hlsScript = "<script src=\x22../main/js/hls.min.js\x22></script>";
                    } else {
                        videosphereAsset = "<video id=\x22videosphere\x22 autoplay loop crossOrigin=\x22anonymous\x22 src=\x22" + vidUrl + "\x22></video>";
                        videoEntity = "<a-videosphere play-on-window-click play-on-vrdisplayactivate-or-enter-vr crossOrigin=\x22anonymous\x22 src=\x22#videosphere\x22 rotation=\x220 180 0\x22 material=\x22shader: flat;\x22></a-videosphere>";
                    }
                
                } else {
                    //hrm, now most vids are hls, don't really need this.../// yes but TODO need to set a single vid as hls here...
                    // if (preloadVideo) { //ugh
                    //     videoAsset = "<video id=\x22video1\x22 crossOrigin=\x22anonymous\x22>"+vidSrc+"</video>";
                    // } else {// still ugh
                    //     videoAsset = "<video autoplay muted loop=\x22true\x22 webkit-playsinline playsinline id=\x22video1\x22 crossOrigin=\x22anonymous\x22></video>"; 
                    // }
                    // videoEntity = "<a-entity "+videoParent+" class=\x22activeObjexGrab activeObjexRay\x22 vid_materials=\x22url: "+vidUrl+"\x22 gltf-model=\x22#movieplayer2.glb\x22 position=\x22"+videoLocation+"\x22 rotation=\x22"+videoRotation+"\x22 width='10' height='6'><a-text id=\x22videoText\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x22-.5 -1 1\x22 wrapCount=\x2240\x22 value=\x22Click to Play Video\x22></a-text>" +
                    // "</a-entity>";
                }
            }
            
            if (sceneResponse.sceneVideoGroups != null && sceneResponse.sceneVideoGroups.length > 0) {
                console.log("sceneResponse.sceneVideoGroups "+ sceneResponse.sceneVideoGroups);
                const objectIDs = sceneResponse.sceneVideoGroups.map(convertStringToObjectID);
                // const objectIDs = sceneResponse.sceneVideoGroups.map(item => {
                //     return ObjectId.createFromHexString(item.toString());
                // });
                // console.log("video groups : "+objectIDs);
                const gquery = {"_id": {$in : objectIDs}};
                const groups = await RunDataQuery("groups", "find", gquery); //only one vid group per scene?
                console.log("video group " + JSON.stringify(groups));
                let group = groups[0];
                    if (group && group._id) {
                    let vidGroup = {};
                    vidGroup._id = group._id;
                    vidGroup.name = group.name;
                    vidGroup.userID = group.userID;
                    vidGroup.tags = group.tags;
                    const o_ids = group.items.map(convertStringToObjectID);
                    console.log("vid group items: "+o_ids);
                    const vidquery = {_id : {$in : o_ids}};
                    let videos = await RunDataQuery("video_items", "find", vidquery);
                    for (let video of videos) {
                        // let video = videos[i];
                        video.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + video.userID + "/video/" + video._id + "/" + video._id + "." + video.filename, 6000);
                        // console.log("video url " + video.url)
                    }
                    vidGroup.videos = videos;
                    requestedVideoGroups.push(vidGroup);
                    videoElements = ""; //jack in video elements, ios don't like them cooked up in script
                    for (let v = 0; v < requestedVideoGroups.length; v++) {
                        for (let i = 0; i < requestedVideoGroups[v].videos.length; i++ ) {  //TODO spin first and second level array
                            videoElements = videoElements + "<video style=\x22display: none;\x22 loop=\x22true\x22 crossorigin=\x22use-credentials\x22 webkit-playsinline playsinline id=\x22"+requestedVideoGroups[v].videos[i]._id+"\x22></video>";
                            console.log("Video elements " + JSON.stringify(videoElements));
                        }
                    }
                }
                var buff = Buffer.from(JSON.stringify(requestedVideoGroups)).toString("base64");
                if (sceneResponse.sceneWebType == "Video Landing") {
                    videoGroupsEntity = "<div id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></div>"; 
                } else {
                    videoGroupsEntity = "<a-entity video_groups_data id=\x22videoGroupsData\x22 data-video-groups='"+buff+"'></a-entity>"; 
                }
                hlsScript = "<script src=\x22../main/js/hls.min.js\x22></script>"; //v 1.0.6 client hls player ref
            }
            
            ////////////// cook some output, ui elements, etc. -- TODO move up or down?
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
            
            if (sceneResponse.sceneYouTubeIDs != null && sceneResponse.sceneYouTubeIDs.length > 0) {
                let youtubeVolume = sceneResponse.sceneMediaAudioVolume != undefined ? sceneResponse.sceneMediaAudioVolume : 80;
                for (let i = 0; i < sceneResponse.sceneYouTubeIDs.length; i++) {
                    youtubeContent = "<div width=\x22240\x22 id=\x22youtubeElement\x22 data-yt_id=\x22"+
                    sceneResponse.sceneYouTubeIDs[i]+"\x22 data-sceneTitle=\x22"+sceneResponse.sceneTitle+"\x22></div>"+
                    "<script>\n"+
                        "var tag = document.createElement('script');\n"+
                        "tag.src = \x22//www.youtube.com/iframe_api\x22;\n"+
                        "var firstScriptTag = document.getElementsByTagName('script')[0];\n"+
                        "firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);\n"+
                    "</script>";
                    
                    youtubeEntity = "<a-entity id=\x22youtubeParent\x22 look-at=\x22#player\x22 position=\x22-6 2 -6\x22>"+

                    "<a-entity id=\x22youtubePlayer\x22 position=\x220 -1 1\x22 gltf-model=\x22#youtubeplayer\x22 youtube_player=\x22yt_id: "+
                    sceneResponse.sceneYouTubeIDs[i]+"; volume: "+youtubeVolume+"\x22></a-entity>"+
                    "<a-text wrapCount=\x2270\x22 value=\x22"+sceneResponse.sceneTitle+"\x22 width=\x222\x22 position=\x22-.95 1.7 .1\x22 id=\x22youtubeTitle\x22></a-text>"+
                    "<a-text width=\x223\x22 position=\x22-.95 .7 .1\x22 id=\x22youtubeState\x22></a-text>"+
                    "<a-text width=\x223\x22 position=\x22-.95 .6 .1\x22 id=\x22youtubeStats\x22></a-text>"+
                    "</a-entity>";
                }
            }
            if (hasPrimaryAudio || hasPrimaryAudioStream) {
                primaryAudioSliderChunk = "<a href=\x22#\x22 style=\x22float: right;\x22 onclick=PlayPausePrimaryAudio() id=\x22primaryAudioPlayPause\x22 class=\x22btn tooltip\x22 type=\x22button\x22>"+
                "Play/Pause Primary Audio<span class=\x22tooltiptext\x22>"+primaryAudioTitle+"</span></a></span><br>"+
                "<span id=\x22primaryAudioVolume\x22>Primary Volume</span><div class=\x22slidecontainer\x22>"+
                // "<a href=\x22#\x22 class=\x22btn\x22 type=\x22button\x22>Play</a>"+
                "<input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+scenePrimaryVolume+"\x22 class=\x22slider\x22 id=\x22primaryAudioVolumeSlider\x22>" +
                "</div>";
            }
            if (hasAmbientAudio) {
                ambientAudioSliderChunk = "<span id=\x22ambientAudioVolume\x22>Ambient Volume</span><div class=\x22slidecontainer\x22><input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+
                sceneAmbientVolume+"\x22 class=\x22slider\x22 id=\x22ambientAudioVolumeSlider\x22></div>";
            }
            if (hasTriggerAudio) {
                triggerAudioSliderChunk = "<span id=\x22triggerAudioVolume\x22>Trigger Volume</span><div class=\x22slidecontainer\x22><input type=\x22range\x22 min=\x22-80\x22 max=\x2220\x22 value=\x22"+
                sceneTriggerVolume+"\x22 class=\x22slider\x22 id=\x22triggerAudioVolumeSlider\x22></div>";
            }
            let userText = "<div class=\x22smallfont\x22><span id=\x22userName\x22 class=\x22\x22>Welcome " + 
            avatarName+ "</span>!&nbsp;&nbsp;<button onclick=\x22Disconnect()\x22 type=\x22button\x22 class=\x22btn\x22>Disconnect</button></div><hr>";
            if (isGuest) {
                userText = "<div><span id=\x22userName\x22 class=\x22smallfont\x22>Welcome Guest known as " + avatarName+ "</span>"+
                //loginLink +
                "<button onclick=\x22Disconnect()\x22 type=\x22button\x22 class=\x22btn\x22>Disconnect</button></div>\n"+
                "<hr>";
            }
            let fromBy = "<div><span class=\x22smallfont\x22>From: <a href=\x22http://"+sceneResponse.sceneDomain+"\x22>" +
            sceneResponse.sceneDomain+ "</a><br><hr>By: " + sceneResponse.userName+ "</span></div><hr>\n"; 
            screenOverlay = "<div class=\x22screen-overlay\x22>" +
            "<button id=\x22screenOverlayCloseButton\x22 type=\x22button\x22 class=\x22screen-overlay-close-button\x22>Close View</button><br>"+
            "</div>";
            audioSliders = "<div id=\x22audioSliders\x22 style=\x22visibility: hidden\x22>"+primaryAudioSliderChunk + ambientAudioSliderChunk + triggerAudioSliderChunk+"</div>";
            mapOverlay = "<div class=\x22map-overlay\x22 id=\x22mapElement\x22>" +
            "<button id=\x22mapOverlayCloseButton\x22 type=\x22button\x22 class=\x22screen-overlay-close-button\x22>Close Map</button><br>"+
            "</div>";
            canvasOverlay = "<div id=\x22canvasOverlay\x22 class=\x22canvas-overlay\x22><button id=\x22sceneTitleButton\x22 type=\x22button\x22 class=\x22collapsible\x22>"+sceneResponse.sceneTitle+"</button>" +
            "<div id=\x22overlayContent\x22 class=\x22content\x22>" + youtubeContent +"<hr>"+ fromBy + keynote + desc + appButtons +
            userText +
            "<div class=\x22smallfont\x22><span id=\x22users\x22></span></div>"+ 
            "<div><hr>"+
            // "<div id=\x22events_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Events')\x22><i class=\x22fas fa-stopwatch \x22></i></div>"+
            // "<div id=\x22locations_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Locations')\x22><i class=\x22fas fa-globe \x22></i></div>"+
            // "<div id=\x22tools_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Tools')\x22><i class=\x22fas fa-tools \x22></i></div>"+
            // "<div id=\x22inventory_dialog_button\x22 style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Inventory')\x22><i class=\x22fas fa-suitcase \x22></i></div>"+
            // "<div id=\x22messages_dialog_button\x22 style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 onclick=\x22SceneManglerModal('Messages')\x22><i class=\x22fas fa-comments \x22></i></div></div><br><hr>"+
            "<div id=\x22events_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 ><i class=\x22fas fa-stopwatch \x22></i></div>"+
            "<div id=\x22locations_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 ><i class=\x22fas fa-globe \x22></i></div>"+
            "<div id=\x22tools_dialog_button\x22 style=\x22float:right; margin: 5px 10px 5px; 0px;\x22 ><i class=\x22fas fa-tools \x22></i></div>"+
            "<div id=\x22inventory_dialog_button\x22 style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 ><i class=\x22fas fa-suitcase \x22></i></div>"+
            "<div id=\x22messages_dialog_button\x22 style=\x22float:right;margin: 5px 10px 5px; 0px;\x22 ><i class=\x22fas fa-comments \x22></i></div></div><br><hr>"+
            mapStyleSelector +
            "</div>"+
            "<div>"+
            mapButtons +
            "</div></div>";
            if (sceneResponse.sceneShowAds != null && sceneResponse.sceneShowAds != undefined && sceneResponse.sceneShowAds != false) { //put the ads if you must..   
                //nah...
            }

            ///////////// postcards //////////////////////
            if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                console.log("tryna get a postcard " + sceneResponse.scenePostcards);
                var postcard = sceneResponse.scenePostcards[sceneResponse.scenePostcards.length - 1].toString(); 
                var oo_id = ObjectId.createFromHexString(postcard); //only need one for this..
                const pquery = {"_id": oo_id};
                const picture_item = await RunDataQuery("image_items", "findOne", pquery);
                // postcards need a "static" host instead of signed URL (which times out), to be used in social posts
                bucketFolder = sceneResponse.sceneDomain; //TODO use "public" bucket if set in process.ENV
                if (nonLocalDomains.includes(bucketFolder)) { //TODO this should be a param of domain object // umm, what
                    bucketFolder = "realitymangler.com";  //THIS! 
                    console.log("NONLOCALDOMAIN WTF!");
                }
                postcard1 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID +"/pictures/"+ 
                                    picture_item._id + ".standard." + picture_item.filename, 6000); //just return a single             
            }
            
            /////////////// pictures /////////////////////////
            if (sceneResponse.scenePictureGroups != null && sceneResponse.scenePictureGroups.length > 0) {
                console.log("tryna get picture groups " +  sceneResponse.scenePictureGroups)
                const pg_ids = sceneResponse.scenePictureGroups.map(convertStringToObjectID);
                const pgquery = {"_id": {$in : pg_ids}};

                const groups = await RunDataQuery("groups", "find", pgquery);
                // console.log("getting ")
                for (let group of groups) { 
                        let picGroup = {};
                        picGroup._id = group._id;
                        picGroup.name = group.name;
                        picGroup.userID = group.userID;
                        let p_ids = [];
                        if (Array.isArray(group.items)) {
                            p_ids = group.items.map(convertStringToObjectID);
                        } else {
                            p_ids.push(ObjectId.createFromHexString(group.items.toString()));
                        }
                        // const p_ids = group.items; //.map(convertStringToObjectID);
                        // console.log("picgroup items : "+ p_ids);
                        const picquery = {"_id": {$in : p_ids}};
                        let images = await RunDataQuery("image_items", "find", picquery);
                    
                        for (let image of images) { //jack in a signed url for each
                            // console.log("gots a pic in pic group w/ image.orientation " + image);
                            if (image.orientation != null && image.orientation != undefined && image.orientation.toLowerCase() == "equirectangular") { 
                                skyboxIDs.push(image._id);
                                image.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + image.userID + "/pictures/originals/" + image._id + ".original." + image.filename, 6000);
                                scenePictureItems.push(image);
                            
                            } else {
                                image.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + image.userID + "/pictures/" + image._id + ".standard." + image.filename, 6000);
                                scenePictureItems.push(image);
                            }
                            picGroup.images = images;
                            requestedPictureGroups.push(picGroup);
                        }
                            if (picturegroupLocation != "") {
                                pictureGroupsEntity = "<a-entity scale=\x22.75 .75 .75\x22 id=\x22picGroupParent\x22 look-at=\x22#player\x22 position=\x22"+picturegroupLocation+"\x22>"+ 
                                "<a-entity position=\x220 -2.5 0\x22 scale=\x22.75  .75 .75\x22 id=\x22pictureGroupsControl\x22 class=\x22envMap activeObjexRay\x22 "+skyboxEnvMap+" toggle-picture-group gltf-model=\x22#camera_icon\x22></a-entity>"+
                                "<a-entity id=\x22pictureGroupPanel\x22 visible=\x22false\x22 position=\x220 -1 0\x22>"+
                                "<a-entity id=\x22pictureGroupPicLandscape\x22 visible=\x22true\x22 position=\x220 2.25 -.1\x22 gltf-model=\x22#flatrect2\x22 scale=\x224 4 4\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                "rotation='0 0 0'></a-entity>"+
                                "<a-entity id=\x22pictureGroupPicPortrait\x22 visible=\x22false\x22 position=\x220 3.25 -.1\x22 gltf-model=\x22#portrait_panel\x22 scale=\x224 4 4\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                "rotation='0 0 0'></a-entity>"+
                                "<a-entity id=\x22pictureGroupPicSquare\x22 visible=\x22false\x22 position=\x220 2.25 -.1\x22 gltf-model=\x22#flatsquare\x22 scale=\x224 4 4\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                "rotation='0 0 0'></a-entity>"+
                                "<a-entity id=\x22pictureGroupPicCircle\x22 visible=\x22false\x22 position=\x220 2.25 -.1\x22 gltf-model=\x22#flatcircle\x22 scale=\x224 4 4\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                "rotation='0 0 0'></a-entity>"+
                                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22pictureGroupFlyButton\x22 gltf-model=\x22#next_button\x22 scale=\x22.25 .25 .25\x22 position=\x223.25 -.75 0\x22></a-entity>" +
                                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22pictureGroupLayoutButton\x22 gltf-model=\x22#previous_button\x22 scale=\x22.25 .25 .25\x22 position=\x22-3.25 -.75 0\x22></a-entity>" +
                                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22pictureGroupNextButton\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x222.25 -.75 0\x22></a-entity>" +
                                "<a-entity visible='true' class=\x22envMap activeObjexRay\x22 id=\x22pictureGroupPreviousButton\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-2.25  -.75 0\x22></a-entity>" +
                                "</a-entity></a-entity>";
                            }
                            var buff = Buffer.from(JSON.stringify(requestedPictureGroups)).toString("base64");
                            pictureGroupsData = "<a-entity picture_groups_control id=\x22pictureGroupsData\x22 data-picture-groups='"+buff+"'></a-entity>"; //to be picked up by aframe, but data is in data-attribute
                            modelAssets = modelAssets + "<a-asset-item id=\x22portrait_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/flatrect2_portrait.glb\x22></a-asset-item>\n" +
                            "<a-asset-item id=\x22flatrect2\x22 crossorigin=\x22anonymous\x22 id=\x22flatrect2\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/flatrect2.glb\x22></a-asset-item>"+
                            "\n<a-asset-item id=\x22camera_icon\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/camera1.glb\x22></a-asset-item>\n";
                            "});";
                        // }
                    }
                }
                let scatterPics = false;
                var index = 0;
                let picLocationsPlaced = [];
                let picIndex = 0;
                for (let i = 0; i < sceneResponse.scenePictures.length; i++) {    
                    const picID = sceneResponse.scenePictures[i].toString();
                    const oo_id = ObjectId.createFromHexString(picID);
                    const query = {"_id": oo_id};
                    let picture_item = await RunDataQuery("image_items", "findOne", query);

                    if (picture_item) {
                        
                        // console.log("picture_item " + JSON.stringify(picture_item));
                        
                        var version = ".standard.";
                        if (picture_item.orientation != undefined) {
                            // if (picture_item.orientation.toLowerCase() == "equirectangular" && sceneResponse.sceneUseSkybox) {
                            if (picture_item.orientation.toLowerCase() == "equirectangular") {
                                skyboxID = picID;
                                version = ".original.";
                                skyboxIDs.push(picID);
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

                        if (picture_item.orientation == "circle" || picture_item.orientation == "Circle" || picture_item.orientation == "square" || picture_item.orientation == "Square" ) {
                            if (picture_item.tags.includes("old")) { //OH YEAH, snap
                                image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/originals/" + picture_item.filename, 6000);
                            } else {
                                
                                image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/originals/" + picture_item._id + ".original." + picture_item.filename, 6000);
                            }
                            
                        } else {
                            image1url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, 6000);
                        }
                        if (picture_item.orientation == "Tileable") {

                            tilepicUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/originals/" + picture_item._id + ".original." + picture_item.filename, 6000);
                            console.log("GOTSA TILEABLE PIC! " + tilepicUrl);
                        }

                        picture_item.url = image1url;
                        scenePictureItems.push(picture_item);
                        imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 crossorigin=\x22anonymous\x22 src='" + image1url + "'>";
                        let caption = "";
                        if (picture_item.captionUpper != null && picture_item.captionUpper != undefined) {
                            caption = "<a-text class=\x22pCap\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x220 1.3 -.1\x22 wrapCount=\x2240\x22 value=\x22"+picture_item.captionUpper+"\x22></a-text>";
                        }
                        let lowerCap = "";
                        let actionCall = "";
                        let link = "";
                        let lookat = " look-at=\x22#player\x22 ";
                        // console.log("picLocations taken: " + picLocationsPlaced);
                        
                        if (picIndex < locationPictures.length) { //now picture types use scene_pictures_control see below
                            position = locationPictures[picIndex].loc;
                            rotation = locationPictures[picIndex].rot;
                            if (locationPictures[picIndex].type.includes("fixed")) {
                                console.log("fixed pic @ " + locationPictures[picIndex].loc);
                                lookat = "";
                            }
                            if (locationPictures[picIndex].scale) {

                            }
                            picIndex++;
                        } else {
                            if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("scatter pics")) {
                                scatterPics = true; //use cooked positions above, not assigned locations
                            }
                        }
                    
                        if (picture_item.linkType != undefined && picture_item.linkType.toLowerCase() != "none") {
                            if (picture_item.linkType == "NFT") { //never mind, these are old image target fu
                            
                            }
                            if (picture_item.linkURL != undefined && !picture_item.linkURL.includes("undefined") && picture_item.linkURL.length > 6) {
                                link = "basic-link=\x22href: "+picture_item.linkURL+";\x22 class=\x22activeObjexGrab activeObjexRay\x22";
                            }
                        }
                        if (picture_item.useTarget != undefined && picture_item.useTarget != "") { //used by mindar - good stuff!
                            console.log("GOTSA urlTarget " + picture_item.urlTarget);
                            const targetURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + picture_item.userID + "/pictures/targets/" + picture_item._id + ".mind");
                            arImageTargets.push(targetURL);
                        

                        }
                        if (picture_item.hasAlphaChannel && scatterPics) {
                            imageEntities = imageEntities + "<a-entity "+link+""+lookat+" geometry=\x22primitive: plane; height: 10; width: 10\x22 material=\x22shader: flat; transparent: true; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                            " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                        } else {
                            console.log("picture_item.orientation " + picture_item);
                            if (picture_item.orientation != "equirectangular" && picture_item.orientation != "Equirectangular" && scatterPics) {  //what if linkType is undefined?

                                if (picture_item.orientation == "portrait" || picture_item.orientation == "Portrait") {
                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+
                                    index+"\x22 gltf-model=\x22#portrait_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                    modelAssets = modelAssets + "<a-asset-item id=\x22portrait_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5c.glb\x22></a-asset-item>\n";
                                } else if (picture_item.orientation == "square" || picture_item.orientation == "Square") {
                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+
                                    index+"\x22 gltf-model=\x22#square_panel\x22 scale=\x223 3 3\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                } else if (picture_item.orientation == "circle" || picture_item.orientation == "Circle") {
                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+
                                    index+"\x22 gltf-model=\x22#circle_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                    modelAssets = modelAssets + "<a-asset-item id=\x22circle_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelcircle1.glb\x22></a-asset-item>\n";
                                } else {
                                    imageEntities = imageEntities + "<a-entity "+link+""+lookat+"  mod-materials=\x22index:"+
                                    index+"\x22 gltf-model=\x22#landscape_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                    " position=\x22"+position+"\x22 rotation=\x22"+rotation+"\x22 visible='true'>"+caption+"</a-entity>";
                                }
                            }
                        }
                    }
                    var buff = Buffer.from(JSON.stringify(scenePictureItems)).toString("base64");
                    scenePictureData = "<a-entity scene_pictures_control id=\x22scenePictureData\x22 data-scene-pictures='"+buff+"'></a-entity>";
                }
                /////////////// skyboxen /////////////////////
                var oo_id = null;
                console.log("skybox ids beez " + JSON.stringify(skyboxIDs) + " vs single skyboxID " + skyboxID);
                if (skyboxIDs.length > 0) { //umm...
                    // skyboxID = skyboxIDs[Math.floor(Math.random() * skyboxIDs.length)];
                    // oo_id =  ObjectID(skyboxID);
                } 
                if (skyboxID != "") {
                    oo_id = ObjectId.createFromHexString(skyboxID); //set if there's an equirect pic, above
                } else {
                    if (sceneResponse.sceneSkybox != null && sceneResponse.sceneSkybox != "") //old way
                    oo_id = ObjectId.createFromHexString(sceneResponse.sceneSkybox);
                }
                if (oo_id) {
                    const query = {"_id": oo_id};
                    const picture_item = await RunDataQuery("image_items", "findOne", query); 
                    const theKey = 'users/' + picture_item.userID + '/pictures/originals/' + picture_item._id + '.original.' + picture_item.filename; //TODO cook smaller equirect versions?
                    //some old skyboxen aren't saved with .original. in filename, check for that
                    // if (!ReturnObjectExists(process.env.ROOT_BUCKET_NAME, theKey)) {
                    //     theKey = 'users/' + picture_item.userID + '/pictures/originals/' + picture_item.filename;
                    // } 
                    skyboxUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, theKey, 6000);
                    skyboxAsset = "<img id=\x22sky\x22 crossorigin=\x22anonymous\x22 src='" + skyboxUrl + "'>";
                    if (sceneResponse.sceneUseSkybox) {
                        skySettings = "<a-sky id=\x22a_sky\x22 crossorigin=\x22anonymous\x22 hide-on-enter-ar skybox_dynamic></a-sky>";
                    }
                }

                /////////////////// build the response! ///////////////////////////////

                let settings = {};  
                    settings._id = sceneResponse._id;
                    settings.sceneLastUpdate = sceneResponse.sceneLastUpdate;
                    settings.sceneType = sceneResponse.sceneWebType;
                    settings.sceneDomain = sceneResponse.sceneDomain;
                    settings.sceneTitle = sceneResponse.sceneTitle;
                    settings.sceneKeynote = sceneResponse.sceneKeynote;
                    settings.sceneDescription = sceneResponse.sceneDescription;
                    settings.sceneEventStart = sceneResponse.sceneEventStart;
                    settings.sceneEventEnd = sceneResponse.sceneEventEnd;
                    settings.hideAvatars = true;
                    settings.sceneUseFog = sceneResponse.sceneUseSceneFog != undefined ? sceneResponse.sceneUseSceneFog : false;
                    settings.sceneUseSkybox = sceneResponse.sceneUseSkybox;
                    settings.sceneSkyRadius = sceneResponse.sceneSkyRadius != undefined ? sceneResponse.sceneSkyRadius : 202;
                    settings.sceneFogDensity = sceneResponse.sceneGlobalFogDensity != undefined ? sceneResponse.sceneGlobalFogDensity : 0;
                    settings.sceneGroundLevel = sceneResponse.sceneGroundLevel;
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
                    // settings.sceneTimedEvents = sceneResponse.sceneTimedEvents; //could be big!?
                    settings.skyboxIDs = skyboxIDs;
                    settings.skyboxID = skyboxID;
                    settings.skyboxURL = skyboxUrl;
                    settings.useSynth = hasSynth;
                    settings.useStarterKit = useStarterKit;
                    settings.useSuperHands = useSuperHands;
                    settings.usePhysicsType = usePhysicsType;
                    settings.useNavmesh = useNavmesh; //"real" navmesh w/ pathfinding
                    settings.useSimpleNavmesh = useSimpleNavmesh;
                    settings.useMatrix = (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('matrix'));
                    settings.sceneWaterLevel = (sceneResponse.sceneWater != undefined && sceneResponse.sceneWater.level != undefined) ? sceneResponse.sceneWater.level : 0;
                    settings.sceneCameraMode = sceneResponse.sceneCameraMode != undefined ? sceneResponse.sceneCameraMode : "First Person"; 
                    settings.sceneCameraFlyable = sceneResponse.sceneFlyable != undefined ? sceneResponse.sceneFlyable : false;
                    let audioGroups = {};
                    audioGroups.triggerGroups = sceneResponse.sceneTriggerAudioGroups;
                    audioGroups.ambientGroups = sceneResponse.sceneAmbientAudioGroups;
                    audioGroups.primaryGroups = sceneResponse.scenePrimaryAudioGroups;
                    audioGroups.objectGroups = objectAudioGroups;
                    settings.audioGroups = audioGroups; 
                    settings.clearLocalMods = false;
                    settings.sceneVideoStreams = (sceneResponse.sceneVideoStreamUrls != undefined && sceneResponse.sceneVideoStreamUrls != null) ? sceneResponse.sceneVideoStreamUrls : [];
                    settings.socketHost = process.env.SOCKET_HOST;
                    settings.networking = sceneResponse.sceneNetworking;
                    settings.playerStartPosition = playerPosition;
                    settings.playerPositions = playerPositions;
                    settings.playerSpeed = sceneResponse.scenePlayer.playerSpeed;
                    settings.playerHeight = sceneResponse.scenePlayer.playerHeight;
                    settings.debugMode = debugMode;
                    settings.scatterObjects = sceneResponse.sceneScatterObjects;
                    settings.sceneScatterObjectLayers = sceneResponse.sceneScatterObjectLayers;
                    settings.scatterMeshes = sceneResponse.sceneScatterMeshes;

                    settings.sceneScatterMeshLayers = sceneResponse.sceneScatterMeshLayers;
                    settings.allowMods = true;
                    settings.sceneTags = sceneResponse.sceneTags;
                    settings.hideGizmos = false;
                    settings.sceneEnvironmentPreset = sceneResponse.sceneEnvironmentPreset;
                    settings.showCameraIcon = sceneResponse.showCameraIcon; //for picture group mgr
                    settings.useArParent = useArParent;
                
                    if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("xr room physics")) {
                        settings.useXrRoomPhysics = true;
                    } else {
                        settings.useXrRoomPhysics = false;
                    }
                    if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("right hand blaster")) {
                        settings.useRightHandBlaster = true;
                    }
                    if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("left hand blaster")) {
                        settings.useLeftHandBlaster = true;
                    }

                    if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("real world meshing")) {
                        settings.useRealWorldMeshing = true;
                    } else {
                        settings.useRealWorldMeshing = false;
                    } 

                    if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("no mods")) {
                        settings.allowMods = false;
                    }
                    if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("hide gizmos")) {
                        settings.hideGizmos = true;
                    }
                    if (sceneResponse.scatterObjects) {
                        settings.sceneScatterObjectLayers = sceneResponse.sceneScatterObjectLayers;
                    }
                    if (sceneResponse.scatterMeshes) {
                        settings.sceneScatterMeshLayers = sceneResponse.sceneScatterMeshLayers;
                    }
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
                    if (sceneResponse.primaryAudioGroups != null && sceneResponse.primaryAudioGroups.length > 0) {
                        hasPrimaryAudio = true;
                    }
                    var sbuff = Buffer.from(JSON.stringify(settings)).toString("base64");
                    settingsData = "<div id=\x22settingsDataElement\x22 data-settings=\x22"+sbuff+"\x22></div>";

                    if (sceneResponse.sceneTimedEvents) {
                        var tebuff = Buffer.from(JSON.stringify(sceneResponse.sceneTimedEvents)).toString("base64");
                        sceneTimedEventsData = "<div id=\x22timedEventsDataElement\x22 data-timedevents=\x22"+tebuff+"\x22></div>";
                    }

                    let grabMix = "<a-mixin id=\x22grabmix\x22" + //mixin for grabbable objex
                        "event-set__grab=\x22material.color: #FFEF4F\x22" +
                        "event-set__grabend=\x22material.color: #F2E646\x22" +
                        "event-set__hit=\x22material.color: #F2E646\x22" +
                        "event-set__hitend=\x22material.color: #EF2D5E\x22" +
                        "event-set__mousedown=\x22material.color: #FFEF4F\x22" +
                        "event-set__mouseenter=\x22material.color: #F2E646\x22" +
                        "event-set__mouseleave=\x22material.color: #EF2D5E\x22" +
                        "event-set__mouseup=\x22material.color: #F2E646\x22" +
                        "geometry=\x22primitive: box; height: 0.30; width: 0.30; depth: 0.30\x22" +
                        "material=\x22color: #EF2D5E;\x22></a-mixin>";

                    let playerAvatarTemplate = "";
                    if (sceneResponse.sceneWebType != undefined && (sceneResponse.sceneWebType.toLowerCase() == "aframe" || sceneResponse.sceneWebType.toLowerCase() == "default")) { // and what else?  networking isOn?
                        playerAvatarTemplate = "<template id=\x22avatar-template\x22>"+ 
                        
                        "<a-entity "+skyboxEnvMap+" gltf-model=\x22#avatar_model\x22>"+
                        "<a-text class=\x22playerName\x22 look-at=\x22#player\x22 rotation=\x220 0 0\x22 position=\x22.5 .75 -.15\x22 value=\x22"+avatarName+"\x22></a-text>"+
                        "</a-entity>"+
                        "</template>";
                    }
                 
                    let webxrFeatures = "";
                    // let arHitTest = "";
                    let arElements = "";
                    let handsTemplate = "";
                    let aframeRenderSettings = "renderer=\x22colorManagement: true; physicallyCorrectLights: true; exposure: 2; sortObjects: true; maxCanvasWidth: 1920; maxCanvasHeight: 1920;\x22";
     

                    //scenetype filters below...

                    console.log("sceneWebType: "+ sceneResponse.sceneWebType); 
                    ////////DEFAULT/AFRAME Scene type:
                    if (sceneResponse.sceneWebType == null || sceneResponse.sceneWebType == undefined || (sceneResponse.sceneWebType && sceneResponse.sceneWebType.toLowerCase() == "default") || 
                        (sceneResponse.sceneWebType && sceneResponse.sceneWebType.toLowerCase() == "aframe")) { 
                        // let xrmode =  "xr-mode-ui=\x22XRMode: xr\x22";
                        let xrExtras = "";
                        let hitCasterComponent = "";
                        if ((sceneResponse.sceneTags && sceneResponse.sceneTags.includes("ar parent")) || (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("hit test"))) {
                            xrExtras = "ar-hit-test"; //added to a-scene
                            ARScript = "<script src=\x22../main/src/component/ar_hit_caster.js\x22></script>"; 
                            hitCasterComponent = "ar_hit_caster"; //added to ar_parent

                        }
                        if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("xr room physics")) {
                            meshUtilsScript = meshUtilsScript + "<script type=\x22module\x22 src=\x22../main/js/xr-room-physics.min.js\x22></script>";
                            xrExtras = "xr_room_physics";
                            webxrFeatures = "webxr=\x22requiredFeatures: plane-detection,mesh-detection,local-floor; optionalFeatures: hit-test;\x22 " + xrExtras + " "; 
                            xrmode = "xr-mode-ui=\x22XRMode: ar\x22";
                        } else if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("real world meshing")) {
                            meshUtilsScript = meshUtilsScript + "<script type=\x22module\x22 src=\x22../main/src/component/aframe_real_world_meshing_mod.js\x22></script>";
                            xrExtras = " real_world_meshing_mod=\x22meshesEnabled: true;\x22";
                            webxrFeatures = " " + xrExtras;
                            xrmode = "xr-mode-ui=\x22XRMode: ar\x22";
                        } else {
                            webxrFeatures = "webxr=\x22optionalFeatures: hit-test, dom-overlay; overlayElement: #dom-overlay;\x22 " + xrExtras + " "; 
                        }
                        if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("hand controls") || sceneResponse.sceneTags.includes("hand controllers")) {
                            meshUtilsScript = meshUtilsScript + "<script src=\x22../main/src/component/hand_equip.js\x22></script>";
                        }
                        // arElements = "<a-entity material=\x22shader:shadow; depthWrite:false; opacity:0.9;\x22 visible=\x22false\x22 geometry=\x22primitive:shadow-plane;\x22 shadow=\x22cast:false;receive:true;\x22"+
                        // "ar-shadow-helper=\x22target:#ar_parent;light:#dirlight;\x22></a-entity>"+
                        // <a-light type="directional" light="castShadow:true;" position="1 1 1" intensity="1.57" shadow-camera-automatic="#ar_parent"></a-light>
                        arElements = "<a-plane follow-shadow=\x22#ar_parent\x22 material=\x22shader:shadow\x22 shadow=\x22cast:false;\x22 rotation=\x22-90 0 0\x22 width=\x222\x22 height=\x222\x22></a-plane>"+
                        "<a-entity scale=\x221 1 1\x22 id=\x22ar_parent\x22 "+hitCasterComponent+">" +
                        arChildElements +
                        "</a-entity>";
                        // "<a-entity show-in-ar-mode visible=\x22false\x22 id=\x22hitCaster\x22 ar_hit_caster=\x22targetEl: #ar_parent\x22 gltf-model=\x22#reticle2\x22></a-entity>\n";
                        handsTemplate = "<template id=\x22hand-template\x22><a-entity><a-box scale=\x220.1 0.1 0.1\x22 visible=false></a-box></a-entity></template>";
                       
                    } 
                    if (sceneResponse.sceneWebType == "Model Viewer") {
                        let extraScripts = "";
                        let sky = "environment-image=\x22neutral\x22";
                        if (skyboxUrl != null) {
                            sky = "skybox-image=\x22"+skyboxUrl+"\x22";
                        }  
                        let planeDetectMode = "floor";
                        let arScaleMode = "";
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("wall")) {
                            planeDetectMode = "wall";
                        } 
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("scale fixed")) {
                            arScaleMode = "fixed";
                        }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("scale auto")) {
                            arScaleMode = "auto";
                        } 
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("show overlay")) {
                            canvasOverlay = canvasOverlay + socketScripts;
                        } else {
                            canvasOverlay = "";
                        }   
                        let sceneGreeting = sceneResponse.sceneDescription;
                        if (sceneResponse.sceneGreeting != null && sceneResponse.sceneGreeting != undefined && sceneResponse.sceneGreeting != "") {
                            sceneGreeting = sceneResponse.sceneGreeting;
                        }      
                        let sceneQuest = "No quests for this scene... yet!";
                        if (sceneResponse.sceneQuest != null && sceneResponse.sceneQuest != undefined && sceneResponse.sceneQuest) {
                            sceneQuest = sceneResponse.sceneQuest;
                        }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('show dialog')) {
                            dialogButton = dialogButton +  //set with the actual button above?
                            "<div id=\x22sceneGreeting\x22 style=\x22z-index: -20;\x22>"+sceneGreeting+"</div>" +
                            "<div id=\x22sceneQuest\x22 style=\x22z-index: -20;\x22>"+sceneQuest+"</div>" +
                            "<div id=\x22theModal\x22 class=\x22modal\x22><div id=\x22modalContent\x22 class=\x22modal-content\x22></div></div>";
                            extraScripts = "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                            "<script type=\x22module\x22 src=\x22../main/js/dialogs.js\x22></script>" +
                            "<script type=\x22module\x22 src=\x22/connect/connect.js\x22></script>" +
                            geoScripts +
                            locationScripts +
                            locationData +
                            modelData;
                            // inventoryData;
                        } else {
                            dialogButton = "";
                            socketScripts = "";
                        }
                        htmltext = "<!DOCTYPE html>\n" +
                            "<head> " +
                            "<html lang=\x22en\x22 xml:lang=\x22en\x22 xmlns= \x22http://www.w3.org/1999/xhtml\x22>"+
                            "<meta charset=\x22UTF-8\x22>"+
                            "<meta name=\x22google\x22 content=\x22notranslate\x22>" +
                            "<meta http-equiv=\x22Content-Language\x22 content=\x22en\x22></meta>" +
                            "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                            "<meta charset='utf-8'/>" +
                            "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                            "<meta property='og:url' content='" + process.env.ROOT_HOST + "/webxr/" + sceneResponse.short_id + "' /> " +
                            "<meta property='og:type' content='website' /> " +
                            "<meta property='og:image' content='" + postcard1 + "' /> " +
                            "<meta property='og:image:height' content='1024' /> " +
                            "<meta property='og:image:width' content='1024' /> " +
                            "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                            "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                            "<meta property='name' content='modelviewer' /> " +
                            "<title>" + sceneResponse.sceneTitle + "</title>" +
                            "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                            "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                            "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                            "<link href=\x22https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                            "<link href=\x22/css/modelviewer.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" + 
                            "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" + 
                            "<script type=\x22module\x22 src=\x22https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js\x22></script>"+
                            extraScripts + 
                            "</head>\n" +
                            "<body style=\x22background-color: black;\x22>\n" +
                            "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                            "<div id=\x22token\x22 data-token=\x22"+token+"\x22></div>\n"+
                            "<model-viewer autoplay shadow-intensity=\x221\x22 camera-controls camera-target=\x220m 0m 0m\x22 src=\x22"+gltfModel+"\x22"+ 
                            " ar ar-placement=\x22"+planeDetectMode+"\x22 ar-modes=\x22webxr scene-viewer quick-look\x22 ar-scale=\x22"+arScaleMode+"\x22 alt=\x22Viewer for single 3D Model\x22"+ 
                            sky +
                            "ios-src=\x22"+usdzModel+"\x22>"+
                            "<button slot=\x22ar-button\x22 style=\x22background-color: red; color: white; font-size: 36px; border-radius: 4px; border: 1px; position: absolute; bottom: 16px; right: 16px; z-index: 100;\x22>"+
                            "AR"+
                            "</button>"+
                            "</model-viewer>" +
                            audioSliders +
                            canvasOverlay +
                            dialogButton +
                           
                            attributionsTextEntity +
                            "<div class=\x22smallfont\x22><span id=\x22users\x22></span></div>"+ 
                            "</body>\n" +
                            socketScripts +
                            "</html>";
                            console.log("Tryna do a model viewer");
                    } else if (sceneResponse.sceneWebType == "HTML from Text Item") {

                        htmltext = sceneTextItemData;
                        console.log("Tryna send html from text itme " + htmltext);
                    
                    } else if (sceneResponse.sceneWebType == "Video Landing") {
                        let bgstyle = "style=\x22height:100%; width:100%; overflow:auto; background-color: "+sceneResponse.sceneColor1+";\x22"
                        if (tilepicUrl != "") {
                            bgstyle = "style=\x22height:100%; width:100%; overflow:auto; background-color: "+sceneResponse.sceneColor1+"; background-image: url("+tilepicUrl+"); background-repeat: repeat;\x22";
                        }

                        htmltext = "<!DOCTYPE html>\n" +
                        "<head> " +
                        "<meta name=\x22viewport\x22 content=\x22width=device-width, initial-scale=1\x22 />"+
                        "<html lang=\x22en\x22 xml:lang=\x22en\x22 xmlns= \x22http://www.w3.org/1999/xhtml\x22>"+
                        "<meta charset=\x22UTF-8\x22>"+
                        "<meta name=\x22google\x22 content=\x22notranslate\x22>" +
                        "<meta http-equiv=\x22Content-Language\x22 content=\x22en\x22></meta>" +
                        "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                        "<meta charset=\x22utf-8\x22/>" +
                        "<meta name=\x22viewport\x22 content=\x22width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no\x22/>" +
                        "<meta property=\x22og:url\x22 content=\x22" + process.env.ROOT_HOST + "/webxr/" + sceneResponse.short_id + "\x22 /> " +
                        "<meta property=\x22og:type\x22 content=\x22website\x22 /> " +
                        "<meta property=\x22og:image\x22 content=\x22" + postcard1 + "\x22 /> " +
                        "<meta property=\x22og:image:height\x22 content=\x221024\x22 /> " +
                        "<meta property=\x22og:image:width\x22 content=\x221024\x22 /> " +
                        "<meta property=\x22og:title\x22 content=\x22" + sceneResponse.sceneTitle + "\x22 /> " +
                        "<meta property=\x22og:description\x22 content=\x22" + sceneResponse.sceneDescription + "\x22 /> " +
                        "<meta property=\x22name\x22 content=\x22modelviewer\x22 /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name=\x22description\x22 content=\x22" + sceneResponse.sceneDescription + "\x22/>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +                        
                        "<link href=\x22https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" + 
                       
                        "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/indexedDb.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/connect.js\x22 defer=\x22defer\x22></script>" +
                        
                        "</head>\n" +
                        "<body "+bgstyle+">" +
                        "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                        "<div id=\x22token\x22 data-token=\x22"+token+"\x22></div>\n"+
                        settingsData +
                        sceneTimedEventsData +
                        hlsScript +
                        videoGroupsEntity +
                        "<center><div><br><br><div class=\x22header\x22>"+sceneResponse.sceneGreeting+ " - " + sceneResponse.sceneQuest+"</div><video controls width=\x2280%\x22 height=\x2210%\x22 id=\x22video\x22></video>"+
                        "<div id=\x22sceneGreeting\x22 class=\x22linkfooter\x22>"+
                        "<h4><a href=\x22https://servicemedia.net/webxr/"+ sceneResponse.sceneNextScene + "\x22>Click Here to Enter Immersive Scene!</a></h4><br>"+
                        "</div></center>"+
                        audioSliders +
                        canvasOverlay +
                        "<div id=\x22theModal\x22 class=\x22modal\x22 ><div id=\x22modalContent\x22 class=\x22modal-content\x22></div>";
                        attributionsTextEntity +
                        "<div class=\x22smallfont\x22><span id=\x22users\x22></span></div>"+ 
                        "</body>\n" +
                        "</html>";
                        console.log("Tryna do a Video Landing scene");

                    } else if (sceneResponse.sceneWebType == "AR Image Tracking") { //aframe plus mindar
                        // dialogButton = "";
                        let extraScripts = "";
                        let sky = "environment-image=\x22neutral\x22";
                        if (skyboxUrl != null) {
                            sky = "skybox-image=\x22"+skyboxUrl+"\x22";
                        }  
                        let planeDetectMode = "floor";
                        let arScaleMode = "auto";
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("wall")) {
                            planeDetectMode = "wall";
                        } 
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("scale fixed")) {
                            arScaleMode = "fixed";
                        } 
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("show overlay")) {
                            canvasOverlay = canvasOverlay + socketScripts;

                        } else {
                            canvasOverlay = "";
                        }   
                        let sceneGreeting = sceneResponse.sceneDescription;
                        if (sceneResponse.sceneGreeting != null && sceneResponse.sceneGreeting != undefined && sceneResponse.sceneGreeting != "") {
                            sceneGreeting = sceneResponse.sceneGreeting;
                        }      
                        let sceneQuest = "No quests for this scene... yet!";
                         if (sceneResponse.sceneQuest != null && sceneResponse.sceneQuest != undefined && sceneResponse.sceneQuest) {
                             sceneQuest = sceneResponse.sceneQuest;
                         }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('show dialog')) {
                            dialogButton = dialogButton +  //set with the actual button above?
                            "<div id=\x22sceneGreeting\x22 style=\x22z-index: -20;\x22>"+sceneGreeting+"</div>"+
                            "<div id=\x22sceneQuest\x22 style=\x22z-index: -20;\x22>"+sceneQuest+"</div>"+
                            "<div id=\x22theModal\x22 class=\x22modal\x22><div id=\x22modalContent\x22 class=\x22modal-content\x22></div></div>";
                            extraScripts = "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                            "<script type=\x22module\x22 src=\x22../main/js/dialogs.js\x22></script>"+
                            "<script src=\x22/connect/indexedDb.js\x22></script>" +
                            "<script src=\x22/connect/traffic.js\x22></script>" +
                            
                            geoScripts +
                            locationScripts +
                            locationData +
                            modelData;
                                            
                        } else {
                            dialogButton = "";
                            socketScripts = "";
                        }
                        // if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('matrix')) {
                        //     extraScripts = extraScripts + "<script src=\x22../main/js/browser-matrix.min.js\x22></script>"; 
                        //     extraEntities = "<a-entity matrix_meshes=\x22init: true\x22></a-entity>";
                        // }
                      
                        htmltext = "<!DOCTYPE html>\n" +
                        "<head> " +
                        "<meta name=\x22viewport\x22 content=\x22width=device-width, initial-scale=1\x22 />"+
                        "<html lang=\x22en\x22 xml:lang=\x22en\x22 xmlns= \x22http://www.w3.org/1999/xhtml\x22>"+
                        "<meta charset=\x22UTF-8\x22>"+
                        "<meta name=\x22google\x22 content=\x22notranslate\x22>" +
                        "<meta http-equiv=\x22Content-Language\x22 content=\x22en\x22></meta>" +
                        "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                        "<meta charset='utf-8'/>" +
                        "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                        "<meta property='og:url' content='" + process.env.ROOT_HOST + "/webxr/" + sceneResponse.short_id + "' /> " +
                        "<meta property='og:type' content='website' /> " +
                        "<meta property='og:image' content='" + postcard1 + "' /> " +
                        "<meta property='og:image:height' content='1024' /> " +
                        "<meta property='og:image:width' content='1024' /> " +
                        "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                        "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                        "<meta property='name' content='modelviewer' /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +                        
                        "<link href=\x22https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" + 
                       
                        "<script src=\x22/main/vendor/jquery/jquery.min.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/indexedDb.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/connect.js\x22 defer=\x22defer\x22></script>" +
                        settingsData +
                        sceneTimedEventsData +
                        aframeScript + 
                        modObjex +
                        modModels +
                        extraScripts + 
                        contentUtils +
                      
                        hlsScript +
                        "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/stats.js/16/Stats.min.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/shaders/noise.js\x22></script>"+
                        "<script src=\x22../main/src/component/aframe-sprite-particles-component.js\x22></script>"+

                        "<script src=\x22../main/src/util/mindar/mindar-image.js\x22></script>"+
                        "<script src=\x22../main/src/util/mindar/mindar-image-aframe.js\x22></script>"+
                        "<script src=\x22https://unpkg.com/aframe-troika-text/dist/aframe-troika-text.min.js\x22></script>"+
                        "<script src=\x22../main/src/component/mod-materials.js\x22></script>"+
                        "</head>\n" +
                        "<body>\n" +
                        "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                        "<div id=\x22token\x22 data-token=\x22"+token+"\x22></div>\n"+
                        "<div class=\x22ar-container\x22>"+
                        "<a-scene mindar-image=\x22imageTargetSrc: "+arImageTargets[0]+";\x22 embedded color-space=\x22sRGB\x22"+    
                            " renderer=\x22colorManagement: true, physicallyCorrectLights\x22 xr-mode-ui=\x22enabled: false\x22 device-orientation-permission-ui=\x22enabled: false\x22>"+
                        "<a-assets>"+
                        videoAsset +
                        gltfsAssets +    
                        "</a-assets>"+
                        videoGroupsEntity+
                        "<a-entity mindar-image-target=\x22targetIndex: 0\x22>" +
                            "<a-gltf-model rotation=\x2290 0 0\x22 position=\x220 0 0.1\x22 scale=\x220.25 0.25 0.25\x22 src=\x22#gltfasset2\x22>"+
                        "</a-entity>"+
                        "<a-camera id=\x22player\x22 position=\x220 0 0\x22 look-controls=\x22enabled: false\x22></a-camera>"
                        "</a-scene>"+
                        "</div>"+    
                        
                        audioSliders +
                        canvasOverlay +
                        dialogButton +
                        attributionsTextEntity +
                       
                        "<div class=\x22smallfont\x22><span id=\x22users\x22></span></div>"+ 
                        "</body>\n" +
                        socketScripts + //?
                        "</html>";
                        console.log("Tryna do a AR Image Tracking scene");

                    } else { /////////////////////////////////////////////////////////------------- Default / AFrame response below ------------------------------
                        let joystick = "joystick=\x22useNavmesh: false\x22";
                        let extraScripts = "";
                        let hasParametricCurve = false;
                        let obbDebug = ""; //to show obb colliders, physics collider debug set elsewhere...
                       
                        if (!showTransport) {
                            transportButtons = "";
                        }
                        if (!showDialog) {
                            dialogButton = "";
                        }
                        if (!showSceneManglerButtons) {
                            sceneManglerButtons = "";
                        }
                        if (locationPictures.length == 0) { //in no pic locations, use circle layout
                            // imageEntities = "<a-entity id=\x22imageEntitiesParent\x22 position='0 3.5 0' rotation=\x2290 0 33\x22 layout=\x22type: circle; radius: 20\x22>"+imageEntities+"</a-entity>\n";
                        }
                        if (sceneResponse.sceneUseDynCubeMap) {
                            skyboxEnvMap = "skybox-env-map";   
                        }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes("hide overlay")) {
                            canvasOverlay = "";
                        }   
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('debug')) { //see matrix.org
                           obbDebug = "obb-collider=\x22showColliders: true\x22";
                        }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('matrix')) { //see matrix.org
                            extraScripts = extraScripts + "<script src=\x22../main/js/browser-matrix.min.js\x22></script>"; 
                            extraEntities = "<a-entity id=\x22matrix_meshes\x22 matrix_meshes=\x22init: true\x22></a-entity>";
                        }
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('parametric')) {
                            hasParametricCurve = true;
                            extraScripts = extraScripts + "<script src=\x22../main/js/parser.js\x22></script>"; 
                            curveEntities = curveEntities + "<a-entity id=\x22p_path\x22 parametric_curve=\x22xyzFunctions: 50*cos(t), 3*cos(3*t) + 20, 50*sin(t);tRange: 0, -6.283;\x22></a-entity>"; //TODODO 
                        }
                       
                        if (sceneResponse.sceneTags != null && sceneResponse.sceneTags.includes('traffic')) {
                            extraScripts = extraScripts + "<script src=\x22/connect/traffic.js\x22 ></script><script src=\x22/main/vendor/axios/axios.min.js\x22></script>"; 
                            // extraEntities = extraEntities + "<a-entity id=\x22traffic_data\x22 traffic_data_viz=\x22init: true\x22></a-entity>";
                        }
                        let sceneQuest = "";
                        if (sceneResponse.sceneQuest != null && sceneResponse.sceneQuest != undefined && sceneResponse.sceneQuest != "") {
                            sceneQuest = sceneResponse.sceneQuest;
                        }

                        let sceneGreeting = sceneResponse.sceneDescription;
                       
                        if (sceneResponse.sceneGreeting != null && sceneResponse.sceneGreeting != undefined && sceneResponse.sceneGreeting != "") {
                            sceneGreeting = sceneResponse.sceneGreeting;

                            if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("greeting")) {
                                console.log("greeting is " + sceneResponse.sceneGreeting);
                                textEntities = textEntities + "<a-entity id=\x22sceneGreetingDialog\x22 class=\x22activeObjexRay\x22 look-at=\x22#player\x22 scene_greeting_dialog=\x22fillColor : "+sceneResponse.sceneFontFillColor+
                                "; outlineColor : "+sceneResponse.sceneFontOutlineColor+"; backgroundColor : "+sceneResponse.sceneTextBackgroundColor+"; font1 : "+sceneResponse.sceneFontWeb1+"; font2 : "+sceneResponse.sceneFontWeb2+"; greetingText : "+sceneResponse.sceneGreeting+"; questText : "+sceneQuest+";\x22></a-entity>";
                            }
                            if (sceneResponse.sceneTags && sceneResponse.sceneTags.includes("greeting hide")) {
                                console.log("greeting is " + sceneResponse.sceneGreeting);
                                textEntities = textEntities + "<a-entity id=\x22sceneGreetingDialog\x22 class=\x22activeObjexRay\x22 look-at=\x22#player\x22 scene_greeting_dialog=\x22behavior: hide; fillColor : "+sceneResponse.sceneFontFillColor+
                                "; outlineColor : "+sceneResponse.sceneFontOutlineColor+"; backgroundColor : "+sceneResponse.sceneTextBackgroundColor+"; font1 : "+sceneResponse.sceneFontWeb1+"; font2 : "+sceneResponse.sceneFontWeb2+"; greetingText : "+sceneResponse.sceneGreeting+"; questText : "+sceneQuest+";\x22></a-entity>";
                            }
                            modelAssets = modelAssets + "<a-asset-item id=\x22flat_round_rect\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/flatroundrect.glb\x22></a-asset-item>\n";
                        }
                        
                        let sceneShadows = "shadow=\x22enabled: false\x22";
                        let physicsInsert = "";
                        let physicsDummy = "";
                        let defaultLights = "";
                        
                        if (physicsScripts.length > 0) { //default is ammo
                            physicsInsert = "physics=\x22driver: ammo; debug: "+debugMode+"; debugDrawMode: 1;\x22";
                            physicsDummy = "<a-box position=\x220 10 -10\x22 width=\x223\x22 height=\x223\x22 depth=\x223\x22 ammo-body=\x22type: dynamic\x22 ammo-shape=\x22type: box;\x22></a-box>"+
                            "<a-box position=\x220 -1 0\x22 width=\x2233\x22 height=\x221\x22 depth=\x2233\x22 material=\x22opacity: 0; transparent: true;\x22 ammo-body=\x22type: static\x22 ammo-shape=\x22type: box;\x22></a-box>";
                        }
                        
                        if (curveEntities.length > 0 && !hasParametricCurve) {
                            curveEntities = "<a-curve id=\x22curve1\x22 type=\x22CatmullRom\x22 closed=\x22true\x22>" + curveEntities + "</a-curve>"+
                            "<a-draw-curve id=\x22showCurves\x22 visible=\x22false\x22 curveref=\x22#curve1\x22 material=\x22shader: line; color: blue;\x22></a-draw-curve>";
                        }
                         
                        let magicWindow = " disable-magicwindow device-orientation-permission-ui=\x22enabled: false\x22 "; //by default use the joystick...
                        // let magicWindow = " disable-magicwindow "; 

                        if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('magicwindow') || sceneResponse.sceneTags.includes('magic window'))) {
                            magicWindow = "";
                            joystick = "";
                            joystickContainer = "";
                            joystickScript = "";
                        }
                        
                        if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('vrmode') || sceneResponse.sceneTags.includes('vr mode'))) {
                            xrmode =  "xr-mode-ui=\x22XRMode: vr\x22";
                        } 
                        if (sceneResponse.sceneTags != null && (sceneResponse.sceneTags.includes('armode') || sceneResponse.sceneTags.includes('ar mode'))) {
                            xrmode =  "xr-mode-ui=\x22XRMode: ar\x22";
                        }
                        if (sceneResponse.sceneUseDynamicShadows) {
                            sceneShadows = "shadow=\x22type: pcfsoft\x22";
                        } 
                        if (!sceneResponse.sceneUseDynamicSky) {
                            defaultLights = "light=\x22defaultLightsEnabled: false;\x22";
                        }
                        /////////AFRAME SCENE DECLARATION////////////////// 
                        
                        let aScene = "<a-scene "+webxrFeatures+" "+sceneBackground+" "+physicsInsert+" "+pool_target+" "+pool_launcher+" gesture-detector " + aframeRenderSettings +
                        " reflection=\x22directionalLight:#real-light\x22 "+sceneShadows+" raycaster=\x22objects: .activeObjexRay a-sphere\x22 "+
                        "screen-controls shadow " + xrmode + " " + magicWindow + " " + obbDebug + " " +
                        "loading-screen=\x22dotsColor: white; backgroundColor: black; enabled: false\x22 " + fogSettings + " "+networkedscene+" "+ARSceneArg+" " + defaultLights +">";
                        
                        let mainDiv = "<div id=\x22mainDiv\x22 style=\x22width:100%; height:100%\x22>";

                        if (sceneResponse.sceneWebType == 'Mapbox') { //no, non-aframe version above - maybe later?
                            aScene = "<a-scene loading-screen=\x22dotsColor: white; backgroundColor: black\x22 xr-mode-ui=\x22enabled: false\x22 keyboard-shortcuts=\x22enterVR: false\x22 device-orientation-permission-ui=\x22enabled: false\x22>";
                            mainDiv = "<div id=\x22map\x22 class=\x22map\x22 style=\x22width:100%; height:100%\x22>"; //closed at end
                            joystickContainer = "";
                        }
                        if (sceneResponse.sceneWebType == 'AR Location Tracking') {
                            console.log("AR Location Tracking mdoe...");
                            aScene = "<a-scene gps-position webxr=\x22referenceSpaceType: unbounded; requiredFeatures: unbounded;\x22 keyboard-shortcuts=\x22enterVR: false\x22 loading-screen=\x22dotsColor: white; backgroundColor: black\x22 xr-mode-ui=\x22enabled: false\x22 device-orientation-permission-ui=\x22enabled: false\x22>";
                            // <a-scene gps-position webxr="referenceSpaceType: unbounded; requiredFeatures: unbounded;"></a-scene>
                            joystickContainer = "";
                  
                        } //else { //default AFRAME with trimmings
                        //AR Image Tracking...?
                        let uid = "0000000000000";
                        if (req.session.user) {
                            uid = req.session.user._id;
                        }
                        var token=jwt.sign({userId:uid,shortID:sceneResponse.short_id},process.env.JWT_SECRET, { expiresIn: '1h' });  
                        let modal = "<div id=\x22theModal\x22 class=\x22modal\x22><div id=\x22modalContent\x22 tabindex=\x22-1\x22 role=\x22dialog\x22 aria-labelledby=\x22modalContent\x22 class=\x22modal-content\x22></div></div>";
                        htmltext = "<html>" +
                        "<!doctype html>"+
                        "<html lang=\x22en\x22>"+
                        "<head> " +
                        "<meta charset=\x22utf-8\x22/>" +
                        "<meta charset=\x22utf-8\x22/>" +
                        "<meta name=\x22viewport\x22 content=\x22width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no\x22/>" +
                        "<meta property=\x22og:url\x22 content=\x22" + process.env.ROOT_HOST + "/webxr/" + sceneResponse.short_id + "\x22 /> " +
                        "<meta property=\x22og:type\x22 content=\x22website\x22 /> " +
                        "<meta property=\x22og:image\x22 content=\x22" + postcard1 + "\x22 /> " + //why postcards must be static!
                        "<meta property=\x22og:image:height\x22 content=\x221024\x22 /> " +
                        "<meta property=\x22og:image:width\x22 content=\x221024\x22 /> " +
                        "<meta property=\x22og:title\x22 content=\x22" + sceneResponse.sceneTitle + "\x22 /> " +
                        "<meta property=\x22og:description\x22 content=\x22" + sceneResponse.sceneDescription + "\x22 /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name=\x22description\x22 content=\x22" + sceneResponse.sceneDescription + "\x22/>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        styleIncludes +
                        "<link href=\x22https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +

                        /////////// script includes /////////////////
                       
                        "<script async src=\x22https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js\x22></script>"+

                        importMap + 
                        
                        
                        "<script src=\x22/main/vendor/jquery/jquery-3.7.1.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/indexedDb.js\x22></script>" +
                        "<script type=\x22module\x22 src=\x22/connect/connect.js\x22></script>" +
                        
                        aframeScript +
                        "<script type=\x22module\x22 src=\x22../main/src/component/aframe-troika-text.min.js\x22 defer=\x22defer\x22></script>"+
                        physicsScripts +
                        logScripts +
                        aframeExtrasScript +
                        extraScripts + //catch all...

                        "<script src=\x22../main/vendor/howler/src/howler.core.js\x22></script>"+
                        "<script src=\x22../main/vendor/howler/src/howler.spatial.js\x22></script>"+
                        hlsScript +
                        
                        "<script type=\x22module\x22 src=\x22../main/js/navigation.js\x22></script>" + //includes navmesh components (simple and not), and extended_wasd_controls
                        blinkScript +   //TODO - check if req comes from vr headset
                        enviromentScript +
                        joystickScript +
                        "<script type=\x22module\x22 src=\x22../main/vendor/aframe/aframe-look-at-component.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/vendor/aframe/aframe-layout-component.js\x22></script>"+

                        "<script type=\x22module\x22 src=\x22../main/src/component/cloud-marker.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/component/local-marker.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/component/mod-materials.js\x22></script>"+

                        // "<script src=\x22../main/src/component/ar-shadow-helper.js\x22></script>"+
                        // "<script src=\x22../main/src/component/ar_hit_caster.js\x22></script>"+
                        // "<script src=\x22../main/vendor/html2canvas/aframe-html-shader.min.js\x22></script>"+
                        primaryAudioScript +
                        ambientAudioScript +
                        triggerAudioScript +
                        // skyGradientScript +
                        ARScript +
                        // cameraEnvMap +
                        modModels +
                        modObjex +

                        contentUtils +
                        audioVizScript +
                        meshUtilsScript +
                        synthScripts +
                        surfaceScatterScript +
                        brownianScript +
                      

                        ///TODO make these conditional
                        "<script src=\x22../main/src/component/aframe-sprite-particles-component.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/component/spawn-in-circle.js\x22></script>"+
                        "<script src=\x22https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/shaders/aframe/aframe-makewaves-shader.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22/main/src/shaders/aframe/aframe-wavy-shader.js\x22></script>"+
                        "<script type=\x22module\x22 src=\x22../main/src/shaders/noise.js\x22></script>"+

                        "</head>" +
                        "<body bgcolor=\x22black\x22>" +
                        
                        modal +
                        mainDiv + //main Div wrapper, different for map

                        "<div class=\x22primaryAudioParams\x22 "+primaryAudioParams+" id="+streamPrimaryAudio+ "_" +oggurl+"></div>"+  //TODO Fix!  concatting the id is stupid, use data-attributes
                        "<div class=\x22ambientAudioParams\x22 id="+ambientUrl+"></div>"+
                        "<div class=\x22triggerAudioParams\x22 id="+triggerUrl+"></div>"+
                        settingsData +
                        sceneTimedEventsData +
                        "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                        audioControl +
                        containers +
                        locationScripts +
                        locationData +
                        geoScripts +
                        "<script type=\x22module\x22 src=\x22../main/js/dialogs.js\x22></script>"+

                        "<div id=\x22dom-overlay\x22 style=\x22visibility: hidden\x22><div id=\x22ar_overlay_message\x22></div>" +
                        "<div><button id=\x22arLockButton\x22 style=\x22visibility: hidden; float:right; margin: auto\x22 type=\x22button\x22 class=\x22arOverlayButton\x22>toggle lock</button></div><br><br><br>"+
                        "<div style=\x22visibility: hidden\x22 id=\x22unlockedButtons\x22>" +
                        "<div><button id=\x22arScaleDownButton\x22 style=\x22float:right; margin: auto\x22 type=\x22button\x22 class=\x22arOverlayButton\x22>scale -</button></div><br><br><br>"+            
                        "<div><button id=\x22arScaleUpButton\x22 style=\x22float:right; margin: auto\x22 type=\x22button\x22 class=\x22arOverlayButton\x22>scale +</button></div><br><br><br>"+  
                        "<div><button id=\x22arRotRightButton\x22 style=\x22float:right; margin: auto\x22 type=\x22button\x22 class=\x22arOverlayButton\x22>rot -</button></div><br><br><br>"+            
                        "<div><button id=\x22arRotLeftButton\x22 style=\x22float:right; margin: auto\x22 type=\x22button\x22 class=\x22arOverlayButton\x22>rot +</button></div></div></div>"+                        
                        // threeDeeTextComponent +
                        aScene +
                        "<div id=\x22overlay\x22></div>"+
                        skySettings +
                       
                        ////////////////ASSETS/////////////
                        // "<a-assets timeout=\x222000\x22>" +
                        "<a-assets>" +
                       
                        playerAvatarTemplate +
                        handsTemplate + 
                        pAudioWaveform +
                        modelAssets +
                        externalAssets +
                        "<a-asset-item id=\x22reticle\x22 src=\x22https://cdn.aframe.io/examples/ar/models/reticle/reticle.gltf\x22 response-type=\x22arraybuffer\x22 crossorigin=\x22anonymous\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22square1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/square1.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22rectangle1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/rectangle1.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22avatar_model\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22flatsquare\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/flatsquare.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22landscape_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/landscape_panel8.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22landscape_panel_wide\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/wide_landscape_panel8.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22dialog_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/dialogpanel2.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22portrait_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/portrait_panel8.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22square_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelsquare1.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22square_panel_plain\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/plainsquare_panel8.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22textbackground\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/textbackground1b.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22texticon\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/texticon1b.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22exclamation\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/exclamation.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22previous_button\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/previous.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22next_button\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/next.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22mailbox\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/mailbox2.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22links\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/links.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22poi1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/poi1b.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22gate2\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/gate2.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22plane150\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/plane150.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22key\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/key1b.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22talkbubble\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/talkbubble1b.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22thoughtbubble\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/thoughtbubble1.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22youtubeplayer\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/youtubeplayer2.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22audioplayer\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/audioplayer_3x1_d.glb\x22></a-asset-item>\n"+
                        "<a-asset-item id=\x22reticle2\x22 response-type=\x22arraybuffer\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/reticle2.glb\x22></a-asset-item>\n"+
                        "<a-mixin id=\x22bar\x22 geometry=\x22primitive: box\x22 material=\x22color: black\x22 scale-y-color=\x22from: 10 60 10; to: 180 255 180; maxScale: 15\x22></a-mixin>\n"+
                        videosphereAsset +
                        webcamAsset +

                        "<img id=\x22n_button\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/next_button_128.png\x22 crossorigin=\x22anonymous\x22>"+
                        "<img id=\x22p_button\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/previous_button_128.png\x22 crossorigin=\x22anonymous\x22>"+
                        "<img id=\x22fly_button\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/fly_button_128.png\x22 crossorigin=\x22anonymous\x22>"+
                        "<img id=\x22camlock_button\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/camlock_button_128.png\x22 crossorigin=\x22anonymous\x22>"+
                        "<img id=\x22play_button\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/play_button_128.png\x22 crossorigin=\x22anonymous\x22>"+

                        "<img id=\x22fireanim1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/fireanim3.png\x22 crossorigin=\x22anonymous\x22></img>"+
                        "<img id=\x22candle1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/candle_flame_8x8.png\x22 crossorigin=\x22anonymous\x22></img>"+
                        "<img id=\x22smoke1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/smokeanim2.png\x22 crossorigin=\x22anonymous\x22>"+
                        "<img id=\x22explosion1\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/pics/explosion1.png\x22 crossorigin=\x22anonymous\x22>"+

                        imageAssets +
                        weblinkAssets +
                        gltfsAssets +
                        videoAsset +
                        grabMix +
                        skyboxAsset +
                        navmeshAsset +
                        "</a-assets>\n"+

                        //////////////ENTITIES////////////////////
                        aframeEnvironment +
                        ambientLight + 
                        cameraRigEntity +
                        ocean +
                        terrain +
                        curveEntities +
                        renderPanel +
                        weblinkEntities +
                        gltfsEntities + 
                        skyParticles +
                        imageEntities +
                        externalEntities +
                        geoEntities +
                        videoEntity +
                        youtubeEntity +
                        textEntities +
                        attributionsTextEntity +
                        availableScenesEntity +
                        pictureGroupsEntity +
                        pictureGroupsData +
                        scenePictureData +
                        sceneTextData + 
                        videoGroupsEntity +
                        navmeshEntity +
                        surfaceEntity +
                        networkingEntity +
                        locationEntity +
                        primaryAudioEntity +
                        ambientAudioEntity + 
                        triggerAudioEntity +
                        lightEntities +
                        groundPlane +
                        extraEntities +
                        placeholderEntities +
                        proceduralEntities +
                        loadLocations +
                        "<a-entity id=\x22createAvatars\x22 create_avatars></a-entity>"+
                        "<a-entity id=\x22particleSpawner\x22 particle_spawner></a-entity>"+
                        
                        audioVizEntity +
                        instancingEntity + 
                        arElements +
                        loadAudioEvents +
                        "<a-entity id=\x22youtube_element\x22 youtube_element_aframe=\x22init: ''\x22></a-entity>"+

                        //create these at runtime now...//nm
                        "<a-entity id=\x22mod_dialog\x22 visible=\x22false\x22 look-at=\x22#player\x22 mod_dialog=\x22mode: 'confirm'\x22>"+
                        "<a-entity id=\x22mod_dialog_text\x22 position=\x22.05 .05 .05\x22></a-entity>"+
                        "<a-entity id=\x22mod_dialog_panel\x22 class=\x22gltf activeObjexRay\x22 gltf-model=\x22#dialog_panel\x22></a-entity>" +
                        "</a-entity>" + //end dialog
                        
                        modelData +
                        objectData +
                        inventoryData +
                        
                        "</a-scene>\n"+ ///////////////////////----- CLOSE AFRAME SCENE !
                        
                        "</div>\n"+
                        sceneTextItemData +
                        "<div id=\x22geopanel\x22 class=\x22geopanel\x22><span></span></div>\n"+
                        "<div id=\x22sceneGreeting\x22 style=\x22z-index: -20;\x22>"+sceneGreeting+"</div>"+
                        "<div id=\x22sceneQuest\x22 style=\x22z-index: -20;\x22>"+sceneQuest+"</div>"+
                        "<div class=\x22backmask\x22 style=\x22position: fixed; left: 0; top: 0; z-index: -5; overflow: hidden\x22></div>"+ //to hide lower elements
                        "<div class=\x22render_panel\x22 style=\x22position: fixed; left: 0; top: 0; z-index: -50; overflow: hidden margin: auto\x22 id=\x22renderPanel\x22></div>"+
                        "<div class=\x22augpanel\x22><p></p></div>\n"+
                       
                        joystickContainer +
                        // screenOverlay + //socket picture
                        canvasOverlay + //drop down side panel
                        audioSliders +
                        mapOverlay + 
                        adSquareOverlay +
                        "<div class=\x22next-button\x22 id=\x22nextButton\x22 style=\x22visibility: hidden\x22 ><i class=\x22fas fa-arrow-circle-right fa-2x\x22></i></div>"+
                        "<div class=\x22footer-text\x22 id=\x22footerText\x22></div>"+
                        "<div class=\x22previous-button\x22 id=\x22previousButton\x22 style=\x22visibility: hidden\x22 ><i class=\x22fas fa-arrow-circle-left fa-2x\x22></i></div>"+
                        "<a href=\x22''\x22 target=\x22_blank\x22 class=\x22ar-buttoon\x22>AR</a>" + //?
                        "<div id=\x22token\x22 data-token=\x22"+token+"\x22></div>\n"+
                        locationButton+
                        dialogButton+
                        ethereumButton+ 
                        cameraLockButton +
                        transportButtons+ 
                        socketScripts +
                        navmeshScripts +
                        shaderScripts +
                        activityPubScripts +
                        sceneManglerButtons +
                        videoElements +
                        "</body>" +
                    "</html>";
                }
                if (!accessScene) {
                    let noAccessHTML = "<html xmlns='http://www.w3.org/1999/xhtml'>" +
                    "<head> " +
                    // "<link href=\x22css/sb-admin-2.css\x22 rel=\x22stylesheet\x22>" +
                    "<style>" +
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
                    res.send(htmltext).end();   
                }
        } catch (e) {
            console.log("error in webxr route : " + e);
            res.send("error in webxr route " + e);
        }
    })();
        
});
///// END PRIMARY SERVERSIDE /webxr/ ROUTE //////////////////////


export default webxr_router;
