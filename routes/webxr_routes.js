////////// DEPRECATED see aframe routes

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
    if (filename) {
        console.log("tryna get extension of " + filename)
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i);
    } else {
        return null;
    }
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
    
    //
    res.redirect('../aframe/'+ req.params._id);

        
});
///// END PRIMARY SERVERSIDE /webxr/ ROUTE //////////////////////


export default webxr_router;
