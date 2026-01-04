  import * as THREE from "three";
  import { SplatMesh } from "sparkjsdev/spark";
import {scene} from "./spark_main.mjs";

export let splatObjex = [];


export async function initSplats () {
    console.log("tryna init splats " + splatObjex.length + splatObjex[0].url);
    for (let i = 0; i < splatObjex.length; i++) {
        const splatURL = splatObjex[i].url;
        const splat = new SplatMesh({ url: splatURL });
        splat.quaternion.set(1, 0, 0, 0);
        splat.position.set(splatObjex[i].locationData.x, splatObjex[i].locationData.y, splatObjex[i].locationData.z);
        scene.add(splat);

    }
}