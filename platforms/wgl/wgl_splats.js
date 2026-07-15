  import * as THREE from "three";
  // import { SplatMesh, SparkRenderer } from "sparkjsdev/spark";
  import {scene, renderer, loadingHeader, StartButton} from "./wgl_main.mjs";

    import {StartPopup} from "./wgl_ui.js";

  import { settings } from '../../../connect/settings.js';

  import { SparkRenderer, SplatMesh, SparkControls, isMobile,
  SplatEdit,
  SplatEditSdf,

  SplatEditSdfType,
  SplatEditRgbaBlendMode } from "sparkjsdev/spark";
import { activeObjex } from "./wgl_locations.js";

export let splatsLoaded = false;
export let splatObjex = [];
// export let spark;

export async function InitSpark () {
    let useLOD = false;
  if (settings && settings.sceneTags && settings.sceneTags.includes("lod")) {
    useLOD = true;
  }
    await renderer;
    // const spark = new SparkRenderer({
    //   renderer,
    //   pagedExtSplats: true,
    //   coneFov0: 70.0,
    //   coneFov: 120.0,
    //   behindFoveate: 0.2,
    //   coneFoveate: 0.4,
    // });
    const spark = new SparkRenderer({
      renderer,
      enableLod: useLOD,
      maxStdDev: Math.sqrt(4),
      view: { sort360: true, sort32: true }
    });
    scene.add(spark);
    // spark.lodSplatScale = lodSplatScale ?? 1.0;
}


export async function initSplats (options) {
  let useLOD = false;
  if (settings && settings.sceneTags && settings.sceneTags.includes("lod")) {
    useLOD = true;
  }
    console.log("tryna init splats " + splatObjex.length + splatObjex[0].url + " use LOD " + useLOD);
    for (let i = 0; i < splatObjex.length; i++) {
                
        const splatURL = splatObjex[i].url;
        // const splatURL = await getAssetFileURL(splatObjex[i].url);
        // const splat = new SplatMesh({ url: splatURL });
        const splat = new SplatMesh({
          url: splatURL,
          lod: useLOD,
          // paged: true,
         
          onLoad: (mesh) => {
            mesh.enableLod = useLOD;
            mesh.updateGenerator();
            console.log("!## Mesh loaded enabled LoD " + useLOD);
            StartPopup(loadingHeader, 'Ready!', true);	
                  const startButton = startPop.querySelector("#startButton");
                  if (startButton) {
                    console.log("startButton found!");
                    // const startButton = document.getElementById('popup_yesButton');
                    startButton.addEventListener('pointerdown', StartButton);
                      
                  } else {
                    console.log("startButton not found!");
                  }

          },
          onProgress: (event) => {
            if (event.type === "progress") {
              console.log("Progress: ", event.loaded, event.total);
            }
          },
      });
      
      // splats.lodMaxSplats = 1 * 1048576 - 2048;
      // splats.foveate = 0.5;
         
        splat.quaternion.set(1, 0, 0, 0);
        // let modFlip = this.data.flipY ? -1 : 1;
        let modFlip = -1;
        if (splatObjex[i].locationData.locationTags.includes("flipy")) {
          modFlip = 1
          
        } else {
          
        }
        const xrot = splatObjex[i].locationData.eulerx ? splatObjex[i].locationData.eulerx : 0;
        const yrot = splatObjex[i].locationData.eulery ? splatObjex[i].locationData.eulery : 0;
        const zrot = splatObjex[i].locationData.eulerz ? splatObjex[i].locationData.eulerz : 0;

        const xscale = splatObjex[i].locationData.xscale ? splatObjex[i].locationData.xscale : 1;

        const yscale = splatObjex[i].locationData.yscale ? splatObjex[i].locationData.yscale : 1;  
        const zscale = splatObjex[i].locationData.zscale ? splatObjex[i].locationData.zscale : 1;
      
        splat.position.set(splatObjex[i].locationData.x, splatObjex[i].locationData.y, splatObjex[i].locationData.z);
      
        splat.rotation.set(xrot, yrot, zrot, 'XYZ');
        
        splat.scale.set(xscale, yscale * modFlip, zscale);
        scene.add(splat);
        splat.userData.name = "SPLAT";
        activeObjex.push(splat);
        // await new Promise(r => setTimeout(r, 100));


        // const editOp = new SplatEdit(SplatEditRgbaBlendMode.MULTIPLY);
        // editOp.addSdfShape(new SdfSphere(new THREE.Vector3(0, 0, 0), 1.5), new THREE.Vector4(1, 0.8, 0.8, 1));
        // splat.addEditOperation(editOp);

    }

}