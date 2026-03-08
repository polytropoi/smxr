//// troika not ready for webgpu yet...
// import {Text} from 'troika-three-text' 

import * as THREE from 'three';
import { Text } from 'three-text/three'; //not troika!
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
Text.setHarfBuzzPath('/fonts/hb.wasm'); //!
Text.init();

import {scene, renderer} from './three_main.mjs';

import {camera} from './three_controls.js';

export let lookAtCameraObjects = [];

export let textContainers = [];

export async function ThreeDeeText (textString, size, parent, position, distance, persist, parentScale) { //

    let scaleFactor = .5;
    if (distance) {
        if (distance > 1) {
            scaleFactor = distance * .05;
            if (parentScale) {
                scaleFactor = scaleFactor/parentScale;
            }
        }
    }

    let textContainer;
    if (parent) {  
       textContainer = parent.getObjectByName('textContainer');
        if (textContainer) {
            console.log("gotsa textContainer!");
            parent.updateMatrixWorld(true);
            parent.worldToLocal(position);
            console.log("ui scale " + scaleFactor);
            textContainer.visible = true;
            textContainer.position.set(position.x, position.y, position.z + 1);
            textContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);
            return;
        }
    } else {
        console.log("init textContainer for " + textString);
    } 
    // if (!size) {
    //     size = 100;
    // }
    if (!textString) {
        textString = "Jello! - My name is Inigo Montoya...";
    }
    const splitString = textString.split("_");
    if (splitString[1]) {
        textString = splitString[1];
    }
    const stringCount = textString.toString().length;
    // const width = stringCount < 6 ? stringCount : 6;
    const width = 6;
    console.log("tryna set ui size " + size + " width " + width + " stringcount " + stringCount);
    const text = await Text.create({
        // width: 1,
        text: textString,
        font: '../../fonts/web/Acme.woff',
        depth: 0.02,
        // align: 'center',
        size: size,
        // size: size,
        removeOverlaps: true,
        layout: {
            width: width,
            align: 'left'
        }
    });


    console.log("gotsa text result " + text.measureTextWidth(textString) + " bounds " + JSON.stringify(text.planeBounds));
    let material = new THREE.MeshPhysicalMaterial({ color: 'black', transparent: true, opacity: .95 });
          material.roughness = 0.1;
      material.metalness = 0.3;
      material.envMap = scene.environment;
      material.envMapIntensity = 2;
    const textmesh = new THREE.Mesh(text.geometry, material);
    const ranges = text.query({
    byCharRange: [
        { start: 0, end: 20 },   // First 5 characters
        // { start: 10, end: 20 }, // Characters 10-20
    ],
    });
    const yscale = (Math.abs(text.planeBounds.min.y) * 1.5) + 1
    const container = new THREE.Object3D();
    container.name = "textContainer";
    if (!persist) {
        textContainers.push(container);
    }
   
    if (parent) { // callout or header, no bg?
        

        let material = new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: .5 });
        material.roughness = 0.1;
        material.metalness = 0.3;
        material.envMap = scene.environment;
        material.envMapIntensity = 2;
        const textmesh = new THREE.Mesh(text.geometry, material);
        container.add(textmesh);
        parent.add(container);

        // const camPos = camera.position.clone();
        console.log("textContainer position is " + JSON.stringify(position));
        parent.updateMatrixWorld(true);
       
        // const targetWorldPosition = new THREE.Vector3();

        if (position) {
            parent.worldToLocal(position);
            
            console.log("position is " + JSON.stringify(position));
            // container.position.set(0,4,0);
            // container.position.copy(position);
            // textmesh.position.set(0,0,0);
            container.position.copy(position);
        } else {
            container.position.set(0,4,0);
            
            textmesh.position.set(0,0,0);
        }

    } else {

        let material = new THREE.MeshPhysicalMaterial({ color: 'black', transparent: true, opacity: .95 });
        material.roughness = 0.1;
        material.metalness = 0.3;
        material.envMap = scene.environment;
        material.envMapIntensity = 2;
        const textmesh = new THREE.Mesh(text.geometry, material);
        const bggeo = new RoundedBoxGeometry(7,yscale,.2, 7, 90); //add background panel
        const bgmat = new THREE.MeshPhysicalMaterial({ color: 'white', transparent: true, opacity: .5 });
        const bgmesh = new THREE.Mesh(bggeo, bgmat);

        container.add(textmesh, bgmesh);
        scene.add(container);
        const camPos = camera.position.clone();
        container.position.set(camPos.x, camPos.y, camPos.z - 20);
        textmesh.position.set(-3,yscale / 5,.25);
    }
    

    lookAtCameraObjects.push(container);
    //  await new Promise(r => setTimeout(r, 3000));
    // const updated = await text.update({ text: 'Hwlloo World' });
    // textmesh.geometry.dispose();
    // textmesh.geometry = updated.geometry;
    //     console.log("gotsa text result2 " + text.measureTextWidth(textString) + " bounds " + JSON.stringify(text.planeBounds));
    // result.text
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
    console.log("tryna init reticle");
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
