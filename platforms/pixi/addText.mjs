import { Text, TextStyle, Assets, Container } from 'pixi';
import { fontFillColor, fontFillColorAlt, font1, stripExtension, app, viewport } from './vtt_main.mjs';
import { settings } from '../../../connect/settings.js';
// import { ReturnUserProfile } from '../connect/vtt.js';
// Load font before use
// await Assets.load({
//     src: '../../fonts/web/Acme.woff',
//     // data: {
//     //     family: 'MyFont', // optional
//     // }
// });



// let userProfile;
    
    let textContainer = new Container();

    // const text3 = new Text({ text: 'Dotrice Regular.woff', style: { fontFamily: 'Dotrice Regular', fontSize: 50 } });
export function addText(app, textData) {



      app.stage.addChild(textContainer);
//   textContainer.anchor.x = .5;
//   textContainer.width = window.innerWidth;
//   textContainer.height = window.innerHeight;
// //     // textContainer.height = app.stage.height;
//     // textContainer.x = app.stage.width / 2;
//         textContainer.x = 0;
//     textContainer.y = app.screen.height * .1;

    let t1 = "";
    let t2 = "";
    if (textData.split("~")[0]) {
        t1 = textData.split("~")[0];
    }
    if (textData.split("~")[1]) {
        t2 = textData.split("~")[1];
    }
    // t1 = 
    console.log("textData " + textData + " font 1 iis " + font1); 

            const newFontSize = Math.max(16, window.innerWidth / 20); 
        const newSmallFontSize = Math.max(16, window.innerWidth / 30); 
    if (t1 && t1 != "") {

        const greetingText = new Text({
            text: t1,
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

    greetingText.y = app.screen.height * .2;
     greetingText.x = app.screen.width / 2;
    textContainer.addChild(greetingText);

    }
    if (t2 && t2 != "") {
        const questText = new Text({
            text: t2,
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
        questText.y = app.screen.height * .3;
        questText.x = app.screen.width / 2;
        textContainer.addChild(questText);
    }



    //

    // 
        // questText.x = window.innerWidth/2;
    // questText.y = window.innerHeight * .2;





// questText.y = app.stage.height * .3;
    // playerText.y += 20;


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
        },
        anchor: .5
    });
    playerText.x = app.screen.width/ 2;
    // playerText.y = app.screen.height - (app.screen.height * .2);
    playerText.y = app.screen.height * .65;
    textContainer.addChild(playerText);
    if (settings && settings.sceneTags && (settings.sceneTags.includes("hide greeting") || settings.sceneTags.includes("greeting hide"))) {
        setTimeout(() =>  {
            HideSplashTexts(textContainer);
        }, 4000);
    } else {
        setTimeout(() =>  {
            textContainer.removeChild(playerText);
        }, 4000);
    }
}

export function HideSplashTexts(textContainer) {
    textContainer.removeChildren();
}

function clamp(num, lower, upper) {
  return Math.min(Math.max(num, lower), upper);
}

let newFontSize = Math.max(16, window.innerWidth / 20); 
let eventText;
let eventTextContainer;
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
        eventTextContainer = new Container();
        eventTextContainer.addChild(eventText);
        app.stage.addChild(eventTextContainer);
    } else {
        eventText.text = textData.keydata;
    }
    eventTextContainer.anchor = .5;

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
