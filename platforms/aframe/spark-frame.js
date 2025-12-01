    import AFRAME from 'aframe';
    import { SplatMesh, SparkRenderer } from "@sparkjsdev/spark";


    AFRAME.registerComponent('splat', {
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
      init: function () {
        const splat = new SplatMesh({ url: this.data.src });
        splat.quaternion.set(1, 0, 0, 0);
        this.el.setObject3D('mesh', splat);
      }
    });

    AFRAME.registerSystem('splat', {
      init: function () {
        const sparkRenderer = new SparkRenderer({ renderer: this.el.renderer });
        this.sceneEl.object3D.add(sparkRenderer);
      }
    });