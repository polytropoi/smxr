import AudioMotionAnalyzer from 'https://cdn.skypack.dev/audiomotion-analyzer?min';
import { primaryAudioElement } from '../connect/media.js';



// audio source
// const audioEl = document.getElementById('audio');

// instantiate analyzer
let audioMotion;
export function InitAnalyzer () {

  if (primaryAudioElement && !audioMotion) {
    audioMotion = new AudioMotionAnalyzer(
      document.getElementById('audioVizContainer'),
      {
        mode: 5,
			barSpace: .25,
			bgAlpha: .5,
			colorMode: 'gradient',
			gradient: 'prism',
			ledBars: false,
			lumiBars: false,
			maxFreq: 16000,
			radial: false,
			reflexAlpha: .5,
			reflexFit: true,
			reflexRatio: .1,
			showBgColor: false,
			showPeaks: true,
			overlay: true,
			outlineBars: true,
      alphaBars: true,
       source: primaryAudioElement
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

      }
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