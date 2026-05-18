import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import {scene, renderer} from './wgl_main.mjs';

import {sunLight} from './wgl_lights.js';

import {camera, controls} from './wgl_controls.js';

import { Sky } from 'three/addons/objects/Sky.js';


export function InitCustomFog() { //hrm...

	const skyColor = color( 0xf0f5f5 );
    const groundColor = color( 0xd0dee7 );

    const fogNoiseDistance = positionView.z.negate().smoothstep( 0, camera.far - 300 );

    const distance = fogNoiseDistance.mul( 20 ).max( 4 );
    const alpha = .98;
    const groundFogArea = float( distance ).sub( positionWorld.y ).div( distance ).pow( 3 ).saturate().mul( alpha );

    // a alternative way to create a TimerNode
    const timer = uniform( 0 ).onFrameUpdate( ( frame ) => frame.time );

    const fogNoiseA = triNoise3D( positionWorld.mul( .005 ), 0.2, timer );
    const fogNoiseB = triNoise3D( positionWorld.mul( .01 ), 0.2, timer.mul( 1.2 ) );

    const fogNoise = fogNoiseA.add( fogNoiseB ).mul( groundColor );

    // apply custom fog

    scene.fogNode = fog( fogNoiseDistance.oneMinus().mix( groundColor, fogNoise ), groundFogArea );
    // scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );

}
export function InitFog() {
    if (settings && settings.sceneUseVolumetricFog) {
        console.log("doin some fog...");
        const fogColor = settings.sceneColor1; // Sky blue
		let radius = 400;
		if (settings.sceneSkyRadius) {
			radius = settings.sceneSkyRadius;
		}
        // const fogDensity = 0.01; // Adjust this value! (Default is 0.00025)
        scene.fog = new THREE.Fog(fogColor, 10, radius * 2);
		// scene.fog = new THREE.FogExp2( fogColor, 0.01 );
        // scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
    }
}

export function InitEnvMap () {
    if (scene && settings && settings.skyboxURL) {
        console.log("gotsa skybox url " + settings.skyboxURL);
        const envMapURL = settings.skyboxURL;
        const equirectTextureLoader = new THREE.TextureLoader();

        const textureEquirect = equirectTextureLoader.load( envMapURL );
        textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirect.colorSpace = THREE.SRGBColorSpace;
        // scene.background = textureEquirect;
        scene.environment = textureEquirect;
	
        // scene.environmentIntensity = 3;

		if (settings.sceneUseSkybox) {
			// 1. Create a large sphere
			const sphereRadius = 300;
			const sphereSegments = 60; // Higher for better quality
			const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);

			// 3. Create material, mapping it to the inside
			const material = new THREE.MeshBasicMaterial({
				map: textureEquirect,
				side: THREE.BackSide // Crucial for skybox
			});


			// 4. Create the mesh and add to scene
			const skySphere = new THREE.Mesh(geometry, material);
			scene.add(skySphere);
		}
    }
}
export function InitSky() {

	if (settings && settings.sceneUseDynamicSky) {
				// Add Sky
				const sky = new Sky();
				sky.scale.setScalar( 450000 );
				scene.add( sky );


       

				const sun = new THREE.Vector3();

				/// GUI


				// const effectController = { //low sun twilight
				// 	turbidity: 10,
				// 	rayleigh: 3,
				// 	mieCoefficient: 0.005,
				// 	mieDirectionalG: 0.7,
				// 	elevation: 2,
				// 	azimuth: 180,
				// 	exposure: renderer.toneMappingExposure
				// };
				console.log("sky params " + JSON.stringify(settings.sceneTime) + " " + JSON.stringify(settings.sceneClouds));
				let elevation = 45;
				let sceneClouds = "medium";
				let cloudCoverage = .35;
				let cloudDensity = .5;
				let cloudElevation = .5;
				if (settings.sceneClouds.name) {
					sceneClouds = settings.sceneClouds.name;
				}
				if (settings.sceneTime.name) {
					if (settings.sceneTime.name == "morning" || settings.sceneTime.name == "evening") {
						elevation = 2;
					} else if (settings.sceneTime.name == "afternoon") {
						elevation = 45;
					} else if (settings.sceneTime.name == "noon" || settings.sceneTime.name == "midday") {
						elevation = 90;
					}

				}
				
				const effectController = {
					turbidity: 10,
					rayleigh: 3,
					mieCoefficient: 0.005,
					mieDirectionalG: 0.7,
					elevation: elevation,
					azimuth: 180,
					// exposure: renderer.toneMappingExposure,
					exposure: .75,
					cloudCoverage: cloudCoverage,
					cloudDensity: cloudDensity,
					cloudElevation: cloudElevation
				};

				// function guiChanged() {

					// sky.turbidity.value = effectController.turbidity;
					// sky.rayleigh.value = effectController.rayleigh;
					// sky.mieCoefficient.value = effectController.mieCoefficient;
					// sky.mieDirectionalG.value = effectController.mieDirectionalG;

					// const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
					// const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					// sun.setFromSphericalCoords( 1, phi, theta );

					// sky.sunPosition.value.copy( sun );

					sunLight.position.copy(sun);
					renderer.toneMappingExposure = effectController.exposure;
// 
				}

			}

				// const gui = renderer.inspector.createParameters( 'Settings' );

				// gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

				// guiChanged();

			// }

        