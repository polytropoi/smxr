

// export let water = 'water';
import * as THREE from 'three/webgpu';

import { color, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, objectPosition, screenUV, viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, time } from 'three/tsl';
	
import { scene } from '../three_main.mjs'

import { settings } from '../../../connect/settings.js';
	
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
export class Water {

    constructor() {

        const timer = time.mul( .8 );
        const floorUV = positionWorld.xzy;

        const waterLayer0 = mx_worley_noise_float( floorUV.mul( 4 ).add( timer ) );
        const waterLayer1 = mx_worley_noise_float( floorUV.mul( 2 ).add( timer ) );

        const waterIntensity = waterLayer0.mul( waterLayer1 );
        const waterColor = waterIntensity.mul( 1.4 ).mix( color(  settings.sceneColor3 ), color( settings.sceneColor4 ) );

        // linearDepth() returns the linear depth of the mesh
        const depth = linearDepth();
        const depthWater = viewportLinearDepth.sub( depth ).toInspector( 'Water / Depth', ( node ) => node.oneMinus() );
        const depthEffect = depthWater.remapClamp( - .002, .04 );

        const refractionUV = screenUV.add( vec2( 0, waterIntensity.mul( .1 ) ) ).toInspector( 'Water / Refraction UV' );

        // linearDepth( viewportDepthTexture( uv ) ) return the linear depth of the scene
        const depthTestForRefraction = linearDepth( viewportDepthTexture( refractionUV ) ).sub( depth );

        const depthRefraction = depthTestForRefraction.remapClamp( 0, .1 );

        const finalUV = depthTestForRefraction.lessThan( 0 ).select( screenUV, refractionUV );

        const viewportTexture = viewportSharedTexture( finalUV ).toInspector( 'Water / Viewport Texture + Refraction UV' );

        const waterMaterial = new THREE.MeshBasicNodeMaterial();
        waterMaterial.colorNode = waterColor.toInspector( 'Water / Color' );
        waterMaterial.backdropNode = depthEffect.mix( viewportSharedTexture(), viewportTexture.mul( depthRefraction.mix( 1, waterColor ) ) );
        waterMaterial.backdropAlphaNode = depthRefraction.oneMinus();
        waterMaterial.transparent = true;

        const water = new THREE.Mesh( new THREE.CircleGeometry( 200, 64 ), waterMaterial );
        water.position.set( 0, 0, 0 );
        water.rotation.x = Math.PI / 2 * -1;
        scene.add(water);
        // return water;
    }
// scene.add( water );
}
// export default Water;