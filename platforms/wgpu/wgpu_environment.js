import * as THREE from 'three';

import { MeshBasicNodeMaterial } from 'three/webgpu';

import { settings } from '../../../connect/settings.js';

import { sequenceInt } from '../../../connect/events.js';

import { GoToNext } from '../../../connect/connect.js';

import { scene, renderer } from './wgpu_main.mjs';

import { sunLight } from './wgpu_lights.js';

import { camera, controls } from './wgpu_controls.js';

import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import {
	color, screenUV, mx_noise_float, sin, time, fog, float, positionWorld, triNoise3D, positionView, positionGeometry, abs, fwidth, smoothstep,
	vec2, vec3, vec4, normalWorld, uniform, uv, dFdx, dFdy, fract, floor, mix, min, max, mul, cameraPosition, saturate, oneMinus, 
	Fn, texture, equirectUV, positionLocal, rangeFogFactor, pmremTexture
} from 'three/tsl';

// import { texture, positionLocal, NodeMaterial } from 'three/nodes';

import { MeshStandardNodeMaterial } from 'three';

import { equirectPictures } from './wgpu_media.js';
import { SetSequenceInt } from '../../connect/events.js';



let skySphere;
let skyboxMaterial;
let textureEquirect;
let textureEquirectPmrem;  //processed for lighting like hdr
let tslTexture;
let tslTextureEnv;
const equirectTextureLoader = new THREE.TextureLoader();
let regularColor = new THREE.Color();


let skyboxColorNode;
let skyboxEnvNode;

// const speed = time.mul(2.0);

//random colors
const speed = time.mul(.5);
const r = sin(speed);
const g = sin(speed.add(2.0));
const b = sin(speed.add(4.0));
// const rn = Math.random();
// const gn = Math.random();
// const bn = Math.random();
const animatedColor = vec3(
	r,
	g,
	b
);

const speed2 = time.mul(.25);
const r2 = sin(speed2);
const g2 = sin(speed2.add(2.0));
const b2 = sin(speed2.add(4.0));
// const rn = Math.random();
// const gn = Math.random();
// const bn = Math.random();
const animatedColor2 = vec3(
	r2,
	g2,
	b2
);

//for tweaked colors, lerp between


// const lerpedColor1 = mix(color('white'), color('orange'), uv().x);
// // const timeUniform = uniform(0);

export function InitCustomFog() { //hrm...

let skyColor = color(settings.sceneColor1);
let groundColor = color(settings.sceneColor2);

	// const skyColor = color(settings.sceneColor1);
	const pulseFactor = sin(time.mul(2.0)).mul(0.5).add(0.5);
	const color1 = color(settings.sceneColor2).rgb; // converts to vec3
	const color2 = color(settings.sceneColor2Alt).rgb;
	// const colorB = vec3(0.0, 0.0, 1.0); // Blue

	// 3. Mix between the two colors based on the pulse factor
	const lerpColor = mix(color1, color2, pulseFactor);

	if (settings && settings.sceneTweakColors) {
		skyColor = color(animatedColor);
		// let groundColor = color(settings.sceneColor2);	
		groundColor = color(animatedColor2);
	} 
	const fogNoiseDistance = positionView.z.negate().smoothstep(0, camera.far - 300);

	const distance = fogNoiseDistance.mul(20).max(4);
	const alpha = parseFloat(settings.fogDensity);
	const groundFogArea = float(distance).sub(positionWorld.y).div(distance).pow(3).saturate().mul(alpha);

	// a alternative way to create a TimerNode
	const timer = uniform(0).onFrameUpdate((frame) => frame.time); //nice

	const fogNoiseA = triNoise3D(positionWorld.mul(.005), 0.2, timer);
	const fogNoiseB = triNoise3D(positionWorld.mul(.01), 0.2, timer.mul(1.2));

	const fogNoise = fogNoiseA.add(fogNoiseB).mul(groundColor);


	if (settings && settings.sceneTweakColors) {
		const fogNoise = fogNoiseA.add(fogNoiseB).mul(lerpColor.div(2));
		scene.fogNode = fog(fogNoiseDistance.oneMinus().mix(groundColor, fogNoise), groundFogArea);
	
	} else if (settings && settings.sceneRandomColors) {
			// const fogNoise = fogNoiseA.add(fogNoiseB).mul(animatedColor);
			// groundColor
		const fogNoise = fogNoiseA.add(fogNoiseB).mul(animatedColor.div(2));
		scene.fogNode = fog(fogNoiseDistance.oneMinus().mix(groundColor, fogNoise), groundFogArea);
	} else {
		const fogNoise = fogNoiseA.add(fogNoiseB).mul(groundColor);
		scene.fogNode = fog(fogNoiseDistance.oneMinus().mix(groundColor, fogNoise), groundFogArea);
		scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );
	}
		

	// scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );

}

