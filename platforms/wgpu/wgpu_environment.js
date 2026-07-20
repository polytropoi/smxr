import * as THREE from 'three';

import { MeshBasicNodeMaterial } from 'three/webgpu';

import { settings } from '../../../connect/settings.js';

import { sequenceInt } from '../../../connect/events.js';

import {scene, renderer} from './wgpu_main.mjs';

import {sunLight} from './wgpu_lights.js';

import {camera, controls} from './wgpu_controls.js';

import { SkyMesh } from 'three/addons/objects/SkyMesh.js';



import { color, screenUV, fog, float, positionWorld, triNoise3D, positionView, positionGeometry, abs, fwidth, smoothstep, vec3, vec4, normalWorld, uniform, uv, dFdx, dFdy, fract, floor, mix, min, max, cameraPosition, saturate, oneMinus} from 'three/tsl';
import { equirectPictures } from './wgpu_media.js';



let skySphere;
let skyboxMaterial;
let textureEquirect;
const equirectTextureLoader = new THREE.TextureLoader();


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


}

export function InitGround() {

	let xscale = 100;
	let yscale = 100;
	let zscale = 100;
	const planeGeo = new THREE.CircleGeometry(100, 100);
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
        const fogDensity = settings.fogDensity * .5; // Adjust this value! (Default is 0.00025)
        // scene.fog = new THREE.Fog(fogColor, 10, radius * 2);
		scene.fog = new THREE.FogExp2( fogColor, fogDensity );
        // scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
    }
}

export async function UpdateEnvMap () {
	if (equirectPictures.length) {
		console.log(JSON.stringify(equirectPictures[sequenceInt]));
		let skyboxURL = equirectPictures[sequenceInt].url;


			 textureEquirect = await equirectTextureLoader.loadAsync( skyboxURL );
			textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
			// textureEquirect.colorSpace = THREE.SRGBColorSpace;
			// // scene.background = textureEquirect;
			// scene.environment = textureEquirect;
			// textureEquirect.needsUpdate = true;

			skySphere.material.map = textureEquirect;
			skySphere.material.needsUpdate = true;
		// if (skySphere && skyboxMaterial) {
		
		// 	// 3. Create material, mapping it to the inside
		// 	const material = new THREE.MeshBasicMaterial({
		// 		map: textureEquirect,
		// 		side: THREE.BackSide // Crucial for skybox
		// 	});
		// 	skySphere.material = material;
		// 	// skyboxMaterial.map = textureEquirect;
		// 	material.needsUpdate = true;
		// }
	}
}
export function InitEnvMap () {

	let skybox = settings.skyboxURL;
	
    if (skybox) {
        console.log("gotsa skybox url " + settings.skyboxURL);
        const envMapURL = settings.skyboxURL;
        // const equirectTextureLoader = new THREE.TextureLoader();

        textureEquirect = equirectTextureLoader.load( envMapURL );
        textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirect.colorSpace = THREE.SRGBColorSpace;
        // scene.background = textureEquirect;
        scene.environment = textureEquirect;
		let radius = 300;
		if (settings.sceneSkyRadius) {
			radius = settings.sceneSkyRadius;
		}
        // scene.environmentIntensity = 3;

		// 1. Create a large sphere
		if (settings.sceneUseSkybox) {	
			const sphereRadius = radius;
			const sphereSegments = 60; // Higher for better quality
			const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);

			// 3. Create material, mapping it to the inside
			skyboxMaterial = new THREE.MeshBasicMaterial({
				map: textureEquirect,
				side: THREE.BackSide // Crucial for skybox
			});

			// 4. Create the mesh and add to scene
			skySphere = new THREE.Mesh(geometry, skyboxMaterial);
			scene.add(skySphere);
		}
	}
}

export function InitWater () {
	
}
export function InitSky() {

	if (settings && settings.sceneUseDynamicSky) {
		// Add Sky
		const sky = new SkyMesh();
		sky.scale.setScalar( 450000 );
		scene.add( sky );

		const sun = new THREE.Vector3();

	
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
		} else {	


			if (settings && settings.sceneTags && settings.sceneTags.includes("sky sphere")) {
				let radius = 295;
				if (settings.sceneSkyRadius) {
					radius = settings.sceneSkyRadius - 5;
				}
				// Define your gradient colors
				const skyColor = color(new THREE.Color(settings.sceneColor1));      // Top of the sky
				const horizonColor = color(new THREE.Color(settings.sceneColor2));  // Horizon/bottom of sky

				// Compute the gradient factor based on the Y-axis position
				// We normalize position to be between 0 (bottom) and 1 (top)
				const verticalGradient = positionWorld.y.normalize();

				// Mix the colors using TSL
				const finalSkyColor = mix(horizonColor, skyColor, verticalGradient);

				// Create the Node Material

				const skyMaterial = new THREE.MeshBasicNodeMaterial();
				skyMaterial.colorNode = finalSkyColor;
				skyMaterial.side = THREE.BackSide; 
				const skyGeometry = new THREE.SphereGeometry(radius, 32, 15);
				const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);

				// Add to your scene
				scene.add(skyMesh);

			} else {
				const topColor = color( settings.sceneColor2 );
				const bottomColor = color( settings.sceneColor1 );

				// const topColor = color( 0x3a1c71 );
				// const bottomColor = color( 0xd76d77 );
				const gradientNode = mix( bottomColor, topColor, uv().y );

				scene.backgroundNode = gradientNode;
			}
			
		}

	}

        