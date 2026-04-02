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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// let htmlCanvas;
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 256;
const ctx = canvas.getContext('2d');
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 // Example for color management

let texture;
let textContainer;

export async function HTMLText (textString, size, parent, position, distance, persist, parentScale) { //this is rendered to texture and put on a plane
    // Setup canvas with 2D context

    // let textContainer = scene.getObjectByName('htmlCanvasContainer');
    // let canvas = document.getElementById("htmlcanvas");


     let scaleFactor = .1;
    if (distance) {
        if (distance > 1) {
            scaleFactor = distance * .1;
            if (parentScale) {
                scaleFactor = scaleFactor/parentScale;
            }
        }
    }
    // console.log("ui scale factor " + scaleFactor);
    scaleFactor = clamp(scaleFactor, .5, 3);
    if (textContainer) {
        // textContainer.attach(scene);
        // textContainer.position.set(position.x, position.y, position.z);
        // console.log("htmlCanvasContainer found");
        // canvas = document.createElement('canvas');
        // canvas.width = 512;
        // canvas.height = 256;
        // canvas.id = "htmlcanvas";
        // ctx = canvas.getContext('2d');
        // ctx.beginPath();
        // ctx.fillStyle = '#3b3b3b';
        // ctx.roundRect(0, 0, canvas.width, canvas.height, 60); // 20px radius on all corners
        // ctx.stroke(); 
        // // ctx.fillRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = '#ffffff';
        // ctx.font = '48px Arial';
        // ctx.fillText(textString, 50, 130);

        // Create texture, material, and mesh
        // const texture = new THREE.CanvasTexture(canvas);
        // texture.colorSpace = THREE.SRGBColorSpace;
        // textContainer = new THREE.Mesh(
        //     new THREE.PlaneGeometry(4, 2),
        //     new THREE.MeshBasicMaterial({ map: texture })
        // );
        // textContainer.name = "htmlCanvasContainer";
        // textContainer.add(textmesh);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //  ctx.beginPath();
            // ctx.fillStyle = '#3b3b3b';
            // ctx.roundRect(0, 0, canvas.width, canvas.height, 20); // 20px radius on all corners
            // ctx.stroke(); 
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            // ctx.fillStyle = 'rgba(0,0,0,0)';
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.fillText(textString, 50, 130);
        parent.attach(textContainer);
        // textContainer.position.y = 1;
        textContainer.position.set(0,2 * scaleFactor,-2 * scaleFactor);
        texture.needsUpdate = true;
        
        textContainer.scale.set(scaleFactor * 2,scaleFactor * 2,scaleFactor * 2);

            // if (position) {
            //     parent.worldToLocal(position);
                
            //     console.log("position is " + JSON.stringify(position));
            //     // container.position.set(0,4,0);
            //     // container.position.copy(position);
            //     // textmesh.position.set(0,0,0);
            //     textContainer.position.copy(position);
            // } else {
            //     textContainer.position.set(0,0,0);
                
            //     textmesh.position.set(0,0,0);
            // }
        
        
    } else {
        // 3. Use the texture in a material
        texture = new THREE.CanvasTexture(canvas);
        // You can set other properties like format, filters, etc. here if needed
        texture.colorSpace = THREE.SRGBColorSpace;
        if (texture) {
            console.log("tryna init htmlcanvas text")
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            textContainer = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), material);
            scene.add(textContainer);
            parent.attach(textContainer);
            textContainer.position.set(0,2,-3);
           
            // ctx.beginPath();
            // ctx.fillStyle = '#3b3b3b';
            // ctx.roundRect(0, 0, canvas.width, canvas.height, 20); // 20px radius on all corners
            // ctx.stroke(); 
            //  ctx.fillStyle = 'rgba(0,0,0,0)';
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.fillText(textString, 50, 130);
            textContainer.scale.set(scaleFactor,scaleFactor,scaleFactor);
             lookAtCameraObjects.push(textContainer);
        }
    }
    // else {
    //     console.log("has text container");
    //     if (canvas) {
    //         console.log("has canvas");
    //         let ctx = canvas.getContext('2d');
    //         parent.attach(textContainer);
    //         textContainer.position.set(0,2,-2);
            
    //         textContainer.scale.set(scaleFactor,scaleFactor,scaleFactor);
    //         ctx.fillText(textString, 50, 130);
    //     } 
    // }
    //     // parent.add(mesh);
}

let cooldown = false;

