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



export function InitGround() {
	console.log("tryna InitGround");
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
        const fogColor = settings.sceneColor2; // Sky blue
		let radius = 400;
		if (settings.sceneSkyRadius) {
			radius = settings.sceneSkyRadius;
		}
        // const fogDensity = 0.01; // Adjust this value! (Default is 0.00025)
        // scene.fog = new THREE.Fog(fogColor, 10, radius);

				const fogDensity = settings.fogDensity * .5; // Adjust this value! (Default is 0.00025)
				// scene.fog = new THREE.Fog(fogColor, 10, radius * 2);
				scene.fog = new THREE.FogExp2( fogColor, fogDensity );
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
		// const uniforms = sky.material.uniforms;
		// uniforms['turbidity'].value = 4;
		// uniforms['rayleigh'].value = 2;
		// uniforms['mieCoefficient'].value = 0.005;
		// uniforms['mieDirectionalG'].value = 0.8;


		const effectController = {
					turbidity: 10,
					rayleigh: 3,
					mieCoefficient: 0.005,
					mieDirectionalG: 0.7,
					elevation: 2,
					azimuth: 180,
					exposure: renderer.toneMappingExposure,
					cloudCoverage: 0.4,
					cloudDensity: 0.4,
					cloudElevation: 0.5,
					showSunDisc: true
				};

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
		let sun = new THREE.Vector3();
		const uniforms = sky.material.uniforms;
					uniforms[ 'turbidity' ].value = effectController.turbidity;
					uniforms[ 'rayleigh' ].value = effectController.rayleigh;
					uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
					uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;
					// uniforms[ 'cloudCoverage' ].value = effectController.cloudCoverage;
					// uniforms[ 'cloudDensity' ].value = effectController.cloudDensity;
					// uniforms[ 'cloudElevation' ].value = effectController.cloudElevation;
					// uniforms[ 'showSunDisc' ].value = effectController.showSunDisc;

					const phi = THREE.MathUtils.degToRad( 90 - elevation );
					const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					uniforms[ 'sunPosition' ].value.copy( sun );

					renderer.toneMappingExposure = effectController.exposure;
		// 3. Set Sun position
		// const phi = THREE.MathUtils.degToRad(elevation); // Elevation
		// const theta = THREE.MathUtils.degToRad(180); // Azimuth
		// const sunPosition = new THREE.Vector3();
		// sunPosition.setFromSphericalCoords(1, phi, theta);

		// uniforms['sunPosition'].value.copy(sunPosition);
		sunLight.position.copy(sun);
		const color = new THREE.Color(settings.sceneColor2);
		scene.background = color;
			
	} else {
		const color2 = new THREE.Color(settings.sceneColor2);

		const color1 = new THREE.Color(settings.sceneColor1);

		// // scene.background = topColor;
 		// console.log("tryna set background gradient " + settings.sceneColor1 + " " + settings.sceneColor2);

		// const skyGeometry = new THREE.SphereGeometry(150, 32, 32);

		// // Use a custom ShaderMaterial to blend colors
		// const skyMaterial = new THREE.ShaderMaterial({
		// vertexShader: `
		// 	varying vec3 vUv;
		// 	void main() {
		// 	vUv = position;
		// 	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		// 	}
		// `,
		// fragmentShader: `
		// 	uniform vec3 topColor;
		// 	uniform vec3 bottomColor;
		// 	uniform float offset;
		// 	uniform float exponent;
		// 	varying vec3 vUv;
		// 	void main() {
		// 	// Calculate normalized height ratio
		// 	float h = normalize(vUv).y + offset;
		// 	// Clamp values and apply power for exponential transition
		// 	gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
		// 	}
		// `,
		// uniforms: {
		// 	topColor: { value: color1 }, // Top color
		// 	bottomColor: { value: color2 }, // Bottom color
		// 	offset: { value: 33 },
		// 	exponent: { value: 0.6 }
		// },
		// side: THREE.BackSide // Render the inside of the sphere!
		// // });

		// const sky = new THREE.Mesh(skyGeometry, skyMaterial);
		// scene.add(sky);

		const vertexShader = `
			varying vec3 vWorldPosition;
			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
			`;

		const fragmentShader = `
			uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;
			varying vec3 vWorldPosition;

			void main() {
				// Normalize the Y-world position to a 0.0 - 1.0 scale
				float h = normalize(vWorldPosition + offset).y;
				// Keep the value between 0.0 and 1.0, then apply exponent for sharper/softer blend
				float gradientFactor = max(pow(max(h, 0.0), exponent), 0.0);
				
				// Mix the bottom and top colors
				gl_FragColor = vec4(mix(bottomColor, topColor, gradientFactor), 1.0);
			}
		`;

				// 2. Create the Sky Material
		const skyMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		uniforms: {
			topColor: { value: new THREE.Color(settings.sceneColor2) }, // Sky color
			bottomColor: { value: new THREE.Color(settings.sceneColor1) }, // Horizon color
			offset: { value: 0 }, // Controls gradient center
			exponent: { value: 1.2 } // Controls gradient transition sharpness
		},
		side: THREE.BackSide // Renders on the inside of the sphere
		});

		// 3. Create the Sky Sphere
		const skyGeometry = new THREE.SphereGeometry(500, 32, 15);
		const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
		scene.add(skySphere);
	}
}
			