export function InitGrid() {
	// const grid = new InfiniteGridHelper(10, 100, 'red', 1000);
	// scene.add(grid);
	// grid.rotation.x = Math.PI / 2;

	const size = 100;
	const divisions = 100;
	const gridHelper = new THREE.GridHelper(size, divisions, settings.sceneColor2, settings.sceneColor3);
	scene.add(gridHelper);


}

export function InitGround() {

	console.log("TRYNA InitGround (default)");
	let xscale = 100;
	let yscale = 100;
	let zscale = 100;
	let radius = 100;
	const planeGeo = new THREE.CircleGeometry(radius, radius);

	const posAttribute = planeGeo.attributes.position;
	const uvAttribute = planeGeo.attributes.uv;

	for (let i = 0; i < posAttribute.count; i++) {
	const x = posAttribute.getX(i);
	const y = posAttribute.getY(i);

	// Map from [-radius, radius] to [0, 1] projection space
	const u = (x / radius + 1) / 2;
	const v = (y / radius + 1) / 2;

	uvAttribute.setXY(i, u, v);
	}
	uvAttribute.needsUpdate = true;
	
	const planeMat = new THREE.MeshStandardMaterial({ roughness: 1, color: settings.sceneColor2 });
	// planeMat.colorNode = settings.sceneColor2;
	if (textureEquirect) {
		planeMat.envMap = textureEquirect;
	}

	const planeMesh = new THREE.Mesh(planeGeo, planeMat);
	planeMesh.receiveShadow = true;
	planeMesh.rotateX(-Math.PI / 2);
	scene.add(planeMesh);
}

export function InitFog() {
	if (settings && settings.sceneUseFog) {

let skyColor = color(settings.sceneColor1);
let groundColor = color(settings.sceneColor2);
		console.log("doin some fog...");
		const fogColor = settings.sceneColor2; // Sky blue
		let radius = 400;
		if (settings.sceneSkyRadius) {
			radius = settings.sceneSkyRadius;
		}
		const fogDensity = settings.fogDensity * .5; // Adjust this value! (Default is 0.00025)
		// scene.fog = new THREE.Fog(fogColor, 10, radius * 2);
		// scene.fog = new THREE.FogExp2(animatedColor, fogDensity);
		// scene.fogNode = fog(color(animatedColor), rangeFogFactor(30, 300));
		if (settings && settings.sceneTweakColors) {
 			scene.fogNode = fog(color(animatedColor), rangeFogFactor(100, 300));
			scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );
			//  scene.fog = new THREE.FogExp2(fogColor, fogDensity);
		} else {
			scene.fogNode = fog(color(groundColor), rangeFogFactor(100, 300));
			scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );
			scene.fog = new THREE.FogExp2(fogColor, fogDensity);
		}
		
	} 
	if (settings && settings.sceneUseVolumetricFog){
		InitCustomFog();
	}
}

