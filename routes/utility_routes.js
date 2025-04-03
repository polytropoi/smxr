//copyright 2025 Service Media, Inc

///////////// duplicates some stuff from https://github.com/polytropoi/smxr_utils, which should be run separately in production, to keep media processing overhead from affecting main api 
///////////// these routes and the 

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from 'path';
import { fileURLToPath } from 'url';

import express, { query } from "express";
import http from "http";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
// import mongojs from "mongojs";
import methodOverride from "method-override";
import session from "express-session";
import MongoStore from "connect-mongo"; //better
import validator from "validator"; 
// import minio from "minio";
import helmet from "helmet";

import sharp from "sharp";


import bcrypt from "bcryptjs"; //just drop in replacement ?!? ok then

import { ObjectId } from "mongodb";
import { RunDataQuery } from "./connect/database.js"; //connection happens here

import fs from 'fs/promises'

const { Readable, Writable } = require("node:stream");
const fs_sync = require("node:fs");

import { readFile } from "node:fs/promises";
const entities = require("entities"); //hrm
// const fs = require("fs");

const ffmpeg = require('fluent-ffmpeg')
const ffmpeg_static = require('ffmpeg-static')
// const requireText = require('require-text');

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
    
export let app = express();
require('dotenv').config();

export let googleMapsKey = process.env.GOOGLEMAPS_KEY;

// utils_router.use(helmet.contentSecurityPolicy());
utils_router.use(helmet.dnsPrefetchControl());
utils_router.use(helmet.expectCt());

utils_router.use(helmet.hidePoweredBy());
utils_router.use(helmet.hsts());
utils_router.use(helmet.ieNoOpen());
utils_router.use(helmet.noSniff());
utils_router.use(helmet.permittedCrossDomainPolicies());
utils_router.use(helmet.referrerPolicy());
utils_router.use(helmet.xssFilter());


var rootHost = process.env.ROOT_HOST
var topName = process.env.ROOT_NAME;
var requirePayment = true; //if subscription is required to login, true for servicemedia
var adminEmail = process.env.ADMIN_EMAIL;
var domainAdminEmail = process.env.DOMAIN_ADMIN_EMAIL;

var whitelist = ['unityapp', 'http://smxr.net', 'https://smxr.net', 'https://servicemedia.s3.amazonaws.com/', 'http://localhost:3000', 'https://servicemedia.net', 'strr.us.s3.amazonaws.com', 'mvmv.us.s3.amazonaws.com', 'http://strr.us', 'https://strr.us',
 'https://strr.us/socket.io', 'http://valuebring.com', 'http://elnoise.com', 'philosophersgarden.com', 'http://elnoise.com', 'http://eloquentnoise.com', 'http://thefamilyshare.com', 'http://little-red-schoolhouse.com', 
 'http://visiblecity.net', 'http://philosophersgarden.net', 'https://realitymangler.com', 'http://regalrooms.tv', 'https://mvmv.us', 'http://mvmv.us', 
 'http://nilch.com', 'https://servicemedia.net', 'http://kork.us', 'http://spacetimerailroad.com'];

var corsOptions = function (origin) {
//    console.log("checking vs whitelist:" + origin);
    if ( whitelist.indexOf(origin) !== -1 ) {
        return true;
    } else {
        return true; //fornow...
    }
};

var oneDay = 86400000;

let busy = false;
// var databaseUrl = process.env.MONGO_URL; //main db connstring
// // console.log(databaseUrl);
// var collections = ["acl", "auth_req", "domains", "apps", "assets", "assetsbundles", "models", "users", "inventories", "inventory_items", "audio_items", "text_items", "audio_item_keys", "image_items", "video_items",
//     "obj_items", "paths", "keys", "traffic", "scores", "attributes", "achievements", "activity", "actions", "purchases", "storeitems", "scenes", "groups", "weblinks", "locations", "iap"];

