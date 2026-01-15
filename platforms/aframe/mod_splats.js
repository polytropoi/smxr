// import * as THREE from "three";
 import AFRAME from 'aframe';
import * as THREE from "three";
// import { SplatMesh } from "@forge-gfx/forge";

import { SplatMesh } from "@sparkjsdev/spark";

AFRAME.registerComponent('mod_splat', {
    dependencies: ['geometry', 'material'],
    schema: {
     
        url: {default: "https://forge.dev/assets/splats/butterfly.spz"},
        xpos: {type: 'number', default: 0}, //for modding...
        ypos: {type: 'number', default: 0},
        zpos: {type: 'number', default: 0},

        xrot: {type: 'number', default: 0},//in degrees, trans to radians below
        yrot: {type: 'number', default: 0},
        zrot: {type: 'number', default: 0},
            // rotation: {default: ''},
        xscale: {type: 'number', default: 1},
        yscale: {type: 'number', default: 1},
        zscale: {type: 'number', default: 1},

        flipY: {default: true}
            
    },
    init() {

        let modFlip = this.data.flipY ? -1 : 1;
        console.log("TRYNA LOAD A SPLAT!" + JSON.stringify(this.data));
        this.splat = new SplatMesh({ url: this.data.url });
        // this.el.setObject3D('SplatMesh', this.splat);
        // this.splat.quaternion.set(1, 0, 0, 0);
        this.el.sceneEl.object3D.add(this.splat);
        // const euler = new THREE.Euler(this.data.xrot, this.data.yrot, this.data.yrot, 'XYZ');
        this.splat.position.set(this.data.xpos, this.data.ypos, this.data.zpos);
        this.splat.rotation.set(this.data.xrot, this.data.yrot, this.data.zrot, 'XYZ');
        
        this.splat.scale.set(this.data.xscale, this.data.yscale * modFlip, this.data.zscale);
// this.splat.rotation.set(0, 0, 0, 'XYZ');     
        this.el.removeAttribute("geometry");
    //   const splatURL = "https://forge.dev/assets/splats/butterfly.spz"

    }  

});