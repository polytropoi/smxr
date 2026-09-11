import * as THREE from 'three/webgpu';
import { SPZLoader } from 'three/addons/loaders/SPZLoader.js';
import { GaussianSplat } from 'three/addons/objects/GaussianSplat.js';


  // import { SplatMesh, SparkRenderer } from "sparkjsdev/spark";
import {scene, renderer, StartButton, loadingHeader} from "./wgpu_main.mjs";

import {StartPopup, startPop} from "./wgpu_ui.js";

import { settings } from '../../../connect/settings.js';

import { activeObjex } from "./wgpu_locations.js";

export let splatsLoaded = false;
export let splatObjex = [];

export async function InitSplats () {
    for (let i = 0; i < splatObjex.length; i++) {
                
        const splatGeometry = await new SPZLoader().loadAsync( splatObjex[i].url );
        const splat = new GaussianSplat( splatGeometry );

        //  splat.quaternion.set(1, 0, 0, 0);
                // let modFlip = this.data.flipY ? -1 : 1;
                // let modFlip = -1;
                // if (splatObjex[i].locationData.locationTags.includes("flipy")) {
                //   modFlip = 1
                  
                // } else {
                  
                // }
                const xrot = splatObjex[i].locationData.eulerx ? splatObjex[i].locationData.eulerx : 0;
                const yrot = splatObjex[i].locationData.eulery ? splatObjex[i].locationData.eulery : 0;
                const zrot = splatObjex[i].locationData.eulerz ? splatObjex[i].locationData.eulerz : 0;
        
                const xscale = splatObjex[i].locationData.xscale ? splatObjex[i].locationData.xscale : 1;
        
                const yscale = splatObjex[i].locationData.yscale ? splatObjex[i].locationData.yscale : 1;  
                const zscale = splatObjex[i].locationData.zscale ? splatObjex[i].locationData.zscale : 1;
              
                splat.position.set(splatObjex[i].locationData.x, splatObjex[i].locationData.y, splatObjex[i].locationData.z);
              
                splat.rotation.set(xrot, yrot, Math.PI, 'XYZ');
                
                // splat.scale.set(xscale, yscale * modFlip, zscale);
                                splat.scale.set(xscale, yscale, zscale);
                scene.add(splat);
                splat.userData.name = "SPLAT";
                // activeObjex.push(splat);
        // scene.add( splat );


    }
     StartPopup(loadingHeader, 'Ready!', true);	
        const startButton = startPop.querySelector("#startButton");
        if (startButton) {
        console.log("startButton found!");
        // const startButton = document.getElementById('popup_yesButton');
        startButton.addEventListener('pointerdown', StartButton);
            setTimeout(() => {
                                console.log("Hello! 3 seconds have passed.");
                                        startPop.style.display = "none";
                            }, 3000); 
        } else {
        console.log("startButton not found!");
        }
}