// export let db_old = mongojs(databaseUrl, collections); //soon you will die!!  VERY SOON!!  HA AHHHAA!
utils_router.use(express.static(path.join(__dirname, './'), { maxAge: oneDay }));

utils_router.use(function(req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Max-Age', '300');
    res.header('Access-Control-Allow-Headers', 'Origin, Access-Control-Allow-Origin, x-unity-version, X-Unity-Version, token, cookie, appid, Cookie, X-Access-Token, x-access-token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    res.header('Access-Control-Expose-Headers', 'set-cookie, Set-Cookie', 'token');
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
});

utils_router.use(methodOverride());  //for header rewriting

var expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 2 hour

utils_router.use(session({
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_SESSIONS_URL }), //new way w/ mongo connect
    rolling: true,
    secret: process.env.JWT_SECRET }));


utils_router.use(cookieParser()); //unused?
utils_router.use(bodyParser.json({ "limit": "150mb", extended: true })); //set this to route specific somehow, for add_scene_mods?
utils_router.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

var maxItems = 1000;

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
    S3Client, 
    S3ServiceException, 
    GetObjectCommand, 
    HeadObjectCommand, 
    CopyObjectCommand, 
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import {SESClient,SendEmailCommand} from "@aws-sdk/client-ses"
// export let s3 = new aws.S3();
export const s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWSKEY,
        secretAccessKey: process.env.AWSSECRET
    }
});
export const ses = new SESClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWSKEY,
        secretAccessKey: process.env.AWSSECRET
    }
});

///////// minio init ///////////////////////////////
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

if (process.env.GRAB_AND_SQUEEZE && process.env.GRAB_AND_SQUEEZE === "YES") {
    //import the media libs and enabled the gs routes
}
////////////////////////////////////
var appAuth = "noauth";

var server = http.createServer(app);
server.timeout = 240000;
server.keepAliveTimeout = 24000;
server.listen(process.env.PORT || 4000, function() {
    console.log("Express server listening on port 4000");
});

// INCLUDE EXTERNAL ROUTES BELOW

// import gs_routes from './routes/gs_routes.js';
// utils_router.use('/gs', gs_routes);  

//////////////////// middleware functions inserted into routes

export function requiredAuthentication(req, res, next) { //primary auth method, used in the routes below

    if (req.session.user && req.session.user.status == "validated") { //check using session cookie
        if (requirePayment) { 
            if (req.session.user.paymentStatus == "ok") {
                next();
            } else {
                req.session.error = 'Access denied! - payment status not ok';
                res.send('payment status not OK');       
            }
        } else {
            console.log("authenticated!");
            next();
        }
    } else {
        if (req.headers['x-access-token'] != null) {  //check using json web token
            var token = req.headers['x-access-token'];
            console.log("req.headers.token: " + token);
            jwt.verify(token, process.env.JWT_SECRET, function (err, payload) {
                    console.log(JSON.stringify(payload));
                    if (payload) {
                        // user.findById(payload.userId).then(
                        //     (doc)=>{
                        //         req.user=doc;
                        //         next();
                        //     }
                        // )
                        // console.log("gotsa token payload: " + req.session.user._id + " vs " +  payload.userId);
                        if (payload.userId != null){
                            (async () => {
                              console.log("gotsa payload.userId : " + payload.userId);
                              try {
                                var oo_id = ObjectId.createFromHexString(payload.userId);
                                const query = {"_id": oo_id};
                                const user = await RunDataQuery("users", "findOne", query);
                                if (user) {
                                  if (user.status == "validated") {
                                      // userStatus = "subscriber";
                                      console.log("user is good");
                                      next();
                                    } else {
                                      req.session.error = 'Access denied!';
                                      console.log("token authentication failed! not a subscriber");
                                      res.send('noauth');    
                                    }
                                } else {
                                  req.session.error = "access denied!";
                                  req.send("noauth");
                                }
                              } catch (e) {
                                req.session.error = "auth error! " + e;
                                console.log("auth error! " + e);
                              }
                            
                           
                          })();
                            // next();
                        } else {
                            req.session.error = 'Access denied!';
                            console.log("token authentication failed! headers: " + JSON.stringify(req.headers));
                            res.send('noauth');
                        }
                    } else {
                        req.session.error = 'Access denied!';
                        console.log("token authentication failed! headers: " + JSON.stringify(req.headers));
                        res.send('noauth');
                    }
            });
        } else {
            req.session.error = 'Access denied!';
            console.log("authentication failed! No cookie or token found");
            res.send('noauth');
        }
    }
}

