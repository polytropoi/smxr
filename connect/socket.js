import { settings } from "../connect/settings.js";

import { MoveAvatarEvent } from "../connect/events.js";

import { avatars, avatarName, localRoomUser,  room, RandomHexColor, socketHost, UpdatePlayerAvatars, ReturnRoomUsersString, token } from "../connect/connect.js"; //should be here...

export let socket = null; //the socket.io instance below

export let isConnected = false;
export let mySocketID = "";

export let roomUsers = {};
export let stringRoomUsers;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

// Public STUN server for NAT traversal
const rtcConfig = {
  iceServers: [{ urls: 'stun:://google.com' }]
};

// start();

async function start() {
  // 1. Capture local media first
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  // 2. Join the signaling room
  socket.emit('join', ROOM);
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(rtcConfig);

  // Add local tracks to the connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Display remote stream when tracks arrive
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Send gathered ICE candidates to the other peer via Socket.IO
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', {
        room: ROOM,
        data: { type: 'candidate', candidate: event.candidate }
      });
    }
  };
}

export function InitSocket () {
if (settings && !socket) {
   const aColor = RandomHexColor();
   console.log ("tryna InitSocket with color " + aColor);

   socket = io.connect(socketHost, {
         query : {
            token: token,
            uname: avatarName,
            color: aColor,
            room: room
         },
         url: socketHost + "/socket.io/?EIO=4&transport=polling&t=NNjNltH",
         autoConnect: true,  //connection is opened if token checks out above
         reconnection: true,
         reconnectionAttempts: 5,        // Limit total reconnection attempts to 5
         reconnectionDelay: 1000,        // Start by waiting 1 second before retrying
         reconnectionDelayMax: 5000,     // Never wait more than 5 seconds between retries
         randomizationFactor: 0.5,
         transports: ['websocket']
         });      
      }


    socket.on('ready', async () => {
        createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('signal', {
            room: ROOM,
            data: { type: 'offer', sdp: offer }
        });
    });

   socket.on('connect', function() {
   
      isConnected = true;
      console.log("connected socket tryna join " + avatarName + " socketID " + socket.id);
      mySocketID = socket.id;
      socket.emit('join', room, avatarName, "web");
      const disconnectButton = document.getElementById("disconnectButton");
      disconnectButton.removeAttribute("hidden");
   
   });

   socket.on("connect_error", (err) => {
      console.log(`Connection error due to: ${err.message}`);
   });

      // Triggered when all reconnection attempts have failed
   socket.io.on("reconnect_failed", () => {
      console.log("Failed to reconnect after maximum attempts.");
   // Example: Show a "Connection Lost. Click to retry" button to the user
   });

   // Optional: Track individual attempts as they happen
   socket.io.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
   });

   socket.on('user joined', function(data) {
      console.log("room user " + data + 'joined room ' + room);
      socket.emit('room users', room);
      const roomUsersString = ReturnRoomUsersString(roomUsers);
      UpdatePlayerAvatars(roomUsers, roomUsersString);
      // EmitSelfPosition();
   });

   socket.on('admin message', function (data) {
      console.log('recieved admin message : ' + data + ' in room ' + room);
      if (data.toString().toLowerCase() == "next") {
         GoToNext();
      }
   });

   socket.on('room users', function (data) {
    console.log("room users data : " + data);
      $('#users').html("");

      roomUsers = JSON.parse(data);

      // let roomUsersString = "";
      // console.log("room users count = " +roomUsers.length);
      // let usercount = 0;
  
            var keys = Object.keys(roomUsers);
            let userCount = keys.length;
            let simpleUsers = [];
            for(var i=0; i<keys.length; i++){
               var key = keys[i];
               var isMe = "";
               // console.log(key, roomUsers[key]);
               if (key === socket.id) {
                  isMe = "*";
                //   localRoomUser = roomUsers[key];
                  // console.log("key isMe " + key);
               }
               const value = roomUsers[key];
               
               if (value.includes("~")) {
                  let split = value.split("~"); //color is appended to username
                  split[0] = split[0].replace("_", " ");
                //   roomUsersString += isMe + "<a href=\x22#\x22 class=\x22tooltip\x22 style=\x22color:"+split[1]+"\x22>"+ split[0]+"<span class=\x22tooltiptext\x22>"+split[0]+"</span></a>, ";
                  let u = {};
                  u.name = split[0];
                  u.color = split[1];

                  simpleUsers.push(u);
               } else {
                //   roomUsersString += value + ", ";
               } 
            //    usercount++;
            }

      //       roomUsersString = roomUsersString.substring(0, roomUsersString.length - 2); //trim last comma and trailing space
      //       roomUsersString = usercount + " users connected: " + roomUsersString;

      const roomUsersString = ReturnRoomUsersString(roomUsers);
      // console.log(roomUsersString);
      $('#users').html(roomUsersString);
      stringRoomUsers = roomUsersString;
      UpdatePlayerAvatars(roomUsers, roomUsersString);
    //   if (userCount > 0) {
    //      const playerHudEl = document.getElementById("player_hud");
    //      if (playerHudEl) {
    //         if (playerHudEl.components.player_hud) {
    //         playerHudEl.components.player_hud.ShowConnectedUsersAndHide(userCount, simpleUsers);
    //         }
    //      }
    //   }
      // $('#users_2').html(roomUsersString);
      // EmitSelfPosition();
   });


   socket.on('getbytes', function (data, metadata) {
         //TODO split the incoming wad and build array(s) of pics, audio, etc based on metadata
         console.log("tryna parse some bytes");
   });

   socket.on('getpicframe', function (data, sid) {

      
      console.log("getting pic frame from " + sid + " roomUsers " + JSON.stringify(roomUsers));
      let userName = "";
      var keys = Object.keys(roomUsers);
      for(var i=0; i<keys.length; i++){
         var key = keys[i];
         console.log(key, roomUsers[key]);
         if (keys[i] === sid) {
            console.log(roomUsers[key] + " sent a pic frame!");
            userName = roomUsers[key];
         }
      }   
      // foreach(var user in roomUsers) {
      //    if (user.key == socket.id) {
      //       console.log(user.value + " sent a pic frame!");
      //    }
      
      // }
      var instance = $('body').data('backstretch');
      var base64 = _arrayBufferToBase64(data);
      var imgSrc = "data:image/jpg;base64," + base64;
      // if (instance === undefined) {
      //     pics.push(imgSrc);
      //     // $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
      //         $(".screen-overlay").backstretch(imgSrc);
      // } 
      // $(".screen-overlay").backstretch("destroy", true);
      // $(".screen-overlay").backstretch(pics);
      // $(".screen-overlay").backstretch(imgSrc, {fade: 250});
      // $('#future').prepend($('<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>').text( "<"+ userName + " <a id="+socket.id+" href=\x22#\x22>sent a pic</a>").append("</span><hr>"));
      $('#future').prepend($("<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>-"+ userName + " <button class=\x22btn picbutton\x22 id="+sid+" href=\x22#\x22>sent a pic</button></span><hr>"));
    //   UpdateContentBox();
         if (pics.length < 1) {
            
            pics.push(imgSrc);
            // picsBuffer = pics;
            // console.log("pushing pic # " + pics.length);
            if (!instance) {
                  $(".screen-overlay").backstretch(pics, {duration: 1000, fade: 250});
            }
         } 

      if (picArrayIndex < 20) {
      if (pics < picArrayIndex) {
         pics.push(imgSrc);
         // $(".screen-overlay").backstretch(imgSrc);
      } else {
         pics.splice(picArrayIndex, 1, imgSrc);  
      }
      picArrayIndex++;
      } else {
      picArrayIndex = 0;
      pics.splice(picArrayIndex, 1, imgSrc);
      picArrayIndex++;
      }

   });

   socket.on('getaudiochunk', function (data){
      console.log("messages data : " + data);

   });

   socket.on('user messages', function(data1, data2, data3, data4) { //name, color, socketID, message
         console.log("messages data : " + data1 + " " + data2 + " " + data3);
         // $('#future').prepend($('<div class=\x22row bubble pull-left\x22 style=\x22margin: 5px 5px 5px 5px;\x22><span class=\x22smallfont_yellow\x22>').text( data1 + ": " + data2).append("</span></div>"));
         // $('#future').prepend($('<span style=\x22margin: 5px 5px 5px 5px;\x22 class=\x22smallfont_lightyellow\x22>').text( "<"+ data1 + ": " + data2).append("</span>"));
         $('#future').prepend("<div class=\x22messageBubbleIn\x22 style=\x22float: left; color: "+data2+";\x22>"+ data1 + ": " + data4 + "</div><br><br><br>");
         if ($('#future li').length > 555) {
            $('#future li').last().remove();
         }
         // UpdateContentBox();
   });

   socket.on('playerposition', function(uname, posX, posY, posZ, rotX, rotY, rotZ, socketID, source) {
      console.log("player position data : " + uname + "x " + posX + " y " + posY + " z " + posZ + " rx " + rotX + " ry " + rotY + " rz " + rotZ + " sid " + socketID + " from " + source);


      if (settings.sceneType == "aframe") {

      
         let pAvatar = document.getElementById(socketID);
         // console.log("pAvatar is " + JSON.stringify(pAvatar));
         // pAvatar.setAttribute('lerp', {'position': posObj, 'rotation': rotObj});
         if (pAvatar != null) { //TODO Interpolation!
            if (source == "unity") {
               posZ = posZ * -1;
            }
            const posObj = {};
            posObj.x = posX;
            posObj.y = posY;
            posObj.z = posZ;
            const rotObj = {};
            rotObj.x = rotX;
            rotObj.y = rotY;
            rotObj.z = rotZ;
            // pAvatar.setAttribute('lerp', {'position': posObj, 'rotation': rotObj});
            // const posRotObj = {position: posX + "," + posY + "," + posZ, rotation: rotX + "," + rotY + "," + rotZ};
                  const posRotObj = {}
                  posRotObj.position = posObj;
                  posRotObj.rotation = rotObj;
                  var mover = pAvatar.components.mover; //much easier
                  // MoveElement(socketID, posRotObj);
                  // const event = new CustomEvent('update_pos_rot', {detail: posRotObj}, false);
                  // console.log("tryna dispatchEvent " + event);
                  // pAvatar.dispatchEvent(event);
                  mover.move(socketID, posObj, rotObj);
            // pAvatar.setAttribute('position', posX + " " + posY + " " + posZ);
            // pAvatar.setAttribute('rotation', rotX + " " + rotY + " " + rotZ);
         } else {
                  const roomUsersString = ReturnRoomUsersString(roomUsers);
            UpdatePlayerAvatars(roomUsers, roomUsersString);
         }
      } else {
         const avatarString = "avatar_" + socketID;
         const sceneAvatar = avatars[avatarString];
         if (sceneAvatar) {
            if (socketID != socket.id) { //don't move yerself
               console.log("gotsa avatar to move " + socketID);

               const avatarData = {'type': 'move', 'posX': posX, 'posY': posY, 'posZ': posZ, 'rotX': rotX, 'rotY': rotY, 'rotZ': rotZ, 'socketID': socketID}

               MoveAvatarEvent(avatarData);
            }
         // } else {
            const roomUsersString = ReturnRoomUsersString(roomUsers);
            UpdatePlayerAvatars(roomUsers, roomUsersString);
         }

      }
      // EmitSelfPosition();
   });

   socket.on('selfplayerposition', function() {
      let pAvatar = document.getElementById(mySocketID);
      if (pAvatar != null) {
         pAvatar.setAttribute('position', cameraPosition.x + " " + cameraPosition.y + " " + cameraPosition.z);
      }
   });

   socket.on('disconnect', function() {
      console.log("disconnect event! " + socket + "connected user count is now " + roomUsers.length);
      const roomUsersString = ReturnRoomUsersString(roomUsers);
      UpdatePlayerAvatars(roomUsers, roomUsersString);
   });
   socket.on('user left', function(id) {
      console.log("user left with socket id " + id + " vs roomUsers " + JSON.stringify(roomUsers));
      UpdatePlayerAvatars(roomUsers);

   });

    // First peer receives 'ready' when second peer joins -> Initiates the call


    // Handle incoming signaling messages from the other peer
    socket.on('signal', async (data) => {
    if (data.type === 'offer') {
        createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('signal', {
        room: ROOM,
        data: { type: 'answer', sdp: answer }
        });
    } else if (data.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
    });
} //InitSocket end