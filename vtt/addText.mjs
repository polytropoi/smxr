import { Text, TextStyle, Assets, Container } from 'pixi';
// import { ReturnUserProfile } from '../connect/vtt.js';
// Load font before use
// await Assets.load({
//     src: '../../fonts/web/Acme.woff',
//     // data: {
//     //     family: 'MyFont', // optional
//     // }
// });

  Assets.addBundle('fonts', [
    { alias: 'Acme', src: '../../fonts/web/Acme.woff' }

  ]);

// let userProfile;
await Assets.loadBundle('fonts');
    // const text3 = new Text({ text: 'Dotrice Regular.woff', style: { fontFamily: 'Dotrice Regular', fontSize: 50 } });
export function addText(app, textData, uicontainer) {

        const newFontSize = Math.max(16, window.innerWidth / 20); 
                const newSmallFontSize = Math.max(16, window.innerWidth / 30); 
    const greetingText = new Text({
        text: textData.split("~")[0],
        style: {
        fill: '#ffffff',
        fontSize: newFontSize,
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

    const questText = new Text({
        text: textData.split("~")[1],
        style: {
        fill: '#ffffff',
        fontSize: newSmallFontSize,
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
        fill: '#ffffff',
        fontSize: newSmallFontSize,
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
    playerText.anchor.x = .5;
    // playerText.y = app.screen.height - (app.screen.height * .2);
    playerText.y = app.screen.height * .5;
    uicontainer.addChild(playerText);

            setTimeout(() =>  {
              HideSplashTexts(uicontainer);
            }, 5000);
}

export function HideSplashTexts(uicontainer) {
    uicontainer.removeChildren();
}

const newFontSize = Math.max(16, window.innerWidth / 20); 
let eventText;

export function addEventText(app, textData, uicontainer) {


    if (!eventText) {
        eventText = new Text({
            text: textData,
            style: {
            fill: '#ffffff',
            fontSize: newFontSize,
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
        uicontainer.addChild(eventText);
    } else {
        eventText.text = textData;
    }

    const randomSignY = Math.random();
    const randomSignX = Math.random();
    
    const randomY = (randomSignY > .5) ? (Math.random() / 1.5) : (Math.random() / 1.5) * -1;  
    const randomX = (randomSignX > .5) ? (Math.random() / 6) : (Math.random() /6) * -1;  

        console.log("tryuna set eventtext " + randomY + " " + randomX);
    eventText.y = app.screen.height * randomY;
    eventText.x = app.screen.width * randomX;

    // playerText.y += 20;


}
