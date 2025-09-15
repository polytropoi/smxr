import { Assets, Graphics, Container, Text } from 'pixi';
import { eventEl } from '../connect/events.js';
import AudioMotionAnalyzer from 'https://cdn.skypack.dev/audiomotion-analyzer?min';
import { primaryAudioElement } from '../connect/media.js';

import { Select } from '@pixi/ui';
import { app} from './vtt_main.mjs';


  eventEl.addEventListener('audio-viz', onAudioVizInit);

  function onAudioVizInit(event) {
    AudioVizMode(event.details);
  }
// audio source
// const audioEl = document.getElementById('audio');

// instantiate analyzer
let audioMotion;
let avizButtonsContainer = new Container();
// const view = new Container();
    const bgColor = 0x000000;
    const fColor = 0xffffff;
    const ddBgColor = 0x000000;
    const width = 300;
    const height = 75;
    const radius = 30;
    const hoverColor = 0x333333;
    const textStyle = {
      fill: fColor,
      fontSize: 20
    };

export function addAudioVizSelect () {
    // const items = ['Reflex Bars','Radial Inverse','Mirror Waves','Classic LEDs'];
    const dropDown = new Select({
       closedBG: getClosedBG(bgColor, width, height, radius),
      openBG: getOpenBG(ddBgColor, width, height, radius),
        textStyle: { fill: 0xffffff, fontSize: 20 },
        items: {
            items,
            backgroundColor: 0x000000,
            hoverColor: 0x000000,
            width: 200,
            height: 50,
        },
        scrollBox: {
            width: 200,
            height: 350,
            radius: 30,
        },
    });

        avizButtonsContainer.interactive = true;
    app.stage.addChild(avizButtonsContainer);
    avizButtonsContainer.addChild(dropDown);

    dropDown.interactive = true;
    dropDown.eventMode = 'dynamic';
    dropDown.alpha = .75;
    // playButton.y = container.height + 300;
    dropDown.anchor = .5;
    dropDown.y = window.innerHeight - (window.innerHeight  * .85);
    dropDown.x = window.innerWidth - (window.innerWidth  * .85);;

        // buttonText.onPress.connect(() => 
        //     // console.log('Button pressed!');``
        //     PlayPauseToggle(buttonText)
        // );
    // buttonText.on('pointerdown', (event) => {
    //     console.log('Button down!');
    //     PlayPauseToggle(buttonText);
    // });
    // dropDown.on('onSelect', (event) => {
    //   event.text
    // });

}

function getClosedBG(backgroundColor, width, height, radius) {
  const closedBG = new Graphics().roundRect(0, 0, width, height, radius).fill(backgroundColor);
  // preload(['arrow_down.png']).then(() => {
  //   const arrowDown = Sprite.from('arrow_down.png');
  //   arrowDown.anchor.set(0.5);
  //   arrowDown.x = width * 0.9;
  //   arrowDown.y = height / 2;
  //   closedBG.addChild(arrowDown);
  // });
  return closedBG;
}
function getOpenBG(backgroundColor, width, height, radius) {
  const openBG = new Graphics().roundRect(0, 0, width, height * 6, radius).fill(backgroundColor);
  // preload(['arrow_down.png']).then(() => {
  //   const arrowUp = Sprite.from('arrow_down.png');
  //   arrowUp.angle = 180;
  //   arrowUp.anchor.set(0.5);
  //   arrowUp.x = width * 0.9;
  //   arrowUp.y = height / 2;
  //   openBG.addChild(arrowUp);
  // });
  return openBG;
}
let presetIndex = -1;

