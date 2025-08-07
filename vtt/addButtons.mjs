import { Assets, Graphics, Container } from 'pixi';

import { Button, ButtonContainer, FancyButton } from '@pixi/ui';

export async function addButtons(app, buttonData, uicontainer) {
    

console.log("tryna add buttons!");

  await Assets.addBundle('fonts', [
    { alias: 'Acme', src: '../../fonts/web/Acme.woff' }

  ]);
 const container = new Container();

    container.y = app.screen.height / 2;
    container.x = app.screen.width / 2;

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
    const text = new Text({
        text: 'Styled Text',
        style: {
        fontSize: 24,
        fill: 0xff1010, // Red color
        fontFamily: 'Arial',
        align: 'center', // Center alignment
        stroke: { color: '#4a1850', width: 5 }, // Purple stroke
        dropShadow: {
            color: '#000000', // Black shadow
            blur: 4, // Shadow blur
            distance: 6 // Shadow distance
            }
        }
    });

    const width = 200;
    const height = 100;
    const button = new FancyButton({
    defaultView: new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "SkyBlue", alpha: .75 }),
    hoverView: new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "LightBlue", alpha: .75 }),
    pressedView: new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "LightCoral", alpha: .75 }),
    disabledView: new Graphics()
    .roundRect(0, 0, width, height, 25)
    .fill({ color: "DarkGray", alpha: .75 }),
    width: width,
    height: height,
    anchor: 0.5,
    text: 'text',

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

    container.addChild(button);
    app.stage.addChild(container);
    button.onPress.connect(() => console.log('onPress'));

}