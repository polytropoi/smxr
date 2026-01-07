
import * as THREE from 'three';

import { scene } from '../spark_main.mjs'

import { settings } from '../../../connect/settings.js';

import { Water } from 'three/addons/objects/Water.js';

export let water;

export class Water1 { //webgl three water
    constructor() {
       
        // const waterGeometry = new THREE.PlaneGeometry( 500, 500 );
        const waterGeometry = new THREE.CircleGeometry( 300, 64 )
        const loader = new THREE.TextureLoader();
        const waterNormals = loader.load( '../../platforms/three/assets/waternormals.jpg' );
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

        const water = new Water(
            waterGeometry,
            {
                waterNormals: waterNormals,
                sunDirection: new THREE.Vector3(),
                sunColor: settings.sceneColor1,
                waterColor: settings.sceneColor2,
                alpha: .75,
                distortionScale: 4
            }
        );
        const waterLevel = parseFloat(settings.sceneWater.level);  
        water.position.set( 0, waterLevel, 0 );
        water.rotation.x = - Math.PI / 2;
        scene.add(water);

    }
}

export function initWater1 () {
        const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load(  '../../platforms/three/assets/waternormals.jpg', function ( texture ) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                } ),
                
                // sunDirection: new THREE.Vector3(),
                // //  waterNormals: waterNormals,
                // sunDirection: new THREE.Vector3(),
                sunColor: settings.sceneColor1,
                waterColor: settings.sceneColor2,
                alpha: .5,
                distortionScale: 2,
                fog: scene.fog !== undefined
            }
        );
        const waterLevel = parseFloat(settings.sceneWater.level);  
        water.position.set( 0, waterLevel, 0 );
        water.material.transparent = true;
        water.material.opacity = .5;
        water.rotation.x = - Math.PI / 2;

        scene.add( water );
        
    }