export function checkAppID(req, res, next) {
    console.log("req.headers: " + JSON.stringify(req.headers));
    if (req.headers.appid) {
        var a_id = ObjectId.createFromHexString(req.headers.appid.toString().replace(":", ""));

        (async () => {
          try {
            const query = {"_id": a_id };
            const app = await RunDataQuery("apps", "findOne", query);

            next();
          } catch (e) { 
                console.log("no app id! " + e);
                req.session.error = 'Access denied!';
                res.send("noappauth " + e);
          }
        })();

    } else {
        console.log("no app id!");
        req.session.error = 'Access denied!';
        res.send("noappauth");
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function admin (req, res, next) { //check user id against acl
    var u_id = req.session.user._id.toString();
    if (req.session.user != undefined) {
        if (req.session.user.authLevel != undefined) {
            if (req.session.user.authLevel.includes("admin")) {
                next(); 
            } else {
                req.session.error = 'Access denied!';
                res.send('noauth');
            }
        }
    }
}

function usercheck (req, res, next) { //gotsta beez the owner of requested resource
    var u_id = req.session.user._id.toString();
    var req_u_id = req.params._id;
//        var scene_id = req.params.scene_id;
    console.log("checkin " + u_id + " vs " + req_u_id);
    if (u_id == req_u_id.toString().replace(":", "")) { //hrm.... dunno why the : needs trimming...
        next();
    } else {
        req.session.error = 'Access denied!';
        res.send('noauth');
    }
}

function domainadmin (req, res, next) { //TODO also check acl
    (async () => {
        try {
            const oid = ObjectId.createFromHexString(req.session.user._id.toString());
            const query = {"_id": oid};
            const user = await RunDataQuery("users", "findOne", query);
            if (user.authLevel.includes("domain_admin") || user.authLevel.includes("admin")) { //should be separate, but later..
                next();
            } else {
               res.send("noauth");
            }
        } catch (e) {
            console.log("error checking domainadmin " + e);
            res.send("noauth " + e);
        }
    })();  
}


export function getExtension(filename) {
    // console.log("tryna get extension of " + filename);
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

export function convertStringToObjectID (stringID) {
    if (ObjectId.isValid(stringID)) {
        return ObjectId.createFromHexString(stringID);
    } else {
        return null;
    }
    
}

export function removeDuplicates(arr){
    let unique_array = []
    for(let i = 0;i < arr.length; i++){
        if(unique_array.indexOf(arr[i]) == -1){
            unique_array.push(arr[i])
        }
    }
    return unique_array
}

export function saveActivity (data) {
    (async () => {
        try {
            const saved = await RunDataQuery("activity", "insertOne", data);
            console.log("inserted an activity " + saved);
        } catch (e) {
            console.log("error inserting activity " + e);
        }
    })();
      
}


//ROUTES BELOW
////////////////////////////////////////////////////////////////
utils_router.get("/", function (req, res) {
    //send "Hello World" to the client as html
    res.send("Hello World!");
    // res.writeHead(301,{Location: 'http://w3docs.com'});
    // res.end();
});






   
const ffmpegPromise_hls360 = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
    //   ffmpeg(inputPath)
    //     .output(outputPath)
    let savepath = outputPath + 'output.m3u8'; //local
        ffmpeg(inputPath)
            .setFfmpegPath(ffmpeg_static)
            // var proc = ffmpeg('rtmp://path/to/live/stream', { timeout: 432000 })
            .output(savepath)
            .outputOptions([
              // '-codec: copy',
              '-hls_time 5',
              '-hls_list_size 0',
              '-hls_playlist_type vod',
              // '-hls_base_url http://localhost:8080/',
              '-hls_segment_filename '+ outputPath +'%03d.ts'
            ])
            // set video bitrate
            .videoBitrate(5000) //compromise
            // set h264 preset
            // .addOption('preset','superfast')
            // set target codec
            .videoCodec('libx264')
            // set audio bitrate
            // .audioCodec('libfdk_aac')
            .audioBitrate('128k')
            // set audio codec
            // .audioCodec('libmp3lame')
            // set number of audio channels
            .audioChannels(2)
            .withSize('4096x2048') //4k equirect
            // set hls segments time
            // .addOption('-hls_time', 10)
            // // include all the segments in the list
            // .addOption('-hls_list_size',0)
            // setup event handlers
            .on('end', () => resolve(outputPath))
            .on('progress', (progress) => {
                console.log(`Frame: ${progress.frames} - Time: ${progress.timemark}`);
            })
            .on('error', (err) => reject(new Error(`FFmpeg failed: ${err.message}`)))
            .run();
    });
  }

  async function exists(f) {
    try {
      await fs.promises.stat(f);
      return true;
    } catch {
      return false;
    }
  }  

