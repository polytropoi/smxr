//// troika not ready for webgpu yet...
// import {Text} from 'troika-three-text' 

// import { defineWorkerModule }     from 'troika-worker-utils'; 
// import * as THREE from 'three';
// import { Container } from '@pmndrs/uikit'
import * as THREE from 'three';
import { Text } from 'three-text/three';


// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const { Text } = require('three-text/three');

import {scene, camera, renderer, navmesh} from './three_main.mjs';

// import * as THREE from 'three';
Text.setHarfBuzzPath('/fonts/hb.wasm');

export async function NewGeoText (textString) {

const result = await Text.create({
  text: textString,
  font: '../../fonts/web/Acme.woff',
  depth: .1,
  size: 6
});

console.log("gotsa text result " + result.text);
const material = new THREE.MeshBasicMaterial({ color: 'hotpink', transparent: true, opacity: .5 });
const mesh = new THREE.Mesh(result.geometry, material);
scene.add(mesh);
mesh.position.set(0, 0, -10);

}
// import { Container, Text } from "@pmndrs/uikit";


// import ThreeMeshUI from 'three-mesh-ui';




export function SplashText (textString) {
    const myText = new Text()
    myScene.add(myText)

    // Set properties to configure:
    myText.text = textString;
    myText.fontSize = 10
    myText.position.z = -20
    myText.color = 0x9966FF

    // Update the rendering:
    myText.sync()
}


// export function TestText (textString) {
// 	const container = new ThreeMeshUI.Block({
// 		width: 1.2,
// 		height: 0.5,
// 		padding: 0.05,
// 		justifyContent: 'center',
// 		alignContent: 'left',
// 		fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
// 		fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png'
// 	});

// 	container.position.set( 0, 0, 0 );
// 	container.rotation.x = -0.3;
// //

// const text = new ThreeMeshUI.Text({
//  content: "Some text to be displayed"
// });

// container.add( text );

// // scene is a THREE.Scene (see three.js)
// scene.add( container );

// // This is typically done in the render loop :
// ThreeMeshUI.update();
// }

// Root container – add it to the scene; call root.update in your loop
export function InitReticle () {
    const material = new THREE.LineBasicMaterial({ color: 0xAAFFAA }); // Green color
const x = 0.01, y = 0.01; // Adjust size as needed

const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
    // Vertical line
    0, y, 0,
    0, -y, 0,
    // Center point (optional)
    // 0, 0, 0,
    // Horizontal line
    x, 0, 0,
    -x, 0, 0
]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// Use THREE.LineSegments for disconnected lines
const reticle = new THREE.LineSegments(geometry, material); 

return reticle;
}

export function UpdateText (string) { //uikit, no workie (use vite, they say...)
    const root = new Container({
    backgroundColor: "red",
    sizeX: 8,
    sizeY: 4,
    flexDirection: "row",
    })
    scene.add(root)

    const container1 = new Container({
    flexGrow: 1,
    margin: 32,
    backgroundColor: "green",
    })
    root.add(container1)

    const container2 = new Container({
    flexGrow: 1,
    margin: 32,
    backgroundColor: "blue",
    })
    root.add(container2);

    renderer.setAnimationLoop(animation)
    // renderer.localClippingEnabled = true
    // renderer.setTransparentSort(reversePainterSortStable)

    function updateSize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    let prev;
    function animation(time) {
    const delta = prev == null ? 0 : time - prev
    prev = time
    root.update(delta)
    renderer.render(scene, camera)
    }
}
