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
        tokenContainer = new Container();
        tokenContainer.anchor = .5;
        tokenContainer.width = viewport.worldWidth;
        tokenContainer.height = viewport.worldHeight;
        spritesContainer.addChild(tokenContainer);
        spritesContainer.setChildIndex(tokenContainer, 0);
    }
    console.log("localMarkers found " + localMarkers.length + " viewport is " + viewport.worldWidth + " " + viewport.worldHeight);
    for (let i = 0; i < localMarkers.length; i++) {
        console.log("localMarker " + localMarkers[i].id + " data " + localMarkers[i].dataset.eldata);
        const elData = JSON.parse(localMarkers[i].dataset.eldata);
         const scaleFactor = .25;
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
    

    const globalPos = {x: xpos, y: ypos};
    const worldPos = viewport.toLocal(globalPos);
        console.log("tryna set token position " + xpos + "  " + ypos + " " + worldPos.x + " " + worldPos.y);
    // token.position.set(worldPos.x,worldPos.y);
    token.x = worldPos.x;
    token.y = worldPos.y;
viewport.addChild(token);
    token.onPress.connect((event) => {
        // console.log("pressed token " + JSON.stringify(token.data));
        }
    );
    }
    console.log(tokenContainer.children);
    //     viewport.animate({
    //   // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   scale: 1, // Target zoom level
    //   time: 1000, // Animation duration of 1 second
    //   ease: 'easeInOutQuad', // Using a common easing function
    //   callbackOnComplete: () => {
    //     console.log("Animation completed!");
       
    //     // Perform actions after animation finishes
    //   }
    // });
 }