export async function ThreeDeeText (textString, size, parent, position, distance, persist, parentScale) { //

    if (!cooldown) {
        cooldown = true;
        
    let scaleFactor = .1;
    if (distance) {
        if (distance > 1) {
            scaleFactor = distance * .025;
            if (parentScale) {
                scaleFactor = scaleFactor/parentScale;
            }
        }
    }
    // console.log("ui scale factor " + scaleFactor);
    scaleFactor = clamp(scaleFactor, .25, 3);
    const width = 10;

    // console.log("tryna show textstring " + textString);
    let textContainer;
    let textmesh;
    let text;
    if (parent) {  
       textContainer = parent.getObjectByName('textContainer');
        if (textContainer && Text) {
            // if (textmesh) {
            // console.log("gotsa textContainer for text string " + textString);
                // textmesh.geometry.dispose();
                parent.updateMatrixWorld(true);
                parent.worldToLocal(position);
                // // console.log("ui scale " + scaleFactor);
                textmesh = textContainer.getObjectByName('textmesh');
               

                textContainer.visible = true;
                textContainer.position.set(position.x - scaleFactor, position.y + (scaleFactor * 2), position.z - (scaleFactor * 4));
                textContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Later, update the text
                // console.log("updating callout " + textString);
                const updated = await Text.create({ text: textString,
                            font: '../../fonts/web/Acme.woff',
                            depth: 0.02,
                            // align: 'left',
                            size: size,
                            // size: size,
                            removeOverlaps: true,
                            layout: {
                                width: width,
                                align: 'left'
                            } 
                    });
                if (textmesh) {
                    // console.log("updateing textmesh "  + textString);
                    textmesh.geometry.dispose();
                    textmesh.geometry = updated.geometry;
                }
            } else { 
                //     }
                //     // textContainer.position.set(position.x, position.y, position.z);
                //     // textmesh.position.set(0, -scaleFactor, -(scaleFactor * 4));
                //     // textContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);
                //     // return;
                // } else {
                console.log("creating textmesh and textContainer");
                        const splitString = textString.split("_");
                if (splitString[1]) {
                    textString = splitString[1];
                }
                const stringCount = textString.toString().length;
                // const width = stringCount < 6 ? stringCount : 6;

                // console.log("tryna set ui size " + size + " width " + width + " stringcount " + stringCount);
                text = await Text.create({
                    // width: 1,
                    text: textString,
                    font: '../../fonts/web/Acme.woff',
                    depth: 0.02,
                    // align: 'left',
                    size: size,
                    // size: size,
                    removeOverlaps: true,
                    layout: {
                        width: width,
                        align: 'left'
                    }
                });

            // console.log("gotsa text result " + text.measureTextWidth(textString) + " bounds " + JSON.stringify(text.planeBounds));
            // let material = new THREE.MeshPhysicalMaterial({ color: 'black', transparent: true, opacity: .95 });
            //     material.roughness = 0.1;
            // material.metalness = 0.3;
            // material.envMap = scene.environment;
            // material.envMapIntensity = 2;
            // textmesh = new THREE.Mesh(text.geometry, material);
           
            let material = new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: .5 });
            material.roughness = 0.1;
            material.metalness = 0.3;
            material.envMap = scene.environment;
            material.envMapIntensity = 2;
           
           
            const ranges = text.query({
            byCharRange: [
                { start: 0, end: 20 },   // First 5 characters
                // { start: 10, end: 20 }, // Characters 10-20
            ],
            });
            const yscale = (Math.abs(text.planeBounds.min.y) * 1.5) + 1
            textContainer = new THREE.Object3D();
            textContainer.name = "textContainer";
            if (!persist) {
                textContainers.push(textContainer);
            }
            // const camPos = camera.position.clone();
            // console.log("textContainer position is " + JSON.stringify(position));
            // parent.updateMatrixWorld(true);
        
            textmesh = new THREE.Mesh(text.geometry, material);
           
            textmesh.name = "textmesh";
            textContainer.add(textmesh);
             textmesh.position.set(0, 0, 0);
            parent.add(textContainer);
            textContainer.visible = false;

            lookAtCameraObjects.push(textContainer);
            // }
        }
    } else {
        console.log("init textContainer for " + textString);
            
    } 
    // if (!size) {
    //     size = 100;
    // }

   


    if (parent) { // callout or header, no bg?
        

        // let material = new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: .5 });
        // material.roughness = 0.1;
        // material.metalness = 0.3;
        // material.envMap = scene.environment;
        // material.envMapIntensity = 2;
        // const textmesh = new THREE.Mesh(text.geometry, material);
        // container.add(textmesh);
        // parent.add(container);
        // textmesh.position.set(0, 0, 0);
        
        // // const camPos = camera.position.clone();
        // console.log("textContainer position is " + JSON.stringify(position));
        // parent.updateMatrixWorld(true);
       
        // // const targetWorldPosition = new THREE.Vector3();

        // if (position) {
        //     parent.worldToLocal(position);
            
        //     console.log("position is " + JSON.stringify(position));
        //     // container.position.set(0,4,0);
        //     // container.position.copy(position);
        //     // textmesh.position.set(0,0,0);
        //     container.position.copy(position);
        // } else {
        //     container.position.set(0,0,0);
            
        //     textmesh.position.set(0,0,0);
        // }
        // container.scale.set(0,0,0); //scale up on second hit above
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
    


    //  await new Promise(r => setTimeout(r, 3000));
    // const updated = await text.update({ text: 'Hwlloo World' });
    // textmesh.geometry.dispose();
    // textmesh.geometry = updated.geometry;
    //     console.log("gotsa text result2 " + text.measureTextWidth(textString) + " bounds " + JSON.stringify(text.planeBounds));
    // result.text
    Cooldown();
    } 
}

function Cooldown () {
    // setTimeout(() => {
    // console.log('cooled down!');
    cooldown = false;
    // }, 100);
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
