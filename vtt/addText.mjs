import { Text, TextStyle, Assets, Container } from 'pixi';

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

await Assets.loadBundle('fonts');
    // const text3 = new Text({ text: 'Dotrice Regular.woff', style: { fontFamily: 'Dotrice Regular', fontSize: 50 } });
export function addText(textData, uicontainer) {


    const greetingText = new Text({
        text: textData.split("~")[0],
        style: {
        fill: '#ffffff',
        fontSize: 100,
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
    // greetingText.width = 500;
    // greetingText.height = 300;
    greetingText.y -= 200;
    questText.y -= 100
    uicontainer.addChild(greetingText, questText);




}