utils_router.post('/process_video_hls_local', requiredAuthentication, function (req, res) {
    let fullpath = req.body.fullpath;

   console.log("tryna encode local file " + req.body.fullpath); 
    (async () => {
        try {
            if (!busy) {    
                const fileExists = await exists(fullpath);
                if (!fileExists){
                    console.log("that file doesn't exist!");   
                }//exists is deprecated, existSync doesn't work w/ promise version..
                if (!req.session.user || process.env.LOCAL_TEMP_FOLDER == undefined && process.env.LOCAL_TEMP_FOLDER == "") {
                    console.log("temp folders not found!");
                } else {
                    busy = true;
                    var ts = Math.round(Date.now() / 1000);
                    let downloadpath = path.dirname(fullpath) + "/";  //set local folder
                    let filename = path.basename(fullpath); // set local filename (*.mp4)                
                    
                    var stats = fs.stat(fullpath)
                    var fileSizeInBytes = stats.size;
                    // Convert the file size to megabytes (optional)
                    var fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                    const updoc = {
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : ts + "." + filename,
                        filename : filename,
                        item_type : 'video',
                        tags: [],
                        item_status: "private",
                        otimestamp : ts,
                        ofilesize : fileSizeInMegabytes};
                    //insert vid first to get the id used for paths below
                    console.log("tryna save hls to " + downloadpath + " filename " + filename + " size " + fileSizeInMegabytes );
                    
                    const response = await ffmpegPromise_hls360(fullpath, downloadpath);
                    console.log("hls encoding result " +JSON.stringify(response));

                    const video_item = await RunDataQuery("video_items", "insertOne", updoc);
                    console.log("inserted video item, uploading next...")
                    const files = await fs.readdir(downloadpath);
                    for (const file of files) {
                        console.log("tryna read file " + downloadpath + file);
                        if (path.extname(file) == '.ts') {   
                            const theFile = await fs.readFile(downloadpath + file);
                            const status = await PutObject(process.env.ROOT_BUCKET_NAME,"users/" + updoc.userID + "/video/" + video_item.insertedId +"/hls/" + file, theFile, 'video/MP2T');
                            // console.log("upload status " + status.size);
                        } else if (path.extname(file) == '.m3u8') {
                            const theFile = await fs.readFile(downloadpath + file);
                            const status = await PutObject(process.env.ROOT_BUCKET_NAME,"users/" + updoc.userID + "/video/" + video_item.insertedId +"/hls/" + file, theFile, 'application/x-mpegURL');
                            // console.log("upload status " + status.size);
                        }
                    }
                    busy = false;
                    res.send ("done!!");
                    console.log("Done!@ :)") ;  
                }
            
            } else {
                console.log("busy at the moment, give us a shake..");
            }
        } catch (e) {
            console.log("error projessing hls local " + e);
            busy = false;
            res.send("error projessing hls local " + e);
        }
    })(); //end async   
});