export function AudioVizMode (mode) {

  if (mode == 'Classic LEDs') {
    presetIndex = 0;
  }
  if (mode == 'Mirror Wave') {
    presetIndex = 1;
  }
  if (mode == 'Radial Inverse') {
    presetIndex = 2;
  }
  if (mode == 'Reflex Bars') {
    presetIndex = 3;
  }
}
export function InitAnalyzer () {


  const presets = [
    // {
    //   name: 'Defaults',
    //   options: undefined
    // },
    {
      name: 'Classic LEDs',
      options: {
        mode: 3,
        barSpace: .5,
        bgAlpha: 0,
        colorMode: 'gradient',
        gradient: 'prism',
        ledBars: true,
        lumiBars: false,
        alphaBars: true,
        maxFreq: 16000,
        radial: false,
        reflexRatio: 0,
        showBgColor: true,
        showPeaks: true,
        overlay: true,
        source: primaryAudioElement
      }
    },
    {
      name: 'Mirror wave',
      options: {
        mode: 10,
        bgAlpha: .7,
        fillAlpha: .3,
        alphaBars: true,
        gradient: 'rainbow',
        lineWidth: 2,
        lumiBars: false,
        maxFreq: 16000,
        radial: false,
        reflexAlpha: 1,
        reflexBright: 1,
        reflexRatio: .5,
        showBgColor: false,
        showPeaks: false,
        overlay: true,
        source: primaryAudioElement
      }
    },
    {
      name: 'Radial inverse',
      options: {
        mode: 3,
        barSpace: .25,
        bgAlpha: 0,
        fillAlpha: .5,
        gradient: 'prism',
        ledBars: false,
        alphaBars: true,
        linearAmplitude: true,
        linearBoost: 1.8,
        lineWidth: 1.5,
        maxDecibels: -30,
        maxFreq: 16000,
        radial: true,
        radialInvert: true,
        showBgColor: true,
        showPeaks: true,
        spinSpeed: 2,
        outlineBars: true,
        overlay: true,
        weightingFilter: 'D',
        source: primaryAudioElement
      }
    },
    {
      name: 'Reflex Bars',
      options: {
        mode: 5,
        barSpace: .25,
        bgAlpha: .5,
        colorMode: 'bar-level',
        gradient: 'prism',
        ledBars: false,
        lumiBars: false,
        maxFreq: 16000,
        radial: false,
        reflexAlpha: .5,
        reflexFit: true,
        reflexRatio: .3,
        showBgColor: false,
        showPeaks: true,
        overlay: true,
        outlineBars: false,
        alphaBars: true,
        source: primaryAudioElement
      }
    }
  ];


    if (presetIndex == -1) {
         presetIndex = Math.floor(Math.random() * presets.length);
    }

  if (primaryAudioElement && !audioMotion) {
    // addAudioVizSelect();


    audioMotion = new AudioMotionAnalyzer(
      document.getElementById('audioVizContainer'),
      presets[presetIndex].options
      // {
      //   mode: 10,
      // bgAlpha: .7,
      // fillAlpha: .6,
      // gradient: 'rainbow',
      // lineWidth: 2,
      // lumiBars: false,
      // maxFreq: 16000,
      // radial: false,
      // reflexAlpha: 1,
      // reflexBright: 1,
      // reflexRatio: .5,
      // showBgColor: false,
      // showPeaks: false,
      // overlay: true,
            //   mode: 5,
            // barSpace: .25,
            // bgAlpha: .5,
            // colorMode: 'gradient',
            // gradient: 'prism',
            // ledBars: false,
            // lumiBars: false,
            // maxFreq: 16000,
            // radial: false,
            // reflexAlpha: .5,
            // reflexFit: true,
            // reflexRatio: .1,
            // showBgColor: false,
            // showPeaks: true,
            // overlay: true,
            // outlineBars: true,
            // alphaBars: true,
            // source: primaryAudioElement
        // source: primaryAudioElement,
        // height: window.innerHeight - 50,
        // preset: 'Reflex Bars',
        // // you can set other options below - check the docs!
        // mode: 3,
        // barSpace: .6,
        // ledBars: true,
        // alphaBars: true,
        // roundBars: true,
        // overlay: true,
        // showBgColor: false,
        // // onCanvasDraw: energyMeters,
        // colorMode: 'gradient',
        // channelLayout: 'dual-horizontal',
        // linearAmplitude: true,
        // showPeaks: true

      // }
    );

  } else {
    console.log("primaryAudioElement not found, or audioMotion initialized..");
  }
}

// callback function
function energyMeters() {
  const canvas     = audioMotion.canvas,
        ctx        = audioMotion.canvasCtx,
        pixelRatio = audioMotion.pixelRatio,
        baseSize   = Math.max( 20 * pixelRatio, canvas.height / 27 | 0 ),
        centerX    = canvas.width >> 1,
        centerY    = canvas.height >> 1;

  // helper function
  const drawLight = ( posX, color, alpha ) => {

    const width       = 50 * pixelRatio,
          halfWidth   = width >> 1,
          doubleWidth = width << 1;

    const grad = ctx.createLinearGradient( 0, 0, 0, canvas.height );
    grad.addColorStop( 0, color );
    grad.addColorStop( .75, `${color}0` );

    ctx.beginPath();
    ctx.moveTo( posX - halfWidth, 0 );
    ctx.lineTo( posX - doubleWidth, canvas.height );
    ctx.lineTo( posX + doubleWidth, canvas.height );
    ctx.lineTo( posX + halfWidth, 0 );

    ctx.save();
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 40;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
  }

  // bass, midrange and treble meters

  ctx.fillStyle = '#fff8';
  ctx.textAlign = 'center';
  const growSize = baseSize * 4;

  const bassEnergy = audioMotion.getEnergy('bass');
  ctx.font = `bold ${ baseSize + growSize * bassEnergy }px sans-serif`;
  ctx.fillText( 'BASS', canvas.width * .15, centerY );
  drawLight( canvas.width * .15, '#f00', bassEnergy );

  drawLight( canvas.width * .325, '#f80', audioMotion.getEnergy('lowMid') );

  const midEnergy = audioMotion.getEnergy('mid');
  ctx.font = `bold ${ baseSize + growSize * midEnergy }px sans-serif`;
  ctx.fillText( 'MIDRANGE', centerX, centerY );
  drawLight( centerX, '#ff0', midEnergy );

  drawLight( canvas.width * .675, '#0f0', audioMotion.getEnergy('highMid') );

  const trebleEnergy = audioMotion.getEnergy('treble');
  ctx.font = `bold ${ baseSize + growSize * trebleEnergy }px sans-serif`;
  ctx.fillText( 'TREBLE', canvas.width * .85, centerY );
  drawLight( canvas.width * .85, '#0ff', trebleEnergy );
}



// // display module version
// document.getElementById('version').innerText = `v${AudioMotionAnalyzer.version}`;

// // play stream
// document.getElementById('live').addEventListener( 'click', () => {
//   audioEl.src = 'https://icecast2.ufpel.edu.br/live';
//   audioEl.play();
// });

// // file upload
// document.getElementById('upload').addEventListener( 'change', e => {
// 	const fileBlob = e.target.files[0];

// 	if ( fileBlob ) {
// 		audioEl.src = URL.createObjectURL( fileBlob );
// 		audioEl.play();
// 	}
// });