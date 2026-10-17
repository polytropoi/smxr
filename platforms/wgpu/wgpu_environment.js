import * as THREE from 'three';

import { MeshBasicNodeMaterial } from 'three/webgpu';

import { settings } from '../../../connect/settings.js';

import { sequenceInt } from '../../../connect/events.js';

import { GoToNext } from '../../../connect/connect.js';

import { scene, renderer } from './wgpu_main.mjs';

import { sunLight } from './wgpu_lights.js';

import { tileablePictures } from './wgpu_media.js';

import { SetGeneratedSurface } from './wgpu_instance.js';

import { SetGeneratedNavmesh } from './wgpu_locations.js';

import { camera, controls } from './wgpu_controls.js';

import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import {
	color, screenUV, mx_noise_float, sin, time, fog, float, positionWorld, triNoise3D, positionView, positionGeometry, abs, fwidth, smoothstep,
	vec2, vec3, vec4, normalWorld, uniform, uv, dFdx, dFdy, fract, floor, mix, min, max, mul, cameraPosition, saturate, oneMinus, 
	Fn, texture, equirectUV, positionLocal, rangeFogFactor, pmremTexture, normalLocal, length
	
} from 'three/tsl';

// import { texture, positionLocal, NodeMaterial } from 'three/nodes';

import { MeshStandardNodeMaterial } from 'three';

import { equirectPictures, InitEquirectVideo } from './wgpu_media.js';
import { SetSequenceInt } from '../../connect/events.js';
import { createStaticCollider } from './wgpu_physics.js';




