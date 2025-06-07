// import * as THREE from "three";
 import AFRAME from 'aframe';
import * as THREE from "three";
import { SplatMesh } from "@forge-gfx/forge";

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
            
    },
    init() {
        console.log("TRYNA LOAD A SPLAT!");
        this.splat = new SplatMesh({ url: this.data.url });
        // this.el.setObject3D('SplatMesh', this.splat);
        this.el.sceneEl.object3D.add(this.splat);
        this.splat.position.set(this.data.xpos, this.data.ypos, this.data.zpos);
                let scale = {x: this.data.xscale, y: this.data.yscale, z: this.data.zscale};
        // this.splat.setAttribute('scale', scale);
        // this.splat.scale.set(this.data.xscale, this.data.yscale, this.data.zscale);


    //   const splatURL = "https://forge.dev/assets/splats/butterfly.spz"

    }  

});