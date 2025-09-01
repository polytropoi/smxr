import { Text, TextStyle, Assets, Container } from 'pixi';
import { fontFillColor, fontFillColorAlt, font1, stripExtension } from './vtt_main.mjs';
// import { ReturnUserProfile } from '../connect/vtt.js';
// Load font before use
// await Assets.load({
//     src: '../../fonts/web/Acme.woff',
//     // data: {
//     //     family: 'MyFont', // optional
//     // }
// });



// let userProfile;

    // const text3 = new Text({ text: 'Dotrice Regular.woff', style: { fontFamily: 'Dotrice Regular', fontSize: 50 } });
export function addText(app, textData, uicontainer) {

    console.log("font 1 iis " + font1); 
    const newFontSize = Math.max(16, window.innerWidth / 20); 
    const newSmallFontSize = Math.max(16, window.innerWidth / 30); 
    const greetingText = new Text({
        text: textData.split("~")[0],
        style: {
        fill: fontFillColor,
        fontSize: newFontSize,
        fontFamily: stripExtension(font1),
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

    const questText = new Text({
        text: textData.split("~")[1],
        style: {
        fill: fontFillColor,
        fontSize: newSmallFontSize,
        fontFamily: stripExtension(font1),
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

   

    greetingText.y = app.screen.height * .075;
    questText.y = app.screen.height * .2;


    // playerText.y += 20;

    uicontainer.addChild(greetingText, questText);
}

export function addPlayerProfileText (app, userProfile, uicontainer) {
    let playerGreeting;
    let localPlayerState;
    // console.log("userProfile " + userProfile.avatarName);


    if (userProfile && userProfile.playerState) {
        localPlayerState = "health: " + userProfile.playerState.health.toString() + "% - mana: " + userProfile.playerState.mana.toString() + "%\n";
        playerGreeting = "Welcome back " + userProfile.avatarName + "!\n"
    } 
    const newSmallFontSize = Math.max(16, window.innerWidth / 50); 
    const playerText = new Text({
        text: playerGreeting + "  " + localPlayerState,
        style: {
        fill: fontFillColor,
        fontSize: newSmallFontSize,
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
    playerText.anchor.x = .5;
    // playerText.y = app.screen.height - (app.screen.height * .2);
    playerText.y = app.screen.height * .75;
    uicontainer.addChild(playerText);

            setTimeout(() =>  {
              HideSplashTexts(uicontainer);
            }, 4000);
}

export function HideSplashTexts(uicontainer) {
    uicontainer.removeChildren();
}

function clamp(num, lower, upper) {
  return Math.min(Math.max(num, lower), upper);
}

let newFontSize = Math.max(16, window.innerWidth / 20); 
let eventText;
let textContainer;
let timeout;

export function addEventText(app, textData, uicontainer) {

    const randomFudge = Math.random();
    const clampedFudge = clamp(randomFudge, .85, 1);
    newFontSize = newFontSize * clampedFudge;
    if (timeout) {
        clearTimeout(timeout);
    }
    
    if (!eventText) {
        eventText = new Text({
            text: textData.keydata,
            style: {
            fill: fontFillColorAlt,
            fontSize: newFontSize,
            fontFamily: stripExtension(font1),
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
        textContainer = new Container();
        textContainer.addChild(eventText);
        app.stage.addChild(textContainer);
    } else {
        eventText.text = textData.keydata;
    }
    textContainer.anchor = .5;

    const randomSignY = Math.random();
    const randomSignX = Math.random();
    
    const randomY = (randomSignY > .5) ? (Math.random()) : (Math.random()) * -1;  
    const randomX = (randomSignX > .5) ? (Math.random()) : (Math.random()) * -1;  

    
    console.log("tryuna set eventtext " + randomY + " " + randomX);


    eventText.y = window.innerHeight / 2 + (randomY * 250);
    eventText.x = window.innerWidth / 2 + (randomX * 250);

    if (textData.keyduration) {
        timeout = setTimeout(() =>  {
            eventText.text = "";
        }, textData.keyduration * 1000);
    }
    

    // playerText.y += 20;


}
