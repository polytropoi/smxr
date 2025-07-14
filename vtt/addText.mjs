import { Text, TextStyle, Assets, Container } from 'pixi';
import { ReturnUserProfile } from '../connect/vtt.js';
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

let userProfile;
await Assets.loadBundle('fonts');
    // const text3 = new Text({ text: 'Dotrice Regular.woff', style: { fontFamily: 'Dotrice Regular', fontSize: 50 } });
export async function addText(textData, uicontainer) {


    const greetingText = new Text({
        text: textData.split("~")[0],
        style: {
        fill: '#ffffff',
        fontSize: 50,
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
        fontSize: 25,
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

   
    // greetingText.width = 500;
    // greetingText.height = 300;


    // let playerGreeting;
    // let localPlayerState;
    // // console.log("userProfile " + userProfile.avatarName);
    // userProfile = await ReturnUserProfile();

    // if (userProfile && userProfile.playerState) {
    //     localPlayerState = "health: " + userProfile.playerState.health.toString() + "% - mana: " + userProfile.playerState.mana.toString() + "%\n";
    //     playerGreeting = "Welcome back " + userProfile.avatarName + "!\n"
    // } 

    // const playerText = new Text({
    //     text: playerGreeting + "\n" + localPlayerState,
    //     style: {
    //     fill: '#ffffff',
    //     fontSize: 25,
    //     fontFamily: 'Acme',
    //     stroke: { color: '#4a1850', width: 5, join: 'round' },
    //         dropShadow: {
    //         color: '#000000',
    //         blur: 4,
    //         angle: Math.PI / 6,
    //         distance: 6,
    //         }
    //     },
    //     anchor: 0.5
    // });

    greetingText.y -= 100;
    questText.y -= 50;
    // playerText.y += 20;

    uicontainer.addChild(greetingText, questText);


}