import { Text, TextStyle, Assets } from 'pixi';

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
export function addText(app) {

const myText = new Text({
    text: 'Hello PixiJS!',
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

myText.x = app.screen.width / 2;
myText.y = app.screen.height / 2;
console.log("tryna set pixi text")
app.stage.addChild(myText);


}