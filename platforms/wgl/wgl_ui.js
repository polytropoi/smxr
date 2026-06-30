//// troika not ready for webgpu yet...
// import {Text} from 'troika-three-text' 

import * as THREE from 'three';
import { Text } from 'three-text/three'; //not troika!

import { ReturnPictureFromGroup, ScenePicture } from './wgl_media.js';

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
Text.setHarfBuzzPath('/fonts/hb.wasm'); //!
Text.init();

import {scene, renderer} from './wgl_main.mjs';

import {player, camera} from './wgl_controls.js';

import {showDialogPanel} from '../../../connect/dialogs.js';

export let lookAtCameraObjects = [];

export let textContainers = [];

export let scenePictures = {};

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
// export let landscapePanel;

export async function HTMLText (textString, size, parent, position, distance, persist, parentScale) { //this is oldschool rendered to texture and put on a plane, NOT the HTML-In-Canvas way (see wgpu route)
  
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
    if (textContainer) { //already created
      
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
       
        
    } else { //create a new one
        
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
           
           
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.fillText(textString, 50, 130);
            textContainer.scale.set(scaleFactor,scaleFactor,scaleFactor);
             lookAtCameraObjects.push(textContainer);
        }
    }
 
}

let cooldown = false;

export async function ThreeDeeText (textString, size, parent, position, distance, persist, parentScale) { // use geometry for text (callouts)

    if (!cooldown) {
        cooldown = true;
        
    let scaleFactor = .1;
    if (distance) {
        if (distance > 1) {
            scaleFactor = distance * .025;
            if (parentScale) {
                scaleFactor = scaleFactor * parentScale;
            }
        }
    }
    // console.log("ui scale factor " + scaleFactor);
    scaleFactor = clamp(scaleFactor, .25, 1.5);
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
  

    if (parent) { // callout or header, no bg?
        

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
    

    Cooldown();
    } 
}

function Cooldown () {
    // setTimeout(() => {
    // console.log('cooled down!');
    cooldown = false;
    // }, 100);
}




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

export function ShowGroupPicture (locationGroupId, locationMediaId, instanceId, position, visible, lookAtCamera) { //simple pics on a plane

    let scenePictureInstance;

    if (instanceId && locationGroupId) {
        console.log("looking for scenePicture from locationGroup "+ locationGroupId + "_" + instanceId);
        scenePictureInstance = scenePictures[locationGroupId + "_" + instanceId];
        if (scenePictureInstance) {
           

            const isVisible = scenePictureInstance.toggleVis();
             console.log("gotsa scenePictureInstance visible " + isVisible);
            if (isVisible) {
                scenePictureInstance.updatePicture();
                scenePictureInstance.updatePosition(position);
            }
            // scenePictureInstance.toggleVis();

        } else {
            scenePictureInstance = new ScenePicture(locationGroupId, locationMediaId, instanceId, position, visible, lookAtCamera)
            scenePictures[locationGroupId + "_" + instanceId] = scenePictureInstance;
            // scenePictureInstance.updatePicture();
        }

    }

}

export function ShowPopup (event) { //hrm move to UI
    const popup = document.getElementById("popup");
    console.log("showDialogPanel " + showDialogPanel);

    if (showDialogPanel) {
        return;
    }
    if (!event) {
        let xpos = window.innerWidth / 2;
        let ypos = window.innerHeight / 2;
        Object.assign(popup.style, {
            left: `${xpos}px`,
            top: `${ypos}px`,
            display: 'block',
        });
    } else {
        // console.log("tryna show popup at " + event.clientX + " " + window.innerWidth);
        let xpos = event.clientX - 256;
        if ((window.innerWidth - event.clientX) < 256) {
            xpos = event.clientX - 512;
        } else if (event.clientX < 256) {
            xpos = 0;
        }
        
        let ypos = event.clientY - 256;
        if (event.clientY < 200) {
            ypos = 0;
        }
        // if (event.clientY > (window.innerHeight - 300)) {
        //     ypos = window.innerHeight - 300;
        // }
         Object.assign(popup.style, {
            left: `${xpos}px`,
            top: `${ypos}px`,
            display: 'block',
        });
    }
    

}
