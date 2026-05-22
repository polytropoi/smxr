import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import {scene, renderer} from './wgpu_main.mjs';

import {sunLight} from './wgpu_lights.js';

import {camera, controls} from './wgpu_controls.js';

import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

import { color, fog, float, positionWorld, triNoise3D, positionView, positionGeometry, abs, fwidth, smoothstep, vec3, vec4, normalWorld, uniform, uv, dFdx, dFdy, fract, floor, min, max, cameraPosition, saturate, oneMinus} from 'three/tsl';


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

// // 2. Define the Infinite Grid Shader using TSL
// const createGridMaterial = () => {
//     const material = new THREE.MeshBasicNodeMaterial();
//     material.transparent = true;

//     // Grid properties via TSL nodes
//     const gridScale = float(10.0); // Size of the grid cells
//     const coords = positionGeometry.xz.div(gridScale);

//     // Calculate line thickness and derivatives for smooth anti-aliasing
//     const grid = abs(coords.fract().sub(0.5)).div(coords.fwidth());
//     const line = min(grid.x, grid.y);

//     // Fade out as the grid approaches the horizon
//     const depth = positionGeometry.z.abs();
//     const fadeFactor = smoothstep(1000, 100, depth);

//     // Combine TSL nodes into the final fragment output
//     const gridColor = vec3(0.5, 0.5, 0.5); // Line color
//     const alpha = float(1.0).sub(smoothstep(0.0, 1.5, line)).mul(fadeFactor);

//     material.colorNode = vec4(gridColor, alpha);
//     return material;
// };
// function getGridNode(coords) {
// 		const scale = 10.0;
// 		const gridCoords = coords.mul(scale);
		
// 		// Calculate derivatives for anti-aliasing
// 		const gridDerivative = dFdx(gridCoords).add(dFdy(gridCoords));
// 		const gridWidth = gridDerivative.max(0.00001); // Avoid division by zero
		
// 		const gridAbs = fract(gridCoords.add(0.5)).abs().sub(0.5).div(gridWidth);
// 		const line = gridAbs.min(oneMinus().clamp(0.0, 1.0));
		
// 		return line;
// }
export function InitGrid () {
	// const grid = new InfiniteGridHelper(10, 100, 'red', 1000);
	// scene.add(grid);
	// grid.rotation.x = Math.PI / 2;

	const size = 100;
	const divisions = 100;
	const gridHelper = new THREE.GridHelper( size, divisions, settings.sceneColor2, settings.sceneColor3 );
	scene.add( gridHelper );
	// 1. Setup WebGPU Renderer
	

	// // 3. Create a large plane for the grid to stretch across
	// const geometry = new THREE.PlaneGeometry(10000, 10000);
	// const material = new THREE.MeshBasicNodeMaterial({ transparent: true });

	// // TSL Shader Logic for the Grid
	// const gridAlpha = getGridNode(positionWorld.xz);
	// material.colorNode = color(0x00ffff).mul(gridAlpha); 

	// const gridScale = uniform(10.0);
	// const thickness = uniform(0.02);
	// const gridColor = uniform(new THREE.Color(0x444444));
	// const backgroundColor = uniform(new THREE.Color(0x111111));
	// const material = new THREE.MeshBasicNodeMaterial();
	// material.colorNode = createInfiniteGridNode();

	// // 5. Create a massive plane in the world
	// const planeGeo = new THREE.PlaneGeometry(1000, 1000);
	// // Rotate it to lay flat on the floor (X-Z axis)
	// planeGeo.rotateX(-Math.PI / 2);
	// const gridGeometry = new THREE.PlaneGeometry(10000, 10000);
	// const gridMesh = new THREE.Mesh(gridGeometry, createGridMaterial());
	// gridMesh.rotation.x = -Math.PI / 2; // Make it lay flat as a floor
	// scene.add(gridMesh);
	// const plane = new THREE.Mesh(planeGeo, material);
	// scene.add(plane);

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

		// 1. Create a large sphere
		if (settings.sceneUseSkybox) {	
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
				const sky = new SkyMesh();
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

					sky.turbidity.value = effectController.turbidity;
					sky.rayleigh.value = effectController.rayleigh;
					sky.mieCoefficient.value = effectController.mieCoefficient;
					sky.mieDirectionalG.value = effectController.mieDirectionalG;

					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
					const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					sky.sunPosition.value.copy( sun );

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

        