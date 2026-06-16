  import * as THREE from "three";
  // import { SplatMesh, SparkRenderer } from "sparkjsdev/spark";
  import {scene, renderer} from "./wgl_main.mjs";
      import { SparkRenderer, SplatMesh, SparkControls, isMobile,
      SplatEdit,
      SplatEditSdf,

      SplatEditSdfType,
      SplatEditRgbaBlendMode } from "sparkjsdev/spark";


export let splatObjex = [];
// export let spark;

export async function InitSpark () {
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
      enableLod: true
    });
    scene.add(spark);
    // spark.lodSplatScale = lodSplatScale ?? 1.0;
}


export async function initSplats (options) {
    console.log("tryna init splats " + splatObjex.length + splatObjex[0].url);
    for (let i = 0; i < splatObjex.length; i++) {
        let useLOD = true;
        const splatURL = splatObjex[i].url;
        // const splat = new SplatMesh({ url: splatURL });
        const splat = new SplatMesh({
          url: splatURL,
          lod: useLOD,
          // paged: true,
         
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
          
            splat.rotation.set(xrot, yrot, zrot, 'XYZ');
            
            splat.scale.set(xscale, yscale * modFlip, zscale);
        scene.add(splat);

        // const editOp = new SplatEdit(SplatEditRgbaBlendMode.MULTIPLY);
        // editOp.addSdfShape(new SdfSphere(new THREE.Vector3(0, 0, 0), 1.5), new THREE.Vector4(1, 0.8, 0.8, 1));
        // splat.addEditOperation(editOp);

    }
}