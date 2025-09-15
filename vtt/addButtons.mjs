import { Assets, Graphics, Container, Text } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';

import { PrimaryAudioPlayPauseToggle, ReturnTimedEventsListenerMode, PrimaryAudioIsPlaying, isPlaying } from '../connect/media.js';
import { addBackgroundPictures } from './addBackground.mjs';
import { app, viewport, hasBgMap, font1, stripExtension, hasAudioViz } from './vtt_main.mjs';
import { InitAnalyzer } from './vtt_audioViz.mjs';
// export let isPlaying = false;
// import 

let buttonContainer = new Container();

export function addSimplePlayButton(app, buttonData, uicontainer) {
    let buttonText = new Text({
        text: 'Play',
        style: {
        fill: '#ffffff',
        fontSize: 48,
        fontFamily: stripExtension(font1),
        stroke: { color: '#4a1850', width: 5, join: 'round' },
            dropShadow: {
            color: '#000000',
            blur: 4,
            angle: Math.PI / 6,
            distance: 6,
            }
        }
    });
   
    buttonContainer.interactive = true;
    app.stage.addChild(buttonContainer);
    buttonContainer.addChild(buttonText);

    buttonText.interactive = true;
    buttonText.eventMode = 'dynamic';
    buttonText.alpha = .75;
    // playButton.y = container.height + 300;
    buttonText.anchor = .5;
    buttonText.y = window.innerHeight - (window.innerHeight  * .15);
    buttonText.x = window.innerWidth / 2;

        // buttonText.onPress.connect(() => 
        //     // console.log('Button pressed!');``
        //     PlayPauseToggle(buttonText)
        // );
    buttonText.on('pointerdown', (event) => {
        console.log('Button down!');
        PlayPauseToggle(buttonText);
    });
    buttonText.on('pointerover', (event) => {
                console.log('Button over');
        buttonText.tint = 'skyblue';
        // PlayPauseToggle(buttonText);
    });
    
}

export function addPlayButton(app, buttonData, uicontainer) {

    // if (ReturnTimedEventsListenerMode() == "None") {
    //     return;
    // }
    console.log("tryna add buttons!");

// await Assets.addBundle('fonts', [{ alias: 'Acme', src: '../../fonts/web/Acme.woff' }]);
 


    // buttonContainer.y = uicontainer.height - (uicontainer.height * .1);
    // buttonContainer.x = uicontainer.width / 2;
        // buttonContainer.interactive = true;


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

    const scaleFactor = app.stage.width / 1200;
    const width = 100 * scaleFactor;
    const height = 50 * scaleFactor;
    const strokeWidth = 3 * scaleFactor;

    const playButton = new FancyButton({
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
   

        text.interactive = false;
    text.eventMode = 'none';
    buttonContainer.addChild(playButton);
    
    playButton.interactive = true;
    playButton.eventMode = 'static';
    playButton.alpha = .5;
    // playButton.y = container.height + 300;

    playButton.y = window.innerHeight - (window.innerHeight  * .125);;
    playButton.x = window.innerWidth / 2;

    // playButton.onPress.connect(() => 
    playButton.onPress.connect(() => console.log('Button pressed!'));
    playButton.on('pointerdown', (event) => {
        // console.log('onPress');
    PlayPauseToggle(playButton);
    // if (isPlaying) {
       
    // }

    });
}

async function PlayPauseToggle(playButton) {
    console.log("playPauseToggle w timedEvents Mode " + ReturnTimedEventsListenerMode());
    // if (ReturnTimedEventsListenerMode() == "Primary Audio") {
    //     PrimaryAudioPlayPauseToggle();
    //     isPlaying = await PrimaryAudioIsPlaying();
    
    // } else { //umm, later...
    //     PrimaryAudioPlayPauseToggle();
    //     isPlaying = await PrimaryAudioIsPlaying();
    // }
    addBackgroundPictures(app);
    PrimaryAudioPlayPauseToggle();
    
    if (isPlaying) {
        // playButton.defaultView.tint = 0xfc03b6; //({ color: "Yellow", alpha: .75 });
        // playButton.options.text.text = "Pause";
        // playButton.alpha = .1;
        playButton.tint = '0xfc03b6';
        playButton.text = "Pause";
        if (hasAudioViz) {
            InitAnalyzer();
        }
    } else {
         playButton.tint = 'white';
        playButton.text = "Play";
        // playButton.options.defaultView.tint = 0x538a72;
        //  playButton.options.text.text = "Play";
                playButton.alpha = .75; 
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