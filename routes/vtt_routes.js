///////// DEPRECATED see pixi routes

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express");
const vtt_router = express.Router();
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


const nonLocalDomains = ["regalrooms.tv"]; //TODO you know what! (put this in sceneDomain object)

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
    
vtt_router.get("/test", function (req, res) {
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


////////////////////PRIMARY /WEBXR ROUTE  e.g. /webxr/<short_id> ///////////////////
vtt_router.get('/:_id', function (req, res) { 
    

        res.redirect('../pixi/'+ req.params._id);

        
});
///// END PRIMARY SERVERSIDE /webxr/ ROUTE //////////////////////


export default vtt_router;
