//copyright 2025 Service Media, Inc

import { createRequire } from "module";

const require = createRequire(import.meta.url);

import path from 'path';
import { fileURLToPath } from 'url';

import express, { query } from "express";
import http from "http";
import jwt from "jsonwebtoken";
import axios from "axios"; //you're next to go buddy
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import methodOverride from "method-override";
import session from "express-session";
import MongoStore from "connect-mongo"; //better
import validator from "validator"; 
// import minio from "minio";
import helmet from "helmet";

import bcrypt from "bcryptjs"; //just drop in replacement ?!? ok then
import shortid from "shortid";
import QRCode from "qrcode";
import { ObjectId } from "mongodb";
import { RunDataQuery } from "./connect/database.js"; //connection happens here
import { ReturnPresignedUrl, ReturnPresignedUrlPut, DeleteObject, DeleteObjects, ReturnObjectExists, ReturnObjectMetadata, ListObjects, GetObject, PutObject, CopyObject } from "./connect/objectStore.js";
import chalk from 'chalk';
const entities = require("entities"); //hrm
require('dotenv').config();
// const requireText = require('require-text'); 

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
    
export let app = express();


export let googleMapsKey = process.env.GOOGLEMAPS_KEY;

// app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());

app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());


let minioClient = null;
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

app.use(express.static(path.join(__dirname, './'), { maxAge: oneDay }));

app.use(function(req, res, next) {

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

app.use(methodOverride());  //for header rewriting

var expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 2 hour

app.use(session({
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_SESSIONS_URL }), //new way w/ mongo connect
    rolling: true,
    secret: process.env.JWT_SECRET }));


app.use(cookieParser()); //unused?
app.use(bodyParser.json({ "limit": "150mb", extended: true })); //TODO set this to route specific somehow, for add_scene_mods?
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

var maxItems = 1000;

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// import {
//     S3Client, 
//     S3ServiceException, 
//     GetObjectCommand, 
//     HeadObjectCommand, 
//     CopyObjectCommand, 
//     ListObjectsV2Command,
//     PutObjectCommand,
//     DeleteObjectCommand,
//     DeleteObjectsCommand,
// } from "@aws-sdk/client-s3";

import {SESClient,SendEmailCommand} from "@aws-sdk/client-ses"
// export let s3 = new aws.S3();
// export const s3 = new S3Client({
//     region: 'us-east-1',
//     credentials: {
//         accessKeyId: process.env.AWSKEY,
//         secretAccessKey: process.env.AWSSECRET
//     }
// });
export const ses = new SESClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWSKEY,
        secretAccessKey: process.env.AWSSECRET
    }
});

///////// minio init ///////////////////////////////
// var minioClient = null;
// if (process.env.MINIOKEY && process.env.MINIOKEY != "" && process.env.MINIOENDPOINT && process.env.MINIOENDPOINT != "") {
//     const minio = require('minio');
//         minioClient = new minio.Client({
//         endPoint: process.env.MINIOENDPOINT,
//         port: 9000,
//         useSSL: false,
//         accessKey: process.env.MINIOKEY,
//         secretKey: process.env.MINIOSECRET
//     });
// }


if (process.env.GRAB_AND_SQUEEZE && process.env.GRAB_AND_SQUEEZE === "YES") {
    //import the media libs and enabled the gs routes
}
////////////////////////////////////
var appAuth = "noauth";

var server = http.createServer(app);
server.timeout = 240000;
server.keepAliveTimeout = 24000;
server.listen(process.env.PORT || 3000, function() {
    console.log("Express server listening on port 3000");
});

// INCLUDE EXTERNAL ROUTES BELOW


import webxr_routes from './routes/webxr_routes.js';
app.use('/webxr', webxr_routes); 

// import aframe_esm_routes from './routes/aframe_esm_routes.js';
// app.use('/esm', aframe_esm_routes); 

import landing_routes from './routes/landing_routes.js';
app.use('/landing', landing_routes);  

import vtt_routes from './routes/vtt_routes.js';
app.use('/vtt', vtt_routes);  

/// uncomment to add these optional routes
import unity_routes from './routes/unity_routes.js';
app.use('/unity', unity_routes);  

import stripe_routes from './routes/stripe_routes.js';
app.use('/stripe', stripe_routes);

// import utility_routes from './routes/utility_routes.js'; //NOTE you must npm install sharp, ffmpeg-fluent, and ffmpeg-static!  These modules are not included in package.json
// app.use('/utils', utils_routes);  

// import oculus_routes from './routes/oculus_routes.js';
// app.use('/oculus', oculus_routes)


/////// SOCKET.IO SHOW/HIDE Below to run socket.io on same port

///this one gets users through handshake
// var socketUsers = {};
// var allUsers = [];
// var io = require('socket.io')(server);
// var mongoAdapter = require('socket.io-adapter-mongo'); //still? //HRM!
// io.adapter(mongoAdapter( process.env.MONGO_SESSIONS_URL )); 
// io.set('origins', 'servicemedia.net');
// io.set('transports', ['polling', 'websocket']);
import { Server } from "socket.io";
const io = new Server(server, {
  transports: ['websocket'],
  connectionStateRecovery: {}
});

async function getSocketsInRoom(roomID) {
  const sockets = await io.in(roomID).fetchSockets();
  // 'sockets' will be an array of Socket instances in the specified room
  return sockets;
}

io.serveClient(true);
// socket = io;
io.on('connection', function(socket) {
    var room = "";
    socket.token = socket.handshake.query.token;
    socket.uname = socket.handshake.query.uname; //set property on socket itself, rather than keeping a list
    socket.color = socket.handshake.query.color;
    // let tokenAuth = tokenAuthentication(socket.token);
    if (socket.token != null && socket.uname != null && socket.color != null){
        socket.on("disconnect", (reason) => {
            console.log(chalk.red("closing connection because bad query from " + socket + " reason " + reason));
        });
    } else {
        console.log(chalk.red("socket " + socket.uname + " " + socket.color + "connected"));
    }

    socket.on('join', function(rm) {
        console.log(chalk.yellow(socket.uname + " " + socket.color + " tryna join " + rm));
        socket.join(rm);
        socket.room = room;
        room = rm; //set global room value for this socket, since we can only be in one at a time
        jwt.verify(socket.token, process.env.JWT_SECRET, function (err, payload) {
            console.log(chalk.red("socket payload: " + JSON.stringify(payload)));
            if (payload) {
                if (payload.userId != null){
                    // console.log("gotsa payload.userId : " + payload.userId);
                    if (payload.userId == "0000000000000") { //TODO check for expiration

                       console.log(chalk.red("payload is guest token")); 
                       console.log(chalk.red(socket.id + " named " + socket.uname + " tryna join " + rm ));
                       socket.join(rm);
                       socket.room = room;
                       socket.userID = payload.userId;
                       room = rm; //set global room value for this socket, since we can only be in one at a time
                       io.to(room).emit('user joined', socket.uname, room);
                    } else {    //maybe do lookup on join? 
                        
                        const oo_id = ObjectId.createFromHexString(payload.userId);
                        (async () => {
                          try {
                            const query = {"_id": oo_id};
                            const user = await RunDataQuery("users", "findOne", query);
                            console.log("gotsa user " + user._id + " authLevel " + user.authLevel + " status " + user.status);
                            console.log(socket.id + " named " + socket.uname + " tryna join " + rm );
                            socket.join(rm);
                            console.log(socket.rooms); 
                            socket.room = room;
                            console.log(socket.rooms); 
                            room = rm; //set global room value for this socket, since we can only be in one at a time
                            socket.userID = payload.userId;
                            io.to(room).emit('user joined', socket.uname, room);
                          } catch (e) {
                            console.log("user not found error! " + e);
                            socket.on("disconnect", (reason) => {
                              console.log("closing connection because userlookup failed " + reason);
                            });
                          }
                        })();
                       
                    }
                } else {
                    socket.on("disconnect", (reason) => {
                        console.log("closing connection because no userID in payload " + reason);
                    });
                }
            } else {
                socket.on("disconnect", (reason) => {
                    console.log("closing connection because no payload " + reason);
                });
            }
        });
    });

    socket.on('disconnect', async function(reason) {
        console.log('Got disconnect: ' + socket.handshake.query.room + ' because why ' + reason);
        
        socket.leave(socket.handshake.query.room);
        socket.to(socket.handshake.query.room).emit('user left', socket.id);
        // io.in(room).emit('disconnected', socket.uname);
        const roomUsers = await getSocketsInRoom(socket.handshake.query.room);
        // for (const key of sockets) {
            // console.log(`Socket ID in ${socket.handshake.query.room}: ${socket.id}`);

            var returnObj = {};
            // Object.keys(roomUsers).forEach(function(key) {
            for (const key of roomUsers) {
                if (key.connected) {
                let namePlusColor = key.uname + "~" + key.color;
                returnObj[key.id] = namePlusColor;
                // returnObj[io.sockets.connected[key].uname] = key; //cook up a nice dict for client to use
                }
            }
            
            // Object.keys(roomUsers).forEach(function(key) {
              
            //     io.sockets.connected[key].emit('room users', JSON.stringify(returnObj));
            // });
        // }
        console.log(chalk.red("room sockets after discon " + JSON.stringify(returnObj))); 
        io.to(room).emit('room users', JSON.stringify(returnObj));

        // if (io.sockets.adapter.rooms[room] != undefined) {
        //     var roomUsers = io.sockets.adapter.rooms[room].sockets;
        //     console.log("roomUsers after disconnect " + JSON.stringify(roomUsers));
        //     var returnObj = {};
        //     Object.keys(roomUsers).forEach(function(key) {
               
        //         let namePlusColor = io.sockets.connected[key].uname + "~" + io.sockets.connected[key].color;
        //         returnObj[key] = namePlusColor;
        //         // returnObj[io.sockets.connected[key].uname] = key; //cook up a nice dict for client to use
        //     });
        //     Object.keys(roomUsers).forEach(function(key) {
              
        //         io.sockets.connected[key].emit('room users', JSON.stringify(returnObj));
        //     });
        // }
    });
    socket.on('room users', function (room) {
        io.sockets.adapter.rooms.get(room);
     
        if (io.sockets.adapter.rooms.get(room) != undefined) {
            var roomUsers = io.sockets.adapter.rooms.get(room);
            // console.log("roomUsers " + roomUsers);
            var returnObj = {};
                
            for (const user of roomUsers) {
                console.log(chalk.red("room user : " +user + " name "+ io.sockets.sockets.get(user).uname)); //the new way get the user's socket
                const namePlusColor = io.sockets.sockets.get(user).uname + "~" + io.sockets.sockets.get(user).color;
                returnObj[user] = namePlusColor;
            }
           
            io.in(room).emit('room users', JSON.stringify(returnObj));
        }
    });
    socket.on('pic frame', function(data, sid) { //sid = sender's socket.id
        console.log("tryna send a pic frame : ");
         socket.to(room).emit('getpicframe', data, sid);
     });

    socket.on('user message', function(data) {
        socket.in(room).emit('user messages', socket.uname, data);
    });

    socket.on('admin message', function(data) {
        socket.in(room).emit('admin message', data);
    });

    socket.on('activity message', function(data) {
        console.log("room : " + room + "activity message: " + data)
        socket.to(room).emit('messages', data);
    });

    socket.on('updateplayerposition', function(room, uname, posx, posy, posz, rotx, roty, rotz, sid, source) { //adding rot vals and source
        socket.to(room).emit('playerposition', uname,posx,posy,posz,rotx, roty, rotz, sid, source);
    });

});

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


export function saveTraffic (req, domain, shortID) {
    let timestamp = Date.now();

    timestamp = parseInt(timestamp);
    // console.log("tryna save req" + );
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    var userdata = {
        username: req.session.user ? req.session.user.userName : "",
        _id: req.session.user ? req.session.user._id : "",
        email: req.session.user ? req.session.user.email : "",
        status: req.session.user ? req.session.user.status : "",
        authlevel: req.session.user ? req.session.user.authLevel : ""
    };
    let data = {
            short_id: shortID,
            appdomain: domain,
            timestamp: timestamp,
            baseUrl: req.baseUrl,
            headers: JSON.stringify(req.headers),
            cookie: JSON.stringify(req.session.cookie),
            userdata: userdata,
            fresh: req.fresh,
            hostname: req.hostname,
            ip: req.ip,
            referring_ip: ip,
            method: req.method,
            originalUrl: req.originalUrl,
            params: JSON.stringify(req.params)
           
        }; //don't forget the semicolon => "intermediate type" error
        // console.log("traffic " + JSON.stringify(data));
        (async () => {
          try {
            const saved = await RunDataQuery("traffic", "insertOne", data);
            // console.log("new traffic : "+ saved);
          } catch (e) {
            console.log("error logging traffic " + e);
          }
        })();
    }    

function nameCleaner(name) {

    name = name.replace(/\s+/gi, '-'); // Replace white space with dash
    return name.replace(/[^a-zA-Z0-9\-]/gi, ''); // Strip any special charactere
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

function uscene (req, res, next) { //check user id against acl, for scene writing
    var u_id = req.session.user._id.toString();
    var req_u_id = req.params.user_id;
    var scene_id = req.params.scene_id.toString().replace(":", "");
    console.log("checkin " + u_id + " vs " + req_u_id + " for " + scene_id);
    if (req.session.user.authLevel.includes("admin")) {
        next();
    } else if (u_id == req_u_id.toString().replace(":", "")) { //hrm.... dunno why the : needs trimming...

        (async () => {
            try {
                const query = {$and: [{"acl_rule": "write_scene_" + scene_id }, {"userIDs": {$in: [u_id]}}]};
                const rule = await RunDataQuery("acl", "findOne", query);
                if (rule) {
                    next();
                } else {
                    req.session.error = 'Access denied!';
                    res.send('noauth');
                    console.log("sorry, that's not in the acl");
                }

            } catch (e) {
                res.send("error " + e);
                console.log("error in acl lookup " + e);
            }
        })();

    } else {
        req.session.error = 'Access denied!';
        res.send('noauth');
    }
}

export function getExtension(filename) {
    // console.log("tryna get extension of " + filename);
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

export function convertStringToObjectID (stringID) {
    stringID = stringID.toString();
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
////////////////////////// create API KEYS ... maybe later...


// app.post('/create_apikey/', requiredAuthentication, function(req, res){
    
//     var uid = req.body.userID; 
//     console.log("tryna create API Key for " + JSON.stringify(req.body.userID));
//     if (uid) {
//         var oo_id = ObjectId.createFromHexString(uid);
//         db_old.users.findOne({_id: oo_id}, function (err, user) {  
//             if (err || !user) {
//             req.session.error = 'Create API Key Failed - user not found ' + uid;
//             console.log('Create API Key Failed - user not found ' + uid);
//             res.send('noauth');
//         } else {
//             console.log("gotsa user " + user._id + " authLevel " + user.authLevel + " status " + user.status);
//             if (user.apikey && user.apikey.length > 4) { //hrm 
//                 res.send("cain't have but one apikey, please contact system administrator");
//                 // res.send(newkey);
//             } else {
//                 let timestamp = Date.now();
//                 timestamp = parseInt(timestamp);
//                 let newkey = "smxr_apikey_" + uid + "_" + timestamp;
//                 db_old.users.update( { _id: oo_id }, { $set: { 
//                     apikey: newkey
//                 }});
//                 res.send("apikey created!");
//                 }
//             }
//         });
//     } else {
//         res.send("nope");
//     }
// });


// ///////////////////////// OBJECT STORE (S3, Minio, etc) OPS BELOW - TODO - replace all s3 calls w promised based versions, to suport minio, etc... (!)
// export async function ReturnPresignedUrl(bucket, key, time) {
    
//     if (minioClient) {
//         return minioClient.presignedGetObject(bucket, key, time);
//     } else {
//         // return s3.getSignedUrl('getObject', {Bucket: bucket, Key: key, Expires: time}); //returns a promise if called in async function?
//         const command = new GetObjectCommand({
//             Bucket: bucket,
//             Key: key,
//           });
//         return await getSignedUrl(s3, command, {expiresIn : time});
//         // return url;
//     } 
// }

// export async function ReturnPresignedUrlPut(bucket, key, time) {
    
//     if (minioClient) {
//         return minioClient.presignedPutObject(bucket, key, time);
//     } else {
//         // return s3.getSignedUrl('getObject', {Bucket: bucket, Key: key, Expires: time}); //returns a promise if called in async function?
//         const command = new PutObjectCommand({
//             Bucket: bucket,
//             Key: key,
//           });
//         return await getSignedUrl(s3, command, {expiresIn : time});
//         // return url;
//     } 
// }

// export async function DeleteObjects(bucket, objectKeys) { //s3.headObject == minio.statObject
//     if (minioClient) {
//                 //todo!
//     } else {

//         const command = new DeleteObjectsCommand({
//             Bucket: bucket,
//             Delete: objectKeys,
//         });
        
//         try {
//             const response = await s3.send(command);
//             // await s3.waitUntilObjectNotExists(
//             //     { Bucket: bucket, Key: key },
//             //   );
//             console.log("delete objects resp: " + response );
//             return response;
//             // return true;
//         } catch (error) {
//             if (error.name === 'NotFound') {
//                 console.log("File does not exist: " + key);
//                 return "not found";
//                 // return false;
//             }
//             console.error(`Error checking file existence: ${error}`);
//             return error;
//             // return false;
//         }
//     }
// }

// export async function DeleteObject(bucket, key) { //s3.headObject == minio.statObject
//     if (minioClient) {
//                 //todo!
//     } else {

//         const command = new DeleteObjectCommand({
//             Bucket: bucket,
//             Key: key,
//         });
        
//         try {
//             await s3.send(command);
//             await s3.waitUntilObjectNotExists(
//                 { Bucket: bucket, Key: key },
//               );
//             console.log("File deleted: " + JSON.stringify(data));
//             return "deleted";
//             // return true;
//         } catch (error) {
//             if (error.name === 'NotFound') {
//                 console.log("File does not exist: " + key);
//                 return "not found";
//                 // return false;
//             }
//             console.error(`Error checking file existence: ${error}`);
//             return error;
//             // return false;
//         }
//     }
// }

// export async function ReturnObjectExists(bucket, key) { //s3.headObject == minio.statObject
//     if (minioClient) {
//                 //todo!
//     } else {

//         const command = new HeadObjectCommand({
//             Bucket: bucket,
//             Key: key,
//         });
        
//         try {
//             let data = await s3.send(command);
//             console.log("File exists: " + JSON.stringify(data));
//             return { exists: true, error: null };
//             // return true;
//         } catch (error) {
//             if (error.name === 'NotFound') {
//                 console.log("File does not exist: " + key);
//                 return { exists: false, error: null };
//                 // return false;
//             }
//             console.error(`Error checking file existence: ${error}`);
//             return { exists: false, error };
//             // return false;
//         }
//     }
// }

// export async function ReturnObjectMetadata(bucket, key) { //s3.headObject == minio.statObject
//     if (minioClient) {
//                 //todo!
//     } else {

//         const command = new HeadObjectCommand({
//             Bucket: bucket,
//             Key: key,
//         });
    
//         try {
//             let data = await s3.send(command);
//             console.log("File exists:" + data);
//             // return { exists: true, error: null };
//             return data;
//         } catch (error) {
//             if (error.name === 'NotFound') {
//                 console.log("File does not exist: "  + key);
//                 // return { exists: false, error: null };
//                 return error;
//             }
//             console.error(`Error checking file existence: ${error}`);
//             // return { exists: false, error };
//             return error;
//         }
      
//     }
// }
// export async function ListObjects(bucket, prefix) {
//     try {
    
//       const response = await s3.send(
//         new ListObjectsV2Command({
//             Bucket: bucket,
//             MaxKeys: 1000000,
//             Prefix: prefix
//           }),
//       );
//       return await response;
//     } catch (caught) {
//         if (caught instanceof NoSuchKey) {
//           console.error(
//             `Error from S3 listing objects from "${bucket}". no such bucket exists.`,
//           );
//           return "error";
//         } else if (caught instanceof S3ServiceException) {
//           console.error(
//             `Error from S3 while getting object from ${bucket}.  ${caught.name}: ${caught.message}`,
//           );
//           return "error";
//         } else {
//           throw caught;
//         //   return caught;
//         }
//       }
// }
// export async function GetObject(bucket, key) {

//     try {
//         const response = await s3.send(
//           new GetObjectCommand({
//             Bucket: bucket,
//             Key: key,
//           }),
//         );
//         // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
//         const str = await response.Body.transformToString();
//         // console.log(str);
//         return str;
//       } catch (caught) {
//         if (caught instanceof NoSuchKey) {
//           console.error(
//             `Error from S3 while getting object "${key}" from "${bucket}". No such key exists.`,
//           );
//           return "error";
//         } else if (caught instanceof S3ServiceException) {
//           console.error(
//             `Error from S3 while getting object from ${bucket}.  ${caught.name}: ${caught.message}`,
//           );
//           return "error";
//         } else {
//           throw caught;
//         //   return caught;
//         }
//       }

// }
// export async function PutObject(bucket, key, body) {

//     const command = new PutObjectCommand({
//         Bucket: bucket,
//         Key: key,
//         Body: body,
//       });
    
//       try {
//         const response = await s3.send(command);
//         console.log(response);
//         return response;
//       } catch (caught) {
//         if (
//           caught instanceof S3ServiceException &&
//           caught.name === "EntityTooLarge"
//         ) {
//           console.error(
//             `Error from S3 while uploading object to ${bucketName}. \
//     The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
//     or the multipart upload API (5TB max).`,
//           );
          
//         } else if (caught instanceof S3ServiceException) {
//           console.error(
//             `Error from S3 while uploading object to ${bucketName}.  ${caught.name}: ${caught.message}`,
//           );
//         } else {
//           throw caught;
//         }
//         return caught;
//       }

// }
// export async function CopyObject(targetBucket, copySource, key) {
//     if (minioClient) {

//     } else {
      
//         const command = new CopyObjectCommand({
//             Bucket: targetBucket,
//             CopySource: copySource,
//             Key: key
//         });
//         try {
//             let data = await s3.send(command);

//             return data;
//         } catch (error) {
//             if (error.name === 'NotFound') {
//                 console.log(`File does not exist: ${filePath}`);
//                 // return { exists: false, error: null };
//                 return error;
//             }
//             console.error(`Error copying: ${error}`);
//             // return { exists: false, error };
//             return error;
//         }
//     }
// } 

export async function SendEmail(toAddress, fromAddress, htmlbody, subject) {
    console.log("tryna send email to " + toAddress + " from " + fromAddress);
    const command = new SendEmailCommand({
        Destination: {
          /* required */
          CcAddresses: [
            /* more items */
          ],
        //   ToAddresses: toAddresses, //must be an array
          ToAddresses: [
            toAddress,
            /* more To-email addresses */
          ],
        },
        Message: {
          /* required */
          Body: {
            /* required */
            Html: {
              Charset: "UTF-8",
              Data: htmlbody,
            }
            // Text: {
            //   Charset: "UTF-8",
            //   Data: textbody,
            // },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
        Source: fromAddress,
        ReplyToAddresses: [
           
          /* more items */
        ],
      });
      try {
        return await ses.send(command);
      } catch (caught) {
        console.log("caught email error " + caught);
        if (caught instanceof Error && caught.name === "MessageRejected") {
          /** @type { import('@aws-sdk/client-ses').MessageRejected} */
          const messageRejectedError = caught;
          return messageRejectedError;
        }
        throw caught;
      }
}

//ROUTES BELOW
////////////////////////////////////////////////////////////////
app.get("/", function (req, res) {
    //send "Hello World" to the client as html
    res.send("Hello World!");
    // res.writeHead(301,{Location: 'http://w3docs.com'});
    // res.end();
});


app.get("/privacy.html", function (req,res) {
    res.redirect("/main/privacy.html");
});

app.get( "/crossdomain.xml", onCrossDomainHandler )
function onCrossDomainHandler( req, res ) {
    var xml = '<?xml version="1.0"?>\n<cross-domain-policy>\n';
    xml += '<allow-access-from domain="strr.us" to-ports="*"/>\n';
    xml += '<allow-access-from domain="mvmv.us" to-ports="*"/>\n';
    xml += '<allow-access-from domain="3dcasefiles.com" to-ports="*"/>\n';
    xml += '</cross-domain-policy>\n';

    req.setEncoding('ascii');
    res.writeHead( 200, {'Content-Type': 'text/xml'} );
    res.end( xml );
};

app.get("/amirite/:_id", function (req, res) {
    //console.log("amirite: " + req.session);
    if (req.session.user) {
    //console.log(JSON.stringify(req.session.user._id.toString()) + " " + req.params._id);
        if (req.session.user._id.toString() == req.params._id) {
            console.log("req.session.user.authLevel :" + req.session.user.authLevel);
            if (req.session.user.userName != "guest" && req.session.user.userName != "subscriber" && req.session.user.authLevel != undefined && req.session.user.authLevel != "noauth") {
                res.send(req.session.user.userName + "~" + req.session.user._id.toString() + "~" + req.session.user.authLevel);

            } else {
                res.send("0");
            }

        } else {
            res.send("0");
        }
    } else {
        res.send("0");
    }
});


function AppQuery (app) {
    // console.log(JSON.stringify(app._id));
    let id = app._id;
    // let query = {'acl_rule': 'app_admin_' + id};
    return 'app_admin_' + id;
}
function ReturnID(item) {
    var splitter = item.acl_rule.lastIndexOf('_');
     let id = item.acl_rule.substring(splitter + 1);
    //  console.log("id " + id + " frim rule item " + JSON.stringify(item));
     return id;
}

////////////////////////////////////// CLIENT (i.e. WebXR) AUTH ROUTE - no cookies, just tokens now...
app.get("/ami-rite-token/:token", function (req, res) { //
    jwt.verify(req.params.token, process.env.JWT_SECRET, function (err, payload) {
        console.log(chalk.white("token auth payload: " + JSON.stringify(payload)));
            if (payload) {
                if (Date.now() >= payload.exp * 1000) {
                    console.log ("EXPIRED TOKEN!");
                    res.send("3");   
                } else {
                    console.log(chalk.white("time remaining on token: " + ((payload.exp * 1000) - Date.now())));
                  if (payload.userId != null){
                        if (payload.userId == "0000000000000") {
                            console.log(chalk.white("payload is guest token")); 
                            res.send('0');
                        } else {

                            console.log(chalk.white("gotsa payload.userId : " + payload.userId));

                            (async () => {
                              try {
                                var oo_id = ObjectId.createFromHexString(payload.userId);
                                const query = {"_id": oo_id};
                                const user = await RunDataQuery("users", "findOne", query);
                                if (user) {
                                  if (user.status == "validated") {
                                    // userStatus = "subscriber";
                                    console.log(chalk.white("user validated!"));
                                    let userData = {};
                                    userData._id = user._id;
                                    userData.userName = user.userName;
                                    userData.sceneShortID = payload.shortID;
                                    userData.authLevel = user.authLevel;
                                    
                                    const scenequery = {"short_id": userData.sceneShortID};
                                    const scene = await RunDataQuery("scenes", "findOne", scenequery); //check that user is authed for this scene
                                    if (scene) {
                                      if (scene.user_id == userData._id) { //TO DO check the acl for write_scene etc..
                                          userData.sceneOwner = "indaehoose";
                                          userData.sceneID = scene._id;
                                          res.send(userData);
                                        } else {
                                          res.send(userData);
                                        }
                                    } else {
                                      res.send(userData);
                                    }
                                   
                                    
                                    } else {
                                      req.session.error = 'Access denied!';
                                      console.log(chalk.white("token authentication failed! not a subscriber"));
                                      res.send("2");    
                                    }
                                }
                                
                              } catch (e) {
                                res.send("auth error " + e);
                              }
                              
                            })();
                            
                        }
                      
                    } else {
                        req.session.error = 'Access denied!';
                        console.log(chalk.white("token authentication failed! headers: " + JSON.stringify(req.headers)));
                        res.send('4');
                    }
                }
            } else {
                req.session.error = 'Access denied!';
                console.log(chalk.white("token authentication failed! headers: " + JSON.stringify(req.headers)));
                res.send('5');
            }
    });
});

///////// ADMIN SESSION CHECK
app.get("/ami-rite/:_id", function (req, res) { 
    if (req.session.user) {
        if (req.session.user._id.toString() == req.params._id) {
            var response = {};
            response.auth = req.session.user.authLevel;
            response.userName = req.session.user.userName;
            response.userID = req.params._id;
            response.mapkey = process.env.GOOGLEMAPS_KEY;

            console.log(chalk.yellow("ami-rite authLevel :" + req.session.user.authLevel));
            if (req.session.user.userName != "guest" && req.session.user.userName != "subscriber" && req.session.user.authLevel != undefined && req.session.user.authLevel != "noauth") {
                if (response.auth.includes("admin")) {

                    (async () => {
                        try {
                            const query = {};
                            const apps = await RunDataQuery("apps", "find", query);
                            if (response.auth.includes("domain_admin")) { 
                                response.apps = apps;
                                console.log(chalk.yellow("that there's a domain_admin!"));
                                const domainsquery = {};
                                const domains = await RunDataQuery("domains", "find", domainsquery);
                                response.domains = domains;
                                res.json(response);
                              
                            } else { //just an admin, check acl
                                const aclQueryArray = apps.map(AppQuery); //flatten apps array for query
                                const aclquery = {"acl_rule" : { $in: aclQueryArray }, "userIDs": response.userID};
                                const rules = await RunDataQuery("acl", "find", aclquery);
                                if (rules && rules.length) {
                                    let rulesAppIDs = rules.map(ReturnID).join(); // a string that's only the appIDs
                                    // console.log(rulesAppIDs);
                                    let appResponse = apps.filter(function (item) { //faster than nested for loops?
                                        return rulesAppIDs.includes(item._id);  //filter out those that don't match the approved ones
                                    });
                                    // console.log("apps " + JSON.stringify(appResponse));
                                    response.apps = appResponse;
                                    res.json(response);
                                } else {
                                    console.log(chalk.yellow("caint find no rules!?!"));
                                    res.send("no rules!");
                                }

                            }
                        } catch (e) {
                            console.log(chalk.yellow("error checking admin fu " + e));
                            res.send("error checking appdomain " + e);
                        }
                    })();
                  
                } else {
                    res.json(response);
                }
            } else {
                res.send("0");
            }
        } else {
            res.send("0");
        }
    } else {
        res.send("0");
    }
});


app.get("/connectionCheck", function (req, res) {
    res.send("connected");
});

app.get("/qrcode/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = req.params.domain + "/" + req.params.code + "/webxr.html";
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});

app.get("/qrcode/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = rootHost + "/webxr/" + req.params.code;
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});

app.get("/qrcode_url/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "http://" + encodeURI(req.params.code);
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_tls/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    
    let fullpath = req.url.toString();
     let s = "https://" + fullpath.substring(12);

    // var s = "https://" + encodeURI(req.params.code);
    console.log(fullpath + " qr fr " + s);
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.post("/qrcode_post", function (req, res) {
        var options = {scale: 10, width: 1024}
    console.log("qrcode for " + req.body.url);
        QRCode.toDataURL(req.body.url, options, function (err, url) {
        var imgLink = "<div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_tls_path/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "https://" +req.params.domain + "/" + req.params.code + "/index.html";
        QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<div><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_tls_path_folder/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "https://" +req.params.domain + "/" + req.params.code + "/";
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<div><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_path/:fullpath", function (req, res) {
    console.log("tryna get qrcode for " + req.params.fullpath);
    var options = {scale: 10, width: 1024}
    var s = "https://" +req.params.fullpath;
    let string = s.replace(/~/g, "/");
    console.log("tryan qrcode for" + string);
    QRCode.toDataURL(string, options, function (err, url) {
        var imgLink = "<div><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});

app.get("/qcode/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = req.params.domain + "/" + req.params.code + "/index.html";
    QRCode.toDataURL(s, options, function (err, url) {
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22http://"+s+"\x22>Link : "+s+"</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});


app.post("/logout", requiredAuthentication, function (req, res) {    
    req.session.destroy();
    res.send("logged out");
    
});
 
app.post("/return_traffic", function (req, res) {    //umm, need to limit scope below if no auth?
   
    // console.log("return traffic data " + JSON.stringify(req.body));
    let query = {};
    let startpoint = req.body.startpoint;
    let appdomain = req.body.appdomain != null ? req.body.appdomain.toString() : null;
    if (req.body.startpoint) {

        if (appdomain) {
            query = {$and: [{timestamp: {$gt : startpoint }}, {appdomain : appdomain}, {hostname : {$ne : "localhost"}}]};
        } else {
            if (startpoint != 0) {
                // query = {timestamp: {$gt : startpoint }};
                query = {$and: [{timestamp: {$gt : startpoint }}, {hostname : {$ne : "localhost"}}]};
            }
        }
    
        (async () => {
            try {
                const trafficdata = await RunDataQuery("traffic", "find", query);
                res.send(trafficdata);
            } catch (e) {
                console.log("error getting traffic data " +e);
                res.send("error getting traffic data " +e);
            }
        })();

    } else {
        console.log("no start point!");
        res.send("no startpoint defined!");
    }

});


//////////////////////////////////// AUTHREQ LOGIN ROUTE
app.post("/authreq", function (req, res) {
    console.log('authRequest for: ' + req.body.uname);
    // var currentDate = Math.floor(new Date().getTime()/1000);

    let isSubscriber = false;
    const username = req.body.uname;
    const password = req.body.upass;

    (async () => {
        try {
            // if (username == "subscriber") { //wtf
            //     const query = {receipt : password};
            //     const iap = await RunDataQuery("iap", "findOne", query);
            //     if (iap) {
            //         isSubscriber = true;
            //     }
            //     if (username == "subscriber" && !isSubscriber) { //mmkay
            //         username = "guest";
            //         password = "password";
            //     }
            // }

            var un_query = {userName: username};
            var em_query = {email: username};
            console.log(chalk.white("authreq tryna find " + username));
            const query = {$or: [un_query, em_query]}; //use either un or email
            const authUser = await RunDataQuery("users", "find", query);
            console.log(chalk.white(authUser.length + " users like dat " + username + " authlevel " + authUser[0].authLevel + " and isSubscriber " + isSubscriber ));
            const authUserIndex = 0; //
            // for (var i = 0; i < authUser.length; i++) {
            //     if (authUser[i].userName == req.body.uname) { //only for cases where multiple accounts on one email, match on the name// seems like a bad thing...
            //         authUserIndex = i;
            //     }
            // }
            if (authUser[authUserIndex] != null && authUser[authUserIndex] != undefined && authUser[authUserIndex].status == "validated" ) {

                if (username == "subscriber" && isSubscriber) { //if it's a validated subscriber let 'em through without password hashtest like below//BUT WHY?
                    req.session.user = authUser[authUserIndex];
                        res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                        var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                        // if (isSubscriber && username == "guest") {
                        //     username = "subscriber"; //switch it back for return...
                        // }
                        var authResp = req.session.user._id.toString() + "~" + username + "~" + authString;
                        res.json(authResp);
                        // req.session.auth = authUser[0]._id;
                        appAuth = authUser[authUserIndex]._id;
                        console.log(chalk.white("auth = " + appAut));
                        
                } else {
                    var hash = authUser[authUserIndex].password;
                    bcrypt.compare(password, hash, function (err, match) {  //check password vs hash
                        if (match) {
                            if (requirePayment && authUser[authUserIndex].paymentStatus != "ok") {
                                console.log(chalk.yellow("payment status not OK"));
                                req.session.auth = "noauth";
                                res.send("payment status not ok");
                                // callback();
                            } else {
                                req.session.user = authUser[authUserIndex];
                                var token=jwt.sign({userId:authUser[authUserIndex]._id},process.env.JWT_SECRET, { expiresIn: '1h' });
                                res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                                var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                                var authResp = req.session.user._id.toString() + "~" + username + "~" + authString + "~" + token;
                                res.json(authResp);
                                // req.session.auth = authUser[0]._id;
                                appAuth = authUser[authUserIndex]._id;
                                console.log(chalk.white("auth = " + appAuth));
                            }

                        } else if (password == process.env.TESTPASS) { //WHAT? TODO: IMPERSONATE USER LOGIC? 
                            console.log(chalk.yellow("admin override..?!"));
                            // req.session.auth = "noauth";
                            // res.send("noauth");
                            req.session.user = authUser[authUserIndex];
                            var token=jwt.sign({userId:authUser[authUserIndex]._id},process.env.JWT_SECRET, { expiresIn: '1h' });
                            res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                            var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                            var authResp = req.session.user._id.toString() + "~" + username + "~" + authString + "~" + token;
                            res.json(authResp);
                            // req.session.auth = authUser[0]._id;
                            appAuth = authUser[authUserIndex]._id;
                            console.log("auth = " + appAuth);

                        } else {
                            console.log("hash does not match!");
                            req.session.auth = "noauth";
                            res.send("authentication failed");
                        }
                    });
                }
            } else {
                console.log("user account not validated 1");
                res.send("user account not validated");
                req.session.auth = "noauth";
            }

        } catch (e) {
            console.log("authreq error " + e);
            res.send("authreq error " + e);
        }
    })();
});
   
app.get('/traffic/:domain', requiredAuthentication, admin, function (req, res) {
    console.log("tryna get traffic info for " + req.params.domain);
    (async () => {
        try {
            const query = {"domain": req.params.domain};
            const domain = await RunDataQuery("domain","findOne", query);
            if (domain) {
                const scenequery = {"sceneDomain": sceneResponse.sceneDomain};
                const scenes = await RunDataQuery("scenes", "find", scenequery);
                res.send(scenes);
            } else {
                res.send(req.params.domain + " domain not found!");
            }
           
        } catch (e) {
            res.send("error getting domain traffic " +e);
        }
    })();
});

app.get('/validate/:auth_id', function (req, res) {
    console.log("tryna validate...");
    //var u_id = ObjectId.createFromHexString(req.params.auth_id);
    var timestamp = Math.round(Date.now() / 1000);
    (async () => {
        try {
            const query = {"validationHash" : req.params.auth_id};
            const user = await RunDataQuery("users","findOne", query);
            if (user) {
                const uquery = { _id: user._id };
                const updoc =  { $set: { status: 'validated' }};
                const upuser = await RunDataQuery("users"," updateOne", query, updoc);
                res.send("<h4>Thanks " + user.userName + 
                ", your address has been validated! You may now login using the credentials you supplied.  <br><br>To change your password, <a href=\"" + rootHost + 
                "/resetpw.html\">Click here</a> </h4>");
            } else {
                res.send("validation string not found!");
            }
            res.send();
           
           
        } catch (e) {
            console.log("error validating user " +e);
            res.send("error validating user " +e);
        }
    })();
});


// app.get('/makedomainadmin/:domain/:_id',  checkAppID, requiredAuthentication, admin, function (req, res) { //hrm...
//     console.log(" makedomainadmin req" + req)
//     var u_id = ObjectId.createFromHexString(req.params._id);
//     (async () => {
//         try {
//             const query = { "_id": u_id };
//             const updoc = {$set: { "authLevel" : "domain_admin_" + req.params.domain }};
//             const uupdated = await RunDataQuery("users", "updateOne", query, updoc);
//             const aclquery =  { acl_rule: "domain_admin_" + req.params.domain };
//             const aclupdoc = { $push: { 'userIDs': req.params._id }};
//             const aclupdated = await RunDataQuery("acl", "updateOne", aclquery, aclupdoc);
//             res.send("updated " + uupdated + aclupdated);
//         } catch (e) {
//             console.log("error making domain admin! " + e);
//             res.send("error making domain admin! " + e);
//         }
//     })();
// });

app.post('/updatedomain/', requiredAuthentication, admin, domainadmin, function (req, res) { //um, no// um, fuckit
    console.log("tryna uddate domain! for " + JSON.stringify(req.body));
    var timestamp = Math.round(Date.now() / 1000);
    req.body.lastUpdateTimestamp = timestamp;
    req.body.lastUpdateUserID = req.session.user._id.toString();
    req.body.lastUpdateUserName = req.session.user.userName;
    (async () => {
        try {
            const query = {"_id": ObjectId.createFromHexString(req.body._id)};
            const updoc = {$set: {domain: req.body.domain, domainStatus: req.body.domainStatus.toLowerCase()}};
            const updated = await RunDataQuery("domains", "updateOne", query, updoc);
           
            res.send("updated " + updated);
        } catch (e) {
            console.log("error updating domain " + e);
            res.send("error updating domain " + e);
        }
    })();

});
app.post('/createdomain/', requiredAuthentication, admin, domainadmin, function (req, res) { 

    var timestamp = Math.round(Date.now() / 1000);
    req.body.dateCreated = timestamp;
    req.body.domainStatus = req.body.domainStatus.toLowerCase();
    // req.body.appStatus = "active";
    req.body.createdByUserID = req.session.user._id.toString();
    req.body.createdByUserName = req.session.user.userName;
    (async () => {
        try {
            const saved = await RunDataQuery("domains", "insertOne", req.body);
            res.send("created " + saved);
        } catch (e) {
            console.log("error creatging domain " + e);
            res.send("error creating domain " + e);
        }
    })();
    
});

app.post('/allapps/', requiredAuthentication, admin, function (req, res) {
    (async () => {
        try {
            const query = {}; //find all!
            const apps = await RunDataQuery("apps", "find", query);
            let response = {};
            response.apps = apps;
            res.send(response);
        } catch (e) {
            console.log("error getting apps " + e);
            res.send("error getting apps " + e);
        }
    })();
   
});

app.post('/remove_app_admin/', requiredAuthentication, domainadmin, function (req, res){
    console.log("tryna remove app admin " + JSON.stringify(req.body));
    (async () => {
        try {
            const query = {"acl_rule": "app_admin_" + req.body.app_id};
            const updoc = { $pull: { 'userIDs': req.body.user_id }};
            const updated = await RunDataQuery("acl", "updateOne", query, updoc);
           
            res.send("updated " + updated);
        } catch (e) {
            console.log("error updating domain " + e);
            res.send("error updating domain " + e);
        }
    })();


}); 

app.post('/add_app_admin/', requiredAuthentication, domainadmin, function (req, res){
    console.log("tryna add app admin " + JSON.stringify(req.body));
    (async () => {
        try {
            const query = {"acl_rule": "app_admin_" + req.body.app_id};
            const updoc = { $push: { "userIDs": req.body.user_id }};
            const updated = await RunDataQuery("acl", "updateOne", query, updoc);
           
            res.send("updated " + updated);
        } catch (e) {
            console.log("error updating domain " + e);
            res.send("error updating domain " + e);
        }
    })();

}); 

app.post('/createapp/', requiredAuthentication, admin, domainadmin, function (req, res) {


    (async () => {
        try {
            const query = {$and: [{"appdomain": req.body.appdomain}, {"appname": req.body.appname}]};
            const app = await RunDataQuery("apps", "findOne", query);
            if (app == null) {
                req.body.dateCreated = new Date();
                req.body.createdByUserID = req.session.user._id.toString();
                req.body.createdByUserName = req.session.user.userName;
                const saved = await RunDataQuery("apps", "insertOne", req.body);
                res.send("app created " + saved);
            } else {
                res.send("sorry that app name already exists!");
            }
            res.send("updated " + updated);
        } catch (e) {
            console.log("error creating app " + e);
            res.send("error creating app " + e);
        }
    })();

});

app.post('/updateapp/:appid', requiredAuthentication, admin, function (req, res) {
        console.log("tryna update appid " + req.params.appid + " body: " + JSON.stringify(req.body));

        (async () => {
            try {
                const query = {"_id": ObjectId.createFromHexString(req.body._id)};
                const updoc = {$set: {appname: req.body.appname, appStatus: req.body.appStatus, appdomain: req.body.appdomain, appunitydomain: req.body.appunitydomain}};
                const updated = await RunDataQuery("apps", "updateOne", query, updoc);
               
                res.send("updated " + updated);
            } catch (e) {
                console.log("error updating domain " + e);
                res.send("error updating domain " + e);
            }
        })();

});
app.post('/domain/', requiredAuthentication, domainadmin, function (req, res) {
    console.log("tryna get domain info for " + req.body._id);
    
    (async () => {
        try {
            let oid = ObjectId.createFromHexString(req.body._id);
            const query = {"_id": oid}; 
            const domain = await RunDataQuery("domains", "findOne", query);

            res.send(domain);  //nevermind the pics...
        } catch (e) {
            console.log("error getting domain " + e);
            res.send("error getting domain " + e);
        }
    })();
});



app.get('/domain/:domain', checkAppID, requiredAuthentication, domainadmin, function (req, res) {
    console.log("tryna get domain info for " + req.params.domain);

    (async () => {
        try {
            const query = {"domain": req.params.domain}; 
            const domain = await RunDataQuery("domains", "findOne", query);
            res.json(domain); //nevermind the pics...
        } catch (e) {
            console.log("error getting domain " + e);
            res.send("error getting domain " + e);
        }
    })();

});

app.get('/app/:appID', requiredAuthentication, admin, function (req, res) {
    console.log("tryna get app " + req.params.appID);
    let oid = ObjectId.createFromHexString(req.params.appID);
    
    (async () => {
        try {
            const query = {"_id": oid}; 
            let app = await RunDataQuery("apps", "findOne", query);
            let app_admins = [];
            const aclquery = {acl_rule: "app_admin_" + req.params.appID};
            const acl_rule = await RunDataQuery("acl", "findOne", aclquery);
            const IDs = acl_rule.userIDs;
            for (let i = 0; i < IDs.length; i++) {
                const uid = ObjectId.createFromHexString(IDs[i]);
                const userquery = {"_id": uid};
                const user = await RunDataQuery("users", "findOne", userquery);
                let admin = {};
                admin.userID = user._id;
                admin.userName = user.userName;
                app_admins.push(admin);     
                
                console.log("pushing admin " + JSON.stringify(admin));
            }
            app.appPictures = []; //nm
            app.appAdmins = app_admins;
            res.json(app);
        } catch (e) {
            console.log("error getting domain " + e);
            res.send("error getting domain " + e);
        }
    })();
});

app.get('/domain/:appID', checkAppID, requiredAuthentication, domainadmin, function (req, res) { //redundant? 
    
    (async () => {
        try {
            const query = {"app": req.params.appID};
            const app = await RunDataQuery("apps", "findOne", query);
            res.json(app);
        } catch (e) {
            console.log("error getting app data " + e);
            res.send("error getting app data " + e);
        }
    })();
  
});

app.get('/user_details/:uid', requiredAuthentication, domainadmin, function (req, res) { //todo
    console.log("tryna get user " + req.params.uid);

    if (req.session.user.authLevel.toLowerCase().includes("domain") && req.params.uid != null) {
        let uID = ObjectId.createFromHexString(req.params.uid);
        (async () => {
            try {
                const query = {"_id" : uID};
                const user = await RunDataQuery("users", "findOne", query);
                res.json(user);
            } catch (e) {
                console.log("error getting user data " + e);
                res.send("error getting user data " + e);
            }
        })();
   
    } else {
        res.send('nope');
    }
});

// app.get('/allusers/', checkAppID, requiredAuthentication, admin, function (req, res) { //todo
app.get('/allusers/', requiredAuthentication, admin, function (req, res) { //todo
    console.log("tryna get users");
    
    if (req.session.user.authLevel.toLowerCase().includes("domain")) {
        (async () => {
            try {
                const query = {};
                const users = await RunDataQuery("users", "find", query);
                res.json(users);
            } catch (e) {
                console.log("error getting users " + e);
                res.send("error getting users " + e);
            }
        })();

} else {
    res.send('');
}
});

app.get('/alldomains/', requiredAuthentication, admin, function (req, res) {
    console.log("tryna get domains");
    (async () => {
        try {
            const query = {};
            const domains = await RunDataQuery("domains", "find", query);
            res.json(domains);
        } catch (e) {
            console.log("error getting domains " + e);
            res.send("error getting domains " + e);
        }
    })();
    
});

app.get('/profile/:_id', requiredAuthentication, usercheck, function (req, res) { //rem'd checkAppID, bc profiles can cross app lines

    console.log("tryna profile...");
    var u_id = ObjectId.createFromHexString(req.params._id);
    let profileResponse = {};
    (async () => {
        try {
            const query = {"_id": u_id};
            const user = await RunDataQuery("users", "findOne", query);
            profileResponse = user;
            profileResponse.activity = {};
            profileResponse.scores = {};
            profileResponse.purchases = {};
            profileResponse.assets = {};
            profileResponse.inventory = {};
            const uquery = {"userID": u_id}; //toString?
            const upquery = {"userID": req.params._id};
            const activities = await RunDataQuery("activities", "find", uquery);
            const inventory_items = await RunDataQuery("inventory_items", "find", uquery);
            const scores = await RunDataQuery("scores", "find", upquery);
            const purchases = await RunDataQuery("purchases", "find", upquery);
            profileResponse.activities = activities;
            profileResponse.scores = scores;
            profileResponse.inventory = inventory_items;
            profileResponse.purchases = purchases;

            res.json(profileResponse);
        } catch (e) {
            console.log("error getting profile " + e);
            res.send("error getting profile " + e);
        }
    })();
});

app.get('/user_inventory/:_id', requiredAuthentication, function(req, res){
    if (req.params._id != undefined && req.params._id != null && ObjectId.isValid(req.params._id)) { 
        const u_id = ObjectId.createFromHexString(req.params._id.toString());

        (async () => {
            try {
                let inventoryItems = [];
                const query = {"userID": u_id};
                const inventory_items = await RunDataQuery("inventory_items", "find", query);
                // let addedObjects = [];
                let addedObjects = {};
                for (let i = 0; i < inventory_items.length; i++) { 
                    
                    // const o_id = ObjectId.createFromHexString(inventory_items[i].objectID.toString());
                    const oquery = {"_id" : inventory_items[i].objectID};
 
                    // console.log("addedObjects " + JSON.stringify(addedObjects)); 
                    if (inventory_items[i].objectID in addedObjects) {
                    //    console.log("already stashed objectID " + inventory_items[i].objectID);
                        // addedIt.push(addedObject);
                    } else {
                        console.log("looking up inventory item with objectID " + inventory_items[i].objectID);
                        let object = await RunDataQuery("obj_items", "findOne", oquery); //unnecessary?
                        addedObjects[inventory_items[i].objectID] = object;
                    }
                    
                    let inventory_item = {};
                    inventory_item._id = inventory_items[i]._id;
                    inventory_item.userID = inventory_items[i].userID;
                    inventory_item.objectID = inventory_items[i].objectID;
                    inventory_item.timestamp = inventory_items[i].timestamp; //creation?
                    inventory_item.fromScene = inventory_items[i].fromScene; //short id
                    inventory_item.objectData = addedObjects[inventory_items[i].objectID];
                    inventoryItems.push(inventory_item);

                }
                let profileResponse = {};
                profileResponse.inventoryItems = inventoryItems;
                res.json(profileResponse);;
            } catch (e) {
                console.log("error getting user inventory " + e);
                res.send("error getting user inventory " + e);
            }
        })();
      
    } else {
        res.send('no inventory userid!');
    }
});


app.post('/drop/', requiredAuthentication, function (req, res) { 
    // let timestamp = Math.round(Date.now() / 1000);
    let i_id = ObjectId.createFromHexString(req.body.inventoryObj._id); //id of the inventory_item
    // let sceneInventoryID = null; //scene inventory
    // let sceneInventory = null;
    let maxperscene = 0;

    (async () => {
        try {
            let o_id = ObjectId.createFromHexString(req.body.inventoryObj.objectID);
            const objquery = {"_id": o_id};
            const obj = await RunDataQuery("obj_items", "findOne", objquery);
            if (obj.maxPerScene != undefined && obj.maxPerScene != null) {
                maxperscene = obj.maxPerScene;
            }
            const scenequery = {"short_id": req.body.inScene}; //should save real sceneID, to skip this one
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            const invquery = {$and: [{"sceneID" : scene._id, "objectID": ObjectId.createFromHexString(req.body.inventoryObj.objectID)}]};
            const inv_items = await RunDataQuery("inventory_items", "find", invquery);
            if (inv_items.length > maxperscene) {
                res.send("maxed per scene!");
            } else {
                const upinvquery = {"_id": i_id};
                const updoc = {$unset: {userID: ""}, $set: {"sceneID" : scene._id, "location": req.body.inventoryObj.location}};
                const updated = await RunDataQuery("inventory_items", "updateOne", upinvquery, updoc);
                console.log("drop has dropped");
                res.send("updated " + updated);
                
            }
        } catch (e) {
            console.log("error dropping an inventory item! " + e);
            res.send("error dropping " + e);
        }
    })();
});

app.post('/pickup/', requiredAuthentication, function (req, res) { 
    let timestamp = Math.round(Date.now() / 1000);
    console.log("pickup called userid " + req.session.user._id + " from scene inventory " + req.body.fromSceneInventory);
    let inventoryItem = {};
    let actionItem = {};
    // let sceneInventoryID = null;        
    // var u_id = ObjectId.createFromHexString(req.session.user._id);
    (async () => {
        try {
            // const query = {"_id": u_id};
            // const user = await RunDataQuery("users", "findOne", query);
            if (req.body.action == undefined) { //for "Drop" and "Pickup" object types, action is assumed
                actionItem.actionID = null;
                actionItem.actionType = req.body.object_item.objtype;
                actionItem.actionName = req.body.object_item.objtype;
                actionItem.actionResult = "none";
            } else {
                actionItem.actionID = ObjectId.createFromHexString(req.body.action._id);
                actionItem.actionType = req.body.action.actionType;
                actionItem.actionResult = req.body.action.actionResult;
                actionItem.actionName = req.body.action.actionName;
            }
            actionItem.userID = ObjectId.createFromHexString(req.body.userData._id);
            actionItem.objectID = ObjectId.createFromHexString(req.body.object_item._id); //platform objectID not the same thing as mongo objectID (urg)
            actionItem.objectName = req.body.object_item.name;
            actionItem.timestamp = timestamp * 1000;
            actionItem.fromScene = req.body.fromScene;

            inventoryItem.userID = ObjectId.createFromHexString(req.body.userData._id); //change these to oids later...
            inventoryItem.objectID = ObjectId.createFromHexString(req.body.object_item._id);
            inventoryItem.objectName = req.body.object_item.name;
            inventoryItem.objectType = req.body.object_item.objtype;
            inventoryItem.objectCategory = req.body.object_item.objcat;
            inventoryItem.obectSubCategory = req.body.object_item.objsubcat;
            inventoryItem.obectClass = req.body.object_item.objclass;
            inventoryItem.timestamp = timestamp;
            inventoryItem.fromScene = req.body.fromScene;

            if (req.body.fromSceneInventory) { //if it came from the scene's inventory (e.g. was dropped by another user), 
                                                // rather than as an element of the scene's config, unset from scene and reassign to user instead of creating a new inventory item as below...
                if (req.body.object_item.maxPerUser != undefined && req.body.object_item.maxPerUser != null &&   
                    req.body.object_item.maxPerUser != 0 && req.body.object_item.maxPerUser != "0") { 
                    const query = {$and: [{"userID" : ObjectId.createFromHexString(req.body.userData._id), "objectID": ObjectId.createFromHexString(req.body.object_item._id)}]};
                    const inventory_items = await RunDataQuery("inventory_items", "find", query); //need to count first
                    console.log(req.body.object_item.maxPerUser + " max per userr and they gots " +inventory_items.length);
                    if (inventory_items && inventory_items.length) {
                        if (inventory_items.length >= req.body.object_item.maxPerUser) {
                            console.log("MAXED - userCurrentCount: " + inventory_items.length + " maxPerUser: " + req.body.object_item.maxPerUser);
                            res.send("user is maxed on this item!");
                        } else {
                            console.log("tryna lookup scene inventory " + req.body.fromSceneInventory + " sceneID " + req.body.sceneID + " obhjectID " + req.body.object_item._id); //this is sceneID now
                            const iquery = {$and: [{"sceneID" : ObjectId.createFromHexString(req.body.sceneID), "objectID": ObjectId.createFromHexString(req.body.object_item._id)}]};
                            // const inventory = await RunDataQuery("inventory_items", "findOne", iquery);
                            // sceneInventoryID = inventory._id;
                            const updoc = {$unset: {sceneID: ""}, $set: {"userID" : ObjectId.createFromHexString(req.body.userData._id)}};
                            const updated = await RunDataQuery("inventory_items", "updateOne", iquery, updoc);
                            console.log("updated an inv item ! " + JSON.stringify(updated));
                            const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                            if (actionItem.actionResult.toLowerCase() == "inventory") {
                                console.log("pickup saved");
                                res.send("saved");
                            } else if (actionItem.actionResult.toLowerCase() == "consume") {
                                console.log("pickup consumed");
                                res.send("consume");
                            } 
                        }
                    } else { //they got zero of these, so give it up
                        console.log("tryna lookup scene inventory " + req.body.fromSceneInventory + " sceneID " + req.body.sceneID + " obhjectID " + req.body.object_item._id); //this is sceneID now
                        const iquery = {$and: [{"sceneID" : ObjectId.createFromHexString(req.body.sceneID), "objectID": ObjectId.createFromHexString(req.body.object_item._id)}]};
                        // const inventory = await RunDataQuery("inventory_items", "findOne", iquery);
                        // sceneInventoryID = inventory._id;
                        const updoc = {$unset: {sceneID: ""}, $set: {"userID" : ObjectId.createFromHexString(req.body.userData._id)}};
                        const updated = await RunDataQuery("inventory_items", "updateOne", iquery, updoc);
                        console.log("updated an inv item ! " + JSON.stringify(updated));
                        const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                        if (actionItem.actionResult.toLowerCase() == "inventory") {
                            console.log("pickup saved");
                            res.send("saved");
                        } else if (actionItem.actionResult.toLowerCase() == "consume") {
                            console.log("pickup consumed");
                            res.send("consume");
                        } 
                    }
                } else { //no max per user, go for it...
                    console.log("tryna lookup scene inventory " + req.body.fromSceneInventory + " sceneID " + req.body.sceneID + " obhjectID " + req.body.object_item._id); //this is sceneID now
                    const iquery = {$and: [{"sceneID" : ObjectId.createFromHexString(req.body.sceneID), "objectID": ObjectId.createFromHexString(req.body.object_item._id)}]};
                    // const inventory = await RunDataQuery("inventory_items", "findOne", iquery);
                    // sceneInventoryID = inventory._id;
                    const updoc = {$unset: {sceneID: ""}, $set: {"userID" : ObjectId.createFromHexString(req.body.userData._id)}};
                    const updated = await RunDataQuery("inventory_items", "updateOne", iquery, updoc);
                    console.log("updated an inv item ! " + JSON.stringify(updated));
                    const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                    if (actionItem.actionResult.toLowerCase() == "inventory") {
                        console.log("pickup saved");
                        res.send("saved");
                    } else if (actionItem.actionResult.toLowerCase() == "consume") {
                        console.log("pickup consumed");
                        res.send("consume");
                    } 
                }
                // res.send("updated inventory " + updated)
            } else { //did not come from sceneInventory, but was part of scene config... but NOT REMOVED!?! hrm..
                if (req.body.object_item.maxPerUser != undefined && req.body.object_item.maxPerUser != null &&   
                req.body.object_item.maxPerUser != 0 && req.body.object_item.maxPerUser != "0") { //enforce maxperuser param, 0 = no limit
                    
                const query = {$and: [{"userID" : ObjectId.createFromHexString(req.body.userData._id), "objectID": ObjectId.createFromHexString(req.body.object_item._id)}]};
                const inventory_items = await RunDataQuery("inventory_items", "find", query); //need to count first
                if (inventory_items && inventory_items.length) {
                    if (inventory_items.length >= req.body.object_item.maxPerUser) {
                        console.log("MAXED - userCurrentCount: " + inventory_items.length + " maxPerUser: " + req.body.object_item.maxPerUser);
                        res.send("user is maxed on this item!");
                        
                        } else {
                            const saved = await RunDataQuery("inventory_items", "insertOne", inventoryItem );
                            console.log("saved an inv item ! " + saved);
                            const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                            if (actionItem.actionResult.toLowerCase() == "inventory") {
                                console.log("pickup saved");
                                res.send("saved");
                            } else if (actionItem.actionResult.toLowerCase() == "consume") {
                                console.log("pickup consumed");
                                res.send("consume");
                            } 
                        }
                    } else {
                        const saved = await RunDataQuery("inventory_items", "insertOne", inventoryItem );
                        console.log("saved an inv item ! " + saved);
                        const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                        if (actionItem.actionResult.toLowerCase() == "inventory") {
                            console.log("pickup saved");
                            res.send("saved");
                        } else if (actionItem.actionResult.toLowerCase() == "consume") {
                            console.log("pickup consumed");
                            res.send("consume");
                        } 
                    }
                
                } else {
                    const saved = await RunDataQuery("inventory_items", "insertOne", inventoryItem );
                    console.log("saved an inv item ! " + saved);
                    const asaved = await RunDataQuery("activities", "insertOne", actionItem);
                    if (actionItem.actionResult.toLowerCase() == "inventory") {
                        console.log("pickup saved");
                        res.send("saved");
                    } else if (actionItem.actionResult.toLowerCase() == "consume") {
                        console.log("pickup consumed");
                        res.send("consume");
                    } 
                }
            
            }
            
        } catch (e) {
            console.log("error updating inventory " + e);
            res.send("error with inventory stuff " + e);
        }
    })();
});


app.post('/update_user/', requiredAuthentication, admin, function (req, res) { //for admins to set lower permissions
    // var u_id = ObjectId.createFromHexString(req.params.auth_id);
    (async () => {
        try {    
            const o_id = ObjectId.createFromHexString(req.body._id);
            const query = {"_id": o_id};
            const updoc = { $set: {
                authLevel : req.body.authLevel,
                paymentStatus: req.body.paymentStatus,
                status: req.body.status,
                type: req.body.type
//              profilePic : profilePic
            }};
            const updated = await RunDataQuery("users", "updateOne", query, updoc);
            res.send("updated " + JSON.stringify(updated));
        } catch (e) {
            console.log("error updating user " + e);
            res.send("error updating user " + e);
        }
    })();
});

app.get('/get_models/:_id', requiredAuthentication, function (req, res) {
    console.log("tryna get_models for " + req.params._id );

    (async () => {
      try {
        const query = {"userID": req.params._id};
        const models = await RunDataQuery("models", "find", query);
        res.send(models);
      } catch (e) {
        console.log("error getting modelz " + e);
        res.send("error getting modelz " + e);
      }
    })();

});
app.get('/get_model/:_id', requiredAuthentication, function (req, res) {
    var model_id = ObjectId.createFromHexString(req.params._id);
    console.log("tryna get_model for " + req.params._id );
      
    (async () => {
      try {
        const query = {"_id": model_id};
        const model = await RunDataQuery("models", "findOne", query);
        if (!model) {
          res.send("no model found!!");
        } else {
          try {         
            model.url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
            res.send (model);  
          } catch (e) {
              res.send(e);
          }
        }
      } catch (e) {
        res.send(e);
      }

    })();

});



app.post('/process_video_hls', requiredAuthentication, function (req, res) {
    console.log("userid = " + req.session.user._id);
    var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
    const options = {
        headers: {'X-Access-Token': token}
      };
    let iID = req.body.id;
    //TODO USE LOCAL ROUTES!
    axios.get(process.env.GS_HOST + "/process_video_hls/"+iID, options)
    .then((response) => {
    //   console.log(response.data);
      console.log("grabAndSqueeze response: " + response.status);
      res.send("processing video");

    })
    .catch(function (error) {
        // handle error
        console.log(error);
        res.send("error: " + error);
        // callback(error);
    })

});

app.get('/process_video_hls_local', requiredAuthentication, function (req, res) {
    console.log("userid = " + req.session.user._id);
    var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
    const options = {
        headers: {'X-Access-Token': token}
      };
    
    axios.get(process.env.GS_HOST + "/process_video_hls_local", options)
    .then((response) => {
    //   console.log(response.data);
      console.log("grabAndSqueeze response: " + response.status);
      res.send("processing video");

    })
    .catch(function (error) {
        // handle error
        console.log(error);
        res.send("error: " + error);
        // callback(error);
    })

});


app.post('/ipfs_up', requiredAuthentication, function (req, res) {
    console.log("userid = " + req.session.user._id);
    var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
    const options = {
        headers: {'X-Access-Token': token}
      };
    let iID = req.body.id;
    axios.get(process.env.GS_HOST + "/ipfs_upl/" + req.body.type + "/"+iID, options)
    .then((response) => {
    //   console.log(response.data);
      console.log("grabAndSqueeze ipfs add response: " + JSON.stringify(response.data));
      
      res.send(JSON.stringify(response.data));
    
    })
    .catch(function (error) {
        // handle error
        console.log(error);
        res.send("error: " + error);
        // callback(error);
    });
});

app.post('/process_staging_files', requiredAuthentication, function (req, res) { //uploaded files go into staging folder, this processes them into database, makes groups, sends to file conversion, etc.
    var itemsArray = req.body.processMe.items;
    var createGroup = false;
    var groupType = "";
    // var groupID;
    // var uid;
    // // var isObj
    // // var objName;
    console.log("process_staging_files : " + JSON.stringify(req.body));
    var itemsExtensions = itemsArray.map(item => {
        return getExtension(item.key).toLowerCase();
    });
    const stagingBucket = process.env.STAGING_BUCKET_NAME;
    const targetBucket = process.env.ROOT_BUCKET_NAME;

    var groupitems = [];
    var params = {
        Bucket: process.env.STAGING_BUCKET_NAME,
    };
    params.Delete = {Objects:[]};
    var originalName = function (name) {
        var index = name.indexOf("_");
        return name.substring(index + 1); //strip off prepended timestamp and _ for title and stuff
    }
    
    const allEqual = itemsExtensions => itemsExtensions.every( v => v === itemsExtensions[0] ); //if all extensions the same, then make a group (which is the point)
    console.log("allEqual " + allEqual + " extensions: "+ itemsExtensions[0]);


    if (allEqual(itemsExtensions) && (itemsExtensions[0].toLowerCase() == ".usdz" || itemsExtensions[0].toLowerCase() == ".reality" || 
    itemsExtensions[0].toLowerCase() == ".glb" || itemsExtensions[0].toLowerCase() == ".spz" || itemsExtensions[0].toLowerCase() == ".ply" || itemsExtensions[0].toLowerCase() == ".splat" || itemsExtensions[0].toLowerCase() == ".ksplat" || 
    itemsExtensions[0].toLowerCase() == ".webp" ||  itemsExtensions[0].toLowerCase() == ".jpg" || itemsExtensions[0].toLowerCase() == ".jp2" || itemsExtensions[0].toLowerCase() == ".jpeg" || itemsExtensions[0].toLowerCase() == ".png" ||
     itemsExtensions[0].toLowerCase() == ".aif" || itemsExtensions[0].toLowerCase() == ".aiff" || itemsExtensions[0].toLowerCase() == ".ogg" || itemsExtensions[0].toLowerCase() == ".wav" || itemsExtensions[0].toLowerCase() == ".mp3" || 
     itemsExtensions[0].toLowerCase() == ".mp4" || itemsExtensions[0].toLowerCase() == ".webm" || itemsExtensions[0].toLowerCase() == ".mov" || itemsExtensions[0].toLowerCase() == ".mkv")) { //need to think how to flex, and use contenttype
        
        var ts = Math.round(Date.now() / 1000);
        if (itemsArray.length > 1) {
            createGroup = true;
        }
        
        groupType = itemsExtensions[0];
        let contentType = "";
        if (groupType.toLowerCase()  == ".webp" || groupType.toLowerCase()  == ".jpg" || groupType.toLowerCase()  == ".jp2" || groupType.toLowerCase()  == ".jpeg" || groupType.toLowerCase()  == ".png") {
            contentType = "picture";
        } else if (groupType.toLowerCase()  == ".mp3" || groupType.toLowerCase()  == ".wav" || groupType.toLowerCase()  == ".ogg" || groupType.toLowerCase()  == ".aif" || groupType.toLowerCase()  == ".aiff"  )  {
            contentType = "audio"
        } else if (groupType.toLowerCase() == ".mp4" || groupType.toLowerCase() == ".mkv" || groupType.toLowerCase() == ".mov" || groupType.toLowerCase() == ".webm")  {
            contentType = "video";
        } else if (groupType.toLowerCase()  == ".glb" || groupType.toLowerCase()  == ".usdz") {
            contentType = "model";
        } else if (groupType.toLowerCase()  == ".ply" || groupType.toLowerCase()  == ".spz" || groupType.toLowerCase()  == ".splat" || groupType.toLowerCase()  == ".ksplat") {
            contentType = "splat";
        } else {
            console.log("invalid contentType!");
            // res.end("invalid content type!");
        }
        if (itemsArray[0].uid != req.session.user._id) { //hrm check em all
            res.send("ids do not match! no upload for you");
        } else {

            (async () => { 
                try {
                    for (let i = 0; i < itemsArray.length; i++) {
                        const item = itemsArray[i];
                        let itemKey = itemsArray[i].key.toLowerCase();
                        itemKey = itemKey.replace(/[/\\?%*:|"<>]\s/g, '-');
                        const itemUID = itemsArray[i].uid;
                        let item_id = "";//set below with db object id after db entry is created
                        // let size = 0;
                        const data = await ReturnObjectMetadata(stagingBucket,"staging/" + itemUID + "/" + itemKey); 
                        const size = data.ContentLength;
                        console.log("processing staging file type " + contentType + " id " + itemKey + " sizeOf = " + size);
                        const url = await ReturnPresignedUrl(stagingBucket, "staging/" + itemUID + "/" + itemKey, 6000);
                        if (contentType == "picture") {
                            const updoc = {   
                                "type" : "fromStaging",
                                "userID" : itemUID,
                                "userName" : req.session.user.userName,
                                "title" : originalName(itemKey),
                                "filename" : itemKey,
                                "item_type" : 'picture',
                                "tags": [],
                                "item_status": "private",
                                "otimestamp" : ts,
                                "ofilesize" : size };
                            const saved = await RunDataQuery("image_items", "insertOne", updoc);   
                            console.log(JSON.stringify(saved));
                            item_id = saved.insertedId.toString(); //objectID of new item
                            groupitems.push(item_id);
                            console.log('new picture item id: ' + item_id);
                            // console.log("transcodePictureURL request: " + tUrl);
                            var copySource = process.env.STAGING_BUCKET_NAME + "/staging/" + updoc.userID + "/" + updoc.filename;
                            var ck = "users/" + itemUID + "/pictures/originals/" + item_id + ".original." + updoc.filename; //path change!
                            console.log("tryna copy origiinal to " + ck);
        
                            const status = await CopyObject(targetBucket, copySource, ck);
                            console.log("copied somethings " + JSON.stringify(status) + " to " + ck + " from " + copySource );
                            var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
                            const options = {
                                headers: {'X-Access-Token': token}
                                };
                            axios.get(process.env.GS_HOST + "/resize_uploaded_picture/"+item_id, options)//pictures automatically Grabbed and Squeezed...
                            .then((response) => {
                                console.log("resize_uploaded_picture gs response: " + response.status);
                            })
                            .catch(function (error) {
                                console.log("gs pic error " + error);
                            });
                        } else if (contentType == "audio") {
                            const updoc = {
                                "type" : "stagedUserAudio",
                                "userID" : req.session.user._id.toString(),
                                "username" : req.session.user.userName,
                                "title" : originalName(itemKey),
                                "artist" : "",
                                "album" :  "",
                                "filename" : itemKey,
                                "item_type" : "audio",
                                "tags": [],
                                "item_status": "private",
                                "otimestamp" : ts,
                                "ofilesize" : size};
                            const saved = await RunDataQuery("audio_items", "insertOne", updoc); 
                            item_id = saved.insertedId.toString(); //id (and acknowledgement) is the only thing the insert returns now, so use the updoc values
                            groupitems.push(item_id);
                            console.log('new picture item id: ' + item_id);
                            var copySource = process.env.STAGING_BUCKET_NAME + "/staging/" + updoc.userID + "/" + updoc.filename;
                            var ck = "users/" + updoc.userID + "/audio/originals/" + item_id + ".original." + updoc.filename; //path change!
                            console.log("tryna copy origiinal to " + ck);
                         
                            const status = await CopyObject(targetBucket, copySource, ck);
                            console.log("copied somethings " + status);

                            var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET); 
                            const options = {
                                headers: {'X-Access-Token': token}
                                };
                            axios.get(process.env.GS_HOST + "/process_audio_download/"+item_id, options)// audio automatically Grabbed and Squeezed...
                            .then((response) => {
                                console.log("process audio gs response: " + response.status);
                            })
                            .catch(function (error) {
                                console.log("gs audio error " + error);
                            });      
                        } else if (contentType == "video") {
                            const updoc = {
                                "userID" : req.session.user._id.toString(),
                                "username" : req.session.user.userName,
                                "title" : originalName(item.key),
                                "filename" : itemKey,
                                "item_type" : 'video',
                                "tags": [],
                                "item_status": "private",
                                "otimestamp" : ts,
                                "ofilesize" : size };
                            const saved = await RunDataQuery("video_items", "insertOne", updoc);
                            item_id = saved.insertedId.toString();
                            groupitems.push(item_id);
                            console.log('new item id: ' + item_id);

                            var copySource = process.env.STAGING_BUCKET_NAME + "/staging/" + item.uid + "/" + itemKey;
                            var ck = "users/" + updoc.userID + "/video/" + item_id + "/" + item_id + "." + itemKey; //video folder w/ id bc encoded HLS files go in there, later..
                            const status = await CopyObject(targetBucket, copySource, ck);
                            console.log(status + " copied a video file " + copySource + " to " + targetBucket + ck);
                        } else if (contentType == "model") {
                            let model_type = "glb"; //support usdz models too
                            if (groupType == ".usdz") {
                                model_type == "usdz";
                            }
                            const updoc = {
                                "userID" : req.session.user._id.toString(),
                                "username" : req.session.user.userName,
                                "name" : ts + "_" + originalName(item.key),
                                "filename" : itemKey,
                                "item_type" : model_type,
                                "tags": [],
                                "item_status": "private",
                                "otimestamp" : ts,
                                "ofilesize" : size };
                            const saved = await RunDataQuery("models", "insertOne", updoc);
                            item_id = saved.insertedId.toString();
                            groupitems.push(item_id);

                            const copySource = process.env.STAGING_BUCKET_NAME + "/staging/" + item.uid + "/" + itemKey;
                            let ck = "users/" + item.uid + "/gltf/" + itemKey;
                            if (model_type == "usdz") {
                                ck = "users/" + item.uid + "/usdz/" + itemKey;
                            }
                            const status = await CopyObject(targetBucket, copySource, ck);
                            console.log(status + " copied a model file " + copySource + " to " + targetBucket +"/"+ ck);                          
                        } else if (contentType == "splat") {
                            
                            const updoc = {
                                "userID" : req.session.user._id.toString(),
                                "username" : req.session.user.userName,
                                "name" : ts + "_" + originalName(item.key),
                                "filename" : itemKey,
                                "item_type" : "splat",
                                "tags": [],
                                "item_status": "private",
                                "otimestamp" : ts,
                                "ofilesize" : size };
                            const saved = await RunDataQuery("models", "insertOne", updoc);
                            item_id = saved.insertedId.toString();
                            groupitems.push(item_id);

                            const copySource = process.env.STAGING_BUCKET_NAME + "/staging/" + item.uid + "/" + itemKey;
                            let ck = "users/" + item.uid + "/splat/" + itemKey;
                          
                            const status = await CopyObject(targetBucket, copySource, ck);
                            console.log(status + " copied a model file " + copySource + " to " + targetBucket +"/"+ ck);                          
                        }
                        params.Delete.Objects.push({Key: 'staging/' + item.uid + '/' + item.key}); //clean up
                    } //end loop
                    var group = {};   //create new group w/ upped items             
                    group.userID = req.session.user._id.toString();
                    group.items = groupitems;
                    if (group.items.length > 1) {
                        console.log("tryna make group for " + req.session.user._id.toString() + " length " + group.items.length);
                        if (contentType == "picture") {
                            group.type = "picture";
                            group.name = "pictures " + ts;
                        } else if (contentType == "model") {
                            group.type = "models";
                            group.name = "models " + ts;
                        } else if (contentType == "audio") {
                            group.type = "audio";
                            group.name = "audio " + ts;
                        } else if (contentType == "video") {
                            group.type = "video";
                            group.name = "video " + ts;
                        } 
                        const saved = await RunDataQuery("groups", "insertOne", group);
                        console.log("saved group " + saved.insertedId);
                        res.send("group created " + saved.insertedId);
                    } else {
                        res.send("file processing complete, no group");
                    }

                   const deleted = await DeleteObjects(process.env.STAGING_BUCKET_NAME, params.Delete); //cleanup staging
                   console.log("deleted staginjg files " + JSON.stringify(deleted));
                } catch (e) {
                    console.log("error processing staging files.." +e);
                }
            })();
        }
       
    } else { //if not all the same, check if it's an object file, and upload with siblings (*.mtl and pic file(s)) //haha no
        console.log("all items must be the same media type " + itemsExtensions.length); //TODO handle if they're different
    }
}); //end app.post /process_staging


app.post('/staging_delete', requiredAuthentication, function (req, res) {
    console.log("staging delete: " + JSON.stringify(req.body));
    params = {
            Bucket: process.env.STAGING_BUCKET_NAME,
            // Prefix: 'staging/' + u_id + '/'
        };
    params.Delete = {Objects:[]};
    // req.body.Contents.forEach(function(content) {
    params.Delete.Objects.push({Key: 'staging/' + req.body.uid + '/' + req.body.key});
    // });
    console.log("delete params: " + JSON.stringify(params));

    (async () => {  
        try {
            const status = await DeleteObjects(process.env.STAGING_BUCKET_NAME, params.Delete);
            res.send("files deleted from staging..." + status);
        } catch (e) {
            res.send("error deleting " + e);
        }
    })();
  
});
app.post('/staging_delete_array', requiredAuthentication, function (req, res) {
    console.log("staging delete: " + JSON.stringify(req.body));

    // if (minioClient) {
    //     var keys = []
      
    //     req.body.deleteMe.items.forEach(function(content) {
    //         keys.push('staging/' + content.uid + '/' + content.key);
    //     });    
    //     minioClient.removeObjects(process.env.STAGING_BUCKET_NAME, keys, function(e) {
    //         if (e) {
    //             console.log('Unable to remove Objects ',e);
    //             res.send('Unable to remove Objects ',e);
    //         } else {
    //             console.log('Removed the objects successfully');
    //             res.send("deleted");
    //         }

    //     });
    // } else {
        const params = {
                Bucket: process.env.STAGING_BUCKET_NAME,
                // Prefix: 'staging/' + u_id + '/'
            };

        params.Delete = {Objects:[]};
        req.body.deleteMe.items.forEach(function(content) {
            params.Delete.Objects.push({Key: 'staging/' + content.uid + '/' + content.key});
        });
        console.log("delete params: " + JSON.stringify(params));
        
        (async () => {
            try {
               const status = await DeleteObjects(process.env.STAGING_BUCKET_NAME, params.Delete);

               res.send("files deleted ~" + status);
                // db.image_items.remove( { "_id" : o_id }, 1 );  // TODO what if files are gone but db reference remains? 
            } catch (e) {
               res.send(e);
            }
        })();

        
    // }
});


app.post('/imagetarget_puturl/:_id/:image_id', requiredAuthentication, function (req, res) {
    console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + req.body.contentType);
    // var cType = req.body.contentType;\
    // var u_id = ObjectId.createFromHexString(req.params._id);
    (async () => {
        try {
            const query = {"_id": ObjectId.createFromHexString(req.params.image_id)};
            const picture_item = await RunDataQuery("image_items", "findOne", query);
            const params = {
                Bucket: process.env.ROOT_BUCKET_NAME,
                Body: '',
                ContentType: 'application/octet-stream',
                Key: "users/" + picture_item.userID + "/pictures/targets/" + req.params.image_id + ".mind",
                Expires: 100
                }; 
            const signedUrl = await ReturnPresignedUrlPut(params.Body, params.Key, 6000); 
            response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                    'Content-Type': 'application/octet-stream'
                },
                body: "",
                method: "put",
                url: signedUrl,
                fields: []
                };
            
            console.log("putObject url : " + signedUrl );
            res.json(response);
        } catch (e) {
            console.log("errpr getting puturl for imagetarget " +e)
            res.send("errpr getting puturl for imagetarget " +e);
        }
    })();
});

app.post('/stagingputurl/:_id', requiredAuthentication, function (req, res) {
    
    var cType = req.body.contentType;
    
    console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + cType);
    var u_id = ObjectId.createFromHexString(req.params._id);

    (async () => {
        try {
            //no need to check user(?), authed in middleware...
            const signedUrl = await ReturnPresignedUrlPut(process.env.STAGING_BUCKET_NAME, req.body.filename, 6000);
            const response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                },
                body: "",
                method: "put",
                url: signedUrl,
                fields: []
                };
                console.log("putObject url : " + signedUrl );
            res.json(response);
        } catch (e) {
            console.log("error getting staging put url " + e);
            res.send("error getting staging put url " + e);
        }
    })();
});


app.get('/staging/:_id', requiredAuthentication, function (req, res) {

    const u_id = req.params._id;
    let response = {};
    let rezponze = {};
    let stagedItems = [];

    (async () => {
        try {
            const params = {
                Bucket: process.env.STAGING_BUCKET_NAME,
                Prefix: 'staging/' + u_id + '/'
            };
            const items = await ListObjects(process.env.STAGING_BUCKET_NAME,'staging/' + u_id + '/');
            response = items.Contents;
            for (let i = 0; i < response.length; i++) {
                let name = ""
                if (minioClient) {
                    name = response[i].name; 
                } else {
                    name = response[i].Key; //close but not identical!
                }
                let url = await ReturnPresignedUrl(process.env.STAGING_BUCKET_NAME, name, 6000);
                name = name.replace('staging/' + u_id + '/', "");
                var itme = {}
                itme.name = name;
            
                itme.url = url;

                stagedItems.push(itme);
                // callbackz();
            }
            console.log(stagedItems.length + ' staging files have been fetched');
            stagedItems.reverse();
            rezponze.stagedItems = stagedItems;
            // rezponze.serverFound = true;
            
            // if (process.env.GS_HOST) {
            //     const testUrl = process.env.GS_HOST;
            //     console.log("testUrl " + testUrl);
            //     const testResp = await fetch(testUrl);
            //     console.log("util server response : " + response);
            //     if (!response) {
            //         // throw new Error(`Response status: ${response.status}`);
            //         console.log("no utils server found!");
            //         rezponze.serverFound = false;
            //     }
              
            // }
           
            res.send(rezponze);
        } catch (e) {
            console.log("error getting stainging " + e);
            res.send("error getting stainging " + e);
        }

    })();
});


app.get('/sharedasset/:assetstring', checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get asset " + req.params.assetstring);
    var assetString = req.params.assetstring.replace("/", ".");
    (async () => {
        try {
            var assetURL = await ReturnPresignedUrl('mvmv.us', assetString, 6000);
            res.send(assetURL);
        } catch (e) {
            res.send(e);
        } 
    })();
});

app.post('/resetcheck', function (req, res) {
    console.log("reset check:" + req.body.hzch);
    (async () => {
        try {
           const query = {"resetHash": req.body.hzch};
           const user = await RunDataQuery("users", "findOne", query);
           var timestamp = Math.round(Date.now() / 1000);
           if (timestamp < user.resetTimestamp + 3600) { //expires in 1 hour!
               console.log("current timestamp is less than userreset " + user.resetTimestamp);
               res.send("validlink");
           } else {
               console.log("expired link");
               res.send("invalidlink");
           }
        } catch (e) {
            console.log("error checking pwreset " + e);
            res.send("error checking pwreset " + e);
        } 
    })();

});

app.post('/optout/', function (req, res) {
    console.log("tryna optout " + JSON.stringify(req.body));
    var timestamp = Math.round(Date.now() / 1000);

    (async () => {
        try {
            const query = {"email": req.body.sentToEmail};
            const updoc = {$set: {accountStatus : "Email Verified", contactStatus: "Opt Out Global", lastUpdate: timestamp}};
            const person = await RunDataQuery("people", "updateOne", query, updoc);
            res.send("updated " + person);
        } catch (e) {
            console.log("error opting out " + e);
            res.send("error opting out " + e);
        }
    })();
   
});

app.get('/optout_check/:hzch', function (req, res) { //called from /landing/invite.html
    let hash = req.params.hzch;
    let requestProtocol = 'https';
    if (req.headers.host.includes("localhost")) {
        requestProtocol = 'http';
    }

    (async () => {
        try {
            const query = {"invitationHash": hash};
            const invitation = await RunDataQuery("invitations", "findOne", query);
            var response = {};
            response.short_id = invitation.invitedToSceneShortID;
            response.sentByUserName = invitation.sentByUserName;
            response.sentByUserID = invitation.sentByUserID;
            response.sentToEmail = invitation.sentToEmail;
            res.send(response);
        } catch (e) {
            console.log("error in optout_check " + e);
            res.send("error in optout_check " + e);
        }
    })();
});
   
app.get('/invitation_check/:hzch', function (req, res) { //called from /landing/invite.html
    let hash = req.params.hzch;
    let requestProtocol = 'https';
    if (req.headers.host.includes("localhost")) {
        requestProtocol = 'http';
    }
    (async () => {
        const query = {"invitationHash": hash};
        const invitation = await RunDataQuery("invitations", "findOne", query);
        const timestamp = Math.round(Date.now() / 1000);
        if (timestamp < invitation.invitationTimestamp + 36000) { //expires in 10 hours! //TODO access window start and end timestamps
            console.log("timestamp checks out!" + JSON.stringify(invitation));
            const updoc = { $set: { validated: true, pin : pin, pinTimeout: timestamp + 6400} };
            const upstatus = await RunDataQuery("invitations", "updateOne", query, updoc);
            var response = {};
            response.short_id = invitation.invitedToSceneShortID;
            response.ok = "yep";
            response.pin = pin;
            response.to = invitation.sentToEmail;
            response.timestampStart = invitation.sceneEventStart;
            response.timestampEnd = invitation.sceneEventEnd;
            response.url = requestProtocol + "://" + req.headers.host + "/webxr/" + invitation.invitedToSceneShortID + "?p=" + pin;
            QRCode.toDataURL(response.url, function (err, url) {
            response.qrcode = url;
            res.send(response);
            });
        } else {
            console.log("expired link");
            res.send("expired_"+invitation.invitedToSceneShortID); //send back sceneID, to allow invite request
        }
    })();
});

app.post('/savepw', function (req, res){ //saved changed password after reset link clicked

    var timestamp = Math.round(Date.now() / 1000);
    if (timestamp < user.resetTimestamp + 3600) { //expires in 1 hour!
        // console.log(req.body.password);
        (async () => {
            try {
                const query = {"resetHash": req.body.hzch}; //could do it with just one...
                const user = await RunDataQuery("users", "findOne", query); 
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(req.body.password, salt);
                const uquery = { "_id": user._id }; //already an objectID!
                const updoc = { $set: { resetHash: "", resetTimestamp: timestamp, password: hash}}
                const updated = await RunDataQuery("users", "updateOne", uquery, updoc);
                res.send("updated password " + updated);
            } catch (e) {
                console.log("error saving password!@ " + e);
                res.send("error saving password!@ " + e);
            }
        })();
    } else {
        console.log("expired link");
        res.send("expiredlink");
    }
});

app.post('/resetpw', function (req, res) { //send an email with reset link

    console.log('reset request from: ' + req.body.email);
    var subject = topName + " Password Reset";
   
    var timestamp = Math.round(Date.now() / 1000);

    if (validator.isEmail(req.body.email) == true) {

        (async () => {
            try {
                const query = {"email": req.body.email}; //could do it with just one...
                const user = await RunDataQuery("users", "findOne", query); 
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(timestamp.toString(), salt);
                var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                const uquery = { "_id": user._id }; //already an objectID!
                const updoc = { $set: {"resetHash": cleanhash, "resetTimestamp": timestamp}};
                const updated = await RunDataQuery("users", "updateOne", uquery, updoc);
                const htmlbody = "<h3>" + topName + " Password Reset</h3><hr><br>" +
                "Click here to reset your password (link expires in 1 hour): </br>" +
                rootHost + "/main/resetter.html?hzch=" + cleanhash;
                const status1 = await SendEmail(req.body.email, process.env.ADMIN_EMAIL, htmlbody, subject);
                const status2 = await SendEmail(process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL, htmlbody, subject);
                console.log(updated + "resetpw mails " + status1 + " " + status2);
                res.redirect("/#/");
               
            } catch (e) {
                console.log("error resetting password!@ " + e);
                res.send("error resetting password!@ " + e);
            }
        })();

    } else {
        res.send("invalid email address");
    }
});


app.post('/share_scene/', function (req, res) { //yep! //make it public?

    //temp container for objex with peopleID + email
    console.log("tryna share scnee with prootocl " + req.protocol);
    let requestProtocol = 'https';
    if (req.headers.host.includes("localhost")) {
        requestProtocol = 'http';
    }
    let sceneData = {};
    let ts = Date.now();
    var emailsFinal = [];
    var emailSplit = [];
    var emailsNotSent = [];
    let thePerson = {};
    let emailActionID = "";
    var ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

    (async () => {
        try {
            const mailactionquery = {"actionType": "Send Email"};
            const emailAction = await RunDataQuery("actions", "findOne", mailactionquery);
            let emailActionID = emailAction._id;
            if (!emailActionID) { //create the email action if it doesn't exist.. hrm
                const newactionupdoc = {"actionType": "Send Email", "actionName": "Send Email"};
                const newaction = await RunDataQuery("actions", "insertOne", newactionupdoc);
                emailActionID = newaction.insertedId;
            }
            var emails = req.body.sceneShareWithPeople != undefined ? req.body.sceneShareWithPeople : req.body.email; //the latter if it's from the public invitation form
            console.log("sharing emails : " + emails);
            if (emails.includes(",")) {
                emailSplit = emails.split(",");
            } else {
                emailSplit.push(emails); //if there's only one
            }
            for (var m = 0; m < emailSplit.length; m++) {
                let mMail = emailSplit[m].toString();
                console.log("maybeMail: " + mMail);
                mMail = mMail.trim();
                if (validator.isEmail(mMail) == false){
                    console.log(mMail + " is a bad email!");
                    
                    // res.end("an email address was invalid!");
                    // break;
                    // callback(true); //err = true means bail if any bad emails!
                    // return;
                } else {
                    console.log(mMail + " is a good email!");
                }
            }
            var emailSplit2 = emailSplit.filter(val => {
                return validator.isEmail;
            });
            console.log("emailSplit is " + JSON.stringify(emailSplit2));

            // var uid = ip;
            // if (req.session.user != undefined) {
            const uid = ObjectId.createFromHexString(req.session.user._id.toString());
            // }
            console.log("tryna send invitations for " +uid + " to emails " + emailSplit2);
            for (const email of emailSplit2) {
               const personquery = {"email": email.toString().trim()};
               const person = await RunDataQuery("people", "findOne", personquery);
                if (!person) {
                    let newperson = {};
                    if (req.session.user) {
                        newperson.userID = req.session.user._id.toString();
                    }
                    newperson.dateCreated = ts;
                    newperson.email = email.toString().trim();
                    let action = {};
                    action.wasSentEmail = ts + "_" + uid + "_" + req.body.short_id;
                    
                    newperson.accountStatus = 'Not Verified';
                    newperson.contactStatus = 'Not Indicated';
                    console.log("fixing to save new person " + JSON.stringify(newperson));   
                    const savedPerson = await RunDataQuery("people", "insertOne", newperson);
                    var person_id = savedPerson.insertedId.toString();
                    var pursoner = {};
                    console.log('new person created, id: ' + person_id);
                    pursoner.personID = person_id;
                    pursoner.email = email.toString().trim();
                    emailsFinal.push(pursoner);
                    const uquery = { "_id": uid };
                    const updoc = { $addToSet: {"people" : person_id}};
                    const updated = await RunDataQuery("users", "updateOne", uquery, updoc);
                    console.log("new person created for " + email + " " + updated);
                    // db_old.users.updateOne( { "_id": ObjectId.createFromHexString(uid) }, { $addToSet: {people : person_id}});
                } else {
                    console.log("found a person : "+ person.email);
                    if (person.activities == undefined) {
                        person.activities = [];
                    }
                    let action = {}; //check out the person and save the action, email or no
                    if (person.accountStatus != undefined && (person.accountStatus.toString().toLowerCase().includes("blacklist") || 
                        person.accountStatus.toString().toLowerCase().includes ("banned"))) {
                        console.log("opt out global for " + email);
                        action.actionID = emailActionID;
                        action.actionName = "Not Sent - Blacklist"
                        action.actionType = "Send Email"
                        action.actionResult = "Not Sent - Blacklist";
                        action.timestamp = ts;
                        action.userID = uid
                    
                        action.targetPersonID = person._id;
                        action.emailAddressTo = person.email;
                        action.fromScene = req.body.short_id;
                        action.data = req.body.sceneShareWithMessage;
                        
                        const activity = await RunDataQuery("activities", "insertOne", action);
                        console.log("person on blacklist! " + JSON.stringify(activity));
                        emailsNotSent.push(person.email);
                        
                    } else if (person.accountStatus != undefined && (person.activities != undefined && person.activities.length > 3) && 
                                person.accountStatus.toString().toLowerCase().includes("not verified")) {
                       
                        action.actionID = emailActionID;
                        action.actionName = "Not Sent - Not Verified"
                        action.actionType = "Send Email"
                        action.actionResult = "Not Sent - Not Verified";
                        action.timestamp = ts;
                        action.userID = uid
                    
                        action.targetID = person._id;
                        action.emailAddressTo = person.email;
                        action.fromScene = req.body.short_id;
                        action.data = req.body.sceneShareWithMessage;
                        
                        const activity = await RunDataQuery("activities", "insertOne", action);
                        console.log("person on not valiodated! " + JSON.stringify(activity));
                        emailsNotSent.push(person.email);
                        
                    } else if (person.contactStatus != undefined && 
                                person.contactStatus.toString().toLowerCase().includes("opt out global")) {
                        console.log("opt out global for " + email);
                      
                        action.actionID = emailActionID;
                        action.actionName = "Not Sent - Opt Out"
                        action.actionType = "Send Email"
                        action.actionResult = "Not Sent - Global Opt Out";
                        action.timestamp = ts;
                        action.userID = uid
                    
                        action.targetID = person._id;
                        action.emailAddressTo = person.email;
                        action.fromScene = req.body.short_id;
                        action.data = req.body.sceneShareWithMessage;
                        
                        const activity = await RunDataQuery("activities", "insertOne", action);
                        console.log("person has opted out! " + JSON.stringify(activity));
                        emailsNotSent.push(person.email);
                        // callbackz(); //do not add to emailsFinal!
                    } else {    
                       
                        action.actionID = emailActionID;
                        action.actionName = "Sent Email"
                        action.actionType = "Send Email"
                        action.actionResult = "Sent Email";
                        action.timestamp = ts;
                        action.userID = uid
                    
                        action.targetID = person._id;
                        action.emailAddressTo = person.email;
                        action.fromScene = req.body.short_id;
                        action.data = req.body.sceneShareWithMessage;
                        
                        const activity = await RunDataQuery("activities", "insertOne", action);
                        console.log("ok to send email to " + person.email);

                        var pursoner = {};
                        // console.log('found person id: ' + person._id);
                        pursoner.personID = person._id;
                        pursoner.email = person.email.toString().trim();
                        emailsFinal.push(pursoner);
                        if (req.session.user) {
                            const uquery = { "_id": uid };
                            const updoc = { $addToSet: {"people" : person._id}};
                            const updated = await RunDataQuery("users", "updateOne", uquery, updoc);
                            console.log('added person to users people ' + uid);
                            // db_old.users.updateOne( { "_id": uid }, { $addToSet: {people : person._id}});
                        }
                    }
                } //checked and validated all the emails
            }             
            if (emailsFinal.length) {
                console.log("emailsFinal " + JSON.stringify(emailsFinal));
                const scenequery = {short_id: req.body.short_id};
                const scene = await RunDataQuery("scenes", "findOne", scenequery);
                sceneData = scene;

                let geoLinks = "";
                let eventData = {};
                let urlHalf = "";
                if (scene.sceneShareWithGroups != undefined && scene.sceneShareWithGroups != null) {
                    if (scene.sceneShareWithGroups.toString().toLowerCase().includes("disallow all")) {
                      
                        let action = {};
                        console.log("invitations not allowed for this scene " + req.body.short_id);
                        action.actionID = emailActionID;
                        action.actionName = "Not Sent - Scene Disallowed";
                        action.actionType = "Send Email";
                        action.actionResult = "Not Sent - Scene Disallowed";
                        action.timestamp = ts;
                        if (req.session.user) {
                            action.userID = ObjectId.createFromHexString(req.session.user._id);
                        }
                        action.targetPersonID = thePerson._id;
                        action.emailAddressTo = thePerson.email;
                        action.fromScene = req.body.short_id;
                        const activity = await RunDataQuery("activities", "insertOne", action);
                        console.log("person on not valiodated! " + JSON.stringify(activity));

                    } else if (scene.sceneShareWithGroups.toString().toLowerCase().includes("scene people only")) {
                        console.log(JSON.stringify(emailsFinal) + " vs " + JSON.stringify(scene.sceneShareWithPeople));
                        for (let i = 0 ; i < emailsFinal.length; i++) { //should be async, but this is only gonna catch one...
                            if (scene.sceneShareWithPeople.indexOf(emailsFinal[i].email) == -1) {
                                console.log("removing " + emailsFinal[i].email + " not on the list..");
                                emailsFinal.splice(i);

                            }
                        }
                    } 
                    
                } 
                if (sceneData.scenePostcards != null && sceneData.scenePostcards.length > 0) {
                    var oo_id = ObjectId.createFromHexString(sceneData.scenePostcards[0]); //TODO randomize? or ensure latest?  or use assigned default?
                    const picquery = {"_id": oo_id};
                    const picture_item = await RunDataQuery("image_items", "findOne", picquery);
                    var item_string_filename = JSON.stringify(picture_item.filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                           
                    urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000);
                } else {
                    console.log("scene has no postcard! that's a bad...but whatever...");
                }
                for (let i = 0; i < sceneData.sceneLocations.length; i++) {
                    if (sceneData.sceneLocations[i].type.toLowerCase() == "geographic") { //TODO what if multiple?  this will get last one in array, maybe?
                        geoLinks += "<strong><a href='http://maps.google.com?q=" + sceneData.sceneLocations[i].latitude + "," + sceneData.sceneLocations[i].longitude + "'>Map to location: "+sceneData.sceneLocations[i].name+"</a></strong><br><br>"+
                        "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + sceneData.sceneLocations[i].latitude + "," + sceneData.sceneLocations[i].longitude + "\x22>" +
                            "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + sceneData.sceneLocations[i].latitude +
                            "," + sceneData.sceneLocations[i].longitude + "&zoom=15&size=600x400&maptype=roadmap&key="+process.env.GOOGLEMAPS_KEY+"&markers=color:blue%7Clabel:%7C" + sceneData.sceneLocations[i].latitude + "," + sceneData.sceneLocations[i].longitude + "\x22>" + 
                            "</a>";
                        if (sceneData.sceneLocations[i].eventData != undefined && sceneData.sceneLocations[i].eventData.toLowerCase().includes('restrict')) {
                            eventData.restrictToLocation = true;
                        }
                    }
                }
                if ((sceneData.sceneEventStart != undefined && sceneData.sceneEventStart != null) || (sceneData.sceneEventEnd != undefined && sceneEventEnd != null)) {
                    eventData.eventStart = sceneData.sceneEventStart;
                    eventData.eventEnd = sceneData.sceneEventEnd;
            
                    if (sceneData.sceneTags != undefined && sceneData.sceneTags != null && sceneData.sceneTags.length > 0 && sceneData.sceneTags.toString().toLowerCase().includes("restrict to event")) {
                        eventData.restrictToEvent = true;
                    } else {
                        eventData.restrictToEvent = false;
                    }
                }
                ///OK gots emails, scenedata, auth - ready to send!
                // async.each (eData, function (data, callbackzz) {
                    console.log("email data is " + JSON.stringify(emailsFinal));
                    let lastMails = [];
                for (const data of emailsFinal) {
                    console.log ("data is "+ JSON.stringify(data));
                    lastMails.push(data.email);
                    var subject = "Invitation : " + sceneData.sceneTitle;
                    var from = adminEmail;
                
                    var to = [data.email];
                
                    var bcc = [];
                    
                    var timestamp = Math.round(Date.now() / 1000);
                    var message = "";
                    var restrictToEventMessage = eventData.restrictToEvent ? "<br>Access is restricted to the event time" : "";
                    var restrictToLocationMessage = eventData.restrictToLocation ? "<br>Access is restricted to the event location<br>" : "";
                    var isNotPublicMessage = "";
                    var app_link = "servicemedia://scene?" + req.body.short_id;
                 
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(timestamp.toString(), salt);
                    const cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                    const invitation = {
                            validated: false,
                            // invitedToSceneShareWithPublic:
                            invitedToSceneTitle: sceneData.sceneTitle,
                            invitedToSceneID: sceneData._id,
                            invitedToSceneShortID: sceneData.short_id,
                            accessTimeWindow: timestamp + 86400, //one day //will deprecate...
                            sceneEventStart : sceneData.sceneEventStart,
                            sceneEventEnd: sceneData.sceneEventEnd,
                            sceneAccessLinkExpire: sceneData.sceneAccessLinkExpire,
                            sceneRestrictToEvent: eventData.restrictToEvent,
                            sceneRestrictToLocation: eventData.restrictToLocation,
                            sentByUserName: req.session.user ? req.session.user.userName.toString() : ip,
                            sentByUserID: req.session.user ? req.session.user._id.toString() : "",
                            sentByUserEmail: req.session.user ? req.session.user.email.toString() : adminEmail,
                            sentToEmail: to,
                            targetPersonID: data.personID,
                            invitationHash: cleanhash,
                            invitationTimestamp: timestamp,
                        };
                    const invsaved = await RunDataQuery("invitations", "insertOne", invitation);       
                    console.log("saved invitation " + invsaved.insertedId);                         
                    let landingButtons = "<br><a href='"+ requestProtocol + "://" + req.headers.host + "/landing/invite.html?iv=" + cleanhash + "' target='_blank'>" +
                    "<button style='font-family: Arial, Helvetica, sans-serif;  font-size: 12px; background-color: blue; color: white; border-radius: 8px; margin: 10px; padding: 10px;'>" +
                    "Click here to access this scene!</a></button><br>";

                    if (req.body.publicRequest) {
                            message = "An invitation to this private Immersive Scene was requested for you!";

                    } else {
                            if (sceneData.sceneShareWithMessage === "" || sceneData.sceneShareWithMessage == null || sceneData.sceneShareWithMessage.length < 2) {
                                message = req.session.user.userName + " has shared an Immersive Scene with you!";
                                // "<h3>Scene Invitation from " + from + "</h3><hr><br>"
                            } else {
                                message = req.session.user.userName + " has shared an Immersive Scene with you, and says "+
                                    "<hr><strong>" + req.body.sceneShareWithMessage +  "</strong><br><hr>";
                            }
                            landingButtons = "<br><a href='"+ requestProtocol + "://" + req.headers.host + "/landing/"+sceneData.short_id+"?iv=" + cleanhash + "' target='_blank'>" +
                            "<button style='font-family: Arial, Helvetica, sans-serif;  font-size: 12px; background-color: #1f4566; color: white; border-radius: 8px; margin: 10px; padding: 10px;'>" +
                            "Landing Page</button></a>"+
    
                            "<a a href='"+ requestProtocol + "://" + req.headers.host + "/webxr/"+sceneData.short_id+"?iv=" + cleanhash + "' target='_blank'>"+
                            "<button style='font-family: Arial, Helvetica, sans-serif;  font-size: 12px; background-color: #1f4566; color: white; border-radius: 8px; margin: 10px; padding: 10px;'>" +
                            "WebXR</button></a>"+
                            "<a href=\x22https://www.oculus.com/open_url/?url=https://smxr.net/webxr/" +  sceneData.short_id + "\x22 target=\x22_blank\x22>"+
                            "<button style='font-family: Arial, Helvetica, sans-serif;  font-size: 12px; background-color: #1f4566; color: white; border-radius: 8px; margin: 10px; padding: 10px;'>" +
                            "Send to Quest</button></a>";
                    }
                    message += restrictToEventMessage + restrictToLocationMessage;
                    if (sceneData.sceneEventStart != undefined && sceneData.sceneEventStart != null && sceneData.sceneEventStart != "") {
                        let datetimeString = new Date(sceneData.sceneEventStart);
                        message += "<br><strong>Event start: " + datetimeString.toLocaleString([], { hour12: true}) + "</strong><br>";
                        // message += "<br><strong>Event start: " + datetimeString.toString() + "</strong><br>";
                        console.log(message);
                    }
                    if (sceneData.sceneEventEnd != undefined && sceneData.sceneEventEnd != null && sceneData.sceneEventEnd != "") {
                        let datetimeString = new Date(sceneData.sceneEventEnd);
                        message += "<strong>Event end: " + datetimeString.toLocaleString([], { hour12: true})  + "</strong><br>";
                    }
                    if (!sceneData.sceneShareWithPublic) { 
                        isNotPublicMessage = "<br><strong>This is a private scene, intended only for subscribers or invited guests.</strong><br>";
                    }
                    message += geoLinks;
                    var htmlbody = message +
                        isNotPublicMessage +
                        landingButtons +

                        "<br> Scene Title: " + sceneData.sceneTitle +
                        "<br> Short ID: " + sceneData.short_id +
                        "<br> Keynote: " + sceneData.sceneKeynote +
                        "<br> Description: " + sceneData.sceneDescription +
                        "<br> Owner: " + sceneData.userName +

                        "<br><a href='"+ requestProtocol + "://" + req.headers.host + "/webxr/"+sceneData.short_id+"?iv=" + cleanhash + "' target='_blank'>"+ 
                        "<img style='width: 512; height: 225; object-fit: cover' src=" + urlHalf + "></a> " +

                        "<br> For more info, or to become a subscriber, visit <a href='https://servicemedia.net'>ServiceMedia.net!</a><br><br> "+
                        "<br> To stop messages like this, <a href='"+ requestProtocol + "://" + req.headers.host + "/landing/opt_out.html?iv=" + cleanhash + "' target='_blank'>click here</a><br><br> ";
                        const params = { Source: process.env.ADMIN_EMAIL,
                            Destination: { ToAddresses: to, BccAddresses: bcc},
                            Message: {
                                Subject: {
                                    Data: subject
                                },
                                Body: {
                                    Html: {
                                        Data: htmlbody
                                    }
                                }
                            }
                        };          
                        
                    const status = await SendEmail(params.Destination.ToAddresses, params.Source, htmlbody, subject);
                    console.log("email status "+ JSON.stringify(status));
                }
                console.log("scene sharing complete!");
                res.send("invitation sent to " + lastMails);
            } else {
                console.log("no valid emails!");
                res.send("no valid emails, no sharing for you");
            }

        } catch (e) {
            console.log("error sharing scene " + e);
            res.send('error sharing scene ' + e);
        }

    })();
   
}); //end share_scene


app.post('/newuser', requiredAuthentication, admin, function (req, res) { //only admins can make new users..for now..!   
//        $scope.user.domain = "servicmedia";
//        $scope.user.appid = "55b2ecf840edea7583000001";

    var appid = req.headers.appid;
    var domain = req.body.domain;
    console.log('newUser request from: ' + JSON.stringify(req.body));
    // ws.send("authorized");
    if (req.body.userPass.length < 7) {  //weak..
        console.log("bad password");
        res.send("badpassword");

    } else if (validator.isEmail(req.body.userEmail) == false) {  //check for valid email

        console.log("bad email");
        res.send("bad email");

    } else {

        (async () => {
            try {
                const unquery = {"userName": req.body.userName};
                const emquery = {"email": req.body.userName};
                const username = await RunDataQuery("users", "findOne", unquery);
                const email = await RunDataQuery("users", "findOne", emquery);
                if ((!username && !email) || req.body.userEmail == domainAdminEmail) {//?
                    var timestamp = Math.round(Date.now() / 1000);
                    var ip = req.headers['x-forwarded-for'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress;
                        const salt = await bcrypt.genSalt(10);
                        const hash = await bcrypt.hash(req.body.userPass, salt);
                        const cleanhash = validator.blacklist(hash, ['/','.','$']); 
                        const updoc =  {type : 'baseuser',
                                        status : 'unvalidated', //hrm
                                        authLevel : 'base',
                                        userName : req.body.userName,
                                        email : req.body.userEmail,
                                        createDate : timestamp,
                                        validationHash : cleanhash,
                                        createIP : ip,
                                        paymentStatus: "ok", //hrm...
                                        // odomain : req.body.domain, //original domain
                                        // oappid : req.headers.appid.toString().replace(":", ""), //original app id
                                        password : hash
                                    };
                        const newUser = await RunDataQuery("users", "insertOne", updoc);
                        const user_id = newUser.insertedId.toString(); //objectID of new record
                        console.log("new user saved to db userID: " + user_id);
                        // req.session.auth = user_id;
                        // req.session.user = newUser;
                        // res.cookie('_id', user_id, { maxAge: 90000, httpOnly: false}); //wait till validated!
                       
                        //send validation email
                        let htmlbody = "Welcome, " + req.body.userName + "! <a href=\"" + rootHost + "/validate/" + cleanhash + "\"> Click here to validate your new account</a>"
                        const status1 = await SendEmail(req.body.userEmail, process.env.ADMIN_EMAIL, htmlbody, req.body.userName + ' New User');
                        const status2 = await SendEmail(process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL, htmlbody, req.body.userName + ' New User EVENT');
                        console.log("new user email statuses " + status1 + " " + status2);
                        res.send("validation email sent! check your email");

                } else {
                    if (username) {
                        console.log("username is taken!");
                    }
                    if (email) {
                        console.log("email is taken!");
                    }
                    res.send ("username and/or email was taken!");
                }

            } catch (e) {
                console.log("error creating new user ! " + e);
                res.send("error creating new user ! " + e);

            }
        })();
    }
});




app.get('/userpics/:u_id', requiredAuthentication, function (req, res) {
    console.log('tryna return userpics for: ' + req.params.u_id);
    // const oid = ObjectId.createFromHexString(req.params.u_id);
    const query = {"userID": req.params.u_id}; //stored as string, fsr
    // if (!req.session.user.authLevel.toLowerCase().includes("domain")) {
    //     query = {};
    // }
    (async () => {
       try {
        const picture_items = await RunDataQuery("image_items", "find", query);
        console.log("gotsome userpics " + picture_items.length);
        for (var i = 0; i < picture_items.length; i++) {
            // console.log("pic userID: "+ picture_items[i].userID);
            var item_string_filename = JSON.stringify(picture_items[i].filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 30);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            var thumbName = 'thumb.' + baseName + item_string_filename_ext;
            var urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_items[i].userID + "/pictures/" + picture_items[i]._id + "." + thumbName, 6000); 
            picture_items[i].URLthumb = urlThumb;
            // console.log(picture_items[i].URLthumb);
        }
            res.json(picture_items);
       } catch (e) {
        res.send("error getting userpics "+ e);
       } 
    })();
   
});

app.get('/uservids/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return uservids for: ' + req.params.u_id);

     // }
     const query = {"userID": req.params.u_id};
     (async () => {
        try {
         const video_items = await RunDataQuery("video_items", "find", query);
         console.log("gotsome uservids " + video_items.length);
         for (var i = 0; i < video_items.length; i++) {
            try {
                video_items[i].URLvid = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + video_items[i].userID + "/video/" + video_items[i]._id + "/" + video_items[i]._id + "." + video_items[i].filename, 6000); //just send back thumbnail urls for list
                // video_items[i].URLvid = vidUrl;
            } catch (e) {
                console.log(e);
            }
         }
             res.json(video_items);
        } catch (e) {
         res.send("error getting uservids "+ e);
        } 
     })();
});

app.post('/return_audiogroups/', function(req, res) {
    console.log('tryna return audiogroups: ' + JSON.stringify(req.body));
    let response = req.body;
    (async () => {
        try {
            let groupItems = [];
            let audio_IDs = [];
            let audioItems = [];
            if (req.body.triggerGroups != null && req.body.triggerGroups.length > 0) {
                const group_ids = req.body.triggerGroups.map(item => { return ObjectId.createFromHexString(item); });
                const query = {"_id": {$in: group_ids}};
                const group_items = await RunDataQuery("groups", "find", query);
                for (let g = 0; g < group_items.length; g++) {
                    const groupdata = group_items[g].groupdata;
                    groupItems.push.apply(groupItems, groupdata); //concat arrays
                    
                }
                response.triggerGroupItems = group_items;
            }
            if (req.body.ambientGroups != null && req.body.ambientGroups.length > 0) {
                const group_ids = req.body.ambientGroups.map(item => { return ObjectId.createFromHexString(item); });
                const query = {"_id": {$in: group_ids}};
                const group_items = await RunDataQuery("groups", "find", query);
                let groupdata = group_items[0].groupdata;
                groupItems.push.apply(groupItems, groupdata); //concat arrays
                response.ambientGroupItems = group_items;
            }
            if (req.body.primaryGroups != null && req.body.primaryGroups.length > 0) {
                const group_ids = req.body.primaryGroups.map(item => { return ObjectId.createFromHexString(item); });
                const query = {"_id": {$in: group_ids}};
                const group_items = await RunDataQuery("groups", "find", query);
                let groupdata = group_items[0].groupdata;
                groupItems.push.apply(groupItems, groupdata); //concat arrays
                response.primaryGroupItems = group_items;
            }
            if (req.body.objectGroups != null && req.body.objectGroups.length > 0) { //while we're here, get the object groups too (?)
                const group_ids = req.body.objectGroups.map(item => { return ObjectId.createFromHexString(item); });
                const query = {"_id": {$in: group_ids}};
                const group_items = await RunDataQuery("groups", "find", query);
                let groupdata = group_items[0].groupdata;
                groupItems.push.apply(groupItems, groupdata); //concat arrays
                response.objectGroupItems = group_items;
            }
            for (let i = 0; i < groupItems.length; i++) {
                audio_IDs.push(groupItems[i].itemID);
            }
            audio_IDs = audio_IDs.map(item => { return ObjectId.createFromHexString(item); });
            const audioquery = {"_id": { $in: audio_IDs}};
            const audio_items = await RunDataQuery("audio_items", "find", audioquery);
            console.log("gots a bunch of audio_items " + audio_items.length);
            for (var item of audio_items) { //ahh, async iterable!
                let item_string_filename = JSON.stringify(item.filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                let item_string_filename_ext = getExtension(item_string_filename);
                let expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 30);
                let baseName = path.basename(item_string_filename, (item_string_filename_ext));
                // console.log("tryna jack in " + baseName + " to a group of " + group.type);
                const mp3Name = baseName + '.mp3';
                const oggName = baseName + '.ogg';
                const pngName = baseName + '.png';
                const urlMp3 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + item.userID + "/audio/" + item._id + "." + mp3Name, 10000);
                const urlOgg = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + item.userID + "/audio/" + item._id + "." + oggName, 10000);
                const urlPng = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + item.userID + "/audio/" + item._id + "." + pngName, 10000);
                item.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                item.URLogg = urlOgg;
                item.URLpng = urlPng;
                audioItems.push(item);
            }
            response.audioItems = audioItems;
            res.send(response);
        } catch (e) {
            console.log("error getting audio groups " + e);
            res.send("error getting audio groups " + e);
        }
    })();
});


app.get('/usergroups/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usergroups for: ' + req.params.u_id);
    (async () => {
        try {
            const query = {"userID": req.params.u_id};
            const groups = await RunDataQuery("groups", "find", query);
            res.send(groups);
        } catch (e) {
            console.log('error getting usergroups ' + e);
            res.send('error getting usergroups ' + e);

        }
    })();
});
    // db_old.groups.find({userID: req.params.u_id}).sort({otimestamp: -1}).toArray( function(err, group_items) {
    //     if (err || !group_items) {
    //         console.log("error getting usergroups items: " + err);
    //     } else {
    //         res.json(group_items);
    //         console.log("returning usergroups for " + req.params.u_id);
    //     }
    // });
// });
app.post('/add_group_item/', requiredAuthentication, function (req, res) { //dunno why I rem'd the groupdata update...?
    console.log(JSON.stringify(req.body));
    var o_id = ObjectId.createFromHexString(req.body.group_id);   
    // console.log('groupID requested : ' + req.body.sourceID);
    (async () => {
      try {
        let newGroupData = [];
        let newItems = [];
        const query = { "_id" : o_id};
        const group = await RunDataQuery("groups", "findOne", query);
        console.log("group to add itme " + JSON.stringify(group) );
        if (group.groupdata == undefined || group.groupdata == null) {
            group.groupdata = [];
        }
        if (group.items == undefined || group.items == null) {
            group.items = [];
        }
        newGroupData = group.groupdata;
        newItems = group.items;
        newItems.push(req.body.item_id);
        const timestamp = Math.round(Date.now() / 1000);
        let newGroupItem = {}; 
        newGroupItem.itemID = req.body.item_id; // ""?s
        newGroupItem.itemIndex = newGroupData.length; // ""?
        newGroupData.push(newGroupItem); // ""?
        const updoc ={ $set: {
            groupdata : newGroupData, // ""?
            lastUpdateTimestamp: timestamp,
            items: newItems
        }};
        const updated = await RunDataQuery("groups", "updateOne", query, updoc);
        res.send("updated " + updated);
      } catch (e) {
        console.log("group update failed " + e);
        res.send(e);
      }
    })();

});
app.post('/remove_group_item/', requiredAuthentication, function (req, res) {
    console.log("tryna remove group itme : "+ JSON.stringify(req.body));
    var o_id = ObjectId.createFromHexString(req.body.group_id);   
    // console.log('groupID requested : ' + req.body.sourceID);

    (async () => {
      try {
        var timestamp = Math.round(Date.now() / 1000);
        let newGroupData = [];
        let newItems = [];
        const query = { "_id" : o_id};
        const group = await RunDataQuery("groups", "findOne", query);
        console.log("group to rm itme " + JSON.stringify(group) );
        // if (group && group.groupData) {
          let index = 0;
          for (let i = 0;  i < group.items.length; i++) {          
            if (group.items[i] == req.body.item_id) {
              console.log("remming groupdata for item " + req.body.item_id);
            } else {
              index++;
              let gData = {};
              gData.itemID = group.items[i];
              gData.itemIndex = index;
              newGroupData.push(gData);
              newItems.push(group.items[i]);
            }
            if (i == group.items.length - 1) {
              const updoc = { $set: {
                lastUpdateTimestamp: timestamp,
                groupdata : newGroupData,
                items: newItems
                }};
              const updated = await RunDataQuery("groups", "updateOne", query, updoc);
              res.send("grup updated " + updated); 
            }
          }
      } catch (e) {
        console.log("group update failed " + e);
        res.send(e);
      }
    })();

});
// app.post('/update_group/', requiredAuthentication, function (req, res) {
//     // console.log(req.params._id);
//     var o_id = ObjectId.createFromHexString(req.body._id);   
//     console.log('group requested : ' + req.body._id);
//     (async () => {
//         try {
//             const query = { "_id" : o_id};
//             const updoc =  { $set: {
//                 lastUpdateTimestamp: timestamp,
//                 groupdata : req.body.groupdata,
//                 items: req.body.items,
//                 tags: req.body.tags,
//                 title: req.body.title,
//                 name: req.body.name
//             }};
//             const updated = await RunDataQuery("groups", "updateOne", query, updoc);
//             res.send("updated group " + updated);
//         } catch (e) {
//             console.log('error updating usergroup ' + e);
//             res.send('error updating usergroup ' + e);

//         }
//     })();
// });

app.post('/updategroup/', requiredAuthentication, function (req, res) {
    // console.log(req.body._id);
    var o_id = ObjectId.createFromHexString(req.body._id.toString());   
    console.log('group requested : ' + req.body._id);
    (async () => {
        try {
            const query = { "_id" : o_id};
            const group = await RunDataQuery("groups", "findOne", query);

            if (req.body.tags && req.body.tags.includes("all alpha") && group.type == "picture") {

                    for (const item of group.items) {
                        var i_id = ObjectId.createFromHexString(item.toString());   
                        const query = { "_id" : i_id};
                        const updoc = { $set: {
                            hasAlphaChannel: true
                            }};
                        const updated = await RunDataQuery("image_items", "updateOne", query, updoc);
                        console.log("updated group item " + JSON.stringify(updated));
                        
                    }
                    res.send("updated!");


            } else if (req.body.tags && req.body.tags.includes("all square") && group.type == "picture") {

                for (const item of group.items) {
                    var i_id = ObjectId.createFromHexString(item.toString());   
                    const query = { "_id" : i_id};
                    const updoc = { $set: {
                        orientation: "Square"
                        }};
                    const updated = await RunDataQuery("image_items", "updateOne", query, updoc);
                    console.log("updated group item " + JSON.stringify(updated));
                    
                }
                res.send("updated!");


            } else if (req.body.tags && req.body.tags.includes("all portrait") && group.type == "picture") {

                for (const item of group.items) {
                    var i_id = ObjectId.createFromHexString(item.toString());   
                    const query = { "_id" : i_id};
                    const updoc = { $set: {
                        orientation: "Portrait"
                        }};
                    const updated = await RunDataQuery("image_items", "updateOne", query, updoc);
                    console.log("updated group item " + JSON.stringify(updated));
                    
                }
                res.send("updated!");


            } else {
               

                console.log("tryna update grup " + req.body._id);
                let grupdata = group.groupdata;
                var timestamp = Math.round(Date.now() / 1000);
                if (req.body.groupdata != null && req.body.groupdata != undefined) {
                    grupdata = req.body.groupdata;
                }
                if (grupdata == null) {
                    grupdata = [];
                    for (let i = 0; i < group.items.length; i++) {
                        let gditem = {};
                        gditem.itemID = group.items[i];
                        gditem.itemIndex = i.toString();
                        console.log("tryna fix index " + JSON.stringify(gditem));
                        grupdata.push(gditem);
                    }
                    console.log("tryna fix group with no group data " + JSON.stringify(grupdata));
                }
                // const query = { "_id" : o_id};
                const updoc =  { $set: { //items are added / removed via separate methods, eg add_group_item
                    lastUpdateTimestamp: timestamp,
                    tags: req.body.tags,
                    name: req.body.name,
                    groupdata: grupdata
                }};
                const updated = await RunDataQuery("groups", "updateOne", query, updoc);
                res.send("updated group " + updated);
            }
        } catch (e) {
            console.log('error updating usergroup ' + e);
            res.send('error updating usergroup ' + e);

        }
    })();
});


app.get('/usergroup/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return user group : ' + req.params.p_id);
    // var pID = req.params.p_id;
    const o_id = ObjectId.createFromHexString(req.params.p_id.toString());

    (async () => {
      try {
        const query = {"_id": o_id};

        const group = await RunDataQuery("groups", "findOne", query);
        // console.log("group " + JSON.stringify(group));
        // if (group && group.items) {
        if (!group.items) {
            group.items = [];
        }
          group.items = group.items.map(convertStringToObjectID);
          if (group.lastUpdate != null) { //?
            group.lastUpdateTimestamp = group.lastUpdate;
          }
          console.log("tryna fetch group " + group._id);
          ///////////////////////////// audio group
          const gquery = {"_id": { $in: group.items}};
          if (group.type.toLowerCase() == "audio") {
            
            const audio_items = await RunDataQuery("audio_items", "find", gquery);
            for (var i = 0; i < audio_items.length; i++) {
              if (group.groupdata) {
                var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                        return obj.itemID === audio_items[i]._id.toString();
                    })[0];
                    if (obj != undefined && obj.itemIndex) {
                        audio_items[i].itemIndex = obj.itemIndex;
                    } else {
                        audio_items[i].itemIndex = i;
                    }
              }
              if (audio_items[i].clipDuration = {}) {
                  audio_items[i].clipDuration = "";
              }
              var item_string_filename = JSON.stringify(audio_items[i].filename);
              item_string_filename = item_string_filename.replace(/\"/g, "");
              var item_string_filename_ext = getExtension(item_string_filename);
              var expiration = new Date();
              expiration.setMinutes(expiration.getMinutes() + 30);
              var baseName = path.basename(item_string_filename, (item_string_filename_ext));
              // console.log("tryna jack in audio " + baseName + " to a group of " + group.type);
              var mp3Name = baseName + '.mp3';
              var oggName = baseName + '.ogg';
              var pngName = baseName + '.png';
              
              const urlMp3 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name,6000);
              const urlOgg = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName,6000);
              const urlPng = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName,6000);
              audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
              audio_items[i].URLogg = urlOgg;
              audio_items[i].URLpng = urlPng;
              // currentIndex++;
            }
            audio_items.sort(function(a, b) {
                return a.itemIndex - b.itemIndex;
            });
            group.audio_items = audio_items;
            res.json(group);
          ///////////////////////////// video group
          } else if (group.type.toLowerCase() == "video") {
            const video_items = await RunDataQuery("video_items", "find", gquery);
            for (var i = 0; i < video_items.length; i++) {
              if (group.groupdata) {
                  var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                      return obj.itemID === video_items[i]._id.toString();
                  })[0];
                  if (obj != undefined && obj.itemIndex) {
                      video_items[i].itemIndex = obj.itemIndex;
                    //   console.log(video_items[i].itemIndex + "index for " + video_items[i]._id.toString() );
                  } else {
                      video_items[i].itemIndex = i;
                    //   console.log(video_items[i].itemIndex + "natchrul index for " + video_items[i]._id.toString() );
                  }
              }
              var item_string_filename = JSON.stringify(video_items[i].filename);
              item_string_filename = item_string_filename.replace(/\"/g, "");
              var item_string_filename_ext = getExtension(item_string_filename);
              var expiration = new Date();
              expiration.setMinutes(expiration.getMinutes() + 30);
              var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            //   console.log("tryna jack in video " + baseName + " to a group of " + group.type.toLowerCase());
              var vidName = baseName + '.mp3';

              video_items[i].vUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + video_items[i].userID + "/video/" + video_items[i]._id + "/" + video_items[i]._id + "." + video_items[i].filename, 6000);
            
            }
            video_items.sort(function(a, b) {
                return a.itemIndex - b.itemIndex;
            });
            group.video_items = video_items;
            group.video_items.sort(function(a, b) {
                return a.itemIndex - b.itemIndex;
            });
            res.json(group);
          ///////////////////////////// pic group  
          } else if (group.type.toLowerCase() == "pictures" || group.type.toLowerCase() == "picture") {
            const image_items = await RunDataQuery("image_items", "find", gquery);
            // console.log("group gots image_items " + image_items.length);
            for (var i = 0; i < image_items.length; i++) {
              if (group.groupdata) {
                  var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                      return obj.itemID === image_items[i]._id.toString();
                  })[0];
                  if (obj != undefined && obj.itemIndex) {
                      image_items[i].itemIndex = obj.itemIndex;
                    //   console.log(image_items[i].itemIndex + "index for " + image_items[i]._id.toString() );
                  } else {
                      image_items[i].itemIndex = i;
                    //   console.log(image_items[i].itemIndex + "natchrul index for " + image_items[i]._id.toString() );
                  }
              }
              var item_string_filename = JSON.stringify(image_items[i].filename);
              item_string_filename = item_string_filename.replace(/\"/g, "");
              var item_string_filename_ext = getExtension(item_string_filename);
            
              var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            //   console.log(baseName);
              var thumbName = 'thumb.' + baseName + item_string_filename_ext;
              var halfName = 'half.' + baseName + item_string_filename_ext;
              
              image_items[i].urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + image_items[i].userID + "/pictures/" + image_items[i]._id + "." + thumbName,6000);
              image_items[i].urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + image_items[i].userID + "/pictures/" + image_items[i]._id + "." + halfName,6000);
              }
              image_items.sort(function(a, b) {
                  return a.itemIndex - b.itemIndex;
              });
      
              group.image_items = image_items;
              group.image_items.sort(function(a, b) {
                  return a.itemIndex - b.itemIndex;
              });
              res.json(group);
            ///////////////////////////// location group    
            } else if (group.type.toLowerCase() == "location") {
              const location_items = await RunDataQuery("locations", "find", gquery);
              for (var i = 0; i < location_items.length; i++) {
                if (group.groupdata) {
                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                        return obj.itemID === location_items[i]._id.toString();
                    })[0];
                    if (obj != undefined && obj.itemIndex) {
                        location_items[i].itemIndex = obj.itemIndex;
                        console.log(location_items[i].itemIndex + "index for " + location_items[i]._id.toString());
                    } else {
                        location_items[i].itemIndex = i;
                        console.log(location_items[i].itemIndex + "natchrul index for " + location_items[i]._id.toString());
                    }
                    }
                }
                location_items.sort(function (a, b) {
                  return a.itemIndex - b.itemIndex;
                });
              
                group.locations = location_items;
                group.locations.sort(function (a, b) {
                    return a.itemIndex - b.itemIndex;
                });
              res.json(group);
            
            } else if (group.type.toLowerCase() == "text") {
              const text_items = await RunDataQuery("text_items", "find", gquery);
              
            
                group.text_items = text_items;
                group.text_items.sort(function (a, b) {
                return a.itemIndex - b.itemIndex;
                });
                res.json(group);
                
            } else if (group.type.toLowerCase() == "people") {
              const people = await RunDataQuery("people", "find", gquery);
             
              
              group.people = people;
              group.people.sort(function (a, b) {
                  return a.itemIndex - b.itemIndex;
              });
              res.json(group);
            } else if (group.type.toLowerCase() == "scenes") {
              const scenes = await RunDataQuery("scenes", "find", gquery);

            } else if (group.type.toLowerCase() == "objects") {
              const obj_items = await RunDataQuery("scenes", "find", gquery);
            
              group.obj_items = obj_items;
              group.obj_items.sort(function (a, b) {
                  return a.itemIndex - b.itemIndex;
              });
              res.json(group);

            }
        // }
      } catch (e) {
        console.log("error geting group data " + e);
        res.send("errror geting group data " + e);
      }
    })();

});

app.get('/useraudio/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return useraudio for: ' + req.params.u_id);

        (async () => {
            try {
                const query = {"userID": req.params.u_id};
                let audio_items = await RunDataQuery("audio_items", "find", query);
                for (var i = 0; i < audio_items.length; i++) {
                    var item_string_filename = JSON.stringify(audio_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var mp3Name = baseName + '.mp3';
                    var oggName = baseName + '.ogg';
                    var pngName = baseName + '.png';

                    var urlMp3 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000); 
                    var urlOgg = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000); 
                    var urlPng = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName, 6000); 

            
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                }
                res.json(audio_items);
            } catch (e) {
                console.log("error getting user audio_items " + e);
                res.send("error getting user audio_items " + e);
            }
        })();
    });

app.get('/userobjs/:u_id', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return userobjs for: ' + req.params.u_id);
    (async () => {
        try {
            const query = {"userID": req.params.u_id};
            const obj_items = await RunDataQuery("obj_items", "find", query);
        } catch (e) {
            console.log("error getting obj_items " + e);
            res.send("error getting obj_items " + e);
        }

    })();
});

app.get('/allobjs/:u_id', requiredAuthentication, domainadmin, function(req, res) { //all userobj reqs come here too - everything for everybody?!?...TODO check public status, use userobj route
    console.log('allobjs/ tryna return ALL userobjs');
    // if (domainadmin()) {
    (async () => {
        try {
            const query = {};
            const obj_items = await RunDataQuery("obj_items", "find", query);
            console.log("gots obj_items " + obj_items.length);
            res.json(obj_items);
        } catch (e) {
            console.log("error getting obj items: " + e);
            res.send("error getting obj items: " + e);
        }
    })();
});

app.post('/newperson', checkAppID, requiredAuthentication, function (req, res) {

    var person = req.body;
    person.userID = req.session.user._id.toString();
    person.dateCreated = Date.now();
    person.accountStatus = 'Not Verified';
    person.contactStatus = 'Not Indicated';
    // if (!textitem.desc) {
    //     textitem.desc = textitem.textstring.substr(0,20) + "...";
    // }
    console.log("fixing to save new person " + JSON.stringify(person));
    (async () => {

        try {
            const newperson = await RunDataQuery("people", "insertOne", person);
            res.send("new person with id " + newperson.insertedId);
        } catch (e) {
            console.log("error creating new peerson " + e);
            res.send("error creating new peerson " + e);
        }

    })();

});

app.post('/delete_person/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete person: " + req.params._id);
    var o_id = ObjectId.createFromHexString(req.params._id);
    (async () => {

        try {
            const query = { "_id" : o_id };
            const deleted = await RunDataQuery("people", "deleteOne", query);
            res.send("deleted person! " + deleted);
        } catch (e) {
            console.log("error deleteing peerson " + e);
            res.send("error deleting peerson " + e);
        }
    })();   
});

app.post('/update_person', requiredAuthentication, function (req, res) {
//        var textitem = req.body;
    console.log("tryna update_person " + JSON.stringify(req.body));
    var o_id = ObjectId.createFromHexString(req.body._id);
//        textitem.userID = req.session.user._id.toString();
    (async () => {

        try {
            const query = { "_id" : o_id };
            const updoc = { $set: {
                accountStatus: req.body.accountStatus,
                contactStatus: req.body.contactStatus,
                lastUpdate : Date.now()
            }}
            const updated = await RunDataQuery("people", "updateOne", query, updoc);
            res.send("updated person! " + JSON.stringify(updated));
        } catch (e) {
            console.log("error deleteing peerson " + e);
            res.send("error deleting new peerson " + e);
        }
    })();
});

app.get('/person_details/:p_id', requiredAuthentication, function(req, res) {
    var o_id = ObjectId.createFromHexString(req.params.p_id);
    console.log('tryna a person with id ' + req.params.p_id);
    (async () => {
        try {
            const query = { "_id" : o_id };
            const person = await RunDataQuery("people", "findOne", query);
            res.send(person);
        } catch (e) {
            console.log("error getting person_details " + e);
            res.send("error getting person_details " + e);
        }
    })();

});

app.get('/people/:u_id', requiredAuthentication, function(req, res) { //this is people "created by" user
    console.log('tryna return people for: ' + req.params.u_id);
    (async () => {
        try {
            const query = {"userID": req.params.u_id};
            
            const people = await RunDataQuery("people", "find", query);
            res.send(people);
        } catch (e) {
            console.log("error getting userpeople " + e);
            res.send("error getting userpeople " + e);
        }
    })();
  
});

app.get('/allpeople/', requiredAuthentication, admin, function(req, res) {
    // console.log('tryna return people for: ' + req.params.u_id);
    (async () => {
        try {
            if (req.session.user.authLevel.toLowerCase().includes("domain")) {
                const peoplequery = {};
                const people = await RunDataQuery("people", "find", peoplequery);
                res.send(people);
            } else {
                const uidstring = req.session.user._id.toString();
                const oid = ObjectId.createFromHexString(uidstring);
                const userquery = {"_id": oid};
                const user = await RunDataQuery("users", "findOne", userquery);
                // const query = {"id": req.params.u_id};
                console.log("user " + JSON.stringify(user));
                const peoplequery = {"_id": {$in: user.people }};
                const people = await RunDataQuery("people", "find", peoplequery);
                res.send(people);
            }
        } catch (e) {
            console.log("error getting userpeople " + e);
            res.send("error getting userpeople " + e);
        }
    })();
    
});

app.get('/actions/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return action_items for: ' + req.params.u_id);
   
        (async () => {
          try {
            const query = {};
            const action_item = await RunDataQuery("actions", "find", query);//hrm returning all for now.. 
            res.json(action_item);
          } catch (e) {
            res.send(e);
          }
        })();
    // }
});

app.get('/action/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return action_items for: ' + req.params.p_id);
    (async () => {
      try {
        const o_id = ObjectId.createFromHexString(req.params.p_id);
        const query = {"_id": o_id};
        const action_item = await RunDataQuery("actions", "findOne", query);
        res.json(action_item);
      } catch (e) {
        res.send(e);
      }
    })();

});
app.post('/update_action/', requiredAuthentication, admin, function (req, res) {
      console.log("update action " + JSON.stringify(req.body));
        (async () => {
          try {
            const timestamp = Math.round(Date.now() / 1000);
            const o_id = ObjectId.createFromHexString(req.body._id);
            const query = {"_id": o_id};
            const updoc = { $set: {
              tags: req.body.tags,
              actionName: req.body.actionName,
              actionType: req.body.actionType,
              actionResult: req.body.actionResult,
              resultTarget: req.body.resultTarget,
              sourceObjectMod: req.body.sourceObjectMod,
              actionDesc: req.body.actionDesc,
              property: req.body.property,
              attribute: req.body.attribute,
              operator: req.body.operator,
              affect: req.body.affect,
              // effectiveness: effectiveness,
              xpoints: req.body.xpoints,
              karma: req.body.karma,
              hitpoints: req.body.hitpoints,
              mana: req.body.mana,
              difficulty: req.body.difficulty,
              orderChaos: req.body.orderChaos,
              alignment: req.body.alignment,
              effectiveness: req.body.effectiveness,
              e_i: req.body.e_i,
              j_p: req.body.j_p,
              s_n: req.body.s_n,
              t_f: req.body.t_f,
              integrity: req.body.integrity,
              protectiveness: req.body.protectiveness,
              generosity: req.body.generosity,
              agreeableness: req.body.agreeableness,
              discipline: req.body.discipline,
              openness: req.body.openness,
              confidence: req.body.confidence,
              lastUpdateTimestamp: timestamp,
              lastUpdateUserID: req.session.user._id,
              lastUpdateUserName: req.session.user.userName
            }};
            const saved = await RunDataQuery("actions", "updateOne", query, updoc);
            console.log("updated action " + JSON.stringify(saved));
            res.send("updated");
          } catch (e) {
            console.log("update action error " + e);
            res.send(e);
          }
        })();

    });
    

app.post('/newaction', requiredAuthentication, function (req, res) {

  (async () => {
    try {
      var actionitem = req.body;
      actionitem.userID = req.session.user._id.toString();
      var timestamp = Math.round(Date.now() / 1000);
      actionitem.otimestamp = timestamp;
      actionitem.createdByUserID = req.session.user._id;
      actionitem.createdByUserName =  req.session.user.userName;
      // res.json(action_item);
      const saved = await RunDataQuery("actions", "insertOne", actionitem);
      res.send("created new action " + saved._id);
    } catch (e) {
      console.log("error creating new action" + e);
      res.send(e);
    }
  })();

});

app.post('/newtext', requiredAuthentication, function (req, res) {

    var textitem = req.body;
    textitem.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    textitem.otimestamp = timestamp;
    textitem.createdByUserID = req.session.user._id;
    textitem.createdByUserName =  req.session.user.userName;
    
    (async () => {
      try {
        const saved = await RunDataQuery("text_items","insertOne",textitem);
        res.send("created " + saved._id);
      } catch (e) {
        console.log("error creating text doc " + e);
        res.send("errror crating text " + e);
      }
    })();

});

app.post('/delete_text/:_id', checkAppID, requiredAuthentication, function (req, res) { //unused!?!?
    console.log("tryna delete text itme: " + req.body._id);
    const o_id = ObjectId.createFromHexString(req.body._id);
    const query = { "_id" : o_id };
    (async () => {
      try {
        const removed = await RunDataQuery("text_items","removeOne",query);
        res.send("deleted " + removed);
      } catch (e) {
        console.log("error dleting text doc " + e);
        res.send("errror deleting text " + e);
      }
    })();

});

app.post('/updatetext/:_id', requiredAuthentication, function (req, res) {
//        var textitem = req.body;
    // console.log("req.body update text:" + JSON.stringify(req.body));
    var o_id = ObjectId.createFromHexString(req.body._id);
//        textitem.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    (async () => {
        try {
            const query = { "_id": o_id };
            const updoc = { $set: {
        
                tags: req.body.tags,
                title: req.body.title,
                type: req.body.type,
                desc: req.body.desc,  //  ? req.body.desc : req.body.textstring.substr(0,20) + "...",
                mode: req.body.mode,
                font: req.body.font,
                author: req.body.author,
                source: req.body.source,
                sourceURL: req.body.sourceURL,
                year: req.body.year,
                fontSize: req.body.fontSize,
                alignment: req.body.alignment != null ? req.body.alignment : "left" ,
                textBackground: req.body.textBackground,
                textBackgroundColor: req.body.textBackgroundColor,
                fillColor: req.body.fillColor,
                outlineColor: req.body.outlineColor,
                glowColor: req.body.glowColor,
                textstring: req.body.textstring,
                rotateToPlayer : req.body.rotateToPlayer != null ? req.body.rotateToPlayer : false,
                scaleByDistance : req.body.scaleByDistance != null ? req.body.scaleByDistance : false,
                useThreeDeeText : req.body.useThreeDeeText != null ? req.body.useThreeDeeText : false,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName
            }};
            const updated = await RunDataQuery("text_items", "updateOne", query, updoc);
            res.send("text updated " + updated);
        } catch (e) {
            console.log("error updating textitem " + e);
            res.send("error updating textitem " + e);
        } 
    })();

});

app.get('/svg/:_id', function(req, res) { 
    console.log('tryna return svg for: ' + req.params._id);
    var o_id = ObjectId.createFromHexString(req.params._id);

    (async () => {
        try {
            const query = {"_id": o_id};
            const text_item = await RunDataQuery("text_items", "findOne", query);
            res.send(text_item.text_string);
        } catch (e) {
            console.log('error getting svg ' + e);
            res.send('error getting svg ' + e);
        }
    })();

});
app.get('/font/:_id', function(req, res) {  //hrm, this one and svg above are the same, getting a text_item...
    console.log('tryna return font for: ' + req.params._id);
    var o_id = ObjectId.createFromHexString(req.params._id);
    (async () => {
        try {
            const query = {"_id": o_id};
            const text_item = await RunDataQuery("text_items", "findOne", query);
            res.send(text_item.text_string);
        } catch (e) {
            console.log('error getting font ' + e);
            res.send('error getting font ' + e);
        }
    })();

});

app.get('/usertexts/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usertexts for: ' + req.params.u_id);
    if (!req.session.user.authLevel.includes("domain")) { //if not domain admin
        (async () => {
            try {
                const query = {userID: req.params.u_id};
                const text_items = await RunDataQuery("text_items", "find", query);
                res.json(text_items);
            } catch (e) {
                console.log("error getting usertexts " + e);
                res.send("error getting usertexts " + e);
            }
        })();
      
    } else {
        (async () => {
            try {
                const query = {};
                const text_items = await RunDataQuery("text_items", "find", query);
                res.json(text_items);
            } catch (e) {
                console.log("error getting usertexts " + e);
                res.send("error getting usertexts " + e);
            }
        })();
        
    }
});

app.get('/usertext/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usertexts for: ' + req.params.p_id);
    var o_id = ObjectId.createFromHexString(req.params.p_id);
    (async () => {
        try {
            const query = {"_id": o_id};
            const text_item = await RunDataQuery("text_items", "findOne", query);
            res.json(text_item);
        } catch (e) {
            console.log("error getting usertexty " + e);
            res.send("error getting usertexty " + e);
        }
    })();
    
});

app.get('/userpic/:p_id', requiredAuthentication, function(req, res) {

  console.log('tryna return userpic : ' + req.params.p_id);
    
      (async () => { 
        
        try {
            const o_id = ObjectId.createFromHexString(req.params.p_id.toString());

            const query = {"_id": o_id};
            let picture_item = await RunDataQuery("image_items", "findOne", query);

            let item_string_filename = JSON.stringify(picture_item.filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            const item_string_filename_ext = getExtension(item_string_filename);
            let expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 30);
            let baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log("user pic basename: " + baseName);
            const thumbName = 'thumb.' + baseName + item_string_filename_ext;
            const halfName = 'half.' + baseName + item_string_filename_ext;
            const standardName = 'standard.' + baseName + item_string_filename_ext;
            const originalName = 'original.' + baseName + item_string_filename_ext;

            const urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + thumbName, 6000); 
            const urlStandard = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + standardName, 6000); 
            const urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000); 
            const urlTarget = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/targets/" + picture_item._id + ".mind", 6000); 
            const urlOriginal = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/originals/" + picture_item._id + "." + originalName, 6000); 
            
                    
            picture_item.URLthumb = urlThumb; //jack in teh signed urls into the object array
            picture_item.URLhalf = urlHalf;
            picture_item.URLstandard = urlStandard;
            picture_item.URLoriginal = urlOriginal;
            picture_item.URLtarget = urlTarget;
            // console.log("urlTarget " + urlTarget);
            if (!picture_item.tags) {
                picture_item.tags = [];
            }
            res.json(picture_item);
                    
        } catch (e) {
        console.log("picture get errora " + e);
        }
    
    })();
    
});

app.get('/hls/:_id', function(req, res) {  //main playback route for hls vids //todo auth? send to tracker?
    var pID = req.params._id;
    console.log("hls pid " + req.params._id);
    if (ObjectId.isValid(pID)) {
        var o_id = ObjectId.createFromHexString(pID);
        (async () => {
            try {
                const query = {"_id": o_id};
                const video_item = await RunDataQuery("video_items", "findOne", query);
                let manifest = await GetObject(process.env.ROOT_BUCKET_NAME,'users/' + video_item.userID + '/video/' + video_item._id + '/hls/output.m3u8');
                const files = await ListObjects(process.env.ROOT_BUCKET_NAME,'users/' + video_item.userID + '/video/' + video_item._id + '/hls/');
                console.log("hls files # "+ files.Contents.length);
                for (const s3Object of files.Contents) { //hrm, maybe not for minio...
                    if (getExtension(s3Object.Key) == ".ts") { //swap out .ts files (e.g 001.ts) for signed urls
                        let url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, s3Object.Key);
                        // console.log("url " + url);
                        manifest = manifest.replace(path.basename(s3Object.Key), url); //rebuild the manifest with signed urls - ha!
                    }
                }
                res.setHeader('content-type', 'application/x-mpegURL');
                res.send(manifest);
            } catch (e) {

            }
        })();
        
    } else {
        console.log("error " + pID);
        res.send("error in id " + pID);
    }
});

app.get('/uservid/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return uservid : ' + req.params.p_id);
    var pID = req.params.p_id;
    var o_id = ObjectId.createFromHexString(pID);
    (async () => {
        try {
            const query = {"_id": o_id};
            const video_item = await RunDataQuery("video_items", "findOne", query);
            let item_string_filename = JSON.stringify(video_item.filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var vidUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + video_item.userID + "/video/" + video_item._id + "/" + video_item._id + "." + video_item.filename, 6000);

            video_item.URLvid = vidUrl; //jack in teh signed urls into the object array
                        // console.log("returning video_item : " + video_item.URLvid);
            res.json(video_item);
        } catch (e) {
            console.log("error getting uservide " + e);
            res.send("error getting uservid " + e);
        }
    })();

});

app.post('/scene_inventory_objex/', function(req, res) {
    console.log('tryna return scene_inventory_objex : ' + req.body.oIDs);
    const iids = req.body.oIDs.map(item => {
        return ObjectId.createFromHexString(item.toString());
    });

    (async () => {
        try {
            const query = {"_id": {$in: iids}};
            const obj_items = await RunDataQuery("obj_items", "find", query);
            let response = {};
            let objex = [];
            response.objex = objex;
            console.log("gots scene inventory items length " + obj_items.length);
            for (let obj_item of obj_items) {

                if (obj_item.objectPictureIDs != null && obj_item.objectPictureIDs != undefined && obj_item.objectPictureIDs.length > 0) { //unused?
                    const query = {_id: {$in: oids }};
                    const pic_items = await RunDataQuery("image_items", "find", query);
                    objectPictures = [];
                // pic_items.forEach(function(picture_item) {               
                    for (let i = 0; i < pic_items.length; i++) { 
                        var imageItem = {};
                        var urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + pic_items[i].userID + "/pictures/" + pic_items[i]._id + ".thumb." + pic_items[i].filename, 6000);
                        var urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + pic_items[i].userID + "/pictures/" + pic_items[i]._id + ".half." + pic_items[i].filename, 6000);
                        // var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                        imageItem.urlThumb = urlThumb;
                        imageItem.urlHalf = urlHalf;
                        // imageItem.urlStandard = urlStandard;
                        imageItem._id = pic_items[i]._id;
                        imageItem.filename = pic_items[i].filename;
                        objectPictures.push(imageItem);
                        obj_item.objectPictures = objectPictures;
                    }
                }
                if (obj_item.actionIDs != undefined && obj_item.actionIDs.length > 0) { //the good stuff!
                    const aids = obj_item.actionIDs.map(item => {
                        return ObjectId.createFromHexString(item.toString());
                    });
                    const query = {"_id": {$in: aids}};
                    const actions = await RunDataQuery("actions", "find", query);
                    if (actions && actions.length) {
                        obj_item.actions = actions;
                    } 
                } 
                if (obj_item.modelID) {
                    const oo_id = ObjectId.createFromHexString(obj_item.modelID.toString());
                    const query = {"_id": oo_id};
                    const model = await RunDataQuery("models", "findOne", query);
                    if (model) {
                        let url = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, 'users/' + model.userID + "/gltf/" + model.filename, 6000);
                        obj_item.modelURL = url;
                    } 
                }
                response.objex.push(obj_item);
            }
            res.send(response);
        } catch (e) {
            console.log("scene_objex_inventory error " +e);
            res.send("scene_objex_inventory error " +e);
        }
    })();
});

app.get('/userobj/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return userobj : ' + req.params.p_id);
    var pID = req.params.p_id.toString();
    var o_id = ObjectId.createFromHexString(pID);
    var childObjects = {};

    (async () => {
      try {
        const query = {"_id": o_id};
        const obj_item = await RunDataQuery("obj_items", "findOne", query);
        if (obj_item) {
          if (obj_item.actionIDs != undefined && obj_item.actionIDs.length > 0) {
            const aids = obj_item.actionIDs.map(item => {
                return ObjectId.createFromHexString(item.toString());
            });
            const actionsquery = {"_id": {$in: aids}};
            const actions = await RunDataQuery("actions", "find", actionsquery);
            if (actions && actions.length) {
              obj_item.actions = actions;
            }
          }
          //no need for object pics, I guess...
          if (obj_item.modelID) {
            let oo_id = ObjectId.createFromHexString(obj_item.modelID.toString());
            const modelquery = {"_id": oo_id};
            const model = await RunDataQuery("models", "findOne", modelquery);
            if (model) {
              obj_item.modelURL = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + model.userID + "/gltf/" + model.filename,6000);
            }

          }
        }
        res.json(obj_item);
      } catch (e) {
        console.log("error getting object " + e);
        res.send("error getting object " + e);
      }

    })();
  });


app.get('/audio/:id', requiredAuthentication, function (req, res){ //TODO Authenticate below if Public/Private bool for this media item

    var audioID = req.params.id;
    var o_id = ObjectId.createFromHexString(audioID.toString());   
    console.log('audioID requested : ' + audioID);

    (async () => {
        try {
            const query = { "_id" : o_id};
            const audio_item = await RunDataQuery("audio_items", "findOne", query);
            if (audio_item.textitemID && audio_item.textitemID != "") {
                const t_id = ObjectId.createFromHexString(audio_item.textitemID.toString());
                const textquery = {"_id" : t_id};
                const text_item = await RunDataQuery("text_items", "findOne", textquery);
                if (text_item) {
                    audio_item.textString = text_item.textstring;
                }
            }
            let item_string_filename = JSON.stringify(audio_item.filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            let item_string_filename_ext = getExtension(item_string_filename);
            let expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 3);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            // console.log(baseName);
            const mp3Name = baseName + '.mp3';
            const oggName = baseName + '.ogg';
            const pngName = baseName + '.png';

            var urlMp3 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_item.userID + "/audio/" + audio_item._id + "." + mp3Name, 6000); 
            var urlOgg = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_item.userID + "/audio/" + audio_item._id + "." + oggName, 6000); 
            var urlPng = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_item.userID + "/audio/" + audio_item._id + "." + pngName, 6000); 
            audio_item.URLmp3 = urlMp3; //jack in teh signed urls into the object array
            audio_item.URLogg = urlOgg;
            audio_item.URLpng = urlPng;
            res.json(audio_item);
        } catch (e) {
            console.log("error getting audio " + e);
            res.send("error getting audio  " + e);
        }
    })();
});
  

// !!!DANGER!!!
// app.get('/scoresremove/:appid',  function (req, res) { //get default path info
//    console.log("nuke all score data for this application!: ", req.params.appid);
// //    var _id = ObjectId.createFromHexString(req.params.p_id);
//    db.scores.remove({appID : req.params.appid}, function (err, saved) {
//        if (err || !saved) {
//            console.log('nuke fail');
//            res.send("nuke fail");
//        } else {
//            console.log('nuked');
//            res.send("nuked");
//        }
//    });
// });

app.post('/score', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post scores");

    scorePost = req.body;
    scorePost.scoreInt = parseInt(req.body.scoreInt);
    // scorePost.scoreMode = parseInt(req.body.scoreMode);
    scorePost.requesterHost = req.headers.host;
    scorePost.remoteAddress = req.connection.remoteAddress;
    scorePost.scoreTimestamp = parseInt(req.body.scoreTimestamp);
    console.log("tryna post score: " + JSON.stringify(scorePost));

    (async () => {
        try {
            const saved = await RunDataQuery("scores", "insertOne", scorePost);
            res.send("new score saved " + saved.insertedId);
        } catch (e) {
            console.log("error saving score " + e);
            res.send("error saving score " + e);
        }
    })();
});

app.get('/scores/:appid/:sceneID/:scoreMode', function (req, res) { //top scores for Unity?

    let appid = req.params.appid.toString().replace(":", "");
    let sceneID = req.params.sceneID;
    let scoreMode = req.params.scoreMode;
    let html = "\n";
    let scores = {};
    let scoresResponse = {};

    (async () => {
        try {
            const query = { "appID" : appid, "sceneID" : sceneID, "scoreMode": scoreMode };
            const scores = await RunDataQuery("scores", "find", query);
            let culledScores = [];
            scores.forEach(function(score){ //cull all but highest score for each user
                if (culledScores.length > 0) {
                    const index = culledScores.map(e => e.platformUserID).indexOf(score.platformUserID);
                    if (index == -1){
                        culledScores.push(score);
                    } else {
                        if (culledScores[index].scoreInt < score.scoreInt) {
                            culledScores[index] = score;
                        } 
                    }
                } else {
                    culledScores.push(score);
                }
            });
            scoresResponse.scores = culledScores;
            res.send(scoresResponse);

        } catch (e) {
            console.log("error getting top scores " + e);
            res.send("error getting scores " + e);
        }
    })();
});


app.get('/totalscores_aka/:appid', function (req, res) { //does not use userID, but the "aka" name from "guest" players

    var appid = req.params.appid.toString().replace(":", "");

    console.log("tryna get total user scores for app: " + appid);

    var scoresResponse = {};
    if (appid != undefined && appid != "") {

        (async () => {
            try {
                const query = {"appID" : appid};
                const scores = await RunDataQuery("scores", "find", query);
                let appScores = scores;
                let uids = [];
                let lookup = {};
                let totalscores = [];

                for (var item, i = 0; item = appScores[i++];) {
                    var uid = item.aka; //use the "aka" username
                    if (!(uid in lookup)) {
                        lookup[uid] = 1;
                        uids.push(uid);
                    }
                }
                for (const uid in uids) {
                    var uscores = {};
                    var scoretemp = 0;
                    for (var entry in appScores) {
                        if (uid == appScores[entry].aka) {
                            scoretemp = scoretemp + parseInt(appScores[entry].scoreInt);
                        }
                    }
                    uscores.scoreName = uid;
                    uscores.scoreTotal = scoretemp;
                    totalscores.push(uscores);
                }
                totalscores.sort((a, b) => (a.scoreTotal < b.scoreTotal) ? 1 : -1);
                for (var i = 0; i < totalscores.length; i++) {
                    totalscores[i].rank = i + 1;
                }
                scoresResponse.totalscores = totalscores;
                res.json(scoresResponse);
            } catch (e) {
                console.log("error getting totalscores_aka " +e);
                res.send("error getting totalscores_aka " +e);
            }
        })();
    } else {
        console.log("no app id for scores!");
        res.send("no app id for scores!");
    }
});


app.get('/totalscores/:appid', function (req, res) {

    var appid = req.params.appid.toString().replace(":", "");

    console.log("tryna get total user scores for app: " + appid);

    let scoresResponse = {};

    (async () => {
        try {
            const query = {"appID" : appid};
            const scores = await RunDataQuery("scores", "find", query);
            let appScores = scores;
            let uids = [];
            let lookup = {};
            let totalscores = [];

            for (var item, i = 0; item = appScores[i++];) {
                    var uid = item.userID;
                    if (!(uid in lookup)) {
                        lookup[uid] = 1;
                        uids.push(uid);
                    }
                }
            for (const uid in uids) {
                var uscores = {};
                var scoretemp = 0;
                for (var entry in appScores) {
                    if (uid == appScores[entry].userID) {
                        scoretemp = scoretemp + parseInt(appScores[entry].score);
                    }
                }
                uscores.scoreName = uid;
                uscores.scoreTotal = scoretemp;
                totalscores.push(uscores);
            }
            totalscores.sort((a, b) => (a.scoreTotal < b.scoreTotal) ? 1 : -1);
            for (var i = 0; i < totalscores.length; i++) {
                totalscores[i].rank = i + 1;
            }
            scoresResponse.totalscores = totalscores;
            res.json(scoresResponse);
        } catch (e) {
            console.log("error getting totalscores_aka " +e);
            res.send("error getting totalscores_aka " +e);
        }
    })();
});
    
app.get('/topscores/:appid', function (req, res) { //whynotmakeitpublic

    console.log("tryna get scores for: " + req.params.appid);
    //var _id = ObjectId.createFromHexString(req.params.u_id);
    var appid = req.params.appid.toString().replace(":", "");
    // console.log("tryna get scores for: " + appid);
    // db.scores.find({appID : appid}, { userName: 1, scoreType: 1, aka: 1, scoreTimestamp: 1, scoreInt: 1, _id:0 }, function(err, scores) {

    (async () => {
        try {
            const query = {"appID" : appid};
            const scores = await RunDataQuery("scores", "find", query);
            let scoresResponse = {};
        
            scoresResponse.scores = scores;
            res.json(scoresResponse);
        } catch (e) {
            console.log("error getting top scores " + e);
            res.send("error getting top scores " + e);
        }
    })();
});

app.get('/scores/:u_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get scores for: ", req.params.u_id);
    //var _id = ObjectId.createFromHexString(req.params.u_id);
    var appid = req.headers.appid.toString().replace(":", "");

    (async () => {
        try {
            const query = {$and : [{"userID" : req.params.u_id}, {"appID" : appid}]};
            const scores = await RunDataQuery("scores", "find", query);
            let scoresResponse = {};
            scoresResponse.scores = scores;
            res.json(scoresResponse);
        } catch (e) {
            console.log("error getting top scores " + e);
            res.send("error getting top scores " + e);
        }
    })();
});

app.get('/get_storeitems_all/',  requiredAuthentication, admin, function (req, res) {

    console.log("tryna get all the storeitems");

    (async () => {
        try {
            const query = {};
            const storeitems = await RunDataQuery("storeitems", "find", query);
            let storeitemsResponse = {};
            for (let storeitem in storeitems) {
                var storeItemPictures = [];
                if (storeitem.lastUpdateTimestamp === null || storeitem.lastUpdateTimestamp === undefined) {
                    if (storeitem.itemCreateDate != null && storeitem.itemCreateDate != undefined) {
                        storeitem.lastUpdateTimestamp = storeitem.itemCreateDate;
                    }
                }
                if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                    // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                    const oids = storeitem.storeItemPictureIDs.map(item => {
                        return ObjectId.createFromHexString(item);
                    });
                    const imagequery = {"_id": {$in: oids }};
                    const image_items = await RunDataQuery("image_items","find",imagequery); 
                    for (const item in image_items) {
                        var imageItem = {};
                        // var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                        // var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                        // var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                        imageItem.urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_item.userID + "/pictures/" + picture_item._id + ".thumb." + picture_item.filename,6000);
                        // imageItem.urlHalf = urlHalf;
                        // imageItem.urlStandard = urlStandard;
                        imageItem._id = picture_item._id;
                        imageItem.filename = picture_item.filename;
                        storeItemPictures.push(imageItem);
                    }
                    storeitem.storeItemPictures = storeItemPictures;
                }
            }
            storeitemsResponse.storeitems = storeitems;
            res.send(storeitemsResponse);            
        } catch (e) {
            console.log("error getting storeitems all " + e);
            res.send("error getting stoeritems all " + e);
        }
    })();
});

app.get('/get_storeitems/:app_id', requiredAuthentication, admin, function (req, res) {

    console.log("tryna get storeitems for: ", req.params.app_id);
    var _id = ObjectId.createFromHexString(req.params.app_id);

    (async () => {
        try {
            const query = {"appID" : _id};
            const storeitems = await RunDataQuery("storeitems", "find", query);
            let storeitemsResponse = {};
            for (let storeitem in storeitems) {
                var storeItemPictures = [];
                if (storeitem.lastUpdateTimestamp === null || storeitem.lastUpdateTimestamp === undefined) {
                    if (storeitem.itemCreateDate != null && storeitem.itemCreateDate != undefined) {
                        storeitem.lastUpdateTimestamp = storeitem.itemCreateDate;
                    }
                }
                if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                    // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                    const oids = storeitem.storeItemPictureIDs.map(item => {
                        return ObjectId.createFromHexString(item);
                    });
                    const imagequery = {"_id": {$in: oids }};
                    const image_items = await RunDataQuery("image_items","find",imagequery); 
                    for (const item in image_items) {
                        var imageItem = {};
                        // var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                        // var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                        // var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                        imageItem.urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_item.userID + "/pictures/" + picture_item._id + ".thumb." + picture_item.filename,6000);
                        // imageItem.urlHalf = urlHalf;
                        // imageItem.urlStandard = urlStandard;
                        imageItem._id = picture_item._id;
                        imageItem.filename = picture_item.filename;
                        storeItemPictures.push(imageItem);
                    }
                    storeitem.storeItemPictures = storeItemPictures;
                }
            }
            storeitemsResponse.storeitems = storeitems;
            res.send(storeitemsResponse);            
        } catch (e) {
            console.log("error getting storeitems all " + e);
            res.send("error getting stoeritems all " + e);
        }
    })();
});


app.get('/get_storeitem/:_id',  requiredAuthentication, admin, function (req, res) {
    console.log("tryna get storeitem: ", req.params._id);
   
    // var appid = req.headers.appid.toString().replace(":", "");
    (async () => {
        try {
            const item_id = ObjectId.createFromHexString(req.params._id);
            
            const query = {_id : item_id};
            let storeitem = await RunDataQuery("storeitems", "findOne", query);
            let storeitemResponse = {};
            // for (let storeitem of storeitems) {
                var storeItemPictures = [];
                console.log("store item " + JSON.stringify(storeitem));
                if (storeitem.totalSold == null || storeitem.totalSold == undefined) {
                    storeitem.totalSold = 0;
                }
                if (storeitem.lastUpdateTimestamp === null || storeitem.lastUpdateTimestamp === undefined) {
                    if (storeitem.itemCreateDate != null && storeitem.itemCreateDate != undefined) {
                        storeitem.lastUpdateTimestamp = storeitem.itemCreateDate;
                    }
                }           
                //hrm, dunno...         
                if (storeitem.storeItemSceneGroupIDs != null && storeitem.storeItemSceneGroupIDs != undefined && storeitem.storeItemSceneGroupIDs.length > 0) {
                    const g_oids = storeitem.storeItemSceneGroupIDs.map(item => {
                        return ObjectId.createFromHexString(item);
                    });
                    const query = {_id: {$in: g_oids }};
                    const groups = await RunDataQuery("groups", "find", query);
                    if (groups && groups.length) {
                        storeitem.storeItemAccessGroups = groups;
                    }

                  
                } 
                if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                    // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                    const oids = storeitem.storeItemPictureIDs.map(item => {
                        return ObjectId.createFromHexString(item);
                    });
                    const imagequery = {"_id": {$in: oids }};
                    const image_items = await RunDataQuery("image_items","find",imagequery); 
                    for (const picture_item in image_items) {
                        var imageItem = {};
                        imageItem.urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".thumb." + picture_item.filename, 6000);
                        imageItem.urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".half." + picture_item.filename, 6000);
                        imageItem.urlStandard = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + ".standard." + picture_item.filename, 6000);
                        imageItem._id = picture_item._id;
                        imageItem.filename = picture_item.filename;
                        storeItemPictures.push(imageItem);
                        storeitem.storeItemPictures = storeItemPictures;
                    }
                    storeitem.storeItemPictures = storeItemPictures;
                }
            // }
            // storeitemResponse.storeitem = storeitem;
            res.send(storeitem);            
        } catch (e) {
            console.log("error getting storeitem " + e);
            res.send("error getting stoeritem " + e);
        }
    })();
});


app.post('/set_storeitem', checkAppID, requiredAuthentication, admin, function (req, res) {
    console.log("tryna save storeitem : " + JSON.stringify(req.body));
    let storeitem = req.body;
    let timestamp = Math.round(Date.now() / 1000);
    storeitem.createdTimestamp = timestamp;
    storeitem.createdByUserID = req.session.user._id;
    storeitem.createdByUserName = req.session.userName;

    (async () => {
        try {
            
            const saved = await RunDataQuery("storeitems", "insertOne", storeitem);
            res.send("created store item " + saved.insertedId );
        } catch (e) {
            console.log("error creagting new store item " + e);
            res.send("error creating new store itme " + e);
        }
    })();
});

app.post('/update_storeitem/', checkAppID, requiredAuthentication, admin, function (req, res) {
    console.log("tryna save storeitem : " + JSON.stringify(req.body));
    var o_id = ObjectId.createFromHexString(req.body._id);
    var timestamp = Math.round(Date.now() / 1000);

    (async () => {
        try {
            const query = {"_id": o_id};
            const updoc = { $set: {
                itemName: req.body.itemName,
                itemDisplayName: req.body.itemDisplayName,
                itemAltName: req.body.itemAltName,
                itemStatus: req.body.itemStatus,
                itemType: req.body.itemType,
                itemSubType: req.body.itemSubType,
                useGameCurrency: req.body.useGameCurrency,
                itemPrice: req.body.itemPrice,
                itemDescription: req.body.itemDescription,
                tags: req.body.tags,
                itemAttributes: req.body.itemAttributes,
                maxPerUser: req.body.maxPerUser,
                maxTotal: req.body.maxTotal,
                displayAssetURL: req.body.displayAssetURL,
                storeItemPictureIDs: req.body.storeItemPictureIDs,
                lastUpdateTimestamp: timestamp
            }};
            const updated = await RunDataQuery("storeitems", "updateOne", query, updoc);
            res.send("updated store item " + JSON.stringify(updated) );
        } catch (e) {
            console.log("error updating new store item " + e);
            res.send("error updating new store item " + e);
        }
    })();
}); 

app.post('/delete_storeitem/', requiredAuthentication, admin, function (req, res) {
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectId.createFromHexString(req.body._id);
    (async () => {
        try {
            const query = {"_id": o_id};
           
            const deleted = await RunDataQuery("storeitems", "deleteOne", query);
            res.send("deleted store item " + JSON.stringify(deleted) );
        } catch (e) {
            console.log("error deleting store item " + e);
            res.send("error deleting store item " + e);
        }
    })();
    // db_old.storeitems.remove( { "_id" : o_id }, 1 );
    // res.send("deleted");
});

//hrm.... purchase needs to flex...
// app.post('/purchase', checkAppID, requiredAuthentication, function (req, res) {
//     console.log("tryna post purchase: " + JSON.stringify(req.body));

//     var _id = ObjectId.createFromHexString(req.body.userID);
//     var obody = req.body;
//     db_old.users.findOne({"_id" : _id}, function (err, user) {
//         if (err || !user) {
//             console.log("error getting user: " + err);
//             res.send("error " + err);
//         } else {
//             var userEmail = user.email;
//             console.log("tryna charge " + userEmail);
//             obody.userEmail = userEmail;
//             if (user.stripeCustomerID != null) {
//                 stripe.charges.create({
//                     amount: 1500, // $15.00 this time
//                     currency: "usd",
//                     customer: user.stripeCustomerID,
//                     receipt_email: userEmail,
//                     description: req.body.purchaseDescription,

//                 }).then(function(charge){
//                     console.log(JSON.stringify(charge));
//                     obody.stripeToken = charge;
//                     db_old.purchases.save(obody, function (err, saved) {
//                         if ( err || !saved ) {
//                             console.log('purchase not saved..');
//                             res.send("nilch");
//                         } else {
//                             var item_id = saved._id.toString();
//                             console.log('new purchase id: ' + item_id);
//                             res.send("purchase id: " + item_id + " charged " + JSON.stringify(charge));
//                         }
//                     });
//                 });
//             } else {
//                 console.log("no customer id!");
//                 res.send("no id");
//             }
//         }
//     });
// });

// app.post('/stripe_testpurchase', checkAppID, requiredAuthentication, function (req, res) {
//     console.log("tryna post test purchase: " + JSON.stringify(req.body));
//     let _id = ObjectId.createFromHexString(req.body.userID);
//     let storeitemID = ObjectId.createFromHexString(req.body.storeitemID);
//     let obody = req.body;
    
//     db_old.users.findOne({"_id" : _id}, function (err, user) {// check user
//         if (err || !user) {
//             console.log("error getting user: " + err);
//             res.send("error " + err);
//         } else {
//             db_old.storeitems.findOne({"_id" : storeitemID}, function (err, storeitem){ //check store item
//                 if (err || !storeitem) {
//                     console.log("no store item error " + err);
//                     res.send("error " + err);
//                 } else {
//                     let usertotal = 0;
//                     db_old.purchases.find({userID: req.body.userID, storeitemID: req.body.storeitemID}, function (err, purchases) { //check user's previous purchases of this item doesn't exceed maxPerUser
//                         if (err) {
//                             console.log("error! " + err);
//                         } else {

//                             for (let i = 0; i < purchases.length; i++) {
//                                 let quantity = (purchases[i].quantity != null) ? purchases[i].quantity : 1;
//                                 usertotal += quantity;
//                             }
//                             if (usertotal >= storeitem.maxPerUser) {
//                                 console.log("maxPerUser exceeded!");
//                                 res.send("this user can't buy more of these!");
//                             } else {
//                                 console.log("checking inventory totalSold == " + total + " maxTotal ==  " + storeitem.maxTotal );
//                                 if (storeitem.maxTotal == 0 || total < storeitem.maxTotal) { //check maxTotal
//                                     var userEmail = user.email;
//                                     console.log("tryna charge " + userEmail);
//                                     obody.userEmail = userEmail;
//                                     obody.purchaseStatus = "Test Purchase"
//                                     if (obody.quantity == null) {
//                                         obody.quantity = 1;
//                                     }
//                                     // if (obody.quantity < storeitem.maxPerUser) {
//                                     db_old.purchases.save(obody, function (err, saved) {
//                                         if ( err || !saved ) {
//                                             console.log('purchase not saved..');
//                                             res.send("purchase failed");
//                                         } else {
//                                             var item_id = saved._id.toString();
//                                             console.log('new purchase id: ' + item_id);
//                                             db_old.storeitems.update( { "_id": storeitemID },{ $inc: { totalSold: obody.quantity }});
//                                             var htmlbody = "Thanks for your Purchase: " + JSON.stringify(saved);
//                                             (async () => {
//                                                 try {
//                                                     const status = await SendEmail(userEmail, adminEmail, htmlbody, "Your Purchase");
//                                                     const status2 = await SendEmail(userEmail, adminEmail, htmlbody, "Your Purchase ADMIN");
//                                                 } catch (e) {
//                                                      console.log("error sending! " + e);
//                                                 }

//                                             })(); 
                                           
//                                             res.send("purchase id: " + item_id + " charged " + saved.price);
//                                         }
//                                     });
//                                 } else {
//                                     console.log("Sold Out!")
//                                     res.send("that item is sold out");
//                                 }
//                             }
//                         }
//                     }); //check user's purchases for this item
//                     let total = 0;
//                     if (storeitem.totalSold != null) {
//                         total = storeitem.totalSold;
//                     }

//                 } 
//             }); 

//         }
//     });
// });

app.get('/purchases/', requiredAuthentication, admin, function (req, res) { //all the things..

    console.log("tryna get all purchases! ");

    (async () => {
        try {
            const query = {};
            const purchases = await RunDataQuery("purchases", "find", query);
            let purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        } catch (e) {
            console.log("error getting all purchases " + e);
            res.send("error getting all purchases " + e);
        }
    })();
});


app.get('/purchases/:app_id/:u_id',  requiredAuthentication, function (req, res) {

    console.log("tryna get purchases for: ", req.params.u_id + " " + req.params.app_id);
    (async () => {
        try {
            const query = {$and : [{userID : req.params.u_id}, {appID : req.params.app_id}]};
            const purchases = await RunDataQuery("purchases", "find", query);
            let purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        } catch (e) {
            console.log("error getting purchases " + e);
            res.send("error getting purchases " + e);
        }
    })();
});

app.get('/purchases/:app_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get purchases for appid: " + req.params.app_id);
    //var _id = ObjectId.createFromHexString(req.params.u_id);
    // var appid = req.headers.appid.toString().replace(":", "");
    (async () => {
        try {
            const query = {"appID" : req.params.app_id};
            const purchases = await RunDataQuery("purchases", "find", query);
            let purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        } catch (e) {
            console.log("error getting purchases " + e);
            res.send("error getting purchases " + e);
        }
    })();
});


app.post('/activity', requiredAuthentication, function (req, res) { //unused?
    console.log("tryna post activity");
    (async () => {
        try {
            
            const saved = await RunDataQuery("activity", "insertOne", req.body);
            res.send("inserted activity " + JSON.stringify(saved) );
        } catch (e) {
            console.log("error inserting activity " + e);
            res.send("error inserting activity " + e);
        }
    })();
});

app.get('/activities/:u_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get activities for: ", req.params.u_id);
    //var _id = ObjectId.createFromHexString(req.params.u_id);
    var appid = req.headers.appid.toString().replace(":", "");
    (async () => {
        try {
            const query = {$and : [{userID : req.params.u_id}, {appID : appid}]};
            const activities = await RunDataQuery("activity", "find", query);
            let activitiesResponse = {};
            activitiesResponse.activities = activities;
            res.json(activitiesResponse);
        } catch (e) {
            console.log("error inserting activity " + e);
            res.send("error inserting activity " + e);
        }
    })();
});

app.post('/add_scene_group/', requiredAuthentication, function (req, res) {

    let s_id = ObjectId.createFromHexString(req.body.scene_id);   
    let g_id = ObjectId.createFromHexString(req.body.group_id);   
   
    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const groupquery = { "_id": g_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            const group = await RunDataQuery("groups", "findOne", groupquery);
            if (req.body.grouptype.toLowerCase().includes('picture')) {
                    var scenePictureGroups = scene.scenePictureGroups || new Array();
                    console.log("tryna add pic group to scene: " + s_id);
                    if (scenePictureGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        scenePictureGroups.push(req.body.group_id);
                        const updoc = { $set: {scenePictureGroups: scenePictureGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with picture group " + JSON.stringify(updated));
                    }

                } else  if (req.body.grouptype == 'audio') {
                    var sceneAudioGroups = scene.sceneAudioGroups || new Array();
                    console.log("tryna add audio group to scene: " + s_id);
                    if (sceneAudioGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneAudioGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneAudioGroups: sceneAudioGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));
                       
                    }
                } else  if (req.body.grouptype == 'paudio') {
                        let scenePrimaryAudioGroups = scene.scenePrimaryAudioGroups || new Array();
                        console.log("tryna add primary audio group to scene: " + s_id);
                        if (scenePrimaryAudioGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                        scenePrimaryAudioGroups.push(req.body.group_id);
                        const updoc = { $set: {scenePrimaryAudioGroups: scenePrimaryAudioGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                        }
                } else  if (req.body.grouptype == 'aaudio') {
                    let sceneAmbientAudioGroups = scene.sceneAmbientAudioGroups || new Array();
                    console.log("tryna add ambient audio group to scene: " + s_id);
                    if (sceneAmbientAudioGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneAmbientAudioGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneAmbientAudioGroups: sceneAmbientAudioGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                    }
                } else  if (req.body.grouptype == 'taudio') {
                    let sceneTriggerAudioGroups = scene.sceneTriggerAudioGroups || new Array();
                    console.log("tryna add trigger audio group to scene: " + s_id);
                    if (sceneTriggerAudioGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneTriggerAudioGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneTriggerAudioGroups: sceneTriggerAudioGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                    }            
                } else if (req.body.grouptype == 'text') {
                    var sceneTextGroups = scene.sceneTextGroups || new Array();
                    console.log("tryna add video group to scene: " + s_id);
                    if (sceneTextGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneTextGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneTextGroups: sceneTextGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                    }

                } else if (req.body.grouptype == 'object') {
                    var sceneObjectGroups = scene.sceneObjectGroups || new Array();
                    console.log("tryna add object group to scene: " + s_id);
                    if (sceneObjectGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneObjectGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneObjectGroups: sceneObjectGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                    }

                } else if (req.body.grouptype == 'video') {
                    var sceneVideoGroups = scene.sceneVideoGroups || new Array();
                    console.log("tryna add location group to scene: " + s_id);
                    if (sceneVideoGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneVideoGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneVideoGroups: sceneVideoGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));
 
                    }
                } else if (req.body.grouptype == 'location') {
                    var sceneLocationGroups = scene.sceneLocationGroups || new Array();
                    console.log("tryna add location group to scene: " + s_id);
                    if (sceneLocationGroups.indexOf(req.body.group_id) > -1) {
                        console.log("redundant group id");
                    } else {
                        sceneLocationGroups.push(req.body.group_id);
                        const updoc = { $set: {sceneLocationGroups: sceneLocationGroups}};
                        const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc )
                        console.log("updateed scene with audio group " + JSON.stringify(updated));

                    }
                }
                res.send("updated scene with group");
        } catch (e) {
            console.log('error adding group to scene ' +e);
            res.send('error adding group to scene ' +e);
        }
    })();
});

app.post('/scenedata/', function (req, res) {

    console.log("tryna get scenedata for tags " + req.body.tags);

    (async () => {
        try {
            let tags = [];


            if (req.body.tags.toString().includes(",")) {
                tags = req.body.tags.split(",");
            } else {
                tags.push(req.body.tags);
            }
            // console.log("tryna find scene with tag "+ tags);
            // const query = {"sceneTags": req.body.tags}; //array of strings...
            const query = {"sceneTags": {$in: tags}};
            const scenes = await RunDataQuery("scenes", "find", query);

            // console.log("scene with tag "+ req.body.tags + " " + JSON.stringify(scenes));

            const theScene = scenes[Math.floor((Math.random()*scenes.length))]; //return random one if more than one
            if (!theScene) {
               theScene = {};
            }
            res.send(theScene);
        } catch (e) {    
            res.send(e);
        }
    })();

}); 

app.post('/add_scene_mods/:s_id', requiredAuthentication, admin, function (req, res) { //update "mods" coming from webxr client, not admin pages
    if (req.params.s_id == req.body.shortID) {
        console.log("userData for sceneMods : " +JSON.stringify(req.body.userData));
        if (req.body.userData._id == req.session.user._id || req.body.userData.sceneOwner == "indaehoose") {    
            
            (async () => {
                try {
                    // console.log("TRYNA ADD SCENE MODS mods " + JSON.stringify(req.body));
                    const query = {"short_id": req.params.s_id};
                    const scene = await RunDataQuery("scenes", "findOne", query);
                    if (!scene.sceneTags.includes("no mods")) { 
                        let scenequery = {};
                        let newFiles = []; 
                        let updatedSceneLocations = [];

                            for (let file in req.body.localFiles) {
                            // for (let key in localData.localFiles) {
                                    // let ext = localData.localFiles[key].name.split('.');
                                console.log("file : " + JSON.stringify(req.body.localFiles[file].name));
                                let timestamp = Math.round(Date.now() / 1000);
                                console.log("gotsa uploaded localfile " + req.body.localFiles[file].name);
                                let buffer = Buffer.from(req.body.localFiles[file].data, 'base64');
                                //models and images only atm...
                                if (getExtension(req.body.localFiles[file].name) == ".glb") { //should sniff the thing instead, but...
                                    let awskey = 'users/' + req.session.user._id.toString() + '/gltf/' + timestamp + '_' + req.body.localFiles[file].name;
                                    let params = { Bucket: process.env.ROOT_BUCKET_NAME, 
                                        Key: awskey, 
                                    // ContentEncoding: 'base64',
                                        ContentType: 'application/octet-stream',
                                        Body: buffer};
                                    const status = await PutObject(params.Bucket, params.Key, params.Body);
                                    console.log("uploaded file " + awskey + " " + JSON.stringify(status));
                                    const newmodel = { //add to models collection
                                        userID : req.session.user._id.toString(),
                                        username : req.session.user.userName,
                                        name : timestamp + "_" + req.body.localFiles[file].name,
                                        filename : timestamp + "_" + req.body.localFiles[file].name,
                                        item_type : 'glb',
                                        tags: [],
                                        item_status: "private",
                                        otimestamp : timestamp,
                                        ofilesize : req.body.localFiles[file].size };
                                    const saved = await RunDataQuery("models", "insertOne", newmodel);
                                    console.log("glb saved with id " + saved.insertedId); //.insertedId == ObjectId of new record
                                    let newfile = {};
                                    newfile.name = req.body.localFiles[file].name.replace("local_","");
                                    newfile._id = saved.insertedId;
                                    newFiles.push(newfile);
                                    var s_id = scene._id;   
                                    var sceneModels = (scene.sceneModels != undefined && scene.sceneModels != null && scene.sceneModels.length > 0) ? scene.sceneModels : new Array();
                                    sceneModels.push(saved.insertedId);
                                    const query = { "_id": s_id };
                                    const updoc = { $set: {"sceneModels": sceneModels}};
                                    console.log("updoc " + JSON.stringify(updoc));
                                    const updated = await RunDataQuery("scenes","updateOne", query, updoc);
                                    console.log("updated sceneModels with " + JSON.stringify(updoc) + " " + JSON.stringify(updated));
                                
                                } else if (getExtension(req.body.localFiles[file].name) == ".ply" || getExtension(req.body.localFiles[file].name) == ".spz" ||
                                             getExtension(req.body.localFiles[file].name) == ".splat" || getExtension(req.body.localFiles[file].name) == ".ksplat"  ) { //should sniff the thing instead, but...
                                    let awskey = 'users/' + req.session.user._id.toString() + '/splat/' + timestamp + '_' + req.body.localFiles[file].name;
                                    let params = { Bucket: process.env.ROOT_BUCKET_NAME, 
                                        Key: awskey, 
                                    // ContentEncoding: 'base64',
                                        ContentType: 'application/octet-stream',
                                        Body: buffer};
                                    const status = await PutObject(params.Bucket, params.Key, params.Body);
                                    console.log("uploaded file " + awskey + " " + JSON.stringify(status));
                                    const newmodel = { //add to models collection
                                        userID : req.session.user._id.toString(),
                                        username : req.session.user.userName,
                                        name : timestamp + "_" + req.body.localFiles[file].name,
                                        filename : timestamp + "_" + req.body.localFiles[file].name,
                                        item_type : 'splat',
                                        tags: [],
                                        item_status: "private",
                                        otimestamp : timestamp,
                                        ofilesize : req.body.localFiles[file].size };
                                    const saved = await RunDataQuery("models", "insertOne", newmodel);
                                    console.log("glb saved with id " + saved.insertedId); //.insertedId == ObjectId of new record
                                    let newfile = {};
                                    newfile.name = req.body.localFiles[file].name.replace("local_","");
                                    newfile._id = saved.insertedId;
                                    newFiles.push(newfile);
                                    var s_id = scene._id;   
                                    var sceneModels = (scene.sceneModels != undefined && scene.sceneModels != null && scene.sceneModels.length > 0) ? scene.sceneModels : new Array();
                                    sceneModels.push(saved.insertedId);
                                    const query = { "_id": s_id };
                                    const updoc = { $set: {"sceneModels": sceneModels}};
                                    console.log("updoc " + JSON.stringify(updoc));
                                    const updated = await RunDataQuery("scenes","updateOne", query, updoc);
                                    console.log("updated sceneModels with " + JSON.stringify(updoc) + " " + JSON.stringify(updated));
                                
                                } else if (getExtension(req.body.localFiles[file].name) == ".jpg" || getExtension(req.body.localFiles[file].name) == ".png") { 
                                    let hasAlpha = false;
                                    if (getExtension(req.body.localFiles[file].name) == ".png") {
                                        hasAlpha = true;
                                    }
                                    const newimage = { 
                                        type : "fromLocalFile",
                                        userID : req.session.user._id.toString(),
                                        userName : req.session.user.userName,
                                        title : timestamp + "_" + req.body.localFiles[file].name,
                                        filename : timestamp + "_" + req.body.localFiles[file].name,
                                        item_type : 'picture',
                                        tags: [],
                                        item_status: "private",
                                        hasAlphaChannel: hasAlpha,
                                        otimestamp : timestamp,
                                        ofilesize : req.body.localFiles[file].size };
                                    const saved = await RunDataQuery("image_items", "insertOne", newimage);
                                    console.log("image saved with id " + saved.insertedId);
                                    let newfile = {};
                                    newfile.name = req.body.localFiles[file].name;
                                    newfile.name.replace("local_","");
                                    newfile._id = saved.insertedId;
                                    newFiles.push(newfile);
                                    let awskey = 'users/' + req.session.user._id.toString() + '/pictures/originals/' + saved.insertedId + '.original.' + req.body.localFiles[file].name;
                                    let params = { Bucket: process.env.ROOT_BUCKET_NAME, 
                                        Key: awskey, 
                                        // ContentEncoding: 'base64',
                                        ContentType: 'application/octet-stream',
                                        Body: buffer};
                                    const status = await PutObject(params.Bucket, params.Key, params.Body);
                                    console.log("put a pic: " + JSON.stringify(status));
                                    console.log('uploaded ' + req.body.localFiles[file].name);
                                    var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
                                    const options = {
                                        headers: {'X-Access-Token': token}
                                    };
                                    const response = await axios.get(process.env.GS_HOST + "/resize_uploaded_picture/"+saved.insertedId, options);
                                    console.log("grabAndSqueezepic response: " + response.status);
                                    var s_id = scene._id;   
                                    var scenePictures = (scene.scenePictures != undefined && scene.scenePictures != null && scene.scenePictures.length > 0) ? scene.scenePictures : new Array();
                                    scenePictures.push(saved.insertedId);
                                    const updoc = { $set: {"scenePictures": scenePictures}};
                                    const query = { "_id": s_id };
                                    const imageupdated = await RunDataQuery("scenes","updateOne", query, updoc);
                                    console.log("image mod updated.." + imageupdated);
                                    // db_old.scenes.update({ "_id": s_id }, ); //add pictureID to scene
                                }
                            } //end new files

                            if (req.body.colorMods != null) {
                                let sceneColor1 = req.body.colorMods.sceneColor1 != null ? req.body.colorMods.sceneColor1 : "";
                                let sceneColor2 = req.body.colorMods.sceneColor2 != null ? req.body.colorMods.sceneColor2 : "";
                                let sceneColor3 = req.body.colorMods.sceneColor3 != null ? req.body.colorMods.sceneColor3 : "";
                                let sceneColor4 = req.body.colorMods.sceneColor4 != null ? req.body.colorMods.sceneColor4 : "";
                                if (sceneColor1 != "") {
                                    scenequery.sceneColor1 = sceneColor1;
                                    console.log("query is " + scenequery.sceneColor1);
                                }
                                if (sceneColor2 != "") {
                                    scenequery.sceneColor2 = sceneColor2;
                                }
                                if (sceneColor3 != "") {
                                    scenequery.sceneColor3 = sceneColor3;
                                }
                                if (sceneColor4 != "") {
                                    scenequery.sceneColor4 = sceneColor4;
                                }
                            }
                            if (req.body.volumeMods != null) {
                                scenequery.scenePrimaryVolume = req.body.volumeMods.volumePrimary != null ? req.body.volumeMods.volumePrimary : 0;
                                scenequery.sceneAmbientVolume = req.body.volumeMods.volumeAmbient != null ? req.body.volumeMods.volumeAmbient : 0;
                                scenequery.sceneTriggerVolume = req.body.volumeMods.volumeTrigger != null ? req.body.volumeMods.volumeTrigger : 0;
                            }
                            if (req.body.sceneEnvironmentPreset != null) {
                                console.log("enviro preset " + req.body.sceneEnvironmentPreset);
                                scenequery.sceneEnvironmentPreset = req.body.sceneEnvironmentPreset;
                            }
                            if (req.body.sceneTags != null) {
                                scenequery.sceneTags = req.body.sceneTags;
                                console.log("sceneTags mods " + scenequery.sceneTags);
                            }
                            if (req.body.sceneTimedEvents != null) {
                                scenequery.sceneTimedEvents = req.body.sceneTimedEvents;
                                console.log("sceneTimedEvents mods " + JSON.stringify(scenequery.sceneTimedEvents));
                            }
                            if (req.body.locationMods != null) {
                                console.log("REQ.BODY.LOCATIONMODS " + JSON.stringify(req.body.locationMods));
                                for (let l = 0; l < req.body.locationMods.length; l++) {
                                    let isMatch = false;
                                    // let name = req.body.locationMods[i].name;
                                    delete req.body.locationMods[l].isNew; //going to the cloud don't need these
                                    delete req.body.locationMods[l].isLocal;
                                    if (req.body.locationMods[l].name && req.body.locationMods[l].name.toLowerCase().includes("local ")) {
                                        let name = req.body.locationMods[l].name.toLowerCase().replace("local ", "");
                                        req.body.locationMods[l].name = name;
                                    }
                                    // console.log("has newfile? " + req.body.locationMods[l].modelID + " Vs " + JSON.stringify(newFiles));
                                    if (req.body.locationMods[l].modelID && req.body.locationMods[l].modelID.length) {
                                        for (let i = 0; i < newFiles.length; i++) {
                                            if (req.body.locationMods[l].modelID && req.body.locationMods[l].modelID.length && (newFiles[i].name == req.body.locationMods[l].modelID.replace("local_", ""))) { //reassign modelID w/ new DB _id
                                                console.log("gotsa new model file match! " + newFiles[i].name);
                                                req.body.locationMods[l].modelID = newFiles[i]._id;
                                                req.body.locationMods[l].model = newFiles[i].name;

                                            }
                                        }
                                    }
                                    if (req.body.locationMods[l].mediaID && req.body.locationMods[l].mediaID.length) {
                                        for (let i = 0; i < newFiles.length; i++) {
                                            if (newFiles[i].name == req.body.locationMods[l].mediaID.replace("local_", "")) { //reassign modelID w/ new DB _id
                                                console.log("gotsa new media file match! " + newFiles[i].name);
                                                req.body.locationMods[l].mediaID = newFiles[i]._id;
                                                req.body.locationMods[l].mediaName = newFiles[i].name;

                                            }
                                        }
                                    }

                                    let matchedID = 0;
                                    
                                    for (let i = 0; i < scene.sceneLocations.length; i++) { //spin through actual locations and either match and update or add a new one
                                        let tsVar = null;
                                    
                                        if (req.body.locationMods[l].timestamp == scene.sceneLocations[i].timestamp) {
                                            console.log("tryna update a EXISTING LOCATION " + req.body.locationMods[l].timestamp);
                                           
                                            if (Number.isInteger(scene.sceneLocations[i].timestamp)) { // shit happens
                                                tsVar = parseInt(req.body.locationMods[l].timestamp);
                                            } else {
                                                tsVar = req.body.locationMods[l].timestamp.toString();
                                            }
                                            if ((scene.sceneLocations[i].tags && scene.sceneLocations[i].tags.includes("no mods"))) {
                                                console.log("mods not allowed for " + scene.sceneLocations[i].timestamp)
                                            } else {
                                                delete req.body.locationMods[l].isLocal;
                                                updatedSceneLocations.push(req.body.locationMods[l]);
                                                matchedID = req.body.locationMods[l].timestamp; //if no match add the new one below
                                            }
                                        } 
                                    }

                                    if (matchedID != req.body.locationMods[l].timestamp) {
                                        console.log("gotsa NEW LOCATION FROM CLIENT!" + req.body.locationMods[l].timestamp)
                                        
                                        if (req.body.locationMods[l].name && req.body.locationMods[l].name.toLowerCase().includes("local ")) {
                                            let name = req.body.locationMods[l].name.toLowerCase().replace("local ", "");
                                            req.body.locationMods[l].name = name;
                                            unmatchedIsModded = true;
                                        }
                                        // console.log("new loc new files? " + req.body.locationMods[l].modelID + " V " + JSON.stringify(newFiles));
                                        if (newFiles.includes(req.body.locationMods[l].modelID)) {
                                            for (let i = 0; i < newFiles.length; i++) {
                                                if (newFiles[i].name == req.body.locationMods[l].modelID.replace("local_","")) { //reassign modelID w/ new DB _id
                                                    console.log("gotsa match new loc new model!");
                                                    req.body.locationMods[l].modelID = newFiles[i]._id;
                                                    
                                                }
                                            }
                                        }
                                        updatedSceneLocations.push(req.body.locationMods[l]);
                                    }
                                }
                                        
                            }

                            scenequery.sceneLocations = updatedSceneLocations; //?
                        const finalquery = {'short_id': req.params.s_id};
                        const updoc = { $set: scenequery };
                        const finalupdated = await RunDataQuery("scenes", "updateOne", finalquery, updoc);
                        console.log("final update with local mods " + JSON.stringify(scenequery));
                        res.send("updated");
                    }
       
                } catch (e) {
                    console.log("error adding local mods " + e);
                    res.send("error adding local mods " + e);
                }
            })(); //end async
        } else {
            console.log("tryna add_scene_mnods, but you aint the scene owner!");
            res.send("must be scene owner!!");
        }
    } else {
        console.log("scene mods are not allowed!");
        res.send("mods not allowed for this");
    }
});

app.post('/add_scene_location/', requiredAuthentication, function (req, res) { //pick from "saved" list of location

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.location_id);   
    console.log('tryna add a scene location : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const locquery= { "_id": p_id};
            let location = await RunDataQuery("locations", "findOne", locquery);
            const timestamp = Math.round(Date.now() / 1000);
            location.timestamp = timestamp;
            const updoc ={$addToSet: { "sceneLocations": location}};
            const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
            res.send("updated " + JSON.stringify(updated));
        } catch (e) {
            console.log("error addding scene location " + e);
            res.send("error addding scene location " + e);
        }
    })();
});


app.post('/add_scene_model/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.model_id);   
    console.log('tryna add a scene model : ' + JSON.stringify(req.body));
    
    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const modelquery = { "_id": p_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            
            const hasModel = (scene.sceneModels.length && scene.sceneModels.indexOf(req.body.model_id) > -1) ? true : false;
            console.log("sceneModels " + JSON.stringify(scene.sceneModels) +" vs "+req.body.model_id + " " + hasModel );
            if (scene.sceneModels == "" || !hasModel) {
                let model = await RunDataQuery("models", "findOne", modelquery); //just to check it's real...?
                let sceneModels = (scene.sceneModels != undefined && scene.sceneModels != null && scene.sceneModels.length > 0) ? scene.sceneModels : new Array();
                sceneModels.push(model._id.toString()); //the real one
                const updoc ={$set: { "sceneModels": sceneModels}}; //addToSet should prevent dupes? //but all these are set as empty strings, not arrays, so addtoset doens't work :(
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated " + JSON.stringify(updated));
                res.send("updated " + JSON.stringify(updated));
            } else {
                console.log("duplicate model ids not allowed!");
                res.send("no dupes - the scene already has that model reference!");
            }
        } catch (e) {
            console.log("error addding scene model " + e);
            res.send("error addding scene location " + e);
        }
    })();
});


app.post('/add_scene_obj/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.obj_id);   
    console.log('tryna add a scene obj : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const objquery = { "_id": p_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            
            const hasModel = (scene.sceneObjects.length && scene.sceneObjects.indexOf(req.body.obj_id) > -1) ? true : false;
            console.log("sceneObjects " + JSON.stringify(scene.sceneObjects) +" vs "+req.body.obj_id + " " + hasModel );
            if (scene.sceneObjects == "" || !hasModel) {
                let object = await RunDataQuery("obj_items", "findOne", objquery); //just to check it's real...?
                let sceneObjects = (scene.sceneObjects != undefined && scene.sceneObjects != null && scene.sceneObjects.length > 0) ? scene.sceneObjects : new Array();
                sceneObjects.push(object._id.toString()); //the real one
                const updoc ={$set: { "sceneObjects": sceneObjects}}; //addToSet should prevent dupes? //but all these are set as empty strings, not arrays, so addtoset doens't work :(
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated " + JSON.stringify(updated));
                res.send("updated " + JSON.stringify(updated));
            } else {
                console.log("duplicate obj ids not allowed!");
                res.send("no dupes - the scene already has that object reference!");
            }
        } catch (e) {
            console.log("error addding scene model " + e);
            res.send("error addding scene location " + e);
        }
    })();
});

app.post('/add_scene_vid/', requiredAuthentication, function (req, res) { //hrm, not hls but fullfat vids, because...?

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.vid_id);   
    console.log('tryna add a scene vid : ' + JSON.stringify(req.body));
    
    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const vidquery = { "_id": p_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            
            const hasVideo = (scene.sceneVideos.length && scene.sceneVideos.indexOf(req.body.vid_id) > -1) ? true : false;
            console.log("sceneObjects " + JSON.stringify(scene.sceneVideos) +" vs "+req.body.vid_id + " " + hasVideo );
            if (scene.sceneVideos == "" || !hasVideo) {
                let video = await RunDataQuery("video_items", "findOne", vidquery); //just to check it's real...?
                let sceneVideos = (scene.sceneVideos != undefined && scene.sceneVideos != null && scene.sceneVideos.length > 0) ? scene.sceneVideos : new Array();
                sceneVideos.push(video._id.toString()); //the real one
                const updoc ={$set: { "sceneVideos": sceneVideos}}; //addToSet should prevent dupes? //but all these are set as empty strings, not arrays, so addtoset doens't work :(
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated " + JSON.stringify(updated));
                res.send("updated " + JSON.stringify(updated));
            } else {
                console.log("duplicate obj ids not allowed!");
                res.send("no dupes - the scene already has that object reference!");
            }
        } catch (e) {
            console.log("error addding scene viodeo " + e);
            res.send("error addding scene viodeo " + e);
        }
    })();
});

app.post('/add_scene_text_item/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.text_id);   
    console.log('tryna add a scene text item : ' + req.body);

    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const textquery = { "_id": p_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            
            const hasText = (scene.sceneTextItems.length && scene.sceneTextItems.indexOf(req.body.text_id) > -1) ? true : false;
            console.log("sceneObjects " + JSON.stringify(scene.sceneTextItems) +" vs "+req.body.text_id + " " + hasText );
            if (scene.sceneTextItems == "" || !hasText) {
                let text = await RunDataQuery("text_items", "findOne", textquery); //just to check it's real...?
                let sceneTextItems = (scene.sceneTextItems != undefined && scene.sceneTextItems != null && scene.sceneTextItems.length > 0) ? scene.sceneTextItems : new Array();
                sceneTextItems.push(text._id.toString()); //the real one
                const updoc = {$set: { "sceneTextItems": sceneTextItems}}; //addToSet should prevent dupes? //but all these are set as empty strings, not arrays, so addtoset doens't work :(
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated " + JSON.stringify(updated));
                res.send("updated " + JSON.stringify(updated));
            } else {
                console.log("duplicate text ids not allowed!");
                res.send("no dupes - the scene already has that object reference!");
            }
        } catch (e) {
            console.log("error addding scene text " + e);
            res.send("error addding scene text " + e);
        }
    })();
});

app.post('/scene_text_items/', function (req, res) {
    // console.log("textIDs " + JSON.stringify(req.body.textIDs) + " length " + req.body.textIDs.length );
    // var s_id = ObjectId.createFromHexString(req.body.ids);   
    if (req.body.textIDs != undefined && req.body.textIDs != null && req.body.textIDs.length > 0) {
        let moids = req.body.textIDs.map(convertStringToObjectID);
        (async () => {
            try {
                const textquery = { "_id": { $in: moids }};
                const text_items = await RunDataQuery("text_items", "find", textquery);
                console.log('getting scene_text_items : ' + req.body.textIDs);
                res.send(text_items);
            } catch (e) {
                console.log("error getting scene text " + e);
                res.send("error  getting scene text " + e);
            }
        })();
    } else {
        res.send ("bad request for textItems");
    }
});

app.post('/add_scene_pic/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna add a scene pic : ' + req.body);
    
    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const picquery = { "_id": p_id};
            const scene = await RunDataQuery("scenes", "findOne", scenequery);
            const hasPic = (scene.scenePictures && scene.scenePictures.length && scene.scenePictures.indexOf(req.body.pic_id) > -1) ? true : false;
            console.log("checking scenePictures for dupes " + JSON.stringify(scene.scenePictures) +" vs "+req.body.pic_id + " " + hasPic );
            if (scene.scenePictures == "" || !hasPic) {
                let picture = await RunDataQuery("image_items", "findOne", picquery); 
                let scenePictures = (scene.scenePictures != undefined && scene.scenePictures != null && scene.scenePictures.length > 0) ? scene.scenePictures : new Array();
                scenePictures.push(picture._id.toString()); 
                const updoc ={$set: { "scenePictures": scenePictures}}; 
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated " + JSON.stringify(updated));
                res.send("updated " + JSON.stringify(updated));
            } else {
                console.log("duplicate obj ids not allowed!");
                res.send("no dupes - the scene already has that object reference!");
            }
        } catch (e) {
            console.log("error scene pic " + e);
            res.send("error addding scene pic " + e);
        }
    })();
});

app.post('/add_object_model/', requiredAuthentication, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.object_id);   
    var p_id = ObjectId.createFromHexString(req.body.model_id);   
    console.log('tryna add a object model : ' + JSON.stringify(req.body));
    (async () => {
        try {
            const objquery = { "_id": s_id};
            const modelquery = { "_id": p_id}
            // const object = await RunDataQuery("obj_items", "findOne", objquery);
            const model = await RunDataQuery("models", "findOne", modelquery);
            const updoc = { $set: {"modelID": model._id, "modelName": model.name}};
            const updated = await RunDataQuery("obj_items", "updateOne", objquery, updoc);
            console.log('getting scene_text_items : ' + req.body.textIDs);
            res.send("updated object " + updated );
        } catch (e) {
            console.log("error updating object model " + e);
            res.send("error updating object modek " + e);
        }
    })();
});


app.post('/add_action_model/', requiredAuthentication, function (req, res) { //save to array instead
    var s_id = ObjectId.createFromHexString(req.body.action_id);   
    var p_id = ObjectId.createFromHexString(req.body.model_id);   
    console.log('tryna add an action model : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const actionquery = { "_id": s_id};
            const modelquery = { "_id": p_id}
            // const object = await RunDataQuery("obj_items", "findOne", objquery);
            const model = await RunDataQuery("models", "findOne", modelquery);
            const updoc = { $set: {"modelID": model._id, "modelName": model.name}};
            const updated = await RunDataQuery("actions", "updateOne", actionquery, updoc);
            console.log('getting scene_text_items : ' + req.body.textIDs);
            res.send("updated object " + updated );
        } catch (e) {
            console.log("error updating object model " + e);
            res.send("error updating object modek " + e);
        }
    })();

});


app.post('/add_action_object/', requiredAuthentication, function (req, res) { //save to array instead
    var s_id = ObjectId.createFromHexString(req.body.action_id);   
    var p_id = ObjectId.createFromHexString(req.body.object_id);   
    console.log('tryna add an action model : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const actionquery = { "_id": s_id};
            const objquery = { "_id": p_id}
            // const object = await RunDataQuery("obj_items", "findOne", objquery);
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            const updoc = { $set: {"objectID": object._id, "objectName": object.name}};
            const updated = await RunDataQuery("actions", "updateOne", actionquery, updoc);
            console.log('getting scene_text_items : ' + req.body.textIDs);
            res.send("updated object " + updated );
        } catch (e) {
            console.log("error updating object model " + e);
            res.send("error updating object modek " + e);
        }
    })();
});


app.post('/add_obj_action/', requiredAuthentication, function (req, res) { //save to array instead
    var o_id = ObjectId.createFromHexString(req.body.object_id);   
    var a_id = ObjectId.createFromHexString(req.body.action_id);   
    console.log('tryna add a object action : ' + JSON.stringify(req.body));
    
    (async () => {
        try {
            const actionquery = { "_id": a_id};
            const objquery = { "_id": o_id}
            // const object = await RunDataQuery("obj_items", "findOne", objquery);
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            const action = await RunDataQuery("actions", "findOne", actionquery);  

            if (object.actionIDs && object.actionIDs.indexOf(action._id.toString()) == -1 ) {
                let objectActions = (object.actionIDs != undefined && object.actionIDs != null && object.actionIDs.length > 0) ? object.actionIDs : new Array();
                objectActions.push(action._id.toString()); 
                const updoc = {$set: {"actionIDs": objectActions}};
                const updated = await RunDataQuery("obj_items", "updateOne", objquery, updoc);
                console.log('getting scene_text_items : ' + req.body.textIDs);
                res.send("updated object " + updated );
            } else {
                res.send("object already has that action attached!");
            }
        } catch (e) {
            console.log("error updating object model " + e);
            res.send("error updating object modek " + e);
        }
    })();
});

app.post('/add_object_pic/', requiredAuthentication, function (req, res) {
    var o_id = ObjectId.createFromHexString(req.body.object_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna add a object pic : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const picquery = { "_id": p_id};
            const objquery = { "_id": o_id};
            // const object = await RunDataQuery("obj_items", "findOne", objquery);
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);  

            if (object.objectPictureIDs && object.objectPictureIDs.indexOf(picture._id.toString()) == -1 ) {
                let objectPictures = (object.objectPictureIDs != undefined && object.objectPictureIDs != null && object.objectPictureIDs.length > 0) ? object.objectPictureIDs : new Array();
                objectPictures.push(picture._id.toString()); 
                const updoc = {$set: {"objectPictureIDs": objectPictures}};
                const updated = await RunDataQuery("obj_items", "updateOne", objquery, updoc);
                console.log('getting scene_text_items : ' + req.body.textIDs);
                res.send("updated object " + updated );
            } else {
                res.send("object already has that picture attached!");
            }
        } catch (e) {
            console.log("error updating object picture " + e);
            res.send("error updating object picture " + e);
        }
    })();
});

app.post('/rem_object_action/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.object_id);   
    // var p_id = ObjectId.createFromHexString(req.body.action_id);   
    console.log('tryna remove an object action : ' + JSON.stringify(req.body));
    (async () => {
        try {
            const objquery = {"_id": s_id};
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            var actionIDs = object.actionIDs;
            if (actionIDs != null) {
                let index = actionIDs.indexOf(req.body.action_id);
                if ( index != -1 ) {
                    actionIDs.splice(index, 1);
                    const updoc = { $set: {"actionIDs": actionIDs}};
                    const updated = await RunDataQuery("obj_items", "updateOne", objquery, updoc);
                    res.send("updated object" + JSON.stringify(updated));
                } else {
                    res.send("that action is not assigned to this object");
                }
            } else {
                res.send("no actions on this obj!");
            }
        } catch (e) {
            console.log("error removing action from object!" +e);
            res.send("error removing action from object!" +e);
        }
    })();
});

app.post('/rem_object_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.domain_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna remove an object pic : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const objquery = {"_id": s_id};
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            var objectPics = object.objectPictureIDs;
            if (objectPics != null) {
                let index = objectPics.indexOf(req.body.pic_id);
                if ( index != -1 ) {
                    objectPics.splice(index, 1);
                    const updoc = { $set: {"objectPictureIDs": objectPics}};
                    const updated = await RunDataQuery("obj_items", "updateOne", objquery, updoc);
                    res.send("updated object" + JSON.stringify(updated));
                } else {
                    res.send("that picture is not assigned to this object");
                }
            } else {
                res.send("no pic on this obj!");
            }
        } catch (e) {
            console.log("error removing pic from object!" +e);
            res.send("error removing pic from object!" +e);
        }
    })();
});

app.post('/add_domain_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.domain_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna add a domain pic : ' + JSON.stringify(req.body));
    (async () => {
        try {
            const domainquery = {"_id": s_id};
            const picquery = {"_id": p_id};
            const domain = await RunDataQuery("domains", "findOne", domainquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);
            var domainPics = domain.domainPictureIDs;
                if (domainPics == null) {
                    domainPics = [];
                }
                if ( domainPics.indexOf(picture._id.toString()) == -1 ) {
                    domainPics.push(picture._id.toString());
                    const updoc = { $set: {"domainPictureIDs": domainPics}};
                    const updated = await RunDataQuery("domains", "updateOne", domainquery, updoc);
                    res.send("updated " + JSON.stringify(updated));
                } else {
                    res.send("that picture is already assigned to this domain");
                }
        } catch (e) {
            console.log("error removing pic from object!" +e);
            res.send("error removing pic from object!" +e);
        }
    })();
});

app.post('/rem_app_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.app_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna remove an app pic : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const appquery = {"_id": s_id};
            const picquery = {"_id": p_id};
            const app = await RunDataQuery("apps", "findOne", appquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);
            var appPics = app.appPictureIDs;

            if (appPics != null) {
                let index = appPics.indexOf(picture._id.toString());
                if ( index != -1 ) {
                    appPics.splice(index, 1);
                    const updoc = { $set: {appPictureIDs: appPics}};
                    const updated = await RunDataQuery("apps", "updateOne", appquery, updoc);
                    res.send("updated " + JSON.stringify(updated));
                } else {
                    res.send("that picture is not assigned to this app");
                }
            }
        } catch (e) {
            console.log("error removing pic from app!" +e);
            res.send("error removing pic from app!" +e);
        }
    })();
});

app.post('/add_app_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.app_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna add an app pic : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const appquery = {"_id": s_id};
            const picquery = {"_id": p_id};
            const app = await RunDataQuery("apps", "findOne", appquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);
            var appPics = app.appPictureIDs;
            if (appPics == null) {
                appPics = [];
            }
            // console.log("XXX scenePics: " + storeItemPics);
            if ( appPics.indexOf(picture._id.toString()) == -1 ) {
                appPics.push(picture._id.toString());
                const updoc = { $set: {"appPictureIDs": appPics}};
                const updated = await RunDataQuery("apps", "updateOne", appquery, updoc);
                res.send("updated app" + updated);
            } else {
                res.send("that picture is already assigned to this app");
            }
            
        } catch (e) {
            console.log("error adding pic from app!" +e);
            res.send("error adding pic from app!" +e);
        }
    })();
});


app.post('/rem_storeitem_pic/', checkAppID, requiredAuthentication, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.storeitem_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna remove a store item pic : ' + JSON.stringify(req.body));
    (async () => {
        try {
            const siquery = {"_id": s_id};
            const picquery = {"_id": p_id};
            const storeitem = await RunDataQuery("storeitems", "findOne", siquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);
            var storeItemPics = storeitem.storeItemPictureIDs;
            if (storeItemPics != null) {
            let index = storeItemPics.indexOf(picture._id.toString());
            if ( index != -1 ) {
                storeItemPics.splice(index, 1);
                const updoc = { $set: {storeItemPictureIDs: storeItemPics}};
                const updated = await RunDataQuery("storeitems", "updateOne", siquery, updoc);
                // db_old.storeitems.update({ "_id": s_id }, { $set: {storeItemPictureIDs: storeItemPics}});
               res.send("updated " + JSON.stringify(updated));
            } else {
                res.send("that picture is not assigned to this storeitem");
            }
            }
            
        } catch (e) {
            console.log("error adding pic from app!" +e);
            res.send("error adding pic from app!" +e);
        }
    })();
});


app.post('/add_storeitem_pic/', requiredAuthentication, function (req, res) {
    console.log('tryna add a store item pic : ' + JSON.stringify(req.body));
    var s_id = ObjectId.createFromHexString(req.body.storeitem_id.toString());   
    var p_id = ObjectId.createFromHexString(req.body.pic_id.toString());   

    (async () => {
        try {
            const siquery = {"_id": s_id};
            const picquery = {"_id": p_id};
            const storeitem = await RunDataQuery("storeitems", "findOne", siquery);
            const picture = await RunDataQuery("image_items", "findOne", picquery);
            var storeItemPics = storeitem.storeItemPictureIDs;
            if (storeItemPics == null) {
                storeItemPics = [];
            }
            if ( storeItemPics.indexOf(picture._id.toString()) == -1 ) {
                storeItemPics.push(picture._id.toString());
                const updoc = { $set: {"storeItemPictureIDs": storeItemPics}};
                const updated = await RunDataQuery("storeitems", "updateOne", siquery, updoc);
                res.send("updated " + JSON.stringify(updated));
                // db_old.storeitems.update({ "_id": s_id }, { $set: {storeItemPictureIDs: storeItemPics}});
                // if (err) {res.send(error)} else {res.send("updated " + new Date())}
            } else {
                res.send("that picture is already assigned to this storeitem");
            }
            
        } catch (e) {
            console.log("error adding pic from app!" +e);
            res.send("error adding pic from app!" +e);
        }
    })();
});


app.post('/add_storeitem_obj/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectId.createFromHexString(req.body.storeitem_id);   
    var p_id = ObjectId.createFromHexString(req.body.obj_id);   
    console.log('tryna add a storeitem obj : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const siquery = {"_id": s_id};
            const objquery = {"_id": p_id};
            // const storeitem = await RunDataQuery("storeitems", "findOne", siquery);
            const object = await RunDataQuery("obj_items", "findOne", objquery);
            const updoc = {$set: {"objectID": object._id, "objectName": object.name}};
            const updated = await RunDataQuery("storeitems", "updateOne", siquery, updoc);
            res.send("updated " + JSON.stringify(updated));
            
        } catch (e) {
            console.log("error adding obj to store item" +e);
            res.send("error adding obj to store item" +e);
        }
    })();
});


app.post('/update_scene_postcards/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    console.log('tryna update scene postcards : ' + JSON.stringify(req.body));

    (async () => {
      try {
        const scenequery = { "_id": s_id};
        const scene = await RunDataQuery("scenes", "findOne", scenequery);
        if (scene) {
       
            let scenePostcards = new Array();
            if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                scenePostcards = scene.scenePostcards;

                console.log("XXX scenePostcards: " + scenePostcards);

                for (let i = 0; i < scenePostcards.length; i++) {
                    var p_id = ObjectId.createFromHexString(scenePostcards[i]);   
                    const query = { "_id": p_id };
                    const pic = await RunDataQuery("image_items", "findOne", query);
                    if (pic) {
                        const ck = 'postcards/' + req.body.scene_id + '/'+ pic._id + ".standard." + pic.filename;
                        const targetBucket = process.env.PUBLIC_BUCKET_NAME; //postcard needs to be copiied to static route for sharing..
                        const copySource = process.env.ROOT_BUCKET_NAME + '/users/' + pic.userID +"/pictures/"+ pic._id + ".standard." + pic.filename;

                        const copystatus = await CopyObject(targetBucket, copySource, ck);
                        console.log("copying postcard ! " +copystatus);
                    } else {
                        console.log("postcard not found!");
                    }
                }
                res.send("updated postcards!") ;
            } else {
                res.send("scene has no postcardz!");
            }
        } else {
          res.send("scene not found!");
        }
      } catch (e) {
        res.send("error updating scene with postcard " + e);
      }
    })();
  
});

app.post('/add_scene_postcard/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var p_id = ObjectId.createFromHexString(req.body.pic_id);   
    console.log('tryna add a scene postcard : ' + JSON.stringify(req.body));

    (async () => {
      try {
        const scenequery = { "_id": s_id};
        const scene = await RunDataQuery("scenes", "findOne", scenequery);
        if (scene) {
          const picquery = { "_id": p_id};
          const pic = await RunDataQuery("image_items", "findOne", picquery);
          if (pic) {
            let scenePostcards = new Array();
            if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                scenePostcards = scene.scenePostcards;
            }
            console.log("XXX scenePostcards: " + scenePostcards);
            scenePostcards.push(req.body.pic_id);
            const upquery = { "_id": s_id };
            const updateDoc = {$set: {scenePostcards: scenePostcards}};
            const status = await RunDataQuery("scenes", "updateOne", upquery, updateDoc);
        

            const ck = 'postcards/' + req.body.scene_id + '/'+ pic._id + ".standard." + pic.filename;
            const targetBucket = process.env.PUBLIC_BUCKET_NAME; //postcard needs to be copiied to static route for sharing..
            const copySource = process.env.ROOT_BUCKET_NAME + '/users/' + pic.userID +"/pictures/"+ pic._id + ".standard." + pic.filename;

            const copystatus = await CopyObject(targetBucket, copySource, ck);

            res.send("updated: " + status + " copied " + copystatus) ;
          } else {
            res.send("postcard not found");
          }
        } else {
          res.send("scene not found!");
        }
      } catch (e) {
        res.send("error updating scene with postcard " + e);
      }
    })();
  
});



app.post('/add_scene_audio/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.scene_id);   
    var a_id = ObjectId.createFromHexString(req.body.audio_id);   
    console.log('tryna import scene audio : ' + JSON.stringify(req.body));

    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const audioquery = { "_id": a_id};
            // const scene = await RunDataQuery("scenes", "findOne", scenequery);
            const audio = await RunDataQuery("audio_items", "findOne", audioquery);
            if (req.body.audio_type === "trigger") {
                const updoc = { $set: {"sceneTriggerAudioID": audio._id.toString()}};
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated scene trigger audio" + JSON.stringify(updated));
            } else if (req.body.audio_type === "ambient") {
                
                const updoc = { $set: {"sceneAmbientAudioID": audio._id.toString()}};
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated scene ambient audio" + JSON.stringify(updated));
            } else if (req.body.audio_type === "primary") {
                const updoc = { $set: {"scenePrimaryAudioID": audio._id.toString()}};
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                console.log("updated scene primary audio" + JSON.stringify(updated));
            }
            res.send("updated");
        } catch (e) {
            console.log("error updating scene audio " + e);
          res.send("error updating scene audio " + e);
        }
    })();
});


app.post('/import_scene_audio_timed_events/', requiredAuthentication, function (req, res) {

    var s_id = ObjectId.createFromHexString(req.body.sceneID);   
    var a_id = ObjectId.createFromHexString(req.body.audioID);   
    console.log('tryna import scene audio timed e3vents : ' + req.body);

    (async () => {
        try {
            const scenequery = { "_id": s_id};
            const audioquery = { "_id": a_id};
            // const scene = await RunDataQuery("scenes", "findOne", scenequery);
            const audio = await RunDataQuery("audio_items", "findOne", audioquery);
            if (audio.timekeys != undefined && audio.timekeys != null && audio.timekeys.length) {
                let sceneTimedEvents = {};
                sceneTimedEvents.timekeys = audio.timekeys;
                const updoc = {$set: {"sceneTimedEvents": sceneTimedEvents}};
                const updated = await RunDataQuery("scenes", "updateOne", scenequery, updoc);
                res.send("updated " + JSON.stringify(updated));
            } else {
                res.send("no timekeys found for that audio item.");
            }   
        } catch (e) {
            console.log("error importing audio timekeys " + e);
          res.send("error importing audio timekeys " + e);
        }
    })();
});


app.get('/uscenes/:_id',  requiredAuthentication, usercheck, function (req, res) { //get scenes for this user
    console.log("tryna get user scenes: ",req.params._id);
    var o_id = ObjectId.createFromHexString(req.params._id);
    var scenesResponse = {};
    let query = {"user_id" : req.params._id};
    if (req.session.user.authLevel.toLowerCase().includes("domain")) { //domain admins can see everything
        query = {};
    }
    (async () => {
        try {
            const sort = { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, sceneDomain: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneWebGLOK: 1, sceneShareWithPublic: 1 };
            const scenes = await RunDataQuery("scenes","find",query,null,sort);
            res.send(scenes);
        } catch (e) {
            console.log("error getting user scenes " + e);
            res.send("error getting user scenes " + e);
        }
    })();
    
});

app.post('/uscenes/',  requiredAuthentication, usercheck, function (req, res) { //get scenes for app
    console.log("tryna get app scenes: ",req.params._id);
    (async () => {
        try {
            const query = { "sceneAppName" : req.body.appName};
            const sort = { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, sceneDomain: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneWebGLOK: 1, sceneShareWithPublic: 1 };
            const scenes = await RunDataQuery("scenes","find",query,null,sort);
            res.send(scenes);
        } catch (e) {
            console.log("error getting app scenes " + e);
            res.send("error getting app scenes " + e);
        }
    })();
});

app.post('/appscenes/',  requiredAuthentication, function (req, res) { //get scenes for app
    console.log("tryna get user scenes fer: " + req.body.sceneDomain);

    // var o_id = ObjectId.createFromHexString(req.params.appid);
    // var scenesResponse = {};

    (async () => {
        try {
            const query = { "sceneDomain" : req.body.sceneDomain};
            const sort = { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, sceneDomain: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneWebGLOK: 1, sceneShareWithPublic: 1 };
            const scenes = await RunDataQuery("scenes","find",query,null,sort);
            res.send(scenes);
        } catch (e) {
            console.log("error getting app scenes " + e);
            res.send("error getting app scenes " + e);
        }
    })();

 
});

app.get('/uscene/:user_id/:scene_id',  requiredAuthentication, uscene, function (req, res) { //scene view for editing/updating scene in admin mode for this user

    console.log("tryna get scene id: ", req.params.scene_id + " excaped " + entities.decodeHTML(req.params.scene_id));
    var reqstring = entities.decodeHTML(req.params.scene_id).toString().replace(":", "");//um,no
//    var sceneID = req.params.scene_id.toString().replace(":", "");
    var audioResponse = {};
    
    var pictureResponse = {};
    var postcardResponse = {};
    var objectResponse = {};
    let sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    // var requestedLocationItems = [];
    // sceneResponse.locations = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    sceneResponse.weblinx = [];
    sceneResponse.assets = [];

    (async () => {
        try {
            // const scenequery = {$or: [{ sceneTitle: reqstring },{ short_id : reqstring },{ _id : o_id}]}; //why the options?
            //get scene data
            const o_id = ObjectId.createFromHexString(req.params.scene_id);
            const scenequery = { "_id" : o_id};
            const sceneData = await RunDataQuery("scenes", "findOne", scenequery);
            
            //this will be returned on a plate with all the trimmings...
            sceneResponse = sceneData;
            
            /////prep ungrouped pictures
            if (sceneData.scenePictures != undefined) { 
                if (sceneData.scenePictures.length > 0) {                              
                    sceneData.scenePictures.forEach(function (picture) {
                    var p_id = ObjectId.createFromHexString(picture); //convert to binary to search by _id beloiw
                    requestedPictureItems.push(p_id); //populate array
                    });
                }
            }
            // prep ungrouped audio
            var triggerOID = ObjectId.isValid(sceneData.sceneTriggerAudioID) ? ObjectId.createFromHexString(sceneData.sceneTriggerAudioID) : "";
            var ambientOID = ObjectId.isValid(sceneData.sceneAmbientAudioID) ? ObjectId.createFromHexString(sceneData.sceneAmbientAudioID) : "";
            var primaryOID = ObjectId.isValid(sceneData.scenePrimaryAudioID) ? ObjectId.createFromHexString(sceneData.scenePrimaryAudioID) : "";
            requestedAudioItems = [triggerOID, ambientOID, primaryOID];
            

            if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                let weblinx = [];
                for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                
                    if (ObjectId.isValid(sceneResponse.sceneWebLinks[i])) {
                        const query = {"_id": ObjectId.createFromHexString(sceneResponse.sceneWebLinks[i])};
                        const weblink = await RunDataQuery("weblinks", "findOne", query);
                        if (weblink) {
                            console.log(JSON.stringify(weblink));
                            let link = {};
                            const urlHalf = await ReturnPresignedUrl(process.env.WEBSCRAPE_BUCKET_NAME,weblink._id + "/" + weblink._id + ".half.jpg",6000);
                            const urlStandard = await ReturnPresignedUrl(process.env.WEBSCRAPE_BUCKET_NAME,weblink._id + "/" + weblink._id + ".standard.jpg",6000);
                            link.urlThumb = "";
                            link.urlHalf = urlHalf;
                            link.urlStandard = urlStandard;
                            link.link_url = weblink.link_url;
                            link.link_title = weblink.link_title;
                            link._id = weblink._id;
                            weblinx.push(link);
                        }
                    }
                }
                sceneResponse.weblinx = weblinx;
                console.log("uscene weblinx " + sceneResponse.weblinx);
            }
            if (sceneResponse.sceneVideos != null && sceneResponse.sceneVideos != undefined && sceneResponse.sceneVideos.length > 0) {
                const moids = sceneResponse.sceneVideos.map(convertStringToObjectID);
                const vidquery = {_id: {$in: moids }};
                let video_items = await RunDataQuery("video_items", "find", vidquery);
                for (let i = 0; i < video_items.length; i++) {
                    let item_string_filename = JSON.stringify(video_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    let item_string_filename_ext = getExtension(item_string_filename);
                    let expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    const urlVid = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + video_items[i].userID + "/video/" + video_items[i]._id + "/" + video_items[i]._id + "." + video_items[i].filename,6000 );
                    video_items[i].vUrl = urlVid;
                }
                sceneResponse.sceneVideoItems = video_items;
            }
            if (sceneResponse.sceneTextItems != null && sceneResponse.sceneTextItems != undefined && sceneResponse.sceneTextItems.length > 0) {
                const moids = sceneResponse.sceneTextItems.map(convertStringToObjectID);
                const textquery = {_id: {$in: moids }};
                const text_items = await RunDataQuery("text_items", "find", textquery);
                sceneResponse.textItems = text_items;
            }
            //groups (why not objects?)
            let allgroups = [];
            if (sceneResponse.sceneVideoGroups != null) {
                allgroups.push(...sceneResponse.sceneVideoGroups);
            };                
            if (sceneResponse.scenePictureGroups != null) {
                allgroups.push(...sceneResponse.scenePictureGroups);
            };
            if (sceneResponse.sceneAudioGroups != null) {
                allgroups.push(...sceneResponse.sceneAudioGroups);
            };
            if (sceneResponse.sceneLocationGroups != null) {
                allgroups.push(...sceneResponse.sceneLocationGroups);
            };
            if (allgroups.length > 0) {
                const moids = allgroups.map(convertStringToObjectID);
                const query = {"_id": {$in: moids }};
                const items = await RunDataQuery("groups", "find", query);
                if (items) {
                    sceneResponse.sceneGroups = items;
                }            
            }

            //get audio files
            const query = {"_id": {$in: requestedAudioItems }};
            let audio_items = await RunDataQuery("audio_items", "find", query);
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
                if (audio_items[i]) {
                    console.log("audioitem " + audio_items[i].userID);
                    const urlMp3 = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + mp3Name, 6000);
                    const urlOgg = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + oggName, 6000);
                    const urlPng = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_items[i].userID + "/audio/" + audio_items[i]._id + "." + pngName, 6000);
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                    if (audio_items[i].tags != null) {
                        if (audio_items[i].tags.length < 1) {
                            audio_items[i].tags = [""];
                        } else {
                            audio_items[i].tags = [""];
                        }
                    }
                }
            }
            audioResponse = audio_items;
            sceneResponse.audio = audioResponse;
            
            //get picture files
            console.log("pids " + JSON.stringify(requestedPictureItems));
            const pids = requestedPictureItems.map(convertStringToObjectID);
            
            const picquery = {"_id": { $in: requestedPictureItems }};
            let picture_items = await RunDataQuery("image_items", "find", picquery);

            for (var i = 0; i < picture_items.length; i++) {
                //    console.log("picture_item: ", picture_items[i]);
                var item_string_filename = JSON.stringify(picture_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 1000);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                //console.log(baseName);
                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                var halfName = 'half.' + baseName + item_string_filename_ext;
                var standardName = 'standard.' + baseName + item_string_filename_ext;
                var originalName = 'original.' + baseName + item_string_filename_ext;


                let urlTarget = "";
                const urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/" + picture_items[i]._id + "." + thumbName,6000);
                const urlQuarter = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/" + picture_items[i]._id + "." + quarterName,6000);
                const urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/" + picture_items[i]._id + "." + halfName,6000);
                const urlStandard = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/" + picture_items[i]._id + "." + standardName,6000);
                if (picture_items[i].useTarget) {
                    urlTarget = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/targets/" + picture_items[i]._id + ".mind",6000);
                }
                //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration); //whoa, ancient...
                picture_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                picture_items[i].urlQuarter = urlQuarter; //jack in teh signed urls into the object array
                picture_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array
                picture_items[i].urlStandard = urlStandard; //jack in teh signed urls into the object array
                picture_items[i].urlTarget = urlTarget;
                if (picture_items[i].orientation != null && picture_items[i].orientation.toLowerCase() == "equirectangular") { //add the big one for skyboxes
                    const urlOriginal = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + picture_items[i].userID + "/pictures/originals/" + picture_items[i]._id + "." + originalName,6000);
                    picture_items[i].urlOriginal = urlOriginal;
                }
                if (picture_items[i].hasAlphaChannel == null) {
                    picture_items[i].hasAlphaChannel = false
                }
                if (picture_items[i].tags != null && picture_items[i].tags.length < 1) {
                    picture_items.tags = [];
                }
            }
            pictureResponse = picture_items;
            // console.log("picture items " + JSON.stringify(pictureResponse));
            var postcardsResponse = [];
            if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                console.log("sceneResponse.scenePostcards " + sceneResponse.scenePostcards);
                const oids = sceneResponse.scenePostcards.map(convertStringToObjectID);
                const pcquery = {"_id": { $in: oids }};
                const postcard_items = await RunDataQuery("image_items", "find", pcquery);
                if (postcard_items && postcard_items.length) {
                    for (let i = 0; i < postcard_items.length; i++) {
                        const urlThumb = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + postcard_items[i].userID + "/pictures/" + postcard_items[i]._id + ".thumb." + postcard_items[i].filename,6000);
                        const urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + postcard_items[i].userID + "/pictures/" + postcard_items[i]._id + ".half." + postcard_items[i].filename,6000);
                        const urlStandard = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + postcard_items[i].userID + "/pictures/" + postcard_items[i]._id + ".standard." + postcard_items[i].filename,6000);
                        var postcard = {};
                        postcard.userID = postcard_items[i].userID;
                        postcard._id = postcard_items[i]._id;
                        postcard.sceneID = postcard_items[i].postcardForScene;
                        postcard.urlThumb = urlThumb;
                        postcard.urlHalf = urlHalf;
                        postcard.urlStandard = urlStandard;
                        // if (postcardsResponse.length < 9) {
                            postcardsResponse.push(postcard);
                        // }
                    } 
                }
            }
            sceneResponse.audio = audioResponse;
            sceneResponse.pictures = pictureResponse;
            sceneResponse.postcards = postcardsResponse;
            
            ///models
            if (sceneResponse.sceneModels && sceneResponse.sceneModels.length) {
                
                const oids = sceneResponse.sceneModels.map(convertStringToObjectID);
                const query = {"_id": { $in: oids }};
                const models = await RunDataQuery("models", "find", query); //how to show missing?  
                sceneResponse.sceneModelz = models;
               
            }
            //objects
            if (sceneResponse.sceneObjects && sceneResponse.sceneObjects.length) {
                
                const oids = sceneResponse.sceneObjects.map(convertStringToObjectID);
                const query = {"_id": { $in: oids }};
                const objeks = await RunDataQuery("obj_items", "find", query);
                // console.log("objeks:" + JSON.stringify(objeks));
                sceneResponse.sceneObjex = objeks;
            }
            ////object group
            if (sceneResponse.sceneObjectGroups != null) {
                const oids = sceneResponse.sceneObjectGroups.map(convertStringToObjectID);
                const query = {"_id": { $in: oids }};
                const ogroups = await RunDataQuery("groups", "find", query);
                if (ogroups && ogroups.length) {
                    sceneResponse.sceneObjexGroups = ogroups; //hrm
                }
            }
            // console.log("scenerepsoonse " + JSON.stringify(sceneResponse) );
            res.json(sceneResponse);
        } catch (e) {
            console.log("error getting scenedata " + e);
            res.send("error getting scenedata " + e);
        }

    })();
});


app.get('/available_domain_scenes/:domain',  function (req, res) { //public scenes for this app's domain name, used by public websites
    let availableScenesResponse = {};
    let availableScenes = [];
   
    availableScenesResponse.availableScenes = availableScenes;
    let query = {};
    if (req.params.domain == "servicemedia.net") { //show all public scenes for servicemedia
        query = {sceneShareWithPublic: true};
    } else {
        query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }]};
    }
   
        console.log("available scene query: "+ JSON.stringify(query));

        (async () => {
            try {
                const scenes = await RunDataQuery("scenes", "find", query);
                for (const scene of scenes) {
                    let availableScene = {};
                    // console.log("scene " + JSON.stringify(scene));
                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { 
                        // console.log("no postcard found for this scene : " + scene.short_id);
                        const postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                        var oo_id = ObjectId.createFromHexString(scene.scenePostcards[postcardIndex]);
                        const postcardquery = {"_id": oo_id};
                        const picture_item = await RunDataQuery("image_items", "findOne", postcardquery);
                        if (picture_item) {
                            var item_string_filename = JSON.stringify(picture_item.filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 30);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                            // var standardName = 'standard.' + baseName + item_string_filename_ext;
                            var halfName = 'half.' + baseName + item_string_filename_ext;
                            var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                            var originalName = 'original.' + baseName + item_string_filename_ext;
                            const urlOrig = "";
                            const urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000);
                            const urlQuarter = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000);
                            availableScene = {
                                sceneTitle: scene.sceneTitle,
                                sceneKey: scene.short_id,
                                sceneType: scene.sceneType,
                                sceneWebType: scene.sceneWebType,
                                sceneAltURL: scene.sceneAltURL,
                                sceneLastUpdate: scene.sceneLastUpdate,
                                sceneDescription: scene.sceneDescription,
                                sceneKeynote: scene.sceneKeynote,
                                sceneCategory: scene.sceneCategory,
                                sceneSource: scene.sceneSource,
                                sceneTags: scene.sceneTags,
                                sceneWebGLOK: scene.sceneWebGLOK,
                                sceneAndroidOK: scene.sceneAndroidOK,
                                sceneIosOK: scene.sceneIosOK,
                                sceneWindowsOK: scene.sceneWindowsOK,
                                sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                sceneOwner: scene.userName,
                                scenePostcardQuarter: urlQuarter,
                                scenePostcardHalf: urlHalf,
                                scenePostcardOriginal: urlOrig
                            };
                            //nope, the domain pages don't use the audiolink...
                            // if (scene.scenePrimaryAudioID != null && scene.scenePrimaryAudioID != "" && scene.scenePrimaryAudioID.length > 8) {
                            //     var o_id = ObjectId.createFromHexString(scene.scenePrimaryAudioID );
                            //     const query = {"_id": o_id};
                            //     const audio_item = await RunDataQuery("audio_items", "findOne", query);
                            //     var item_string_filename = JSON.stringify(audio_item.filename);
                                
                            //     item_string_filename = item_string_filename.replace(/\"/g, "");
                            //     var item_string_filename_ext = getExtension(item_string_filename);
                            //     var expiration = new Date();
                            //     expiration.setMinutes(expiration.getMinutes() + 1000);
                            //     var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                
                            //     var mp3Name = baseName + '.mp3';
                                
                            //     const primaryAudioUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME,"users/" + audio_item.userID + "/audio/" + audio_item._id + "." + mp3Name,6000);
                            //     availableScene.primaryAudioUrl = primaryAudioUrl;
                            // }
                            availableScenesResponse.availableScenes.push(availableScene);
                        }
                    } else {
                        console.log("availahle scene needs a postcard ! " + scene.short_id);
                    }
                }
                availableScenesResponse.availableScenes.sort(function(a, b) {
                    return b.sceneLastUpdate - a.sceneLastUpdate;
                });
                res.send(availableScenesResponse);
            } catch (e) {
                console.log("error getting domains scenes " +e);
                res.send("error getting domains scenes " +e);
            }
        })();
    });

app.get('/available_domain_scenes/:domain/:user_id/:platform_id',  requiredAuthentication, function (req, res) { //called from Unity ? public scenes for this app's domain name, w/ platform filter //TODO authenticate, check acl

    var availableScenesResponse = {};
    var availableScenes = [];
    var availableScene = {};
    var query = {};
    availableScenesResponse.availableScenes = availableScenes;
    var userStatus = "nilch";
    console.log("tryna get unity domains scenes " + JSON.stringify(req.params));
    (async () => {
        try {
            // if (req.params.user_id == "nilch" || req.params.user_id == "guest" && req.params.user_id == "") {
            //     return null;
            // }
            // const oo_id = ObjectId.createFromHexString(req.params.user_id.toString());
            // const userquery = {"_id": oo_id}; 
            // const user = await RunDataQuery("users", "findOne", userquery);
            // console.log("gotsa user " + user._id + " authLevel " + user.authLevel + " status " + user.status);
            // if (user.authLevel != null && user.authLevel != undefined &&  user.status == "validated") {
            // userStatus = "subscriber";
            // console.log("gotsa subscriber!");
            // }
            var platformString = "";
            if (req.params.platform_id == "1") {
                platformString = "sceneWindowsOK";
            } else if (req.params.platform_id == "2") {
                platformString = "sceneAndroidOK";
            } else if (req.params.platform_id == "3") {
                platformString = "sceneIosOK";
            } else if (req.params.platform_id == "4") {
                platformString = "sceneWebGLOK";
            }
            if (req.params.domain == "servicemedia.net") { //guest query?  show all public scenes for servicemedia
                query = {$and: [{ [platformString]: true}, {sceneShareWithPublic: true }, {sceneStickyness: { $lt: 4 }}]};
            } else {
                query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }, { [platformString]: true}]};
            }
            // if (userStatus == "subscriber") { //not public
            //     if (req.params.domain == "servicemedia.net") {
            //         query = {$and: [{ [platformString]: true}, {$or: [{ "user_id": req.params.user_id}, {sceneShareWithSubscribers: true }, {sceneShareWithPublic: true }]}]};
            //     } else {
            //         query = {$and: [{ [platformString]: true}, { "sceneDomain": req.params.domain}, {$or: [{ "user_id": req.params.user_id}, {sceneShareWithSubscribers: true }, {sceneShareWithPublic: true }]}]};
            //     }
            // }
            // console.log("scene query : " + JSON.stringify(query));
            const scenes = await RunDataQuery("scenes", "find", query);
            // console.log("scenes: " + JSON.stringify(scenes));
            for (let scene of scenes) {
                if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                    const postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                    const pc_id = ObjectId.createFromHexString(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                    // db_old.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                    const picquery = {"_id": pc_id};
                    const picture_item = await RunDataQuery("image_items", "findOne", picquery);
                            
                    var item_string_filename = JSON.stringify(picture_item.filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                    // var standardName = 'standard.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                    // var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                    // var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
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
                        sceneWebGLOK: scene.sceneWebGLOK,
                        sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                        sceneOwner: scene.userName ? "" : scene.userName,
                        scenePostcardQuarter: urlQuarter,
                        scenePostcardHalf: urlHalf
                    };
                    if (scene.scenePrimaryAudioID != null && ObjectId.isValid(scene.scenePrimaryAudioID)) {
                        var a_id = ObjectId.createFromHexString(scene.scenePrimaryAudioID);
                        const audioquery = {_id: a_id};
                        const audio_item = await RunDataQuery("audio_items", "findOne", audioquery);
                        var item_string_filename = JSON.stringify(audio_item.filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 1000);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        var mp3Name = baseName + '.mp3';
                        var primaryAudioUrl = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, 10000);
                        availableScene.primaryAudioUrl = primaryAudioUrl;
                        availableScenesResponse.availableScenes.push(availableScene);
                        
                    } else {
                        availableScenesResponse.availableScenes.push(availableScene);
                    }                        
                }
            
            }  
            availableScenesResponse.availableScenes.sort(function(a, b) {
                return b.sceneLastUpdate - a.sceneLastUpdate;
            });
            // console.log("availablescenes " + JSON.stringify(availableScenesResponse));
            res.send(availableScenesResponse);          
        } catch (e) {
            console.log('error getting available domains scenes ' + e);
            res.send('error getting available domains scenes ' + e);
        }
    })();
});


app.get('/publicscenes', async (req, res) => { //works to put async in the route like so
  console.log("host is " + req.get('host'));

  var availableScenesResponse = {};
  var availableScenes = [];
  availableScenesResponse.availableScenes = availableScenes;

  const shuffleArray = ([...arr]) => {
      let m = arr.length;
      while (m) {
        const i = Math.floor(Math.random() * m--);
        [arr[m], arr[i]] = [arr[i], arr[m]];
      }
      return arr;
    };
    const sampleScenes = ([...arr], n = 1) => shuffleArray(arr).slice(0, n);

    const query = {$and: [{sceneShareWithPublic: true}, {sceneStickyness: {$lt: 4}}]};
    // const data = await db.collection("scenes").find({$and: [{sceneShareWithPublic: true}, {sceneStickyness: {$lt: 4}}]}).toArray();
    const data = await RunDataQuery ("scenes","find",query);
    
    const scenes = sampleScenes(data,30);
    console.log("gots public scenes" + scenes.length );
    for (const scene of scenes) { 
      if (scene.scenePostcards != null && scene.scenePostcards.length > 0 && scene.scenePostcards[0] != undefined) {
        
        try {
          let postcardIndex = getRandomInt(0, scene.scenePostcards.length - 1);
          var oo_id = ObjectId.createFromHexString(scene.scenePostcards[postcardIndex]); //? still confused w/ mongojs driver?
          const query = {"_id": oo_id};
          const picture_item = await RunDataQuery("image_items", "findOne" , query); //TODO make this one call!!!!!

          var item_string_filename = JSON.stringify(picture_item.filename);
          item_string_filename = item_string_filename.replace(/\"/g, "");
          var item_string_filename_ext = getExtension(item_string_filename);
          var expiration = new Date();
          expiration.setMinutes(expiration.getMinutes() + 30);
          var baseName = path.basename(item_string_filename, (item_string_filename_ext));
          var halfName = 'half.' + baseName + item_string_filename_ext;
        //   var quarterName = 'quarter.' + baseName + item_string_filename_ext;
          var urlHalf = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + halfName, 6000);
        //   var urlQuarter = await ReturnPresignedUrl(process.env.ROOT_BUCKET_NAME, "users/" + picture_item.userID + "/pictures/" + picture_item._id + "." + quarterName, 6000);
          // console.log("tyryna get mibno urls... " + urlHalf);
          var tempOwnerName = "test"
          var availableScene = {
              sceneWindowsOK: scene.sceneWindowsOK,
              sceneAndroidOK: scene.sceneAndroidOK,
              sceneIosOK: scene.sceneIosOK,
              sceneDomain: scene.sceneDomain,
              sceneTitle: scene.sceneTitle,
              sceneKey: scene.short_id,
              sceneDescription: scene.sceneDescription,
              sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
              sceneOwner: tempOwnerName,
              scenePostcardHalf: urlHalf
            //   scenePostcardQuarter: urlQuarter
          };
          availableScenesResponse.availableScenes.push(availableScene);
          // console.log("pushing available scene " + availableScene.sceneTitle);
        } catch (e) {
          // res.send(e);
          console.log("public scenes error: "+ e);
        }
    }
  }
//   console.log("availableScenesRsponse " + JSON.stringify(availableScenesResponse));
  res.send(availableScenesResponse); 

});

app.post('/newlocation', requiredAuthentication, function (req, res) {

    var location = req.body;
    location.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    location.lastUpdate = timestamp;

    (async () => {
        try {
            const saved = await RunDataQuery("locations", "insertOne", location); 
            console.log("new location " + saved.insertedId);
            res.send("created new location " + saved.insertedId);
        } catch (e) {
            console.log("error creating new location " + e);
            res.send("error creaating new location " + e);
        }
    })();
});

app.get('/userlocations/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return userlocations for: ' + req.params.u_id);

    (async () => {
        try {
            const query = {"userID": req.params.u_id};
            const locations = await RunDataQuery("locations", "find", query);
            res.send(locations);
        } catch (e) {
            console.log('error getting userlocations ' + e);
            res.send('error getting userlocations ' + e);
        }
    })();
});


app.post('/delete_location/',  requiredAuthentication, function (req, res) { //weird, post + path
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectId.createFromHexString(req.body._id);
    (async () => {
        try {
            const query = {"_id":  o_id};
            const deleted = await RunDataQuery("locations", "deleteOne", query);
            console.log("deleted location " + JSON.stringify(deleted));
            res.send("deleted location " + JSON.stringify(deleted));
        } catch (e) {
            console.log('error deleted location ' + e);
            res.send('error deleted location' + e);
        }
    })();
});

app.get('/userlocation/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return location : ' + req.params.p_id);
    var pID = req.params.p_id;
    if (pID != undefined && pID.length > 10) {
        var o_id = ObjectId.createFromHexString(pID);
        
        (async () => {
            try {
                const query = {"_id":  o_id};
                const location = await RunDataQuery("locations", "findOne", query);
                res.json(location);
            } catch (e) {
                console.log('error gettiong  userlocation ' + e);
                res.send('error getting userlocation' + e);
            }
        })();

    } else {
        res.send("not a valid location ID!");
    }
});

app.post('/update_location/:_id', requiredAuthentication, function (req, res) {
    console.log("tryna update_location " + JSON.stringify(req.body));
   
    console.log('location requested : ' + req.body._id);
    (async () => {
        try {
            const o_id = ObjectId.createFromHexString(req.body._id);   
            const query = { "_id" : o_id};
            let location = await RunDataQuery("locations", "findOne", query);
            console.log("tryna update location " + req.body._id);
            const timestamp = Math.round(Date.now() / 1000);
            location.lastUpdate = timestamp;
            if (location.type.toLowerCase() == "geographic") {
                const gupdoc = {$set: {
                    tags: req.body.tags,
                    name: req.body.name,
                    description: req.body.description,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    lastUpdate: timestamp
                }};
                // console.log("gupdoc " + JSON.stringify(gupdoc));
                // const o_id = ObjectId.createFromHexString(req.body._id); 
                const lquery = {"_id" : o_id};
                const updated = await RunDataQuery("locations", "updateOne", lquery, gupdoc);
                res.send("updated " + JSON.stringify(updated));
            } else if (location.type.toLowerCase() == "worldspace") {
                const wupdoc = { $set: {
                    tags: req.body.tags,
                    name: req.body.name,
                    description: req.body.description,
                    x: req.body.x,
                    y: req.body.y,
                    z: req.body.z,
                    lastUpdate: timestamp
                }};
                // console.log("gupdoc " + JSON.stringify(wupdoc));
                // const o_id = ObjectId.createFromHexString(req.body._id); 
                const wquery = {"_id" : o_id};
                const updated = await RunDataQuery("locations", "updateOne", wquery, wupdoc);
                res.send("updated " + JSON.stringify(updated));
            } 
        } catch (e) {
            console.log("error updating location " + e);
            res.send("error updating location " + e);
        }
    })();
});

app.post('/newscene', requiredAuthentication, admin, function (req, res) {
    console.log(req.body);

    (async () => {
        try {
        const newShortID = shortid.generate(); //um, collisions?
        const updoc = {    
            "sceneTitle": req.body.title,
            "user_id": req.session.user._id.toString(),
            "userName": req.session.user.userName,
            "otimestamp": Math.round(Date.now() / 1000),
            "sceneLocations": [],
            "short_id": newShortID
        };
        const newscene =  await RunDataQuery("scenes", "insertOne", updoc);
        res.send("new scene created! " + JSON.stringify(newscene));
        } catch (e) {
            console.log('error creating new scene ' + e);
            res.send('error creating new scene ' + e);
        }
    })();
});


app.post('/newgroup', requiredAuthentication, function (req, res) {

    var group = req.body;
    console.log("new group data " + JSON.stringify(req.body));
    group.userID = req.session.user._id.toString();
    group.userName = req.session.user.username;
    var timestamp = Math.round(Date.now() / 1000);
    group.lastUpdate = timestamp;
    let items = [];
    group.items = items;
    (async () => {
        try {

            const saved = await RunDataQuery("groups", "insertOne", group);
            res.send(saved.insertedId);
        } catch (e) {
            console.log("error creating new group " + e);
            res.send("error creating new group "+ e);
        }
    })();
    
});

app.post('/delete_group/', requiredAuthentication, function (req, res) { 
    var o_id = ObjectId.createFromHexString(req.body._id);
    (async () => {
        try {
            const query = {"_id": o_id};
            const deleted = await RunDataQuery("groups", "deleteOne", query);
            res.send("deleted group " + JSON.stringify(deleted));
        } catch (e) {
            console.log("error deleteing group " + e);
            res.send("error deleting group "+ e);
        }
    })();
    // db_old.groups.remove( { "_id" : o_id }, 1 );
    // res.send("delback");
});

app.post('/clone_group/', requiredAuthentication, function (req, res) { 
    console.log("tryna clone group : " + req.body._id);
    var o_id = ObjectId.createFromHexString(req.body._id);

    (async () => {
        try {
            const query = { "_id" : o_id};
            const group = await RunDataQuery("groups", "findOne", query);
            let clonedgroup = {};
            // clonedgroup._id = new ObjectId.createFromHexString(); //better way
            clonedgroup.type = group.type;
            clonedgroup.userID = req.session.user._id.toString();
            clonedgroup.userName = req.session.user.username;
            clonedgroup.name = group.name + " clone";
            var timestamp = Math.round(Date.now() / 1000);
            clonedgroup.groupdata = group.groupdata;
            clonedgroup.items = group.items;
            clonedgroup.lastUpdate = timestamp;
            console.log("new group data " + JSON.stringify(clonedgroup));
            const newgroup = await RunDataQuery("groups", "insertOne", clonedgroup);
            console.log("cloned group created " + newgroup.insertedId);
            res.send("group cloned! " + newgroup.insertedId);
        } catch (e) {
            console.log("error cloning group " + e);
            res.send("error cloning group " + e);
            
        }
    })();
});


///  TODO later, with cleanup options
// app.post('/delete_scene/:_id', checkAppID, requiredAuthentication, function (req, res) { 
//     console.log("tryna delete key: " + req.body._id);
//     var o_id = ObjectId.createFromHexString(req.body._id);
//     db.scenes.remove( { "_id" : o_id }, 1 );
//     res.send("deleted");
// });

app.post('/update_weblink/', requiredAuthentication, function (req, res) { //refresh the websrape
                
    var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
    const options = {
        headers: {'X-Access-Token': token}
      };
    const data = {
        "_id" : req.body.sceneID
    };
    axios.post(process.env.GS_HOST + "/scrapeweb/", data, options) //it does a validation lookup over there
    .then((response) => {
      console.log("scrapeweb response: " + response.data);
      res.send("ok");
    })
    .catch(function (error) {
        res.send(error);
    })
    // var dateNow = Date.now();
    // db.weblinks.update({"_id": ObjectId.createFromHexString(req.body.sceneID)}, { $set: {"render_date": dateNow}});
    
});

app.post('/scrape_weblink/', requiredAuthentication, function (req, res) {
    console.log("req.header: " + req.headers);
    console.log("checkin weblink: " + req.body.link_url + " for scene " + req.body.sceneID);
    var lurl = "";
    lurl = req.body.link_url;
    (async () => {
        try {
            const query = {"link_url" : lurl};
            const link = await RunDataQuery("weblinks", "findOne", query);
            if (link) {  //update existing link if it already exists in db
                console.log(" link item found for " + lurl);
                var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
                const options = {
                    headers: {'X-Access-Token': token}
                };
                const data = {
                    "_id" : link._id
                };
                axios.post(process.env.GS_HOST + "/scrapeweb/", data, options)
                .then((response) => {
                  console.log(response.data);
                  
                })
                .catch(function (error) {
                    res.end(error);
                });
                const scenequery = {'_id': ObjectId.createFromHexString(req.body.sceneID)};
                const sceneupdoc = {$addToSet: { 'sceneWebLinks': link._id.toString()}};
                const sceneupdate = await RunDataQuery("scenes", "updateOne", scenequery, sceneupdoc);
                const dateNow = Date.now();
                const upquery = {"_id": link._id};
                const updoc = { $set: {"render_date": dateNow, "link_title": req.body.link_title}};
                const updatedweblink = await RunDataQuery("weblinks", "updateOne", upquery, updoc);
                res.send("ok");
            } else {
                const savedLink = await RunDataQuery("weblinks", "insertOne", req.body); //insert record if it doesn't exist yet
                console.log(" link item found for " + lurl);
                var token=jwt.sign({userId:req.session.user._id},process.env.JWT_SECRET);
                const options = {
                    headers: {'X-Access-Token': token}
                };
                const data = {
                    "_id" : savedLink._id
                };
                axios.post(process.env.GS_HOST + "/scrapeweb/", data, options)
                .then((response) => {
                  console.log(response.data);
                  
                })
                .catch(function (error) {
                    res.end(error);
                });
                const scenequery = {'_id': ObjectId.createFromHexString(req.body.sceneID)};
                const sceneupdoc = {$addToSet: { 'sceneWebLinks': link._id.toString()}};
                const sceneupdate = await RunDataQuery("scenes", "updateOne", scenequery, sceneupdoc);
                const dateNow = Date.now();
                const upquery = {"_id": savedLink._id};
                const updoc = { $set: {"render_date": Date.now()}};
                const updatedweblink = await RunDataQuery("weblinks", "updateOne", upquery, updoc);
                res.send("ok");
            }
        } catch (e) {
            console.log('error scraping weblink ' +e);
            res.send('error scraping weblink ' +e);

        }
    })();
});

app.post('/clone_scene', requiredAuthentication, function (req,res) {

    console.log("request to clone scene " + JSON.stringify(req.body));
    // res.send("clone, ok!");
    var o_id = ObjectId.createFromHexString(req.body.sceneID);   
    // console.log('path requested : ' + req.body._id);
    (async () => {
        try {
            const query = { "_id" : o_id};
            const scene = await RunDataQuery("scenes", "findOne", query);
            let title = scene.sceneTitle + " clone";
            const newShortID = shortid.generate(); //TODO - externalize and check for collisions!
            const updoc = {
                short_id : newShortID,
                sceneTitle : title,
                user_id : req.session.user._id.toString(),
                userName : req.session.user.userName,
                otimestamp : Math.round(Date.now() / 1000),
                clonedFromID : scene.short_id,
                sceneDomain : scene.sceneDomain,
                sceneAppName : scene.sceneAppName,
                sceneSource : scene.sceneSource,
                sceneAltURL : scene.sceneAltURL != null ? scene.sceneAltURL : "",
                sceneStickyness : parseInt(scene.sceneStickyness) != null ? parseInt(scene.sceneStickyness) : 5,
                sceneNumber : scene.sceneNumber,
                sceneTags : scene.sceneTags,
                sceneYouTubeIDs : (scene.sceneYouTubeIDs != null && scene.sceneYouTubeIDs != undefined) ? scene.sceneYouTubeIDs : [],
                sceneVideoStreamUrls : (scene.sceneVideoStreamUrls != null && scene.sceneVideoStreamUrls != undefined) ? scene.sceneVideoStreamUrls : [],
                sceneLinks : scene.sceneLinks,
                scenePeopleGroupID : scene.scenePeopleGroupID,
                sceneLocationGroups : scene.sceneLocationGroups,
                sceneAudioGroups : scene.sceneAudioGroups,
                scenePictureGroups : scene.scenePictureGroups,
                sceneTextGroups : scene.sceneTextGroups,
                sceneVideoGroups : scene.sceneVideoGroups,
                sceneVideos : scene.sceneVideos,
                scenePlayer : scene.scenePlayer  != null ? scene.scenePlayer : "",
                sceneCategory : scene.sceneCategory != null ? scene.sceneCategory : "None",
                sceneType : (scene.sceneType != null && scene.sceneType.length > 2) ? scene.sceneType : "Default",
                sceneWebType : (scene.sceneWebType != null && scene.sceneWebType.length > 2) ? scene.sceneWebType : "Default",
                sceneCameraMode : scene.sceneCameraMode != null ? scene.sceneCameraMode : "First Person",
                sceneDebugMode : scene.sceneDebugMode != null ? scene.sceneDebugMode : "",
                sceneUseThreeDeeText : scene.sceneUseThreeDeeText != null ? scene.sceneUseThreeDeeText : false,
                sceneAndroidOK : scene.sceneAndroidOK != null ? scene.sceneAndroidOK : false,
                sceneIosOK : scene.sceneIosOK != null ? scene.sceneIosOK : false,
                sceneWindowsOK : scene.sceneWindowsOK != null ? scene.sceneWindowsOK : false,
                sceneLocationTracking : scene.sceneLocationTracking != null ? scene.sceneLocationTracking : false,
                sceneShowAds : scene.sceneShowAds != null ? scene.sceneShowAds : false,
                sceneShareWithPublic : false,
                sceneShareWithSubscribers : scene.sceneShareWithSubscribers != null ? scene.sceneShareWithSubscribers : false,
                sceneShareWithGroups : scene.sceneShareWithGroups != null ? scene.sceneShareWithGroups : "",
                sceneShareWithPeople : scene.sceneShareWithPeople != null ? scene.sceneShareWithPeople : "",
                sceneEventStart : scene.sceneEventStart != null ? scene.sceneEventStart : "",
                sceneEventEnd : scene.sceneEventEnd != null ? scene.sceneEventEnd : "",
                sceneEnvironment : scene.sceneEnvironment != null ? scene.sceneEnvironment : {},
                sceneUseStaticObj : scene.sceneUseStaticObj != null ? scene.sceneUseStaticObj : false,
                sceneStaticObjUrl : scene.sceneStaticObjUrl != null ? scene.sceneStaticObjUrl : "",
                sceneStaticObjTextureUrl : scene.sceneStaticObjTextureUrl != null ? scene.sceneStaticObjTextureUrl : "",
                sceneRandomizeColors : scene.sceneRandomizeColors != null ? scene.sceneRandomizeColors : false,
                sceneTweakColors : scene.sceneTweakColors != null ? scene.sceneTweakColors : false,
                sceneColorizeSky : scene.sceneColorizeSky != null ? scene.sceneColorizeSky : false,
                sceneScatterMeshes : scene.sceneScatterMeshes != null ? scene.sceneScatterMeshes : false,
                sceneScatterMeshLayers : scene.sceneScatterMeshLayers != null ? scene.sceneScatterMeshLayers : {},
                sceneScatterObjectLayers : scene.sceneScatterObjectLayers != null ? scene.sceneScatterObjectLayers : {},
                sceneScatterObjects : scene.sceneScatterObjects != null ? scene.sceneScatterObjects : false,
                sceneScatterOffset : scene.sceneScatterOffset != null ? scene.sceneScatterOffset : "",
                sceneShowViewportMeshes : scene.sceneShowViewportMeshes != null ? scene.sceneShowViewportMeshes : false,
                sceneShowViewportObjects : scene.sceneShowViewportObjects != null ? scene.sceneShowViewportObjects : false,
                sceneViewportMeshLayers : scene.sceneViewportMeshLayers != null ? scene.sceneViewportMeshLayers : {},
                sceneViewportObjectLayers : scene.sceneViewportObjectLayers != null ? scene.sceneViewportObjectLayers : {},
                sceneTargetColliderType : scene.sceneTargetColliderType != null ? scene.sceneTargetColliderType : "none",
                sceneUseTargetObject : scene.sceneUseTargetObject != null ? scene.sceneUseTargetObject : false,
                sceneTargetRotateToPlayer : scene.sceneTargetRotateToPlayer != null ? scene.sceneTargetRotateToPlayer : false,
                sceneDetectHorizontalPlanes : scene.sceneDetectHorizontalPlanes != null ? scene.sceneDetectHorizontalPlanes : false,
                sceneDetectVerticalPlanes : scene.sceneDetectVerticalPlanes != null ? scene.sceneDetectVerticalPlanes : false,
                sceneCameraDepthOfField : scene.sceneCameraDepthOfField != null ? scene.sceneCameraDepthOfField : false,
                sceneFlyable : scene.sceneFlyable != null ? scene.sceneFlyable : false,
                sceneFaceTracking : scene.sceneFaceTracking != null ? scene.sceneFaceTracking : false,
                sceneTargetObjectHeading : scene.sceneTargetObjectHeading != null ? scene.sceneTargetObjectHeading : 0,
                sceneTargetObject : scene.sceneTargetObject,
                sceneTargetEvent : scene.sceneTargetEvent,
                sceneTargetText : scene.sceneTargetText  != null ? scene.sceneTargetText : "",
                sceneNextScene : scene.sceneNextScene != null ? scene.sceneNextScene : "",
                scenePreviousScene : scene.scenePreviousScene,
                sceneUseDynamicSky : scene.sceneUseDynamicSky != null ? scene.sceneUseDynamicSky : false,
                sceneUseDynCubeMap : scene.sceneUseDynCubeMap != null ? scene.sceneUseDynCubeMap : false,
                sceneUseSkyParticles : scene.sceneUseSkyParticles != null ? scene.sceneUseSkyParticles : false,
                sceneSkyParticles : scene.sceneSkyParticles != null ? scene.sceneSkyParticles : "",
                sceneUseDynamicShadows : scene.sceneUseDynamicShadows != null ? scene.sceneUseDynamicShadows : false,
                sceneSkyRotationOffset : scene.sceneSkyRotationOffset != null ? scene.sceneSkyRotationOffset : 0,
                sceneUseCameraBackground : scene.sceneUseCameraBackground != null ? scene.sceneUseCameraBackground : false,
                sceneCameraOrientToPath : scene.sceneCameraOrientToPath  != null ? scene.sceneCameraOrientToPath : false,
                sceneCameraPath : scene.sceneCameraPath != null ? scene.sceneCameraPath : "Random",
                sceneUseSkybox : scene.sceneUseSkybox != null ? scene.sceneUseSkybox : false,
                sceneSkybox : scene.sceneSkybox,
                sceneUseDynCubeMap : scene.sceneUseDynCubeMap != null ? scene.sceneUseDynCubeMap : false,
                sceneUseSceneFog : scene.sceneUseSceneFog != null ? scene.sceneUseSceneFog : false,
                sceneUseGlobalFog : scene.sceneUseGlobalFog != null ? scene.sceneUseGlobalFog : false,
                sceneUseVolumetricFog : scene.sceneUseVolumetricFog != null ? scene.sceneUseVolumetricFog : false,
                sceneGlobalFogDensity : scene.sceneGlobalFogDensity != null ? scene.sceneGlobalFogDensity : .001,
                sceneUseSunShafts : scene.sceneUseSunShafts != null ? scene.sceneUseSunShafts : false,
                sceneUseFloorPlane : scene.sceneUseFloorPlane != null ? scene.sceneUseFloorPlane : false,
                sceneFloorplaneTexture : scene.sceneFloorplaneTexture != null ? scene.sceneFloorplaneTexture : "",
                sceneUseEnvironment : scene.sceneUseEnvironment != null ? scene.sceneUseEnvironment : false,
                sceneUseTerrain : scene.sceneUseTerrain != null ? scene.sceneUseTerrain : false,
                sceneUseHeightmap : scene.sceneUseHeightmap != null ? scene.sceneUseHeightmap : false,
                sceneHeightmap : scene.sceneHeightmap,
                sceneEnvironmentPreset : scene.sceneEnvironmentPreset != null ? scene.sceneEnvironmentPreset : "",
                sceneTime : scene.sceneTime,
                sceneTimeSpeed : scene.sceneTimeSpeed,
                sceneWeather : scene.sceneWeather,
                sceneClouds : scene.sceneClouds,
                sceneWater : scene.sceneWater,
                sceneGroundLevel : scene.sceneGroundLevel,
                sceneWindFactor  : scene.sceneWindFactor != null ?  scene.sceneWindFactor : 0,
                sceneSkyRadius  : scene.sceneSkyRadius != null ?  scene.sceneSkyRadius : 202,
                sceneLightningFactor  : scene.sceneLightningFactor != null ? scene.sceneLightningFactor : 0,
                sceneCharacters : scene.sceneCharacters,
                sceneEquipment : scene.sceneEquipment,
                sceneFlyingObjex : scene.sceneFlyingObjex,
                sceneSeason : scene.sceneSeason,
                scenePictures  : scene.scenePictures, //array of IDs only
                scenePostcards  : scene.scenePostcards, //array of IDs only
                sceneWebLinks  : scene.sceneWebLinks != null ? scene.sceneWebLinks : [], //custom object //no, make it an array of IDs
                sceneColor4  : scene.sceneColor4,
                sceneColor1  : scene.sceneColor1,
                sceneColor2  : scene.sceneColor2,
                sceneColor3  : scene.sceneColor3,
                sceneLocationRange  : scene.sceneLocationRange != null ? scene.sceneLocationRange : .1,
                sceneUseMap  : scene.sceneUseMap != null ? scene.sceneUseMap : false,
                sceneMapType  : scene.sceneMapType != null ? scene.sceneMapType : "none",
                sceneMapZoom  : scene.sceneMapZoom != null ? scene.sceneMapZoom : 16,
                sceneLatitude  : scene.sceneLatitude != null ? scene.sceneLatitude : "",
                sceneLongitude  : scene.sceneLongitude != null ? scene.sceneLongitude : "",
                 sceneUseStreetMap  : scene.sceneUseStreetMap  != null ? scene.sceneUseStreetMap : false,
                sceneUseSatelliteMap  : scene.sceneUseSatelliteMap  != null ? scene.sceneUseSatelliteMap : false,
                sceneUseHybridMap  : scene.sceneUseHybridMap  != null ? scene.sceneUseHybridMap : false,
                sceneEmulateGPS  : scene.sceneEmulateGPS  != null ? scene.sceneEmulateGPS : false,
                sceneLocations  : scene.sceneLocations,
                sceneTriggerAudioID  : scene.sceneTriggerAudioID,
                scenePrimaryAudioTitle  : scene.scenePrimaryAudioTitle,
                sceneAmbientAudioID  : scene.sceneAmbientAudioID,
                scenePrimaryAudioID  : scene.scenePrimaryAudioID,
                scenePrimaryAudioStreamURL  : scene.scenePrimaryAudioStreamURL,
                sceneAmbientAudioStreamURL  : scene.sceneAmbientAudioStreamURL,
                sceneTriggerAudioStreamURL  : scene.sceneTriggerAudioStreamURL,
                scenePrimaryAudioGroups  : scene.scenePrimaryAudioGroups,
                sceneAmbientAudioGroups  : scene.sceneAmbientAudioGroups,
                sceneTriggerAudioGroups  : scene.sceneTriggerAudioGroups,
                sceneBPM  : scene.sceneBPM != null ? scene.sceneBPM : "100",
                scenePrimaryPatch1  : scene.scenePrimaryPatch1,
                scenePrimaryPatch2  : scene.scenePrimaryPatch2,
                scenePrimaryMidiSequence1  : scene.scenePrimaryMidiSequence1,
                scenePrimarySequence2Transpose  : scene.scenePrimarySequence2Transpose != null ? scene.scenePrimarySequence2Transpose : "0",
                scenePrimarySequence1Transpose  : scene.scenePrimarySequence1Transpose != null ? scene.scenePrimarySequence1Transpose : "0",
                scenePrimaryMidiSequence2  : scene.scenePrimaryMidiSequence2,
                sceneAmbientVolume  : scene.sceneAmbientVolume,
                scenePrimaryVolume  : scene.scenePrimaryVolume,
                sceneTriggerVolume  : scene.sceneTriggerVolume,
                sceneWeatherAudioVolume  : scene.sceneWeatherAudioVolume,
                sceneMediaAudioVolume  : scene.sceneMediaAudioVolume,
                sceneAmbientSynth1Volume  : scene.sceneAmbientSynth1Volume,
                sceneAmbientSynth2Volume  : scene.sceneAmbientSynth2Volume,
                sceneTriggerSynth1Volume  : scene.sceneTriggerSynth1Volume,
                sceneAmbientPatch1  : scene.sceneAmbientPatch1,
                sceneAmbientPatch2  : scene.sceneAmbientPatch2,
                sceneAmbientSynth1ModulateByDistance  : scene.sceneAmbientSynth1ModulateByDistance != null ? scene.sceneAmbientSynth1ModulateByDistance : false,
                sceneAmbientSynth2ModulateByDistance  : scene.sceneAmbientSynth2ModulateByDistance != null ? scene.sceneAmbientSynth2ModulateByDistance : false,
                sceneAmbientSynth1ModulateByDistanceTarget  : scene.sceneAmbientSynth1ModulateByDistanceTarget != null ? scene.sceneAmbientSynth1ModulateByDistanceTarget: false,
                sceneAmbientSynth2ModulateByDistanceTarget  : scene.sceneAmbientSynth2ModulateByDistanceTarget != null ? scene.sceneAmbientSynth2ModulateByDistanceTarget : false,
                sceneAmbientMidiSequence1  : scene.sceneAmbientMidiSequence1,
                sceneAmbientMidiSequence2  : scene.sceneAmbientMidiSequence2,
                sceneAmbientSequence1Transpose  : scene.sceneAmbientSequence1Transpose != null ? scene.sceneAmbientSequence1Transpose : "0",
                sceneAmbientSequence2Transpose  : scene.sceneAmbientSequence2Transpose != null ? scene.sceneAmbientSequence2Transpose : "0",
                sceneTriggerPatch1  : scene.sceneTriggerPatch1,
                sceneTriggerPatch2  : scene.sceneTriggerPatch2,
                sceneTriggerPatch3  : scene.sceneTriggerPatch3,
                sceneGeneratePrimarySequences  : scene.sceneGeneratePrimarySequences != null ? scene.sceneGeneratePrimarySequences : false,
                sceneGenerateAmbientSequences  : scene.sceneGenerateAmbientSequences != null ? scene.sceneGenerateAmbientSequences : false,
                sceneGenerateTriggerSequences  : scene.sceneGenerateTriggerSequences != null ? scene.sceneGenerateTriggerSequences : false,
                sceneLoopPrimaryAudio  : scene.sceneLoopPrimaryAudio != null ? scene.sceneLoopPrimaryAudio : false,
                scenePrimaryAudioLoopCount  : scene.scenePrimaryAudioLoopCount != null ? scene.scenePrimaryAudioLoopCount : 0,
                sceneAutoplayPrimaryAudio  : scene.sceneAutoplayPrimaryAudio != null ? scene.sceneAutoplayPrimaryAudio : false,
                scenePrimaryAudioVisualizer  : scene.scenePrimaryAudioVisualizer != null ? scene.scenePrimaryAudioVisualizer : false,
                scenePrimaryAudioTriggerEvents  : scene.scenePrimaryAudioTriggerEvents != null ? scene.scenePrimaryAudioTriggerEvents : false,
                sceneAttachPrimaryAudioToTarget  : scene.sceneAttachPrimaryAudioToTarget != null ? scene.sceneAttachPrimaryAudioToTarget : false,
                sceneAutoplayAudioGroup  : scene.sceneAutoplayAudioGroup != null ? scene.sceneAutoplayAudioGroup : false,
                sceneLoopAllAudioGroup  : scene.sceneLoopAllAudioGroup != null ? scene.sceneLoopAllAudioGroup : false,
                sceneAnchorPositionAudioGroup  : scene.sceneAnchorPositionAudioGroup != null ? scene.sceneAnchorPositionAudioGroup : false,
                sceneAnchorCanvasAudioGroup  : scene.sceneAnchorCanvasAudioGroup != null ? scene.sceneAnchorCanvasAudioGroup : false,
                sceneCreateAudioSpline  : scene.sceneCreateAudioSpline != null ? scene.sceneCreateAudioSpline : false,
                sceneAttachAudioGroupToTarget  : scene.sceneAttachAudioGroupToTarget != null ? scene.sceneAttachAudioGroupToTarget : false,
                sceneUseMicrophoneInput  : scene.sceneUseMicrophoneInput != null ? scene.sceneUseMicrophoneInput : false,
                sceneKeynote  : scene.sceneKeynote,
                sceneDescription  : scene.sceneDescription,
                sceneStyleTheme: scene.sceneStyleTheme != null ? scene.sceneStyleTheme : "",
                sceneFontWeb1  : scene.sceneFontWeb1,
                sceneFontWeb2  : scene.sceneFontWeb2,
                sceneFont  : scene.sceneFont,
                sceneFontFillColor  : scene.sceneFontFillColor,
                sceneFontOutlineColor  : scene.sceneFontOutlineColor,
                sceneFontGlowColor  : scene.sceneFontGlowColor,
                sceneTextBackground  : scene.sceneTextBackground,
                sceneTextBackgroundColor  : scene.sceneTextBackgroundColor,
                sceneTextItems  : scene.sceneTextItems, //ids of text items
                sceneText  : scene.sceneText, //this is "primary" tex
                sceneTextLoop  : scene.sceneTextLoop != null ? scene.sceneTextLoop : false, //also for "primary" text below
                scenePrimaryTextFontSize  : scene.scenePrimaryTextFontSize != null ? scene.scenePrimaryTextFontSize : "12",
                scenePrimaryTextMode  : scene.scenePrimaryTextMode != null ? scene.scenePrimaryTextMode : "Normal",
                scenePrimaryTextAlign  : scene.scenePrimaryTextAlign != null ? scene.scenePrimaryTextAlign : "Left",
                sceneNetworking  : scene.sceneNetworking != null ? scene.sceneNetworking : "None",
                scenePrimaryTextRotate  : scene.scenePrimaryTextRotate != null ? scene.scenePrimaryTextRotate : false,
                scenePrimaryTextScaleByDistance  : scene.scenePrimaryTextScaleByDistance != null ? scene.scenePrimaryTextScaleByDistance : false,
                sceneTextAudioSync  : scene.sceneTextAudioSync != null ? scene.sceneTextAudioSync : false,
                sceneTextUseModals  : scene.sceneTextUseModals != null ? scene.sceneTextUseModals : true,
                sceneObjects : scene.sceneObjects,
                sceneModels : scene.sceneModels,
                sceneObjectGroups : scene.sceneObjectGroups,
                sceneLastUpdate : new Date()
                };
                const inserted = await RunDataQuery("scenes", "insertOne", updoc);
                console.log("cloned scene! " + JSON.stringify(inserted));
                let resp = {};
                // resp.item_id = item_id;
                resp.title = title;
                res.send(resp);

        } catch (e) {
            console.log("eerror cloning scene " + e);
            res.send("eerror cloning scene " + e);
        }
    })();
});


app.post('/update_scene/:_id', requiredAuthentication, function (req, res) {

    console.log("update_scene req.header: " + JSON.stringify(req.headers));
    console.log(req.params._id);
    var lastUpdateTimestamp = Date.now();
    var o_id = ObjectId.createFromHexString(req.body._id);   
    console.log('path requested : ' + req.body._id);
    
    (async () => {
      try {
        const query = { "_id" : o_id};
        const updoc = { $set: {
          sceneDomain : req.body.sceneDomain,
          sceneAppName : req.body.sceneAppName,
          sceneSource : req.body.sceneSource,
          sceneAltURL : req.body.sceneAltURL != null ? req.body.sceneAltURL : "",
          sceneStickyness : parseInt(req.body.sceneStickyness) != null ? parseInt(req.body.sceneStickyness) : 5,
          sceneNumber : req.body.sceneNumber,
          sceneTitle : req.body.sceneTitle,
          sceneTags : req.body.sceneTags,
          sceneYouTubeIDs : (req.body.sceneYouTubeIDs != null && req.body.sceneYouTubeIDs != undefined) ? req.body.sceneYouTubeIDs : [],
          sceneVideoStreamUrls : (req.body.sceneVideoStreamUrls != null && req.body.sceneVideoStreamUrls != undefined) ? req.body.sceneVideoStreamUrls : [],
          sceneLinks : req.body.sceneLinks,
          scenePeopleGroupID : req.body.scenePeopleGroupID,
          sceneLocationGroups : req.body.sceneLocationGroups,
          sceneAudioGroups : req.body.sceneAudioGroups,
          scenePictureGroups : req.body.scenePictureGroups,
          sceneTextGroups : req.body.sceneTextGroups,
          sceneVideoGroups : req.body.sceneVideoGroups,
          sceneVideos : req.body.sceneVideos,
          scenePlayer : req.body.scenePlayer  != null ? req.body.scenePlayer : "",
          sceneCategory : req.body.sceneCategory != null ? req.body.sceneCategory : "None",
          sceneType : (req.body.sceneType != null && req.body.sceneType.length > 2) ? req.body.sceneType : "Default",
          sceneWebType : (req.body.sceneWebType != null && req.body.sceneWebType.length > 2) ? req.body.sceneWebType : "Default",
          sceneCameraMode : req.body.sceneCameraMode != null ? req.body.sceneCameraMode : "First Person",
          sceneDebugMode : req.body.sceneDebugMode != null ? req.body.sceneDebugMode : "",
          sceneUseThreeDeeText : req.body.sceneUseThreeDeeText != null ? req.body.sceneUseThreeDeeText : false,
          sceneAndroidOK : req.body.sceneAndroidOK != null ? req.body.sceneAndroidOK : false,
          sceneIosOK : req.body.sceneIosOK != null ? req.body.sceneIosOK : false,
          sceneWindowsOK : req.body.sceneWindowsOK != null ? req.body.sceneWindowsOK : false,
          sceneWebGLOK : req.body.sceneWebGLOK != null ? req.body.sceneWebGLOK : false,
          sceneLocationTracking : req.body.sceneLocationTracking != null ? req.body.sceneLocationTracking : false,
          sceneShowAds : req.body.sceneShowAds != null ? req.body.sceneShowAds : false,
          sceneShareWithPublic : req.body.sceneShareWithPublic != null ? req.body.sceneShareWithPublic : false,
          sceneShareWithSubscribers : req.body.sceneShareWithSubscribers != null ? req.body.sceneShareWithSubscribers : false,
          sceneShareWithGroups : req.body.sceneShareWithGroups != null ? req.body.sceneShareWithGroups : "",
          sceneShareWithPeople : req.body.sceneShareWithPeople != null ? req.body.sceneShareWithPeople : "",
          sceneShareWithGroups : req.body.sceneShareWithGroups != null ? req.body.sceneShareWithGroups : "",
          sceneEventStart : req.body.sceneEventStart != null ? req.body.sceneEventStart : "",
          sceneEventEnd : req.body.sceneEventEnd != null ? req.body.sceneEventEnd : "",
          sceneAccessLinkExpire : req.body.sceneAccessLinkExpire != null ? req.body.sceneAccessLinkExpire : "",
          sceneShareWithMessage : req.body.sceneShareWithMessage != null ? req.body.sceneShareWithMessage : "",
          sceneEnvironment : req.body.sceneEnvironment != null ? req.body.sceneEnvironment : {},
          sceneUseStaticObj : req.body.sceneUseStaticObj != null ? req.body.sceneUseStaticObj : false,
          sceneStaticObjUrl : req.body.sceneStaticObjUrl != null ? req.body.sceneStaticObjUrl : "",
          sceneStaticObjTextureUrl : req.body.sceneStaticObjTextureUrl != null ? req.body.sceneStaticObjTextureUrl : "",
          sceneRandomizeColors : req.body.sceneRandomizeColors != null ? req.body.sceneRandomizeColors : false,
          sceneTweakColors : req.body.sceneTweakColors != null ? req.body.sceneTweakColors : false,
          sceneColorizeSky : req.body.sceneColorizeSky != null ? req.body.sceneColorizeSky : false,
          sceneScatterMeshes : req.body.sceneScatterMeshes != null ? req.body.sceneScatterMeshes : false,
          sceneScatterMeshLayers : req.body.sceneScatterMeshLayers != null ? req.body.sceneScatterMeshLayers : {},
          sceneScatterObjectLayers : req.body.sceneScatterObjectLayers != null ? req.body.sceneScatterObjectLayers : {},
          sceneScatterObjects : req.body.sceneScatterObjects != null ? req.body.sceneScatterObjects : false,
          sceneScatterOffset : req.body.sceneScatterOffset != null ? req.body.sceneScatterOffset : "",
          sceneShowViewportMeshes : req.body.sceneShowViewportMeshes != null ? req.body.sceneShowViewportMeshes : false,
          sceneShowViewportObjects : req.body.sceneShowViewportObjects != null ? req.body.sceneShowViewportObjects : false,
          sceneViewportMeshLayers : req.body.sceneViewportMeshLayers != null ? req.body.sceneViewportMeshLayers : {},
          sceneViewportObjectLayers : req.body.sceneViewportObjectLayers != null ? req.body.sceneViewportObjectLayers : {},
          sceneTargetColliderType : req.body.sceneTargetColliderType != null ? req.body.sceneTargetColliderType : "none",
          sceneUseTargetObject : req.body.sceneUseTargetObject != null ? req.body.sceneUseTargetObject : false,
          sceneTargetRotateToPlayer : req.body.sceneTargetRotateToPlayer != null ? req.body.sceneTargetRotateToPlayer : false,
          // sceneTargetRotateToPlayer : req.body.sceneTargetRotateToPlayer != null ? req.body.sceneTargetRotateToPlayer : false,
          sceneDetectHorizontalPlanes : req.body.sceneDetectHorizontalPlanes != null ? req.body.sceneDetectHorizontalPlanes : false,
          sceneDetectVerticalPlanes : req.body.sceneDetectVerticalPlanes != null ? req.body.sceneDetectVerticalPlanes : false,
          sceneCameraDepthOfField : req.body.sceneCameraDepthOfField != null ? req.body.sceneCameraDepthOfField : false,
          sceneFlyable : req.body.sceneFlyable != null ? req.body.sceneFlyable : false,
          sceneFaceTracking : req.body.sceneFaceTracking != null ? req.body.sceneFaceTracking : false,
          sceneTargetObjectHeading : req.body.sceneTargetObjectHeading != null ? req.body.sceneTargetObjectHeading : 0,
          sceneTargetObject : req.body.sceneTargetObject,
          sceneTargetEvent : req.body.sceneTargetEvent,
          sceneTargetText : req.body.sceneTargetText  != null ? req.body.sceneTargetText : "",
          sceneNextScene : req.body.sceneNextScene != null ? req.body.sceneNextScene : "",
          scenePreviousScene : req.body.scenePreviousScene,
          sceneUseDynamicSky : req.body.sceneUseDynamicSky != null ? req.body.sceneUseDynamicSky : false,
          sceneUseDynCubeMap : req.body.sceneUseDynCubeMap != null ? req.body.sceneUseDynCubeMap : false,
          sceneUseSkyParticles : req.body.sceneUseSkyParticles != null ? req.body.sceneUseSkyParticles : false,
          sceneSkyParticles : req.body.sceneSkyParticles != null ? req.body.sceneSkyParticles : "",
          sceneUseDynamicShadows : req.body.sceneUseDynamicShadows != null ? req.body.sceneUseDynamicShadows : false,
          sceneSkyRotationOffset : req.body.sceneSkyRotationOffset != null ? req.body.sceneSkyRotationOffset : 0,
          sceneUseCameraBackground : req.body.sceneUseCameraBackground != null ? req.body.sceneUseCameraBackground : false,
          sceneCameraOrientToPath : req.body.sceneCameraOrientToPath  != null ? req.body.sceneCameraOrientToPath : false,
          sceneCameraPath : req.body.sceneCameraPath != null ? req.body.sceneCameraPath : "Random",
          sceneUseSkybox : req.body.sceneUseSkybox != null ? req.body.sceneUseSkybox : false,
          sceneSkybox : req.body.sceneSkybox,
          sceneUseDynCubeMap : req.body.sceneUseDynCubeMap != null ? req.body.sceneUseDynCubeMap : false,
          sceneUseSceneFog : req.body.sceneUseSceneFog != null ? req.body.sceneUseSceneFog : false,
          sceneUseGlobalFog : req.body.sceneUseGlobalFog != null ? req.body.sceneUseGlobalFog : false,
          sceneUseVolumetricFog : req.body.sceneUseVolumetricFog != null ? req.body.sceneUseVolumetricFog : false,
          sceneGlobalFogDensity : req.body.sceneGlobalFogDensity != null ? req.body.sceneGlobalFogDensity : .001,
          sceneUseSunShafts : req.body.sceneUseSunShafts != null ? req.body.sceneUseSunShafts : false,
          // sceneRenderFloorPlane : req.body.sceneRenderFloorPlane != null ? req.body.sceneRenderFloorPlane : false,
          sceneUseFloorPlane : req.body.sceneUseFloorPlane != null ? req.body.sceneUseFloorPlane : false,
          sceneFloorplaneTexture : req.body.sceneFloorplaneTexture != null ? req.body.sceneFloorplaneTexture : "",
          sceneUseEnvironment : req.body.sceneUseEnvironment != null ? req.body.sceneUseEnvironment : false,
          sceneUseTerrain : req.body.sceneUseTerrain != null ? req.body.sceneUseTerrain : false,
          sceneUseHeightmap : req.body.sceneUseHeightmap != null ? req.body.sceneUseHeightmap : false,
          sceneHeightmap : req.body.sceneHeightmap,
          sceneEnvironmentPreset : req.body.sceneEnvironmentPreset != null ? req.body.sceneEnvironmentPreset : "",
          sceneTime: req.body.sceneTime,
          sceneTimeSpeed: req.body.sceneTimeSpeed,
          sceneWeather: req.body.sceneWeather,
          sceneClouds: req.body.sceneClouds,
          sceneWater: req.body.sceneWater,
          sceneGroundLevel: req.body.sceneGroundLevel,
          sceneWindFactor : req.body.sceneWindFactor != null ?  req.body.sceneWindFactor : 0,
          sceneSkyRadius  : req.body.sceneSkyRadius != null ?  req.body.sceneSkyRadius : 202,
          sceneLightningFactor : req.body.sceneLightningFactor != null ? req.body.sceneLightningFactor : 0,
          sceneCharacters: req.body.sceneCharacters,
          sceneEquipment: req.body.sceneEquipment,
          sceneFlyingObjex: req.body.sceneFlyingObjex,
          sceneSeason: req.body.sceneSeason,
          scenePictures : req.body.scenePictures, //array of IDs only
          scenePostcards : req.body.scenePostcards, //array of IDs only
          sceneWebLinks : req.body.sceneWebLinks != null ? req.body.sceneWebLinks : [], //custom object //no, make it an array of IDs
          sceneColor4 : req.body.sceneColor4,
          sceneColor1 : req.body.sceneColor1,
          sceneColor2 : req.body.sceneColor2,
          sceneColor3 : req.body.sceneColor3,
          sceneStyleTheme: req.body.sceneStyleTheme != null ? req.body.sceneStyleTheme : "",
          sceneColor4Alt : req.body.sceneColor4Alt,
          sceneColor1Alt : req.body.sceneColor1Alt,
          sceneColor2Alt : req.body.sceneColor2Alt,
          sceneColor3Alt : req.body.sceneColor3Alt,
          sceneLocationRange : req.body.sceneLocationRange != null ? req.body.sceneLocationRange : .1,
          sceneUseMap : req.body.sceneUseMap != null ? req.body.sceneUseMap : false,
          sceneMapType : req.body.sceneMapType != null ? req.body.sceneMapType : "none",
          sceneMapZoom : req.body.sceneMapZoom != null ? req.body.sceneMapZoom : 17,
          sceneLatitude : req.body.sceneLatitude != null ? req.body.sceneLatitude : "",
          sceneLongitude : req.body.sceneLongitude != null ? req.body.sceneLongitude : "",
          sceneUseStreetMap : req.body.sceneUseStreetMap  != null ? req.body.sceneUseStreetMap : false,
          sceneUseSatelliteMap : req.body.sceneUseSatelliteMap  != null ? req.body.sceneUseSatelliteMap : false,
          sceneUseHybridMap : req.body.sceneUseHybridMap  != null ? req.body.sceneUseHybridMap : false,
          sceneEmulateGPS : req.body.sceneEmulateGPS  != null ? req.body.sceneEmulateGPS : false,
          sceneLocations : req.body.sceneLocations,
          sceneTriggerAudioID : req.body.sceneTriggerAudioID,
          scenePrimaryAudioTitle : req.body.scenePrimaryAudioTitle,
          sceneAmbientAudioID : req.body.sceneAmbientAudioID,
          scenePrimaryAudioID : req.body.scenePrimaryAudioID,
          scenePrimaryAudioStreamURL : req.body.scenePrimaryAudioStreamURL,
          sceneAmbientAudioStreamURL : req.body.sceneAmbientAudioStreamURL,
          sceneTriggerAudioStreamURL : req.body.sceneTriggerAudioStreamURL,
          scenePrimaryAudioGroups : req.body.scenePrimaryAudioGroups,
          sceneAmbientAudioGroups : req.body.sceneAmbientAudioGroups,
          sceneTriggerAudioGroups : req.body.sceneTriggerAudioGroups,
          sceneBPM : req.body.sceneBPM != null ? req.body.sceneBPM : "100",
          scenePrimaryPatch1 : req.body.scenePrimaryPatch1,
          scenePrimaryPatch2 : req.body.scenePrimaryPatch2,
          scenePrimaryMidiSequence1 : req.body.scenePrimaryMidiSequence1,
          scenePrimarySequence2Transpose : req.body.scenePrimarySequence2Transpose != null ? req.body.scenePrimarySequence2Transpose : "0",
          scenePrimarySequence1Transpose : req.body.scenePrimarySequence1Transpose != null ? req.body.scenePrimarySequence1Transpose : "0",
          scenePrimaryMidiSequence2 : req.body.scenePrimaryMidiSequence2,
          sceneAmbientVolume : req.body.sceneAmbientVolume,
          scenePrimaryVolume : req.body.scenePrimaryVolume,
          sceneTriggerVolume : req.body.sceneTriggerVolume,
          sceneWeatherAudioVolume : req.body.sceneWeatherAudioVolume,
          sceneMediaAudioVolume : req.body.sceneMediaAudioVolume,
          sceneAmbientSynth1Volume : req.body.sceneAmbientSynth1Volume,
          sceneAmbientSynth2Volume : req.body.sceneAmbientSynth2Volume,
          sceneTriggerSynth1Volume : req.body.sceneTriggerSynth1Volume,
          sceneAmbientPatch1 : req.body.sceneAmbientPatch1,
          sceneAmbientPatch2 : req.body.sceneAmbientPatch2,
          sceneAmbientSynth1ModulateByDistance : req.body.sceneAmbientSynth1ModulateByDistance != null ? req.body.sceneAmbientSynth1ModulateByDistance : false,
          sceneAmbientSynth2ModulateByDistance : req.body.sceneAmbientSynth2ModulateByDistance != null ? req.body.sceneAmbientSynth2ModulateByDistance : false,
          sceneAmbientSynth1ModulateByDistanceTarget : req.body.sceneAmbientSynth1ModulateByDistanceTarget != null ? req.body.sceneAmbientSynth1ModulateByDistanceTarget: false,
          sceneAmbientSynth2ModulateByDistanceTarget : req.body.sceneAmbientSynth2ModulateByDistanceTarget != null ? req.body.sceneAmbientSynth2ModulateByDistanceTarget : false,
          sceneAmbientMidiSequence1 : req.body.sceneAmbientMidiSequence1,
          sceneAmbientMidiSequence2 : req.body.sceneAmbientMidiSequence2,
          sceneAmbientSequence1Transpose : req.body.sceneAmbientSequence1Transpose != null ? req.body.sceneAmbientSequence1Transpose : "0",
          sceneAmbientSequence2Transpose : req.body.sceneAmbientSequence2Transpose != null ? req.body.sceneAmbientSequence2Transpose : "0",
          sceneTriggerPatch1 : req.body.sceneTriggerPatch1,
          sceneTriggerPatch2 : req.body.sceneTriggerPatch2,
          sceneTriggerPatch3 : req.body.sceneTriggerPatch3,
          sceneGeneratePrimarySequences : req.body.sceneGeneratePrimarySequences != null ? req.body.sceneGeneratePrimarySequences : false,
          sceneGenerateAmbientSequences : req.body.sceneGenerateAmbientSequences != null ? req.body.sceneGenerateAmbientSequences : false,
          sceneGenerateTriggerSequences : req.body.sceneGenerateTriggerSequences != null ? req.body.sceneGenerateTriggerSequences : false,
          sceneLoopPrimaryAudio : req.body.sceneLoopPrimaryAudio != null ? req.body.sceneLoopPrimaryAudio : false,
          scenePrimaryAudioLoopCount : req.body.scenePrimaryAudioLoopCount != null ? req.body.scenePrimaryAudioLoopCount : 0,
          sceneAutoplayPrimaryAudio : req.body.sceneAutoplayPrimaryAudio != null ? req.body.sceneAutoplayPrimaryAudio : false,
          scenePrimaryAudioVisualizer : req.body.scenePrimaryAudioVisualizer != null ? req.body.scenePrimaryAudioVisualizer : false,
          scenePrimaryAudioTriggerEvents : req.body.scenePrimaryAudioTriggerEvents != null ? req.body.scenePrimaryAudioTriggerEvents : false,
          sceneAttachPrimaryAudioToTarget : req.body.sceneAttachPrimaryAudioToTarget != null ? req.body.sceneAttachPrimaryAudioToTarget : false,
          sceneAutoplayAudioGroup : req.body.sceneAutoplayAudioGroup != null ? req.body.sceneAutoplayAudioGroup : false,
          sceneLoopAllAudioGroup : req.body.sceneLoopAllAudioGroup != null ? req.body.sceneLoopAllAudioGroup : false,
          sceneAnchorPositionAudioGroup : req.body.sceneAnchorPositionAudioGroup != null ? req.body.sceneAnchorPositionAudioGroup : false,
          sceneAnchorCanvasAudioGroup : req.body.sceneAnchorCanvasAudioGroup != null ? req.body.sceneAnchorCanvasAudioGroup : false,
          sceneCreateAudioSpline : req.body.sceneCreateAudioSpline != null ? req.body.sceneCreateAudioSpline : false,
          sceneAttachAudioGroupToTarget : req.body.sceneAttachAudioGroupToTarget != null ? req.body.sceneAttachAudioGroupToTarget : false,
          sceneUseMicrophoneInput : req.body.sceneUseMicrophoneInput != null ? req.body.sceneUseMicrophoneInput : false,
          sceneKeynote : req.body.sceneKeynote,
          sceneDescription : req.body.sceneDescription,
          sceneGreeting : req.body.sceneGreeting,
          sceneQuest : req.body.sceneQuest,
          sceneFont : req.body.sceneFont,
          sceneFontWeb1  : req.body.sceneFontWeb1,
          sceneFontWeb2  : req.body.sceneFontWeb2,
          sceneFontFillColor : req.body.sceneFontFillColor,
          sceneFontOutlineColor : req.body.sceneFontOutlineColor,
          sceneFontGlowColor : req.body.sceneFontGlowColor,
          sceneTextBackground : req.body.sceneTextBackground,
          sceneTextBackgroundColor : req.body.sceneTextBackgroundColor,
          sceneTextItems : req.body.sceneTextItems, //ids of text items
          sceneText : req.body.sceneText, //this is "primary" tex
          sceneTextLoop : req.body.sceneTextLoop != null ? req.body.sceneTextLoop : false, //also for "primary" text below
          scenePrimaryTextFontSize : req.body.scenePrimaryTextFontSize != null ? req.body.scenePrimaryTextFontSize : "12",
          scenePrimaryTextMode : req.body.scenePrimaryTextMode != null ? req.body.scenePrimaryTextMode : "Normal",
          scenePrimaryTextAlign : req.body.scenePrimaryTextAlign != null ? req.body.scenePrimaryTextAlign : "Left",
          sceneNetworking : req.body.sceneNetworking != null ? req.body.sceneNetworking : "None",
          scenePrimaryTextRotate : req.body.scenePrimaryTextRotate != null ? req.body.scenePrimaryTextRotate : false,
          scenePrimaryTextScaleByDistance : req.body.scenePrimaryTextScaleByDistance != null ? req.body.scenePrimaryTextScaleByDistance : false,
          sceneTextAudioSync : req.body.sceneTextAudioSync != null ? req.body.sceneTextAudioSync : false,
          sceneTextUseModals : req.body.sceneTextUseModals != null ? req.body.sceneTextUseModals : true,
          sceneObjects: req.body.sceneObjects,
          sceneModels: req.body.sceneModels,
          sceneObjectGroups: req.body.sceneObjectGroups,
          sceneTimedEvents: req.body.sceneTimedEvents,
          sceneLastUpdate : lastUpdateTimestamp,
          sceneHasBgMap: req.body.sceneHasBgMap,
          sceneMapWidth: req.body.sceneMapWidth,
          sceneMapHeight: req.body.sceneMapHeight,
          scenePixelsPerMeterActual: req.body.scenePixelsPerMeterActual
        }};
        const updated = await RunDataQuery("scenes", "updateOne", query, updoc);
        res.send("updated " + updated);
        //TODO update inventories?
        // let inventoryID = scene.sceneInventoryID; //easier to jack in here, than ? make a temp batch route? 
        // if (inventoryID == null) {
        //     let inventories = {};
        //     let inventoryItems = [];
        //     inventories.inventoryItems = inventoryItems; 
        //     db_old.inventories.save(inventories, function (err, saved) {
        //     if (err || !saved) {
        //         console.log("problemo2 with inventory add " + err); 
        //         } else {
        //             inventoryID = saved._id;
        //             db_old.scenes.update( { "_id": o_id }, { $set: { sceneInventoryID : inventoryID }});
        //         }
        //     });
        // }

      } catch (e) {
        console.log("update scene error! " + e);
        res.send("update scene error! " + e);
      }
      

    })();
});

app.post('/newobj', requiredAuthentication, function (req, res) {

    var newobj = req.body;
    newobj.userID = req.session.user._id.toString();
    newobj.userName = req.session.user.userName;
    let timestamp = Math.round(Date.now() / 1000);
    newobj.createdTimestamp = timestamp;
    (async () => {
        try {
            const saved = await RunDataQuery("obj_items", "insertOne", newobj);
            var item_id = saved.insertedId.toString();
            console.log('new object created, id: ' + item_id);
            res.send("created: " + item_id);
        } catch (e) {
            console.log("error creating new obj!" + e)
            res.send("error creating new obj " + e);
        }
    })();

   
});

app.post('/delete_obj/', requiredAuthentication, function (req, res) { 
    console.log("tryna delete obj: " + req.body._id);
    var o_id = ObjectId.createFromHexString(req.body._id);
    (async () => {
        try {
            const query = { "_id" : o_id };
            const removed = await RunDataQuery("obj_items", "deleteOne", query);
            res.send("deleted");
        } catch (e) {
            console.log("error deleting audio!" + e)
            res.send("error dleting audio " + e);
        }
    })();
    // db_old.obj_items.remove( { "_id" : o_id }, 1 );
    // res.send("deleted");
});


app.post('/update_pic/:_id', requiredAuthentication, function (req, res) {
    console.log("update_pic rez " + req.body.width + " " + req.body.height);

    var o_id = ObjectId.createFromHexString(req.params._id);   
    console.log('pic requested : ' + req.body._id);
 
      (async () => {
        try {
          const query = { "_id": o_id };
          const pic_item = await RunDataQuery("image_items", "findOne", query);
          if (req.session.user._id != pic_item.userID && !req.session.user.authLevel.toLowerCase().includes("admin")) {
              console.log("must be owner to update!");
              res.send ("You don't have permission to update this");
          } else {
              console.log("tryna update pic " + req.body._id + " rez " + req.body.width + " " + req.body.height);
              let timestamp = Math.round(Date.now() / 1000);
              let isPublic = false;
              if (req.body.isPublic != null) {
                  isPublic = req.body.isPublic;
              }

              const query = { "_id": o_id };
              const updoc = { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                title: req.body.title,
                isPublic : isPublic,
                useTarget : req.body.useTarget,
                orientation: req.body.orientation,
                hasAlphaChannel: req.body.hasAlphaChannel,
                imageData: req.body.imageData,
                captionUpper: req.body.captionUpper,
                captionLower: req.body.captionLower,
                mods: req.body.mods,
                license: req.body.license,
                description: req.body.description,
                imageData: req.body.imageData,
                linkType: req.body.linkType,
                linkURL: req.body.linkURL,
                sourceText: req.body.sourceText,
                sourceTitle: req.body.sourceTitle,
                sourceLink: req.body.sourceLink,
                authorName: req.body.authorName,
                authorLink: req.body.authorLink,
                nft: req.body.nft,
                width: req.body.width,
                height: req.body.height,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName
              }};
              const saved = await RunDataQuery("image_items","updateOne",query,updoc);
              res.send("updated " + saved);
            }
        } catch (e) {
          console.log("error updating pic " + e);
          res.send(e);
        }
        
      })();

});

app.post('/update_video/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);    

    var o_id = ObjectId.createFromHexString(req.params._id);   
    console.log('video requested : ' + req.body._id);

    (async () => {
        try {
            const query = { "_id" : o_id};
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            const updoc = { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                timekeys: req.body.timekeys,
                title: req.body.title,
                isPublic : isPublic,
                orientation: req.body.orientation,
                hasAlphaChannel: req.body.hasAlphaChannel,
                captionUpper: req.body.captionUpper,
                captionLower: req.body.captionLower,
                mods: req.body.mods,
                license: req.body.license,
                description: req.body.description,
                linkType: req.body.linkType,
                linkURL: req.body.linkURL,
                sourceText: req.body.sourceText,
                sourceTitle: req.body.sourceTitle,
                sourceLink: req.body.sourceLink,
                authorName: req.body.authorName,
                authorLink: req.body.authorLink,
                nft: req.body.nft,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.name,
            }};
            const updated = await RunDataQuery("video_items", "updateOne", query, updoc);
            res.send("updated video " + updated);
        } catch (e) {
            console.log("error updating video " + e);
        }
    })();

});

app.post('/update_model/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);    

    var o_id = ObjectId.createFromHexString(req.params._id);   
    console.log('update model requested : ' + req.body._id);

    (async () => {
        try {
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            const query = { "_id" : o_id};
            const updoc = { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                name: req.body.name,
                isPublic : isPublic,
                sourceTitle: req.body.sourceTitle,
                sourceLink: req.body.sourceLink,
                sourceText: req.body.sourceText.replace(/"/g, "'"),
                authorName: req.body.authorName,
                authorLink: req.body.authorLink,
                license: req.body.license,
                modifications: req.body.modifications,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName,
                }};
                const updated = await RunDataQuery("models", "updateOne", query, updoc);
                res.send("updated model " + updated);
        } catch (e) {
            console.log("error updatign model " + e);
            res.send("error updatign model " + e);
        }
    })();
});


app.post('/update_obj/:_id', requiredAuthentication, function (req, res) {

    const id = req.params._id.toString();
    console.log('tryna update obj : ' + id);

    // var o_id = ;   
    
    const timestamp = Math.round(Date.now() / 1000);
    (async () => {
      try {
        // const query = { "_id" : o_id};
        // const obj_item = await RunDataQuery("obj_items", "findOne", query, req.originalUrl);
        // if (obj_item) {
        
          const actionIDs = req.body.actionIDs.length ? req.body.actionIDs.map(convertStringToObjectID) : [];
          const query = {"_id": ObjectId.createFromHexString(id)};
          const updateDoc = { $set: {
            actionIDs: actionIDs != null ? actionIDs : [],
            name: req.body.name,
            description: req.body.description,
            objtype: req.body.objtype,
            objcat: req.body.objcat,
            objsubcat: req.body.objsubcat,
            objclass: req.body.objclass,
            level: req.body.level,
            xpoints: req.body.xpoints,
            mana: req.body.mana,
            hitpoints: req.body.hitpoints,
            armorclass: req.body.armorclass,
            age: req.body.age,
            species: req.body.species,
            alignment: req.body.alignment,
            personality: req.body.personality,
            strength: req.body.strength,
            dexterity: req.body.dexterity,
            constitution: req.body.constitution,
            intelligence: req.body.intelligence,
            wisdom: req.body.wisdom,
            charisma: req.body.charisma,
            integrity: req.body.integrity,
            quality: req.body.quality,
            rarity: req.body.rarity,
            distribution: req.body.distribution,
            purity: req.body.purity,
            scale: req.body.scale,
            weight: req.body.weight,
            property: req.body.property,
            attribute: req.body.attribute,
            operator: req.body.operator,
            affect: req.body.affect,
            effectiveness: req.body.effectiveness,
            physics: req.body.physics,
            interaction: req.body.interaction,
            eventtype: req.body.eventtype,
            eventdata: req.body.eventdata,
            collidertype: req.body.collidertype,
            highlight: req.body.highlight,
            labeltext: req.body.labeltext,
            callouttext: req.body.callouttext,
            prompttext: req.body.prompttext,
            tags: req.body.tags,
            title: req.body.title,

            // price: req.body.price != null ? req.body.price : 0,
            intval: req.body.intval != null ? req.body.intval : 0,
            floatval: req.body.floatval != null ? req.body.floatval : 0,
            stringval: req.body.stringval != null ? req.body.stringval : "",
            assetname: req.body.assetname,
            assettype: req.body.assettype,
            audioEmit: req.body.audioEmit != null ? req.body.audioEmit : false,
            audioScale: req.body.audioScale != null ? req.body.audioScale : false,
            randomColor: req.body.randomColor != null ? req.body.randomColor : false,
            namedColor: req.body.namedColor,
            highlightColor: req.body.highlightColor,
            color1: req.body.color1,
            color2: req.body.color2,
            snapToGround: req.body.snapToGround  != null ? req.body.snapToGround : false,
            randomRotation: req.body.randomRotation != null ? req.body.randomRotation : false,
//                objectScale: req.body.objectScale ? req.body.objectScale : 0,
            xoffset: req.body.xoffset != null ? req.body.xoffset : "0",
            yoffset: req.body.yoffset != null ? req.body.yoffset : "0",
            zoffset: req.body.zoffset != null ? req.body.zoffset : "0",
            rotationAxis: req.body.rotationAxis != null ? req.body.rotationAxis : 0,
            rotationSpeed: req.body.rotationSpeed != null ? req.body.rotationSpeed : 0,
            objScale: req.body.objScale != null ? req.body.objScale : 1,
            maxPerScene: req.body.maxPerScene != null ? req.body.maxPerScene : 10,
            maxPerUser: req.body.maxPerUser != null ? req.body.maxPerUser : 1,
            maxTotal: req.body.maxTotal != null ? req.body.maxTotal : 1,
            speedFactor: req.body.speedFactor != null ? req.body.speedFactor : 3,
            colliderScale: req.body.colliderScale != null ? req.body.colliderScale : 1,
            triggerScale: req.body.triggerScale != null ? req.body.triggerScale : 1,
            yPosFudge: req.body.yPosFudge != null ? req.body.yPosFudge : 0,
            yRotFudge: req.body.yRotFudge != null ? req.body.yRotFudge : 0,
            eulerx: req.body.eulerx != null ? req.body.eulerx : 0,
            eulery: req.body.eulery != null ? req.body.eulery : 0,
            eulerz: req.body.eulerz != null ? req.body.eulerz : 0,
            
            scatter: req.body.scatter != null ? req.body.scatter : false,
            showcallout: req.body.showcallout != null ? req.body.showcallout : false,
            // buyable: req.body.buyable != null ? req.body.buyable : false,
            userspawnable: req.body.userspawnable != null ? req.body.userspawnable : false,
            textitemID: req.body.textitemID != null ? req.body.textitemID : "",
            pictureitemID: req.body.pictureitemID  != null ? req.body.pictureitemID : "",
            audioitemID: req.body.audioitemID != null ? req.body.audioitemID : "",
            textgroupID: req.body.textgroupID != null ? req.body.textgroupID : "",
            picturegroupID: req.body.picturegroupID != null ? req.body.picturegroupID : "",
            audiogroupID: req.body.audiogroupID != null ? req.body.audiogroupID : "",
            synthPatch1: req.body.synthPatch1 != null ? req.body.synthPatch1 : "",
            tonejsPatch1: req.body.tonejsPatch1 != null ? req.body.tonejsPatch1 : "",
            synthNotes: req.body.synthNotes != null ? req.body.synthNotes : "",
            synthDuration: req.body.synthDuration != null ? req.body.synthDuration : "",
            particles: req.body.particles != null ? req.body.particles : "",
            light: req.body.light != null ? req.body.light : "",
            lastUpdateTimestamp: timestamp,
            lastUpdateUserID: req.session.user._id,
            lastUpdateUserName: req.session.user.name
            // childObjectIDs: req.body.childObjectIDs
            }};
            const status = await RunDataQuery("obj_items", "updateOne", query, updateDoc);
            res.send("update status " + status);
      } catch (e) {
        res.send("upd obj error " + e);
      }
    })();
  });


app.post('/update_audio/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);
    var o_id = ObjectId.createFromHexString(req.params._id);   
    console.log('audioID requested : ' + req.body);

    (async () => {
        try {
            const query = { "_id" : o_id};
            const timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            if (req.body.clipDuration != null && req.body.clipDuration != undefined)
            req.body.clipDuration = req.body.clipDuration.toString();
            const updoc = { $set: {
                tags: req.body.tags,
                timekeys : req.body.timekeys,
                samplekeys : req.body.samplekeys,
                user_groups: req.body.user_groups,
                title: req.body.title,
                isPublic : isPublic,
                alt_title: req.body.alt_title,
                alt_artist: req.body.alt_artist,
                alt_source: req.body.alt_album,
                modVol: req.body.modVol,
                sourceText: req.body.sourceText != undefined ? req.body.sourceText : "",
                clipDuration : req.body.clipDuration != null ? req.body.clipDuration : "",
                textitemID : req.body.textitemID != null ? req.body.textitemID : "",
                textgroupID : req.body.textgroupitemID != null ? req.body.textgroupitemID : "",
                pictureitemID : req.body.pictureitemID != null ? req.body.pictureitemID : "",
                picturegroupID : req.body.picturegroupID != null ? req.body.picturegroupID : "",
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName
            }};
            const updated = await RunDataQuery ("audio_items", "updateOne", query, updoc);
            res.send("updated audio item " + updated);
        } catch (e) {
            console.log("error updating audio item " + e);
            res.send("error updating audio item " + e);
        }
    })();
});



app.post('/delete_audio/', requiredAuthentication, function (req, res){

    console.log('tryna delete audioID : ' + req.body._id);
    const audio_id = req.body._id;
    const o_id = ObjectId.createFromHexString(audio_id);   

    (async () => {
        try {
            const query = { "_id" : o_id};
            const audio_item = await RunDataQuery("audio_items", "findOne", query);
            let item_string_filename = audio_item.filename;
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);
            var pngName = baseName + ".png";
            var mp3Name = baseName + ".mp3";
            var oggName = baseName + ".ogg";
            var params = {
                Bucket: process.env.ROOT_BUCKET_NAME, // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + item_string_filename // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item._id + "." + pngName // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item._id + "." + mp3Name // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item._id + "." + oggName // required
                        }
                    ],
                    Quiet: true || false
                }
            };
            const status = await DeleteObjects(params.Bucket, params.Delete);
            const deleted = await RunDataQuery("audio_items", "deleteOne", query);
            res.send(status + " files deleted ~" + deleted);
        } catch (e) {
            console.log("error deleting audio " +e);
            res.send("error deleting audio " +e);
        }

    })();
});
  
app.post('/delete_model/', requiredAuthentication, function (req, res){
    console.log("tryna delete model: " + req.body);
    (async () => {
      try {
        var pic_id = req.body._id;
        var o_id = ObjectId.createFromHexString(pic_id);   

        const query = { "_id" : o_id};
        const model = await RunDataQuery("models", "findOne", query);

        if (!model) {
            console.log("error getting model not found");
        } else {
            var item_string_filename = model.filename;
            // item_string_filename = item_string_filename.replace(/\"/g, "");
            var params = {
                Bucket: process.env.ROOT_BUCKET_NAME, // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key:  "users/" + req.session.user._id.toString() + "/gltf/" + item_string_filename // required
                        }
                    ],
                    Quiet: true || false,
                }
            };
            try {
                const status = await DeleteObjects(process.env.ROOT_BUCKET_NAME, params.Delete);
                const query = { "_id" : o_id };
                const dbstatus = await RunDataQuery("models", "deleteOne", query);
                res.send(status + " deleted " + dbstatus);
                
            } catch (e) {
                res.send(e);
            }
          }
      } catch (e) {
        res.send(e);
      }
    })();
});

app.post('/delete_video/', requiredAuthentication, function (req, res){
    // console.log(req.body);

    console.log('tryna delete videoID : ' + req.body._id);
    var vid_id = req.body._id;
    var o_id = ObjectId.createFromHexString(vid_id);   

    (async () => {
      try {
        const query = { "_id" : o_id};
        const vid_item = await RunDataQuery("video_items", "findOne", query);
        // if (vid_item) {
            var item_string_filename = vid_item.filename;
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log("looking for vid named" + baseName);

            var delete_params = {
                Bucket: process.env.ROOT_BUCKET_NAME, // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key:  "users/" + req.session.user._id.toString() + "/video/"+ item_string_filename // required
                        }
                    ],
                    Quiet: true || false,
                }
            };

                const files = await ListObjects(process.env.ROOT_BUCKET_NAME,'users/'+ vid_item.userID + '/video/'+ vid_item._id +'/');
                console.log("files " + JSON.stringify(files));
                if (!files || files.Contents == undefined || files.Contents.length == 0) {
                    
                    const query = { "_id" : o_id };
                    const status = await RunDataQuery("video_items", "deleteOne", query);
                    console.log("no content found, video_item record deleted " + status);
                    res.send("deleted video item from db");
                } else {
                    // let response = files.Contents;
                    files.Contents.forEach(function(content) {
                        console.log("deleting vid thing " + content.Key);
                        delete_params.Delete.Objects.push({Key: content.Key}); //add the hls files
                        
                    });
                    // console.log(JSON.stringify(delete_params));
                    const dstatus = await DeleteObjects(process.env.ROOT_BUCKET_NAME, delete_params);
                    
                    const query = { "_id" : o_id };
                    const status = await RunDataQuery("video_items", "deleteOne", query);
                    console.log("some video things were deleted " + status);
                    res.send("deleted " + status);
                }

        //   } else {
        //     console.log("no video found!");
        //     res.send("no video found to delete!");
        //   }
        } catch(e) {
          res.send(e);
        }
      })();
    });
        
app.post('/delete_picture/', requiredAuthentication, function (req, res) { //TODO check user? or acl? another auth key?
    // console.log(req.body);

    console.log('tryna delete pictureID : ' + req.body._id);
    var pic_id = req.body._id;
    var o_id = ObjectId.createFromHexString(pic_id);   

    (async () => {
      try {
        const query = { "_id" : o_id};
        const pic_item = await RunDataQuery("image_items", "findOne", query);
        if (pic_item) {
          console.log("tryna delete " + JSON.stringify(pic_item))
            if (pic_item.filename != undefined) {
              var item_string_filename = pic_item.filename;
              item_string_filename = item_string_filename.replace(/\"/g, "");
              var item_string_filename_ext = getExtension(item_string_filename);
              var baseName = path.basename(item_string_filename, (item_string_filename_ext));
              console.log(baseName);
              var thumbName = 'thumb.' + baseName + item_string_filename_ext;
              var halfName = 'half.' + baseName + item_string_filename_ext;
              var quarterName = 'quarter.' + baseName + item_string_filename_ext;
              var standardName = 'standard.' + baseName + item_string_filename_ext;
              var params = {
                Bucket: process.env.ROOT_BUCKET_NAME,// required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key: "users/" + pic_item.userID + "/" + item_string_filename 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/" + pic_item._id + ".original." + item_string_filename 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/" + pic_item._id + "." + thumbName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/" + pic_item._id + "." + quarterName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/" + pic_item._id + "." + halfName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/" + pic_item._id + "." + standardName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/" + item_string_filename 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/originals/" + pic_item._id + ".original." + item_string_filename 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/" + pic_item._id + "." + thumbName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/" + pic_item._id + "." + quarterName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/" + pic_item._id + "." + halfName 
                        },
                        {
                            Key: "users/" + pic_item.userID + "/pictures/" + pic_item._id + "." + standardName 
                        }
                        
                        ],
                        Quiet: true || false
                    }
                };
                try {
                  const status = await DeleteObjects(process.env.ROOT_BUCKET_NAME, params.Delete);
                  console.log("deleting from s3 " + status);
                  const query = { "_id" : o_id };
                  const data = await RunDataQuery("image_items", "deleteOne", query);
                  res.send("deleted pic " + data);

                } catch (e) {
                  res.send(e);
                }
              }
            }
        } catch (e) {
          res.send(e);
        }
    })();
  });


function Shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


function UppercaseFirst(s) {
// Check for empty string.
// console.log("checkin s " + s);
// if (s.Length < 2) {
//     return s.Empty;
// }
if (s != undefined) {
const ufirst = s.charAt(0).toUpperCase() + s.slice(1);
// console.log("to upperfirst " + ufirst);
// Return char and concat substring.
return ufirst;
    } else {
        return "*";
    }
};

// function getExtension(filename) {
//     var i = filename.lastIndexOf('.');
//     return (i < 0) ? '' : filename.substr(i);
// }

function cleanbase64 (string) {
    btoa(string.replace(/[\u00A0-\u2666]/g, function(c) {
    return '&#' + c.charCodeAt(0) + ';';
    }))
};