export function UpdateSkyColors(time) {
	if (settings && settings.sceneTweakColors) {

		// const sineCycle = time.mul(2.0).sin().mul(0.5).add(0.5);

		// // 3. Interpolate or multiply base colors using the sine node
		// const randomColor1 = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

		// const dynamicColor1 = color(randomColor).mul(sineCycle);

		// // const randomColor2 = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

		// // const dynamicColor2 = color(randomColor).mul(sineCycle);

		// // 4. Assign the node to the light's colorNode property
		sunLight.colorNode = animatedColor;

		// scene.fog.colorNode = animatedColor;


		// 		const topColor = color( settings.sceneColor2 );
		// const bottomColor = color( settings.sceneColor1 );

		// const topColor = color( 0x3a1c71 );
		// const bottomColor = color( 0xd76d77 );
		// const gradientNode = mix( dynamicColor1, dynamicColor2, uv().y );

		// scene.backgroundNode = gradientNode;
		// if (sunLight) {

		// 	const hue = (performance.now() * 0.1) % 1;
		// 	console.log("hue is " + hue);
		// 	regularColor.setHSL(hue, 1.0, 0.5);

		// 	//

		// 	sunLight.color.set(regularColor);

		// 	// scene.fog.color.set(regularColor);
		// }
		// if (scene.fog) {
		// 	scene.fog.color.set(regularColor);
		// }
	}
}

export const wavyDistortion = Fn( ( { imageTex, frequency, amplitude } ) => {
  // Multiply time by frequency and add vertical UV to create motion down the plane
  const wave = sin( uv().y.mul( frequency ).add( time ) ).mul( amplitude );
  
  // Distort the horizontal axis (X) using the wave value
  const distortedUV = vec2( uv().x.add( wave ), uv().y );
  
  return texture( imageTex, distortedUV );
} );

