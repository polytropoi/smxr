// import * as THREE from "three";
    import { SplatMesh } from "@forge-gfx/forge";

AFRAME.registerComponent('mod_splat', {
    dependencies: ['geometry', 'material'],
    schema: {
        init: {default: ""},
        url: {default: "https://forge.dev/assets/splats/butterfly.spz"}
        
    },
    init() {
        console.log("TRYNA LOAD A SPLAT!");
        this.splat = new SplatMesh({ url: "https://forge.dev/assets/splats/butterfly.spz" });
        // this.el.setObject3D('SplatMesh', this.splat);
        this.el.sceneEl.object3D.add(this.splat);
        console.log("splat is this big " + this.splat.fileBytes);


    //   const splatURL = "https://forge.dev/assets/splats/butterfly.spz"

    }  

});