utils_router.get('/resize_uploaded_picture/:_id', requiredAuthentication, function (req, res) { //presumes original pic has already been uploaded to production folder and db entry made
    console.log("tryna resize pic with key: " + req.params._id);
    
    (async () => { 
        try {
            var o_id = ObjectId.createFromHexString(req.params._id);
            const query = {"_id": o_id};
            let image = await RunDataQuery("image_items", "findOne", query);
            console.log("gotsa image from db " + image._id);
            let oKey = "users/" + image.userID + "/pictures/originals/" + image._id +".original."+image.filename;
            // var params = {Bucket: process.env.ROOT_BUCKET_NAME, Key: oKey};
            let extension = getExtension(image.filename).toLowerCase();
            let contentType = 'image/jpeg';
            let format = 'jpg';
            let alphaValue = 1;
            if (extension == ".PNG" || extension == ".png") {
                contentType = 'image/png';
                format = 'png';
                alphaValue = 0;
            } 
            let bytes = await GetObject(process.env.ROOT_BUCKET_NAME, oKey, "binary"); //get the original pic, returns byte array
            console.log("gots data with format " + format + " with alpha " + alphaValue +  " key : users/" + image.userID + "/pictures/originals/" + image._id +".original."+image.filename);
            const buffer = Buffer.from(bytes); //convert to buffer for sharp

                const buff1 = await sharp(buffer)
                .resize({
                kernel: sharp.kernel.nearest,
                height: 1024,
                width: 1024,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: alphaValue }
                })
               
                .toFormat(format)
                .toBuffer();

                // console.log("tryna put standard to key : users/" + image.userID + "/pictures/" + image._id +".standard."+image.filename );
                let key1 = "users/" + image.userID + "/pictures/" + image._id +".standard."+image.filename;
                const putstatus_1 = await PutObject(process.env.ROOT_BUCKET_NAME, key1, buff1, contentType); 
                console.log("putstatus 1 ok");

                const buff2 = await sharp(buffer)
                // .flatten({ background: { r: 0, g: 0, b: 0, alpha: alphaValue } })
                .resize({
                kernel: sharp.kernel.nearest,
                height: 512,
                width: 512,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: alphaValue }
                })
                
                .toFormat(format)
                .toBuffer();
                
                let key2 = "users/" + image.userID + "/pictures/" + image._id +".half."+image.filename;
                const putstatus_2 = await PutObject(process.env.ROOT_BUCKET_NAME, key2, buff2, contentType); 
                console.log("putstatus 2 ok");

                const buff3 = await sharp(buffer)
                
                .resize({
                kernel: sharp.kernel.nearest,
                height: 128,
                width: 128,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: alphaValue }
                })
                
                .toFormat(format)
                .toBuffer();
                
                let key3 = "users/" + image.userID + "/pictures/" + image._id +".thumb."+image.filename;
                const putstatus_3 = await PutObject(process.env.ROOT_BUCKET_NAME, key3, buff3, contentType); 
                console.log("putstatus 3 ok");
                console.log("Done resizng " + format);
        
        } catch (e) {
            console.log("error resizing pic " + e);
            res.send("error resizing pic " + e);
        }
    })();//end async
        
});
       
async function DownloadAudioFile (params, location) {
    //errors caught in calling function?
    try {
        const response = await GetObject(params.Bucket, params.Key, "stream");
        console.log("response is " + response);
        const fileStream = fs_sync.createWriteStream(location);
        response.Body.pipe(fileStream);
        console.log("done downloading audio..");
    } catch (e) {
        console.log("error downloading audio file! " +e);
    }   
}


