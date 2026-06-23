import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import {scene, renderer} from './wgl_main.mjs';

import {sunLight} from './wgl_lights.js';

import {camera, controls} from './wgl_controls.js';

import { Sky } from 'three/addons/objects/Sky.js';
// import { InfiniteGridHelper } from '../wgl/src/InfiniteGridHelper.js';


export function InitGrid () {
	// const grid = new InfiniteGridHelper(10, 100, 'red', 1000);
	// scene.add(grid);
	// grid.rotation.x = Math.PI / 2;

	const size = 100;
	const divisions = 100;
	const gridHelper = new THREE.GridHelper( size, divisions, settings.sceneColor2, settings.sceneColor3 );
	scene.add( gridHelper );
}


// export function InitCustomFog() { //hrm... //nope, wgpu only

// 	const skyColor = color( 0xf0f5f5 );
//     const groundColor = color( 0xd0dee7 );

//     const fogNoiseDistance = positionView.z.negate().smoothstep( 0, camera.far - 300 );

//     const distance = fogNoiseDistance.mul( 20 ).max( 4 );
//     const alpha = .98;
//     const groundFogArea = float( distance ).sub( positionWorld.y ).div( distance ).pow( 3 ).saturate().mul( alpha );

//     // a alternative way to create a TimerNode
//     const timer = uniform( 0 ).onFrameUpdate( ( frame ) => frame.time );

//     const fogNoiseA = triNoise3D( positionWorld.mul( .005 ), 0.2, timer );
//     const fogNoiseB = triNoise3D( positionWorld.mul( .01 ), 0.2, timer.mul( 1.2 ) );

//     const fogNoise = fogNoiseA.add( fogNoiseB ).mul( groundColor );

//     // apply custom fog

//     scene.fogNode = fog( fogNoiseDistance.oneMinus().mix( groundColor, fogNoise ), groundFogArea );
//     // scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );

// }

export function InitGround() {
	console.log("tryna InitGround");
		const planeGeo = new THREE.PlaneGeometry(100, 100);
		const planeMat = new THREE.MeshStandardMaterial({color: settings.sceneColor3});
		// planeMat.colorNode = settings.sceneColor2;
		const planeMesh = new THREE.Mesh(planeGeo, planeMat);
		planeMesh.receiveShadow = true; 
		planeMesh.rotateX(-Math.PI / 2);
		scene.add(planeMesh);
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
        scene.fog = new THREE.Fog(fogColor, 10, radius);
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
		const sky = new Sky();
		sky.scale.setScalar(450000); // Make it huge
		scene.add(sky);

		// 2. Configure shader parameters
		const uniforms = sky.material.uniforms;
		uniforms['turbidity'].value = 10;
		uniforms['rayleigh'].value = 2;
		uniforms['mieCoefficient'].value = 0.005;
		uniforms['mieDirectionalG'].value = 0.8;

		let elevation = 5;
		// if (settings.sceneClouds.name) {
		// 		sceneClouds = settings.sceneClouds.name;
		// 	}
		if (settings.sceneTime.name) {
			if (settings.sceneTime.name == "morning" || settings.sceneTime.name == "evening") {
				elevation = 2;
			} else if (settings.sceneTime.name == "afternoon") {
				elevation = 45;
			} else if (settings.sceneTime.name == "noon" || settings.sceneTime.name == "midday") {
				elevation = 90;
			}

		}
		// 3. Set Sun position
		const phi = THREE.MathUtils.degToRad(elevation); // Elevation
		const theta = THREE.MathUtils.degToRad(180); // Azimuth
		const sunPosition = new THREE.Vector3();
		sunPosition.setFromSphericalCoords(1, phi, theta);

		uniforms['sunPosition'].value.copy(sunPosition);
		sunLight.position.copy(sunPosition);
			
	} else {
		const color = new THREE.Color(settings.sceneColor2);
		scene.background = color;
	}
}
			