export async function UpdateEnvMap() {

	
	if (equirectPictures.length) {
		if (sequenceInt >= equirectPictures.length) {
			SetSequenceInt(0); //kept in events.js
		}

		console.log("UpdateEnvMap w skybox # " + sequenceInt + " of " + equirectPictures.length);// JSON.stringify(equirectPictures[sequenceInt]));
		let skyboxURL = equirectPictures[sequenceInt].url;

		if (settings && settings.sceneUseSkybox && skyboxURL && skyboxMaterial) {

			// const pmremGenerator = new THREE.PMREMGenerator(renderer);
		
			textureEquirect = await equirectTextureLoader.loadAsync(skyboxURL);
			textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
			textureEquirect.colorSpace = THREE.SRGBColorSpace;
			// textureEquirectPmrem = pmremGenerator.fromEquirectangular(textureEquirect).texture;
				


			// scene.environment = textureEquirect;
			
			// const textureEqMod = wavyDistortion(textureEquirect, 33, 33);
			// const modifiedUV = uv().add(vec3(sin(time.mul(2.0)).mul(0.02), 0.0, 0.0).xy);
			// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
			if (settings.sceneTags.includes("distort")) {
				const uvNode = uv();
				const distortion = sin(uvNode.y.mul(30).add(time)) .mul(.002);
				const distortion2 = sin(uvNode.x.mul(15).add(time)).mul(.001);
				const distortedUV = vec2(uvNode.x.add(distortion), uvNode.y.add(distortion2));
				tslTexture = texture(textureEquirect, distortedUV);



			} else if (settings.sceneTags.includes("noise")) {
				const noiseCoord = vec3(uv().mul(33.0), time.mul(0.1));
				const noiseValue = mx_noise_float(noiseCoord);

				// 4. Sample the texture with modified/distorted UVs and tint with noise
				tslTexture = texture(textureEquirect, uv().add(noiseValue.mul(0.05)));
				// skyboxColorNode = baseTexture.mul(noiseValue);
			} else {
				// tslTexture = texture(textureEquirect);
				tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
			}
			// tslTextureEnv = texture(textureEquirectPmrem, equirectUV( positionLocal.normalize()));

			if (settings.sceneTweakColors) {
				// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
				skyboxColorNode = tslTexture.mul(animatedColor.add(1).mul(0.5));
				skyboxMaterial.colorNode = skyboxColorNode; 
				scene.environmentNode = skyboxColorNode; //to everything
				scene.backgroundNode = skyboxColorNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				// skyboxMaterial.envNode = skyboxColorNode;
				// scene.environment = textureEquirect;
			} else {
				
				skyboxColorNode = tslTexture.mul(1);
				
				skyboxMaterial.colorNode = skyboxColorNode; // Assign the sampled texture to the color node
				
				scene.environmentNode = skyboxColorNode; //to everything
				scene.backgroundNode = skyboxColorNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
			}
			// textureEquirectPmrem.dispose();
			// pmremGenerator.dispose();
		}
	}
	if (settings && settings.sceneTweakColors) {

		// skyboxColorNode = tslTexture.mul(animatedColor.add(1).mul(0.75));
		// skyboxMaterial.colorNode = skyboxColorNode; // Assign the sampled texture to the color node
		// // skyboxMaterial.envNode = skyboxNode;

		// scene.environmentNode = skyboxColorNode;
		// scene.environment = textureEquirect;
				// scene.environment = textureEquirectPmrem;
		// UpdateSkyColors();
		// if (sunLight) {

		const hue = (performance.now() * 0.1) % 1;
		console.log("hue is " + hue);
		regularColor.setHSL(hue, 1.0, 0.5);

		
		if (sunLight) {
			sunLight.colorNode = animatedColor;
		}
		if (scene.fog) {
			scene.fog.color.set(regularColor);
		}
			
		// }
	}


	// textureEquirect.colorSpace = THREE.SRGBColorSpace;
	// // scene.background = textureEquirect;
	// scene.environmentNode = skyboxColorNode;
	// 	scene.environment = textureEquirect;
	// textureEquirect.needsUpdate = true;

	// skySphere.material.map = textureEquirect;
	// skySphere.material.needsUpdate = true;

	// if (settings.sceneUseSkybox) {

	// 	skyboxMaterial.colorNode = skyboxColorNode; // Assign the sampled texture to the color node
	// 	skyboxMaterial.envNode = skyboxColorNode;

	// 	// skyboxMaterial.side = THREE.BackSide;    
	// 	// scene.environmentNode = skyboxColorNode;
	// } else {

	// }
	// scene.environment = textureEquirect;
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
	// }
}
export async function InitEnvMap() {

	let skybox = settings.skyboxURL;

	if (skybox) {
		console.log("gotsa skybox url " + settings.skyboxURL);
		const envMapURL = settings.skyboxURL;


		// const equirectTextureLoader = new THREE.TextureLoader();

		// const pmremGenerator = new THREE.PMREMGenerator(renderer);
		textureEquirect = await equirectTextureLoader.loadAsync(envMapURL);

		textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
		textureEquirect.colorSpace = THREE.SRGBColorSpace;


		tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));

		// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
		let skyboxColorNode = tslTexture.mul(1);

		scene.environmentNode = skyboxColorNode;
		scene.environment = textureEquirect;
		// textureEquirectPmrem = pmremGenerator.fromEquirectangular(textureEquirect).texture;
				
 		// pmremGenerator.compileEquirectangularShader();

		// scene.environment = textureEquirectPmrem;
		

		// scene.background = textureEquirect;

		skyboxMaterial = new THREE.NodeMaterial();
		skyboxMaterial.side = THREE.BackSide;

		let radius = 300;
		if (settings.sceneSkyRadius) {
			radius = settings.sceneSkyRadius;
		}
		// scene.environmentIntensity = 3;
		
		if (settings.sceneUseSkybox) {
			// const tex = texture(textureEquirect)
			const sphereRadius = radius;
			const sphereSegments = 60; // Higher for better quality
			const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);


			// const textureEqMod = wavyDistortion(textureEquirect, 33, 33);
			
			// tslTextureEnv = texture(textureEquirectPmrem, equirectUV( positionLocal.normalize()));



			// skyboxColorNode = tslTexture.mul(1);
			// let skyboxEnvNode = pmremTexture(tslTextureEnv);

			if (settings && (settings.sceneTweakColors || settings.sceneRandomColors)) {
				tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
				skyboxColorNode = tslTexture.mul(animatedColor.add(1).mul(0.5)); 
				// skyboxEnvNode = tslTextureEnv.mul(animatedColor.add(1).mul(0.5)); 
				// if (sunLight) {
				// 	sunLight.colorNode = animatedColor;
				// }

				const hue = (performance.now() * 0.1) % 1;
				console.log("hue is " + hue);
				regularColor.setHSL(hue, 1.0, 0.5);

				
				if (sunLight) {
					sunLight.colorNode = animatedColor;
				}
				if (scene.fog) {
					scene.fog.color.set(regularColor);
				}
				
				scene.environmentNode = skyboxColorNode;
				scene.backgroundNode = skyboxColorNode;
				
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				skyboxMaterial.colorNode = skyboxColorNode; 

			} else if (settings.sceneColorizeSky) {
			
			} else {	
				scene.environmentNode = skyboxColorNode;

				scene.backgroundNode = skyboxColorNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
					skyboxMaterial.colorNode = skyboxColorNode; 


			}

				// scene.environment = textureEquirect;
				// scene.background = textureEquirect;
			// Assign the sampled texture to the color node
			// skyboxMaterial.envNode = skyboxColorNode;

		
			// 
			// scene.environment = textureEquirectPmrem;

			skySphere = new THREE.Mesh(geometry, skyboxMaterial);
		

			skySphere.position.set(0, settings.sceneGroundLevel * -1, 0);
			skyboxMaterial.needsUpdate = true;
			scene.add(skySphere);

			// textureEquirectPmrem.dispose();
			// pmremGenerator.dispose();

		}
	}
}