const ffmpegPromise_audioFiles = (inputPath, audio_id) => {
    return new Promise((resolve, reject) => {
        //   ffmpeg(inputPath)
        //     .output(outputPath)
        ffmpeg(inputPath)
        .setFfmpegPath(ffmpeg_static)
        
        .output(process.env.LOCAL_TEMP_FOLDER + "/" + audio_id + 'tmp.png')            
        .complexFilter(
        [
            '[0:a]aformat=channel_layouts=mono,showwavespic=s=600x200'
        ]
        )
        .outputOptions(['-vframes 1'])
        // .format('png')

        .output(process.env.LOCAL_TEMP_FOLDER + "/" + audio_id + 'tmp.ogg')
        .audioBitrate(192)
        .audioCodec('libvorbis')
        .format('ogg')

        .output(process.env.LOCAL_TEMP_FOLDER + "/" + audio_id + 'tmp.mp3')
        .audioBitrate(192)
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('end', () => resolve("done squeezing audio"))
        .on('progress', (progress) => {
            console.log(`Frame: ${progress.frames} - Time: ${progress.timemark}`);
        })
        .on('error', (err) => reject(new Error(`FFmpeg failed: ${err.message}`)))

        .run();
    });
}

utils_router.get('/process_audio_download/:_id', requiredAuthentication, function (req, res) { //download before processing, instead of streaming it// combined minio/s3 version
    console.log("tryna process audio : " + req.params._id);
    if (process.env.LOCAL_TEMP_FOLDER && process.env.LOCAL_TEMP_FOLDER != "") {
        (async () => {
            if (!busy) {    
                try {
                    busy = true;
                    const o_id = ObjectId.createFromHexString(req.params._id);
                    const query = {"_id": o_id};
                    let audio_item = await RunDataQuery("audio_items", "findOne", query);
                    let downloadpath = process.env.LOCAL_TEMP_FOLDER + audio_item._id;
                    var params = {Bucket: process.env.ROOT_BUCKET_NAME, Key: 'users/' + audio_item.userID + '/audio/originals/' + audio_item._id + ".original." + audio_item.filename};
                    let filename = audio_item._id +"."+ audio_item.filename;
                    await fs.mkdir(downloadpath);
                    await DownloadAudioFile(params, downloadpath + "/" + filename);
                    console.log("file downloaded " + downloadpath + "/" + filename);
                    const processed = await ffmpegPromise_audioFiles(downloadpath +"/"+ filename, audio_item._id); //send for processing
                  
                    console.log("status processing audio " + processed); //files below should be in place now....
                    const put1 = await PutObject(process.env.ROOT_BUCKET_NAME,"users/" + audio_item.userID + "/audio/" + audio_item._id +"."+path.parse(audio_item.filename).name + ".mp3",
                    await readFile(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.mp3'),'audio/mp3');
                    fs.unlink(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.mp3');

                    const put2 = await PutObject(process.env.ROOT_BUCKET_NAME,"users/" + audio_item.userID + "/audio/" + audio_item._id +"."+path.parse(audio_item.filename).name + ".ogg",
                    await readFile(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.ogg'),'audio/ogg');
                    fs.unlink(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.ogg');
                    
                    const put3 = await PutObject(process.env.ROOT_BUCKET_NAME,"users/" + audio_item.userID + "/audio/" + audio_item._id +"."+path.parse(audio_item.filename).name + ".png",
                    await readFile(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.png'),'audio/png');
                    fs.unlink(process.env.LOCAL_TEMP_FOLDER + "/" + audio_item._id + 'tmp.png');

                    busy = false;
                    res.send("processed and uploading..");

                } catch (e) {
                    busy = false;
                    console.log("error processing audio files " + e);
                    res.send("error processing audio files " + e);
                }
            } else {
                console.log("busy with audio processing, give us a shake...");
            }
        })();
    } else {
        console.log("no temp folder found!");
    }
});

export default utils_router;