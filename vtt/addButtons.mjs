import { Assets, Graphics, Container, Text } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';

import { PrimaryAudioPlayPauseToggle, ReturnTimedEventsListenerMode, PrimaryAudioIsPlaying } from '../connect/media.js';


export let isPlaying = false;

let playButton;
export async function addFancyButtons(app, buttonData, uicontainer) {

    if (ReturnTimedEventsListenerMode() == "None") {
        return;
    }
console.log("tryna add buttons!");

  await Assets.addBundle('fonts', [
    { alias: 'Acme', src: '../../fonts/web/Acme.woff' }

  ]);
 
  const container = new Container();

    container.y = app.screen.height - (app.screen.height * .1);
    container.x = app.screen.width / 2;

    // container.height = app.screen.height;
    // container.width = app.screen.width;
    //  const button = new Button(
    //       new Graphics()
    //           .rect(0, 0, 100, 50, 15)
    //           .fill(0xFFFFFF)
    //  );
    // const bGraphic1 = new Graphics();
    // bGraphic1.x = app.screen.width / 2;
    // bGraphic1.y = app.screen.height / 2;
    // bGraphic1.fill(0xFFFFFF);
    // bGraphic1.roundRect(500, 500, 100, 50, 15);
   
    const buttonText = new Text({
        text: 'Click me',
        style: {
        fill: '#ffffff',
        fontSize: 10,
        fontFamily: 'Acme',
        stroke: { color: '#4a1850', width: 5, join: 'round' },
            dropShadow: {
            color: '#000000',
            blur: 4,
            angle: Math.PI / 6,
            distance: 6,
            }
        }
    });

    const fontsize = Math.max(16, window.innerWidth / 50); 
    const text = new Text({
        text: 'Play',
        style: {
        fontSize: fontsize,
        fill: 'white', // Red color
        fontFamily: 'Acme',
        align: 'center', // Center alignment
        stroke: { color: 'black', width: 2 }, // Purple stroke
        dropShadow: {
            color: '#000000', // Black shadow
            blur: 2, // Shadow blur
            distance: 2 // Shadow distance
            }
        }
    });

    const scaleFactor = app.stage.width / 1500;
    const width = 100 * scaleFactor;
    const height = 50 * scaleFactor;
    const strokeWidth = 3 * scaleFactor;

    playButton = new FancyButton({
        defaultView: new Graphics()
        .roundRect(0, 0, width, height, 25)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "SkyBlue", alpha: .75 }),
        hoverView: new Graphics()
        .roundRect(0, 0, width, height, 25)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightBlue", alpha: .75 }),
        pressedView: new Graphics()
        .roundRect(0, 0, width, height, 25)
        .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "LightCoral", alpha: .75 }),
        disabledView: new Graphics()
        .roundRect(0, 0, width, height, 25)
            .stroke({ color: 'black', width: strokeWidth })
        .fill({ color: "DarkGray", alpha: .75 }),
        width: width,
        height: height,
    
        anchor: 0.5,
        text: text,

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

    container.addChild(playButton);

    app.stage.addChild(container);
    // playButton.y = container.height + 300;

    // playButton.y = window.innerHeight - (window.innerHeight  * .1);;

    playButton.onPress.connect(() => 
        // console.log('onPress');
    PlayPauseToggle()
    // if (isPlaying) {
       
    // }

    );
}

async function PlayPauseToggle() {
    console.log("timedEvents Mode " + ReturnTimedEventsListenerMode());
    if (ReturnTimedEventsListenerMode() == "Primary Audio") {
        PrimaryAudioPlayPauseToggle();
        isPlaying = await PrimaryAudioIsPlaying();
    
    } else { //umm, later...
        PrimaryAudioPlayPauseToggle();
        isPlaying = await PrimaryAudioIsPlaying();
    }

    if (isPlaying) {
        playButton.defaultView.tint = 0xfc03b6; //({ color: "Yellow", alpha: .75 });
        playButton.options.text.text = "Pause";
    } else {
        playButton.options.defaultView.tint = 0x538a72;
         playButton.options.text.text = "Play";
    }
}

export async function addButtons(app, buttonData, uicontainer) {

    console.log("tryna add buttons!");

  await Assets.addBundle('fonts', [{ alias: 'Acme', src: '../../fonts/web/Acme.woff' }]);
    const width = 200;
    const height = 100;
    const defaultButton = new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "SkyBlue", alpha: .75 });

    const hoverButton = new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "LightBlue", alpha: .75 });
    
    const pressedButton = new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "LightCoral", alpha: .75 });
    
    const disabledButton = new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "DarkGray", alpha: .75 });
    const fontsize = Math.max(16, window.innerWidth / 20); 
    const buttonText = new Text({
        text: "Click Me",
        style: {
        fill: '#ffffff',
        fontSize: fontsize,
        fontFamily: 'Acme',
        stroke: { color: '#4a1850', width: 5, join: 'round' },
            dropShadow: {
            color: '#000000',
            blur: 4,
            angle: Math.PI / 6,
            distance: 6,
            }
        },
        anchor: 0.5
    });


    const container = new Container();
    container.y = app.screen.height / 2;
    container.x = app.screen.width / 2;

    container.addChild(defaultButton, buttonText);
    app.stage.addChild(container);
}