let skySphere, videoSkySphere;
let skyboxMaterial, videoSkyboxMaterial;
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
export const animatedColor = vec3(
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


export async function InitHeightmap(url) {

	// 1. Load your grayscale heightmap
	console.log("tryna load heightmap " + url + " wtexture " + JSON.stringify(tileablePictures[0]));
	const textureLoader = new THREE.TextureLoader();
	const heightMap = await textureLoader.loadAsync(url);

	const textureMap = await textureLoader.loadAsync(tileablePictures[0].url);

		// 1. Set wrapping behavior to repeat
	textureMap.wrapS = THREE.RepeatWrapping; // Horizontal (U)
	textureMap.wrapT = THREE.RepeatWrapping; // Vertical (V)

	// 2. Set how many times the texture repeats across the surface
	textureMap.repeat.set(32, 32); // Repeats 4 times in X and 4 times in Y

	// 3. Optional: Set filtering for sharp or smooth rendering
	textureMap.magFilter = THREE.LinearFilter;
	textureMap.minFilter = THREE.LinearMipmapLinearFilter;
	const scale = 100;


	const geometry = new THREE.PlaneGeometry(1000, 1000, 256, 256);
// // 3. Create the material using the heightmap as a displacementMap
// 		const material = new THREE.MeshStandardMaterial({
// 			color: 0x555555,
// 			wireframe: false,
// 			displacementMap: heightMap,
// 			displacementScale: scale, // Controls the height of the peaks
// 			map: textureMap
// 		});

  	const terrainGeometry = await applyDisplacementMapToGeometry(geometry, heightMap, scale, 0);

		// terrainGeometry.computeVertexNormals();
		// terrainGeometry.computeBoundsTree ? geometry.computeBoundsTree() : geometry.computeBoundingBox();

		// 4. Combine into a mesh and add to the scene
		
		// const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
		// 

		const bottomColor = color(settings.sceneColor3); // e.g., deep water / low elevation
		const topColor = color(settings.sceneColor2);    // e.g., snow / high elevation
		const elevationFactor = positionWorld.y; 

		const material = new THREE.MeshStandardNodeMaterial();
		material.colorNode = mix(bottomColor, topColor, elevationFactor);
			
		const terrainMesh = new THREE.Mesh(terrainGeometry, material);

		scene.add(terrainMesh);
// SetGeneratedSurface(terrainGeometry.clone());
	
		terrainMesh.position.set(0, (scale/2) * -1, 0); //instead of using displacement bias
		// terrain.position.set(0, 0, 0);
		terrainMesh.rotation.x = -Math.PI / 2; // Rotate flat if needed
		const navmaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
		SetGeneratedNavmesh(terrainMesh);

		const surfaceGeo = terrainMesh.geometry.clone();
		
		

		// const rotationAttribute = surfaceMesh.geometry.getAttribute('rotation');

		const surfaceMesh = new THREE.Mesh(terrainGeometry, navmaterial);
		// const positionAttribute = surfaceMesh.geometry.getAttribute('position');
		// surfaceMesh.position.set(0, (scale/2) * -1, 0);
		surfaceMesh.position.set(0, (scale/2) * -1, 0);
		surfaceMesh.rotation.x = -Math.PI / 2;

		// surfaceMesh.material = navmaterial;

		// Tell Three.js to send the updated buffer to the GPU
				
		// positionAttribute.needsUpdate = true;
		// scene.add(surfaceMesh);
		// surfaceMesh.computeVertexNormals();
		// rotationAttribute.needsUpdate = true;
		// surfaceMesh.geometry = terrainMesh.geometry.clone();

		const colliderMesh = terrainMesh.clone();

		// surfaceMesh.rotation.x = -Math.PI / 2;
		
		createStaticCollider(colliderMesh);
		// await SetGeneratedSurface(surfaceMesh);

	
	// const textureLoader = new THREE.TextureLoader();
	// const heightmapTexture = textureLoader.load(url);

	// // 2. Define your displacement scale
	// const maxElevation = 50.0; 

	// // 3. Setup the TSL logic
	// // Sample the height from the red channel (standard for heightmaps)
	// const heightSample = texture(heightmapTexture, uv()).x;

	// // Apply displacement node to the geometry's local positions
	// const displacedPosition = positionLocal.add(THREE.vec3(0, heightSample.mul(maxElevation), 0));

	// // Determine color based on the relative height (0.0 to 1.0)
	// const lowestColor = color('#1a4d1a');  // Deep valley green
	// const highestColor = color('#ffffff'); // Snowy mountain white

	// // Linearly interpolate color based on heightmap value
	// const terrainColorNode = mix(lowestColor, highestColor, heightSample);

	// // 4. Construct the Material
	// const terrainMaterial = new THREE.MeshStandardNodeMaterial({
	// 	positionNode: displacedPosition, // Vertices moved on the GPU
	// 	colorNode: terrainColorNode       // Dynamic fragment coloring
	// });

	// // 5. Apply to a highly subdivided Plane
	// const geometry = new THREE.PlaneGeometry(200, 200, 256, 256);
	// geometry.rotateX(-Math.PI / 2); // Orient flat on the XZ plane

	// const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
	// scene.add(terrainMesh);
	// console.log("LOADED heightmap");

}

// Helper function to bake a displacement map into a BufferGeometry
async function applyDisplacementMapToGeometry(geometry, displacementMapTexture, scale = 1, bias = 0) {
  // Ensure the texture image is loaded
  const image = displacementMapTexture.image;
  if (!image) {
    throw new Error('Displacement map image not loaded yet.');
  }

  // Draw texture onto an offscreen canvas to read pixel data
  const canvas = document.createElement('canvas');
  canvas.width = image.width || image.naturalWidth;
  canvas.height = image.height || image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal;
  const uvAttr = geometry.attributes.uv;

  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const uv = new THREE.Vector2();

  for (let i = 0; i < posAttr.count; i++) {
    position.fromBufferAttribute(posAttr, i);
    normal.fromBufferAttribute(normAttr, i).normalize();
    uv.fromBufferAttribute(uvAttr, i);

    // Map UV (0 to 1) to canvas pixel coordinates
    const x = Math.min(Math.floor(uv.x * canvas.width), canvas.width - 1);
    const y = Math.min(Math.floor((1 - uv.y) * canvas.height), canvas.height - 1); // Flip Y if needed

    const idx = (y * canvas.width + x) * 4;
    // Assuming grayscale or using red channel for displacement (0 to 255 -> 0 to 1)
    const displacementValue = (data[idx] / 255); 
    const finalDisplacement = displacementValue * scale + bias;

    // Displace vertex along normal
    position.addScaledVector(normal, finalDisplacement);
    posAttr.setXYZ(i, position.x, position.y, position.z);
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
//   geometry.computeBoundsTree ? geometry.computeBoundsTree() : geometry.computeBoundingBox();

  return geometry;
}

export async function InitGround(options) {

	console.log("tryna InitGround with options " + JSON.stringify(options));
	let groundGeometry;
	let x = 512;
	let y = 512;
	let radius = 100;
	
	if (settings.sceneSkyRadius) {
		x = settings.sceneSkyRadius - (settings.sceneSkyRadius * .1);
		y = settings.sceneSkyRadius - (settings.sceneSkyRadius * .1);
		radius = settings.sceneSkyRadius / 2;
	}
	if (options.type == "circle") {
		
		// let xscale = 100;
		// let yscale = 100;
		// let zscale = 100;
		// radius = 1024;
		groundGeometry = new THREE.CircleGeometry(radius, radius/10);

		const posAttribute = groundGeometry.attributes.position;
		const uvAttribute = groundGeometry.attributes.uv;

		for (let i = 0; i < posAttribute.count; i++) {
		const x = posAttribute.getX(i);
		const y = posAttribute.getY(i);

		// Map from [-radius, radius] to [0, 1] projection space
		const u = (x / radius + 1) / 2;
		const v = (y / radius + 1) / 2;

		uvAttribute.setXY(i, u, v);
		}
		uvAttribute.needsUpdate = true;
	} else {
		// groundSize = settings.sceneSkyRadius * 2
		groundGeometry = new THREE.PlaneGeometry(Math.floor(x),Math.floor(y),128,128);
	}
		
	if (options && options.type == "tsl noise") {
		const planeMat = new THREE.MeshStandardNodeMaterial({
		// color: 0x00ffcc
		// roughness: .2,
		// wireframe: true
		});
		const noiseScale = .05;
		let noiseInput = mul(positionLocal, noiseScale);
		let speed = 1;
		let animatedTime = 1;
		if (options && options.animate) { 
		  	speed = .05;
  			animatedTime = time.mul(speed);
			noiseInput = mul(positionLocal, noiseScale).mul(animatedTime);
		}


		const noiseVal = mx_noise_float(noiseInput);

		// Scale the noise to control the displacement height
		const displacementAmount = 5;
		const displacement = mul(noiseVal, displacementAmount);

		// 4. Offset the vertex positions along their normals
		const pos = positionLocal.toVar();
		const distFromCenter = length(pos.xz);
		const flatRadius = float(10.0);
		const fadeWidth = float(20.0);
		// const mask = smoothstep(flatRadius, flatRadius.add(fadeWidth), distFromCenter);

		const displacedPosition = positionLocal.add(mul(normalLocal, displacement));

		// 5. Assign the result to the material's positionNode

		const uvCoord = uv();

		// Calculate distance from the center of the UV map (0.5, 0.5)
		const centerDist = length(uvCoord.sub(.5));

		// Create a mask: 0 at the center, ramping up to 1 near the edges
		// smoothstep(edge0, edge1, x) -> adjust radius as needed
		const mask = smoothstep(0.01, 0.25, centerDist);

		const finalDisplacement = displacedPosition.mul(mask);
		planeMat.positionNode = displacedPosition;



				// 3. Color by Elevation Node
		// Define your terrain colors (Low elevation vs High elevation)
		const lowColor = vec3( 0.1, 0.5, 0.2 );  // Green valleys
		const highColor = vec3( 0.8, 0.4, 0.1 ); // Brown/Orange peaks

		// Mix the colors based on the elevation factor
		// (mx_noise_float typically outputs a -1 to 1 range, so we normalize to 0-1)
		const colorFactor = noiseVal.add( 1.0 ).mul( 0.5 ); 
		const elevationColor = lowColor.mix( highColor, colorFactor );
		planeMat.colorNode = elevationColor;
		let planeMesh = new THREE.Mesh(groundGeometry, planeMat);

		// SetGeneratedNavmesh(planeMesh); //uh, no
		
		planeMesh.receiveShadow = true;
		planeMesh.rotateX(-Math.PI / 2);
		
		scene.add(planeMesh);
	} else if (options && options.type == "simple noise") {
		const geometry = new THREE.PlaneGeometry(512, 512, 256, 256); 

		// Generate our noise texture
		const noiseTexture = generateNoiseTexture();

		// Create a material that supports displacement mapping
		const material = new THREE.MeshStandardMaterial({
			color: 0x33aa55,
			wireframe: false, // Set to true if you want to see the vertex shifts clearly
			roughness: 0.8,
			
			// Pass the noise map here
			displacementMap: noiseTexture, 
			// Adjust how high/low the peaks and valleys go
			displacementScale: 2,       
			// Adjusts the base zero-point offset of the map
			displacementBias: 0.0          
		});

		// Combine into a mesh and add to your scene
		const terrainMesh = new THREE.Mesh(geometry, material);
		terrainMesh.rotation.x = -Math.PI / 2; // Lay flat like ground
		scene.add(terrainMesh);
	} else if (options && options.type == "perlin noise1") {
				// 1. Setup Geometry and Data
		const size = 128; // Resolution of the grid/texture
		const width = 1024, height = 1024;
		const geometry = new THREE.PlaneGeometry(width, height, size - 1, size - 1);
		const perlin = new ImprovedNoise();

		// Create arrays for the texture and displacement
		const data = new Uint8Array(size * size);
		const positions = geometry.attributes.position;

		// 2. Generate Perlin Noise and Apply to Mesh
		for (let i = 0; i < positions.count; i++) {
			// Get UV coordinates or vertex position to sample noise
			const u = geometry.attributes.uv.getX(i);
			const v = geometry.attributes.uv.getY(i);

			// Sample Perlin Noise (returns values between -1 and 1)
			// Scale u and v to adjust the frequency of the noise
			const noiseValue = perlin.noise(u * 15, v * 15, 0); 
			
			// Scale and map the noise value for height displacement (Z axis for PlaneGeometry)
			const elevation = noiseValue * 15; 
			positions.setZ(i, elevation);

			// Save mapping to texture data (convert -1 to 1 range into 0 to 255)
			const pixelValue = Math.floor((noiseValue + 1) * 127.5);
			data[i] = pixelValue;
		}

		// Crucial: Tell Three.js that the vertices positions updated
		const merged = BufferGeometryUtils.mergeVertices(geometry);
		merged.computeVertexNormals();
		merged.attributes.position.needsUpdate = true;		
		// geometry.computeVertexNormals();
		// geometry.attributes.position.needsUpdate = true;

		// 3. Create the Perlin Noise Visual Texture
		// Use RedFormat since it's a grayscale heightmap
		const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
		texture.needsUpdate = true;

		// 4. Create Material and Mesh


		// const material = new THREE.MeshStandardNodeMaterial({
		// 	map: texture, // Uses the generated Perlin noise texture visually
		// 	wireframe: false,
		// 	// side: THREE.DoubleSide
		// });
		const bottomColor = color(settings.sceneColor3); // e.g., deep water / low elevation
		const topColor = color(settings.sceneColor2);    // e.g., snow / high elevation
		const elevationFactor = positionWorld.y; 

		const material = new THREE.MeshStandardNodeMaterial();
		material.colorNode = mix(bottomColor, topColor, elevationFactor);

		const mesh = new THREE.Mesh(merged, material);
		 // Lay flat like terrain
		scene.add(mesh);

		mesh.rotation.x = -Math.PI / 2;
		// SetGeneratedNavmesh(mesh);
		SetGeneratedSurface(mesh);
		createStaticCollider(mesh);
		// SetGeneratedNavmesh(mesh); //?
	}  else if (options && options.type == "perlin noise") {
	
		// Setup Plane Geometry
		let textureMap
		if (tileablePictures.length) {
			const textureLoader = new THREE.TextureLoader();
			textureMap = await textureLoader.loadAsync(tileablePictures[0].url);

			if (textureMap) {
			// 1. Set wrapping behavior to repeat
				textureMap.wrapS = THREE.RepeatWrapping; // Horizontal (U)
				textureMap.wrapT = THREE.RepeatWrapping; // Vertical (V)

				// 2. Set how many times the texture repeats across the surface
				textureMap.repeat.set(32, 32); // Repeats 4 times in X and 4 times in Y

				// 3. Optional: Set filtering for sharp or smooth rendering
				textureMap.magFilter = THREE.LinearFilter;
				textureMap.minFilter = THREE.LinearMipmapLinearFilter;
			}
		}
		const width = x;
		const height = y;
		const segments = 128; 
		const geometry = new THREE.PlaneGeometry(width, height, segments, segments);

		// Rotate to make it horizontal (flat terrain)
		geometry.rotateX(-Math.PI / 2);

		// Access the position attribute
		const positionAttr = geometry.attributes.position;
		const perlin = new ImprovedNoise();
		const peakHeight = 5; // Maximum height of hills
		const noiseScale = 100;

		for (let i = 0; i < positionAttr.count; i++) {
			// Get X and Z coordinates of the vertex
			const x = positionAttr.getX(i);
			const z = positionAttr.getZ(i);

			// Calculate noise value based on coordinates (scale inputs for smooth hills)
			const y = perlin.noise(x * .05, 0, z * .05) * peakHeight;

			// Update the Y (height) coordinate
			positionAttr.setY(i, y);
		}
		// for (let i = 0; i < positionAttr.count; i++) {
		// 	const x = positionAttr.getX(i);
		// 	const y = positionAttr.getY(i);

		// 	// Dividing coordinates stretches the noise map, making features larger
		// 	const z = perlin.noise(x / noiseScale, y / noiseScale, 0) * peakHeight;
			
		// 	positionAttr.setZ(i, z);
		// }


		// Required updates for Three.js to render correctly
		geometry.computeVertexNormals();
		positionAttr.needsUpdate = true;

		const moddedGeo = createNavGeometry(geometry);
		// const material = new THREE.MeshStandardMaterial({ color: 0x55aa55, wireframe: false });

		const bottomColor = color(settings.sceneColor3); // e.g., deep water / low elevation
		const topColor = color(settings.sceneColor2);    // e.g., snow / high elevation
		const elevationFactor = positionWorld.y; 

		const material = new THREE.MeshStandardNodeMaterial();
		const colorMix = mix(bottomColor, topColor, elevationFactor);
		material.roughnessNode = .9;
		material.envMapIntensity = 2;
		if (textureMap) {
			material.colorNode = texture(textureMap).mul(colorMix);
		} else {
			material.colorNode = colorMix;
		}

		const navmaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
		const terrainMesh = new THREE.Mesh(geometry, material);
		// const navMesh = new THREE.Mesh(moddedGeo, navmaterial);

		scene.add(terrainMesh);


		const surfaceMesh = terrainMesh.clone();
		const colliderMesh = terrainMesh.clone();
		const navigationMesh = terrainMesh.clone();

		SetGeneratedNavmesh(navigationMesh);
		surfaceMesh.material = navmaterial;
		surfaceMesh.rotation.x = -Math.PI / 2;
		SetGeneratedSurface(surfaceMesh, "buffer");
		createStaticCollider(colliderMesh);
		console.log("generated perlin ground!");
	
	} else { //e.g. flat or circle
		let textureMap;
		if (tileablePictures.length) {
			const textureLoader = new THREE.TextureLoader();
			textureMap = await textureLoader.loadAsync(tileablePictures[0].url);

			if (textureMap) {
				// 1. Set wrapping behavior to repeat
				textureMap.wrapS = THREE.RepeatWrapping; // Horizontal (U)
				textureMap.wrapT = THREE.RepeatWrapping; // Vertical (V)

				// 2. Set how many times the texture repeats across the surface
				textureMap.repeat.set(32, 32); // Repeats 4 times in X and 4 times in Y

				// 3. Optional: Set filtering for sharp or smooth rendering
				textureMap.magFilter = THREE.LinearFilter;
				textureMap.minFilter = THREE.LinearMipmapLinearFilter;
			}
		}
		// const bottomColor = color(settings.sceneColor3); // e.g., deep water / low elevation
		const tint = color(settings.sceneColor2);    // e.g., snow / high elevation
		// const elevationFactor = positionWorld.y; 

		const navmaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
		const material = new THREE.MeshStandardNodeMaterial();
		// const colorMix = mix(bottomColor, topColor, elevationFactor);
		material.roughnessNode = .9;
		material.envMapIntensity = 2;

		if (textureMap) {
			material.colorNode = texture(textureMap).mul(tint);
		} else {
			material.colorNode = tint;
		}
		
		// const planeMat = new THREE.MeshStandardMaterial({ roughness: 1, color: settings.sceneColor2 });
	// planeMat.colorNode = settings.sceneColor2;
		let planeMesh = new THREE.Mesh(groundGeometry, material);
		let navigationMesh = new THREE.Mesh(groundGeometry, navmaterial);


		planeMesh.rotateX(-Math.PI / 2);
		planeMesh.position.set(0,0,0);

		navigationMesh.rotateX(-Math.PI / 2);
		navigationMesh.position.set(0,0,0);

		scene.add(planeMesh);
		scene.add(navigationMesh);
		SetGeneratedNavmesh(navigationMesh);


		const surfaceMesh = planeMesh.clone();
		const colliderMesh = planeMesh.clone();
		// const navigationMesh = planeMesh.clone();

		surfaceMesh.material = navmaterial;
		surfaceMesh.rotation.x = -Math.PI / 2;
		SetGeneratedSurface(surfaceMesh, "primitive");
		createStaticCollider(colliderMesh);
		console.log("generated flat ground!");
	}
}

function createNavGeometry(terrainGeometry, maxSlope = 0.7) {
    const posAttr = terrainGeometry.attributes.position;
    const indexAttr = terrainGeometry.index;
    
    const navVertices = [];
    const tempV1 = new THREE.Vector3();
    const tempV2 = new THREE.Vector3();
    const tempV3 = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // Process every triangle face
    for (let i = 0; i < indexAttr.count; i += 3) {
        const idx1 = indexAttr.getX(i);
        const idx2 = indexAttr.getX(i + 1);
        const idx3 = indexAttr.getX(i + 2);

        tempV1.fromBufferAttribute(posAttr, idx1);
        tempV2.fromBufferAttribute(posAttr, idx2);
        tempV3.fromBufferAttribute(posAttr, idx3);

        // Calculate face slope normal
        THREE.Triangle.getNormal(tempV1, tempV2, tempV3, faceNormal);
        const slope = faceNormal.dot(up);

        // Only include the triangle if it is flat enough to walk on
        if (slope >= maxSlope) {
            navVertices.push(tempV1.x, tempV1.y, tempV1.z);
            navVertices.push(tempV2.x, tempV2.y, tempV2.z);
            navVertices.push(tempV3.x, tempV3.y, tempV3.z);
        }
    }

    const navGeo = new THREE.BufferGeometry();
    navGeo.setAttribute('position', new THREE.Float32BufferAttribute(navVertices, 3));
    return navGeo;
}

function generateNoiseTexture(width = 1024, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create a pixel buffer
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Simple pseudo-random/perlin-like noise distribution
    for (let i = 0; i < data.length; i += 4) {
        // Generate a random grayscale value between 0 and 255
        // (Tip: For smoother terrain, look into Simplex or Perlin noise algorithms)
        const value = Math.floor(Math.random() * 255); 
        
        data[i]     = value; // Red
        data[i + 1] = value; // Green
        data[i + 2] = value; // Blue
        data[i + 3] = 255;   // Alpha (fully opaque)
    }

    ctx.putImageData(imgData, 0, 0);

    // Convert the canvas into a Three.js CanvasTexture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Displacement maps represent non-color data
    texture.colorSpace = THREE.NoColorSpace; 
    
    // Optional: Use linear filtering to smooth out rough pixel edges
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
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
 			// scene.fogNode = fog(color(animatedColor), rangeFogFactor(100, 1000));
			// scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );
			 scene.fog = new THREE.FogExp2(fogColor, fogDensity);
		} else {
			// scene.fogNode = fog(color(groundColor), rangeFogFactor(100, 1000));
			// scene.backgroundNode = normalWorld.y.max( 0 ).mix( groundColor, skyColor );
			scene.fog = new THREE.FogExp2(fogColor, fogDensity);
		}
		
	} 
	if (settings && settings.sceneUseVolumetricFog){
		InitCustomFog();
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
		
			const textureEquirect = await equirectTextureLoader.loadAsync(skyboxURL);
			textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
			textureEquirect.colorSpace = THREE.SRGBColorSpace;
			textureEquirect.wrapS = THREE.RepeatWrapping; 
    		textureEquirect.wrapT = THREE.ClampToEdgeWrapping; 
			// textureEquirectPmrem = pmremGenerator.fromEquirectangular(textureEquirect).texture;
				

			let skyboxColorNode;
			// scene.environment = textureEquirect;
			
			// const textureEqMod = wavyDistortion(textureEquirect, 33, 33);
			// const modifiedUV = uv().add(vec3(sin(time.mul(2.0)).mul(0.02), 0.0, 0.0).xy);
			let tslTexture; 
					// tslTexture = texture(textureEquirect, equirectUV());
			if (settings.sceneTags.includes("distort")) {
				const uvNode = uv();
				const distortion = sin(uvNode.y.mul(30).add(time)) .mul(.002);
				const distortion2 = sin(uvNode.x.mul(15).add(time)).mul(.001);
				const distortedUV = vec2(uvNode.x.add(distortion), uvNode.y.add(distortion2));
				tslTexture = texture(textureEquirect, distortedUV);
				// tslTexture.mapping = THREE.EquirectangularReflectionMapping;



			} else if (settings.sceneTags.includes("noise")) {
				const noiseCoord = vec3(uv().mul(33.0), time.mul(0.1));
				const noiseValue = mx_noise_float(noiseCoord);

				// 4. Sample the texture with modified/distorted UVs and tint with noise
				tslTexture = texture(textureEquirect, uv().add(noiseValue.mul(0.05)));

				// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize().add(noiseValue.mul(0.05))));
				// skyboxColorNode = baseTexture.mul(noiseValue);
				// tslTexture = texture(textureEquirect);
			} else {
				// tslTexture = texture(textureEquirect);
				// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
				// tslTexture = texture(textureEquirect, uv());
						// tslTexture = texture(textureEquirect, equirectUV());
				// tslTexture = texture(textureEquirect, equirectUV( positionWorld.normalize()));
				tslTexture = texture(textureEquirect);
			}
			
		
			// tslTextureEnv = texture(textureEquirectPmrem, equirectUV( positionLocal.normalize()));

			if (settings.sceneTweakColors) {
				// tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
				skyboxColorNode = tslTexture.mul(animatedColor.add(1).mul(0.5));
				skyboxMaterial.colorNode = skyboxColorNode; 
				// scene.environmentNode = skyboxColorNode; //to everything
				// scene.backgroundNode = skyboxColorNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				// skyboxMaterial.envNode = skyboxColorNode;
				// scene.environment = textureEquirect;
			} else {
				
				skyboxColorNode = tslTexture.mul(1);
				
				skyboxMaterial.colorNode = skyboxColorNode; // Assign the sampled texture to the color node
				
				// scene.environmentNode = skyboxColorNode; //to everything
				// scene.backgroundNode = skyboxColorNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
			}

			skyboxMaterial.needsUpdate = true;
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

	let radius = 300;
	if (settings.sceneSkyRadius) {
		radius = settings.sceneSkyRadius;
	}
	const equirectVideos = settings.equirectVideos;

	if (equirectVideos && equirectVideos.length) {


		const videoSkyboxMaterial = new THREE.MeshBasicNodeMaterial();
		videoSkyboxMaterial.side = THREE.BackSide;
		const sphereRadius = radius - 10;
		const sphereSegments = 60; // Higher for better quality
		const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);
		const videoSkySphere = new THREE.Mesh(geometry, videoSkyboxMaterial);
	

		videoSkySphere.position.set(0, settings.sceneGroundLevel * -1, 0);
		// videoSkyboxMaterial.needsUpdate = true;
		scene.add(videoSkySphere);
		const vidElID =  "video_" + equirectVideos[0].id
		const sceneEquirectVideo = InitEquirectVideo(vidElID, videoSkySphere);

		// const textureEquirect = sceneEquirectVideo.returnVideoTexture();
		// textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
		// textureEquirect.colorSpace = THREE.SRGBColorSpace;


		// // tslTexture = texture(textureEquirect, uv());
		// // tslTexture = texture(textureEquirect, equirectUV());

		// const tslTexture = texture(textureEquirect, equirectUV( positionLocal.normalize()));
		// let videoSkyboxColorNode = tslTexture.mul(3);
		// videoSkyboxMaterial.colorNode = videoSkyboxColorNode;
		// scene.environmentNode = skyboxColorNode;
		// scene.environment = textureEquirect;

	}

	if (skybox) {
		console.log("gotsa skybox url " + settings.skyboxURL);
		const envMapURL = settings.skyboxURL;


		// const equirectTextureLoader = new THREE.TextureLoader();

		// const pmremGenerator = new THREE.PMREMGenerator(renderer);
		textureEquirect = await equirectTextureLoader.loadAsync(envMapURL);

		textureEquirect.mapping = THREE.EquirectangularReflectionMapping;
		textureEquirect.wrapS = THREE.RepeatWrapping; 
    	textureEquirect.wrapT = THREE.ClampToEdgeWrapping; 
		textureEquirect.colorSpace = THREE.SRGBColorSpace;


		// tslTexture = texture(textureEquirect, uv());
		// tslTexture = texture(textureEquirect, equirectUV());

		// tslTexture = texture(textureEquirect, equirectUV( positionWorld.normalize() ));
		// let skyboxColorNode;

		// scene.environmentNode = skyboxColorNode;
		// scene.environment = textureEquirect;
		// scene.environmentIntensity = 2.5; 
		skyboxMaterial = new THREE.NodeMaterial();
		skyboxMaterial.side = THREE.BackSide;

		
		if (settings.sceneUseSkybox) {
			// const tex = texture(textureEquirect)
			const sphereRadius = radius;
			const sphereSegments = 60; // Higher for better quality
			const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);

			if (settings.sceneTags.includes("distort")) {
				const uvNode = uv();
				const distortion = sin(uvNode.y.mul(30).add(time)) .mul(.002);
				const distortion2 = sin(uvNode.x.mul(15).add(time)).mul(.001);
				const distortedUV = vec2(uvNode.x.add(distortion), uvNode.y.add(distortion2));
				tslTexture = texture(textureEquirect, distortedUV);



			} else if (settings.sceneTags.includes("noise")) {
				const noiseCoord = vec3(uv().mul(33.0), time.mul(0.1));
				const noiseValue = mx_noise_float(noiseCoord);

				tslTexture = texture(textureEquirect, uv().add(noiseValue.mul(0.05)));
				// tslTexture = texture(textureEquirect);
				
			} else {
				// tslTexture = texture(textureEquirect, equirectUV());
				
				// tslTexture = texture(textureEquirect, equirectUV());
				// tslTexture = texture(textureEquirect);
				tslTexture = texture(textureEquirect, equirectUV( positionWorld.normalize() ));
			}
			let skyboxColorNode = tslTexture.mul(1);
			const envNode = pmremTexture(tslTexture);


			if (settings && (settings.sceneTweakColors || settings.sceneRandomColors)) {
				
				skyboxColorNode = tslTexture.mul(animatedColor.add(1).mul(0.5)); 
				
				const hue = (performance.now() * 0.1) % 1;
				console.log("hue is " + hue);
				regularColor.setHSL(hue, 1.0, 0.5);
				
				if (sunLight) {
					sunLight.colorNode = animatedColor;
				}
				if (scene.fog) {
					scene.fog.color.set(regularColor);
				}				
				// scene.environmentNode = skyboxColorNode;
				// scene.backgroundNode = skyboxColorNode;
				scene.environmentNode = envNode;
				scene.backgroundNode = envNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				skyboxMaterial.colorNode = skyboxColorNode; 
			} else if (settings.sceneColorizeSky) {
				console.log("tryna colorize sky to " + settings.sceneColor2);
				const skyColor = color(settings.sceneColor2);
				skyboxColorNode = tslTexture.mul(skyColor.mul(3));
				// scene.environmentNode = skyboxColorNode;
				// scene.backgroundNode = skyboxColorNode;
				scene.environmentNode = envNode;
				scene.backgroundNode = envNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				skyboxMaterial.colorNode = skyboxColorNode; 
			} else {	
				// scene.environmentNode = skyboxColorNode;
				// scene.backgroundNode = skyboxColorNode;
				scene.environmentNode = envNode;
				scene.backgroundNode = envNode;
				scene.environment = textureEquirect;
				scene.background = textureEquirect;
				skyboxMaterial.colorNode = skyboxColorNode; 

			}

			skySphere = new THREE.Mesh(geometry, skyboxMaterial);	
			skySphere.position.set(0, settings.sceneGroundLevel * -1, 0);
			skyboxMaterial.needsUpdate = true;
			scene.add(skySphere);

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


		const sun = new THREE.Vector3();


		console.log("sky params " + JSON.stringify(settings.sceneTime) + " " + JSON.stringify(settings.sceneClouds));
		let elevation = 65;
		let sceneClouds = "medium";
		let cloudCoverage = .75;
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

		// const effectController = {
		// 	turbidity: 10,
		// 	rayleigh: 3,
		// 	mieCoefficient: 0.005,
		// 	mieDirectionalG: 0.7,
		// 	elevation: elevation,
		// 	azimuth: 180,
		// 	// exposure: renderer.toneMappingExposure,
		// 	exposure: .05,
		// 	cloudCoverage: cloudCoverage,
		// 	cloudDensity: cloudDensity,
		// 	cloudElevation: cloudElevation
		// };

		const effectController = {
			turbidity: 5,
			rayleigh: 1,
			mieCoefficient: 0.005,
			mieDirectionalG: 0.7,
			elevation: elevation,
			azimuth: 180,
			// exposure: renderer.toneMappingExposure,
			exposure: .05,
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

		scene.add(sky);
		sky.sunPosition.value.copy(sun);

		

		sunLight.position.copy(sun);
		// renderer.toneMappingExposure = effectController.exposure;
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

