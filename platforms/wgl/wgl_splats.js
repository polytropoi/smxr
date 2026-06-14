  import * as THREE from "three";
  import { SplatMesh, SparkRenderer } from "sparkjsdev/spark";
import {scene, renderer} from "./wgl_main.mjs";

export let splatObjex = [];
export let spark;

export async function InitSpark () {
    await renderer;
    spark = new SparkRenderer({ renderer });
    scene.add(spark);
}


export async function initSplats () {
    console.log("tryna init splats " + splatObjex.length + splatObjex[0].url);
    for (let i = 0; i < splatObjex.length; i++) {
        let useLOD = true;
        const splatURL = splatObjex[i].url;
        // const splat = new SplatMesh({ url: splatURL });
        const splat = new SplatMesh({
          url: splatURL,
          lod: useLOD,
          enableLod: useLOD,
          nonLod: true,
          onLoad: (mesh) => {
            mesh.enableLod = true;
            mesh.updateGenerator();
            console.log("!## Mesh loaded enabled LoD");
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
        // splat.quaternion.set(1, 0, 0, 0);
//         const quaternion = new THREE.Quaternion();
// const euler = new THREE.Euler(x, y, z, 'XYZ'); // x, y, z are in radians
// quaternion.setFromEuler(euler);

        splat.rotation.set(xrot, yrot, zrot, 'XYZ');


        //   this.splat.position.set(this.data.xpos, this.data.ypos, this.data.zpos);
        // this.splat.rotation.set(this.data.xrot, this.data.yrot, this.data.zrot, 'XYZ');
        
        splat.scale.set(xscale, yscale * modFlip, zscale);
        scene.add(splat);

    }
}