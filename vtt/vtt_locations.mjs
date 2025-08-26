import { Assets, Graphics, Container, Text } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';
import { selectedPosition } from '../connect/events.js';
import { SetSelectedLocationTimestamp, SceneManglerModal, keydown } from '../main/js/dialogs.js';
import { pixelsPerMeterActual } from './vtt_main.mjs';


let tokenContainer;

export function LoadLocations(app, viewport, spritesContainer) {
    console.log("tryna load localMarkers..");
    const localMarkers = document.querySelectorAll('.local_marker');
    const cloudMarkers = document.querySelectorAll('.cloud_marker');
    
    if (!tokenContainer) {
            // tokenContainer.destroy({ children: true });
                tokenContainer = new Container();
        tokenContainer.anchor = 0;
        // tokenContainer.width = viewport.width;
        // tokenContainer.height = viewport.height;
        viewport.addChild(tokenContainer);
        viewport.setChildIndex(tokenContainer, viewport.children.length - 1);
    } else {
        tokenContainer.removeChildren();
    }
    
    console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    for (let i = 0; i < localMarkers.length; i++) {
        console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
        const elData = JSON.parse(localMarkers[i].dataset.eldata);
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const zIndex = parseFloat(elData.ypos); //use Y axis from 3D as elevation/sorting/zindex for 2D 
            const xpos = parseFloat(elData.xpos) * pixelsPerMeterActual; //these values are multiplied by pixelsPerMeterActual
            const ypos = parseFloat(elData.zpos) * pixelsPerMeterActual; // use the Z axis for Y position in 2D, you must

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
        // const globalPos = {x: xpos, y: ypos} ;
        // const worldPos = viewport.toWorld(globalPos);
        // // console.log(viewport.x + " " + viewport.scale.x + " " + viewport.scale.y  + " scale tryna set token position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
        // console.log("setting token position w/ viewport position " + viewport.x + " " + viewport.x  + " scale " + viewport.scale.x + " " + viewport.scale.y  + " position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
        // token.position.set(worldPos.x,worldPos.y);
        // token.x = worldPos.x;
        // token.y = worldPos.y;
        token.x = xpos;
        token.y = ypos;
        tokenContainer.addChild(token);
        // tokenContainer.setChildIndex(token, tokenContainer.children.length -1);
        token.onPress.connect((event) => {
            console.log(token.x + " " + token.y + " pressed loaded token " + JSON.stringify(token.data));
            
            viewport.animate({
                position: { x: token.x, y: token.y }, // Target center position
                scale: 1.5, // Target zoom level
                time: 1000, // Animation duration of 1 second
                ease: 'easeInOutQuad', // Using a common easing function
                callbackOnComplete: () => {
                    // console.log("Animation completed!");
                }
            });

            if (keydown == "Shift") {
                SetSelectedLocationTimestamp(elData.timestamp);
                SceneManglerModal('Location');
            }
        });
    }

    for (let i = 0; i < cloudMarkers.length; i++) {

        const elData = JSON.parse(atob(cloudMarkers[i].dataset.eldata));
                console.log("cloudMarker " + cloudMarkers[i].id + " data " + JSON.stringify(elData));
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const zIndex = parseFloat(elData.ypos); //use Y axis from 3D as elevation/sorting/zindex for 2D 
            const xpos = parseFloat(elData.x) * pixelsPerMeterActual; //these values are multiplied by pixelsPerMeterActual
            const ypos = parseFloat(elData.z) * pixelsPerMeterActual; // use the Z axis for Y position in 2D, you must

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
        token.x = xpos;
        token.y = ypos;
        tokenContainer.addChild(token);
        // tokenContainer.setChildIndex(token, tokenContainer.children.length -1);
        token.onPress.connect((event) => {
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

            if (keydown == "Shift") {
                SetSelectedLocationTimestamp(elData.timestamp);
                SceneManglerModal('Location');
            }
        });
    }


    viewport.bounce(); //better to add this after locations loaded..?
    // console.log(tokenContainer.children);

 }


 export function AddLocation(app, viewport, spritesContainer) {
    console.log("tryna load localMarkers..");
    // const localMarkers = document.querySelectorAll('.local_marker');
    
    // if (!tokenContainer) {
    //         // tokenContainer.destroy({ children: true });
    //             tokenContainer = new Container();
    //     tokenContainer.anchor = 0;
    //     // tokenContainer.width = viewport.width;
    //     // tokenContainer.height = viewport.height;
    //     viewport.addChild(tokenContainer);
    //     viewport.setChildIndex(tokenContainer, viewport.children.length - 1);
    // } else {
    //     tokenContainer.removeChildren();
    // }
    
    // tokenContainer = new Container();
    // // tokenContainer.anchor = .5;
    // // tokenContainer.width = viewport.width;
    // // tokenContainer.height = viewport.height;
    // viewport.addChild(tokenContainer);
    // viewport.setChildIndex(tokenContainer, viewport.children.length - 1);
    
    // console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    // // for (let i = 0; i < localMarkers.length; i++) {
    //     console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
    //     const elData = JSON.parse(localMarkers[i].dataset.eldata);
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const xpos = parseFloat(selectedPosition.x) * pixelsPerMeterActual;
            const ypos = parseFloat(selectedPosition.y) * pixelsPerMeterActual;

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
    

    const globalPos = {x: xpos, y: ypos} ;
    const worldPos = viewport.toWorld(globalPos);
        // console.log(viewport.x + " " + viewport.scale.x + " " + viewport.scale.y  + " scale tryna set token position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
        console.log("setting token position w/ viewport position " + viewport.x + " " + viewport.x  + " scale " + viewport.scale.x + " " + viewport.scale.y  + " position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
    // token.position.set(worldPos.x,worldPos.y);
    token.x = xpos;
    token.y = ypos;
    tokenContainer.addChild(token);
    // tokenContainer.setChildIndex(token, tokenContainer.children.length -1);
    token.onPress.connect((event) => {
        console.log("pressed new token " + JSON.stringify(token.data));
        }
    );
    // }
    // console.log(tokenContainer.children);

 }
