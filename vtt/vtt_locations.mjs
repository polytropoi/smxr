import { Assets, Graphics, Container, Text } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';


let tokenContainer;
 export function LoadLocations(app, viewport, spritesContainer) {
    console.log("tryna load localMarkers..");
    const localMarkers = document.querySelectorAll('.local_marker');
    // .forEach(el => {
    // // Do something with each element
    //     console.log("localMarker " + el.id);
    // });
    // localMarkers.forEach(el => {
    // // Do something with each element
    //      console.log("localMarker " + el.id);
    // });
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
    
    // tokenContainer = new Container();
    // // tokenContainer.anchor = .5;
    // // tokenContainer.width = viewport.width;
    // // tokenContainer.height = viewport.height;
    // viewport.addChild(tokenContainer);
    // viewport.setChildIndex(tokenContainer, viewport.children.length - 1);
    
    console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    for (let i = 0; i < localMarkers.length; i++) {
        console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
        const elData = JSON.parse(localMarkers[i].dataset.eldata);
         const scaleFactor = .6;
            const width = 100 * scaleFactor;
            const height = 50 * scaleFactor;
            const strokeWidth = 3 * scaleFactor;
            const xpos = parseFloat(elData.xpos);
            const ypos = parseFloat(elData.ypos);

    const fontsize = Math.max(18, window.innerWidth / 50);  
    const text = new Text({
        text: 'placeholder',
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
    token.x = worldPos.x;
    token.y = worldPos.y;
    tokenContainer.addChild(token);
    // tokenContainer.setChildIndex(token, tokenContainer.children.length -1);
    token.onPress.connect((event) => {
        // console.log("pressed token " + JSON.stringify(token.data));
        }
    );
    }
    // console.log(tokenContainer.children);

 }
