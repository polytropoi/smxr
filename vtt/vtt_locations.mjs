import { Assets, Graphics, Container, Text } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';
import { selectedPosition, eventEl } from '../connect/events.js';
import { SetSelectedLocationTimestamp, SceneManglerModal, keydown } from '../connect/dialogs.js';
import { localData, SaveModToLocal} from '../connect/connect.js';

// import { dragTarget, onDragStart, onDragMove, onDragEnd } from './addElements.mjs';
import { app, viewport } from './vtt_main.mjs';
import { SaveLocalData } from '../connect/indexedDb.js';

  let dragTarget = null;
//   let viewport;
  eventEl.addEventListener('map-update', onMapLocationUpdate);

 
    function onMapLocationUpdate(event) { //dialog or other event that updates a map token
        
        const theEl = document.getElementById(event.details);
        console.log("theEl data " + theEl.dataset.eldata);
        const elData = JSON.parse(atob(theEl.dataset.eldata));
        console.log("gotsa mapLocationUpdate.." + event.details + " " + JSON.stringify(elData));
        for (let i = 0; i < locationTokenContainer.children.length; i++) {
                
            if (event.details == locationTokenContainer.children[i].data.timestamp) {
                console.log("whoot gotsa amtch at xz " + locationTokenContainer.children[i].x + " " +locationTokenContainer.children[i].y );
                locationTokenContainer.children[i].data = elData;
                locationTokenContainer.children[i].text = elData.name;
                // document.getElementById('xpos').value = locationTokenContainer.children[i].x;
                // document.getElementById('zpos').value = locationTokenContainer.children[i].z;
            }
        }

    }

   function onDragMove(event) {
    console.log("tryna dragmove.." + dragTarget.data.name + " child of " + dragTarget.parent);
    if (dragTarget) {
      
      locationTokenContainer.toLocal(event.global, null, dragTarget.position);
    }
  }

   function onDragStart(event) {
    console.log("token dragstart! " + dragTarget.data.name);   
    dragTarget.alpha = 0.5;
    locationTokenContainer.on('pointermove', onDragMove);
  }

   function onDragEnd() {
   
    if (dragTarget) {
         console.log("dragend " + dragTarget.data.timestamp + " x " + dragTarget.x + " y " + dragTarget.y );
      locationTokenContainer.off('pointermove', onDragMove);
      dragTarget.alpha = 1;
        console.log("localData is " + JSON.stringify(localData));
        for (let i = 0; i < localData.locations.length; i++) {
            if (localData.locations[i].timestamp == dragTarget.data.timestamp) {
                localData.locations[i].x = dragTarget.x;
                localData.locations[i].z = dragTarget.y;
            }
        } 
    //   document.getElementById('xpos').value = dragTarget.x;
    //             document.getElementById('zpos').value = dragTarget.z;
    // //   console.log(dragTarget.data.name )
        // SaveModToLocal(dragTarget.data.timestamp);
        SaveLocalData();
         dragTarget = null;
    }
  }

    let locationTokenContainer = new Container();
    locationTokenContainer.interactive = true;
    locationTokenContainer.on('pointerup', onDragEnd);
    locationTokenContainer.on('pointerupoutside', onDragEnd);