export function InitWater() {

}
export function InitSky() {

	if (settings && settings.sceneUseDynamicSky) {
		// Add Sky
		const sky = new SkyMesh();
		sky.scale.setScalar(450000);
		scene.add(sky);

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

		const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
		const theta = THREE.MathUtils.degToRad(effectController.azimuth);

		sun.setFromSphericalCoords(1, phi, theta);

		sky.sunPosition.value.copy(sun);

		sunLight.position.copy(sun);
		renderer.toneMappingExposure = effectController.exposure;
		// 
	} else {


		// if (settings && settings.sceneTags && !settings.sceneUseSkybox) {
		// 	let radius = 295;
		// 	if (settings.sceneSkyRadius) {
		// 		radius = settings.sceneSkyRadius - 5;
		// 	}
		// 	// Define your gradient colors
		// 	const skyColor = color(settings.sceneColor2);
		// 	const horizonColor = color(settings.sceneColor1);
		// 	// const skyColor = color(new THREE.Color(settings.sceneColor1));      // Top of the sky
		// 	// const horizonColor = color(new THREE.Color(settings.sceneColor2));  // Horizon/bottom of sky

		// 	// Compute the gradient factor based on the Y-axis position
		// 	// We normalize position to be between 0 (bottom) and 1 (top)
		// 	const verticalGradient = positionWorld.y.normalize();

		// 	// Mix the colors using TSL
		// 	const finalSkyColor = mix(horizonColor, skyColor, verticalGradient);

		// 	// Create the Node Material

		// 	const skyMaterial = new THREE.MeshBasicNodeMaterial();
		// 	skyMaterial.colorNode = finalSkyColor;
		// 	skyMaterial.side = THREE.BackSide;
		// 	const skyGeometry = new THREE.SphereGeometry(radius, 32, 15);
		// 	const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);

		// 	// Add to your scene
		// 	scene.add(skyMesh);

		// } else {
			let topColor = color(settings.sceneColor2);
			let bottomColor = color(settings.sceneColor1);

			if (settings && settings.sceneTweakColors) {
				topColor = animatedColor;
				bottomColor = animatedColor2;
			}
			// const topColor = color( 0x3a1c71 );
			// const bottomColor = color( 0xd76d77 );
			const gradientNode = mix(bottomColor, topColor, uv().y.mul(2));

			if (sunLight) {
				sunLight.colorNode = topColor;
			}
			scene.backgroundNode = gradientNode;
		}

	// }

}