export function LoadLocations(app, viewport, spritesContainer) {
    console.log("tryna load localMarkers..");
    const localMarkers = document.querySelectorAll('.local_marker');
    const cloudMarkers = document.querySelectorAll('.cloud_marker');
    spritesContainer.addChild(locationTokenContainer);
    
    // console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    for (let i = 0; i < localMarkers.length; i++) {
        console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
        const elData = JSON.parse(localMarkers[i].dataset.eldata); //this one is not b64 encoded
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const zIndex = parseFloat(elData.ypos); //use Y axis from 3D as elevation/sorting/zindex for 2D 
            let xpos = parseFloat(elData.xpos); //these values are multiplied by pixelsPerMeterActual
            let ypos = parseFloat(elData.zpos); // use the Z axis for Y position in 2D, you must

        const fontsize = Math.max(18, window.innerWidth / 50);  
        const text = new Text({
            text: elData.name,
            style: {
            fontSize: fontsize,
            fill: 'white', // Red color
            fontFamily: 'Acme',
            align: 'center', // Center alignment
            stroke: { color: 'black', width: 1 }, // Purple stroke
            dropShadow: {
                color: '#000000', // Black shadow
                blur: 1, // Shadow blur
                distance: 1 // Shadow distance
                }
            }
        });
        const token = new FancyButton({
        defaultView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "SkyBlue", alpha: .75 }),
        hoverView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightBlue", alpha: .75 }),
        pressedView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightCoral", alpha: .75 }),
        disabledView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "DarkGray", alpha: .75 }),
        width: width,
        height: height,
    
        anchor: 0.5,
        text: text,
        padding: 5,

        animations: {
            hover: {
                props: {
                    scale: {
                        x: 1.1,
                        y: 1.1,
                    }
                },
                duration: 100,
            },
            pressed: {
                props: {
                    scale: {
                        x: 0.9,
                        y: 0.9,
                    }
                },
                duration: 100,
                }
            }
        });
        token.data = elData;
         console.log("localMarker " + localMarkers[i].id + " data " + JSON.stringify(token.data));
        token.x = xpos;
        token.y = ypos;
        locationTokenContainer.addChild(token);
        // locationTokenContainer.setChildIndex(token, locationTokenContainer.children.length -1);
        token.on('pointerdown', (event) => {
            

            if (keydown == "Shift") {
                console.log("localmarker shift + onPress");
                SetSelectedLocationTimestamp(elData.timestamp);
                SceneManglerModal('Location');
            } else if (keydown == "T") {
                // viewport.plugins.pause("drag");
                console.log("localmarker shift + onPress");
                SetSelectedLocationTimestamp(elData.timestamp);
                // SceneManglerModal('Location');
                dragTarget = token;
                onDragStart();
            } else {
                console.log("localmarker onPress" + token.x + " " + token.y + " pressed loaded token " + JSON.stringify(token.data));
                    
                viewport.animate({
                    position: { x: token.x, y: token.y }, // Target center position
                    scale: 1.5, // Target zoom level
                    time: 1000, // Animation duration of 1 second
                    ease: 'easeInOutQuad', // Using a common easing function
                    callbackOnComplete: () => {
                        // console.log("Animation completed!");
                    }
                });
            }
        });
          token.on('pointerup', onDragEnd);
            token.on('pointerupoutside', onDragEnd);
    }
        ///////////////same but different for cloudmarkers
    for (let i = 0; i < cloudMarkers.length; i++) {

        const elData = JSON.parse(atob(cloudMarkers[i].dataset.eldata));
                // console.log("cloudMarker " + cloudMarkers[i].id + " data " + JSON.stringify(elData));
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const zIndex = parseFloat(elData.ypos); //use Y axis from 3D as elevation/sorting/zindex for 2D 
            let xpos = parseFloat(elData.x); //these values are multiplied by pixelsPerMeterActual
            let ypos = parseFloat(elData.z); // use the Z axis for Y position in 2D, you must

        const fontsize = Math.max(18, window.innerWidth / 50);  
        const text = new Text({
            text: elData.name,
            style: {
            fontSize: fontsize,
            fill: 'white', // Red color
            fontFamily: 'Acme',
            align: 'center', // Center alignment
            stroke: { color: 'black', width: 1 }, // Purple stroke
            dropShadow: {
                color: '#000000', // Black shadow
                blur: 1, // Shadow blur
                distance: 1 // Shadow distance
                }
            }
        });
        const token = new FancyButton({
        defaultView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "Pink", alpha: .75 }),
        hoverView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightBlue", alpha: .75 }),
        pressedView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightCoral", alpha: .75 }),
        disabledView: new Graphics()
        .roundRect(0, 0, width, height, 5)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "DarkGray", alpha: .75 }),
        width: width,
        height: height,
    
        anchor: 0.5,
        text: text,
        padding: 5,

        animations: {
            hover: {
                props: {
                    scale: {
                        x: 1.1,
                        y: 1.1,
                    }
                },
                duration: 100,
            },
            pressed: {
                props: {
                    scale: {
                        x: 0.9,
                        y: 0.9,
                    }
                },
                duration: 100,
                }
            }
        });
        token.data = elData;

        // if (xpos > 0) { //modify coords to match 3D, with zero in the center instead of top left corner
        //     xpos = xpos * 2;
        // } else {
        //     xpos = xpos * -1;
        // }
        // if (ypos > 0) { //modify coords to match 3D, with zero in the center instead of top left corner
        //     ypos = ypos * 2;
        // } else {
        //     ypos = ypos * -1;
        // } 
        token.x = xpos;
        token.y = ypos;
        locationTokenContainer.addChild(token);
        // locationTokenContainer.setChildIndex(token, locationTokenContainer.children.length -1);
        // token.onPress.connect((event) => {      
        token.on('pointerdown', (event) => {
            console.log("keydown is " + keydown);

            if (keydown == "Shift") {
                console.log("SHift key + token pointerdown");
                SetSelectedLocationTimestamp(elData.timestamp);
                SceneManglerModal('Location');
            } else if (keydown == "T") {
                SetSelectedLocationTimestamp(elData.timestamp);
                // SceneManglerModal('Location');
                console.log("T key + pointerdown at " + token.x + " " + token.y);
                dragTarget = token;
                onDragStart();

            } else {
                console.log(token.x + " " + token.y + " pressed loaded cloud token " + JSON.stringify(token.data));
            
                viewport.animate({
                    position: { x: token.x, y: token.y }, // Target center position
                    scale: 1.5, // Target zoom level
                    time: 1000, // Animation duration of 1 second
                    ease: 'easeInOutQuad', // Using a common easing function
                    callbackOnComplete: () => {
                        // console.log("Animation completed!");
                    }
                });
            }
        });

    }


    viewport.bounce(); //better to add this after locations loaded..?
    // console.log(locationTokenContainer.children);

 }


 export function AddLocation(app, viewport, spritesContainer) {
    console.log("tryna load localMarkers..");
    // const localMarkers = document.querySelectorAll('.local_marker');
    
    // if (!locationTokenContainer) {
    //         // locationTokenContainer.destroy({ children: true });
    //             locationTokenContainer = new Container();
    //     locationTokenContainer.anchor = 0;
    //     // locationTokenContainer.width = viewport.width;
    //     // locationTokenContainer.height = viewport.height;
    //     viewport.addChild(locationTokenContainer);
    //     viewport.setChildIndex(locationTokenContainer, viewport.children.length - 1);
    // } else {
    //     locationTokenContainer.removeChildren();
    // }
    
    // locationTokenContainer = new Container();
    // // locationTokenContainer.anchor = .5;
    // // locationTokenContainer.width = viewport.width;
    // // locationTokenContainer.height = viewport.height;
    // viewport.addChild(locationTokenContainer);
    // viewport.setChildIndex(locationTokenContainer, viewport.children.length - 1);
    
    // console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    // // for (let i = 0; i < localMarkers.length; i++) {
    //     console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
    //     const elData = JSON.parse(localMarkers[i].dataset.eldata);
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            // let xpos = parseFloat(selectedPosition.x) * pixelsPerMeterActual;
            // let ypos = parseFloat(selectedPosition.y) * pixelsPerMeterActual;
            let xpos = parseFloat(selectedPosition.x);
            let ypos = parseFloat(selectedPosition.y);

    const fontsize = Math.max(18, window.innerWidth / 50);  
    const text = new Text({
        text: 'new placeholder',
        style: {
        fontSize: fontsize,
        fill: 'white', // Red color
        fontFamily: 'Acme',
        align: 'center', // Center alignment
        stroke: { color: 'black', width: 1 }, // Purple stroke
        dropShadow: {
            color: '#000000', // Black shadow
            blur: 1, // Shadow blur
            distance: 1 // Shadow distance
            }
        }
    });
    const token = new FancyButton({
        defaultView: new Graphics()
        .roundRect(0, 0, width, height, 2)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "SkyBlue", alpha: .75 }),
        hoverView: new Graphics()
        .roundRect(0, 0, width, height, 2)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightBlue", alpha: .75 }),
        pressedView: new Graphics()
        .roundRect(0, 0, width, height, 2)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightCoral", alpha: .75 }),
        disabledView: new Graphics()
        .roundRect(0, 0, width, height, 2)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "DarkGray", alpha: .75 }),
        width: width,
        height: height,
    
        anchor: 0.5,
        text: text,
        padding: 2,

        animations: {
            hover: {
                props: {
                    scale: {
                        x: 1.1,
                        y: 1.1,
                    }
                },
                duration: 100,
            },
            pressed: {
                props: {
                    scale: {
                        x: 0.9,
                        y: 0.9,
                    }
                },
                duration: 100,
            }
        }
    });
    // token.data = elData;
    

    // const globalPos = {x: xpos, y: ypos} ;
    // const worldPos = viewport.toWorld(globalPos);
    // xpos = worldPos.x;
    // ypos = world
        // console.log(viewport.x + " " + viewport.scale.x + " " + viewport.scale.y  + " scale tryna set token position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
        console.log("setting token position w/ viewport position " + viewport.x + " " + viewport.x  + " scale " + viewport.scale.x + " " + viewport.scale.y  + " position " + xpos + "  " + ypos)/// + " " + worldPos.x + " " + worldPos.y);
    // token.position.set(worldPos.x,worldPos.y);

        // if (xpos > 0) { //modify coords to match 3D, with zero in the center instead of top left corner
        //     xpos = xpos * 2;
        // } else {
        //     xpos = xpos * -1;
        // }
        // if (ypos > 0) { //modify coords to match 3D, with zero in the center instead of top left corner
        //     ypos = ypos * 2;
        // } else {
        //     ypos = ypos * -1;
        // } 

    token.x = xpos;
    token.y = ypos;
    locationTokenContainer.addChild(token);
    // locationTokenContainer.setChildIndex(token, locationTokenContainer.children.length -1);
    token.onPress.connect((event) => {
        console.log("pressed new token " + JSON.stringify(token.data));
        }
    );
    // }
    // console.log(locationTokenContainer.children);

 }
