
import * as THREE from 'three';

import { scene, animatedSprites } from './wgpu_main.mjs';
import { uniform, Fn, vec3, sin, time, color } from 'three/tsl';

import { CreateSprites, CreateAnimatedSprite } from './wgpu_fx.js';

import { settings } from '../../../connect/settings.js';

export let lightMods = [];

export let sunLight;

export let skyAmbientLight;

export let waterAmbientLight;

export function InitSceneLights () {
            sunLight = new THREE.DirectionalLight( settings.sceneColor1, 2 );
            sunLight.castShadow = true;
            // sunLight.shadow.mapSize.width = 4096;
            // sunLight.shadow.mapSize.height = 4096;
            sunLight.shadow.camera.near = .5;
            sunLight.shadow.camera.far = 50;
            // sunLight.shadow.camera.right = 2;
            // sunLight.shadow.camera.left = - 2;
            // sunLight.shadow.camera.top = 1;
            // sunLight.shadow.camera.bottom = - 2;
            sunLight.shadow.camera.left = -50;
            sunLight.shadow.camera.right = 50;
            sunLight.shadow.camera.top = 50;
            sunLight.shadow.camera.bottom = -50;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.bias = - 0.01;
            sunLight.position.set( 50, 50, 50 );
    
            waterAmbientLight = new THREE.HemisphereLight( settings.sceneColor3, settings.sceneColor4, .5 );
            skyAmbientLight = new THREE.HemisphereLight( settings.sceneColor2, settings.sceneColor3, 1.5 );
    
            scene.add( sunLight );
            scene.add( skyAmbientLight );
            scene.add( waterAmbientLight );
}


export function create_Light(locationData) {
    console.log("tryna create light ");
    const light = new THREE.PointLight( 0xff0000, 5, 50 );
    light.position.set(locationData.x, locationData.y, locationData.z);
    scene.add(light);
    lightMods.push(light);
}

export function CreateLight(locationData) {

    if (!locationData.yscale) {
        locationData.yscale = 1;
    }
    if (locationData.locationTags.includes("fire")) {
        console.log("tryna create fire size " + locationData.yscale);
        
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 0);
        light.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(light);
        
        lightMods.push(light);

        const smoke = CreateSprites(6, parseFloat(locationData.yscale), parseFloat(locationData.yscale), null);
        smoke.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(smoke);
            // }
        const animatedSprite = CreateAnimatedSprite("fireanim1", locationData.yscale, 30, 6, 6);
        scene.add(animatedSprite);
        animatedSprite.position.set(locationData.x, locationData.y, locationData.z);
        // animatedSprites.push(animatedSprite); // no need w/ tsl!

    } else if (locationData.locationTags.includes("fire2")) {
        console.log("tryna create fire size " + locationData.yscale);
        
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 0);
        light.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(light);
        
        lightMods.push(light);

        const smoke = CreateSprites(6, parseFloat(locationData.yscale), parseFloat(locationData.yscale), null);
        smoke.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(smoke);
            // }
        const animatedSprite = CreateAnimatedSprite("fireanim1", locationData.yscale, 10, 6, 6);
        scene.add(animatedSprite);
        animatedSprite.position.set(locationData.x, locationData.y, locationData.z);
        // animatedSprites.push(animatedSprite);

    } else if (locationData.locationTags.includes("candle")) {
        console.log("tryna create candle size " + locationData.yscale);
    
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) / 2, parseFloat(locationData.yscale) * 4, parseFloat(locationData.yscale) * 4);
                    // const light = new THREE.PointLight( settings.sceneColor1Alt, 100, 100);
                    // light.intensity = .1;
        light.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(light);
        
        // lightMods.push(light);

        // const smoke = CreateSprites(10, parseFloat(locationData.yscale), parseFloat(locationData.yscale), null);
        // smoke.position.set(locationData.x, locationData.y, locationData.z);
        // scene.add(smoke);
            // }
        const animatedSprite = CreateAnimatedSprite("candle1", locationData.yscale, 25, 8, 8);
        scene.add(animatedSprite);
        animatedSprite.position.set(locationData.x, locationData.y, locationData.z);


        const flickerIntensity = uniform(1.0);

        // 3. Build the TSL Light Effect
        const flickerEffect = Fn(() => {
            // Use time and math to create a shaky, randomized wave
            const baseWave = sin(time.mul(20.0)); // Fast movement
            const microChanges = sin(time.mul(50.0)).mul(0.3); // Tiny jitters
            
            // Combine them and map to a 0.5 to 1.0 brightness range
            const flickerSignal = baseWave.add(microChanges).mul(0.25).add(0.75);
            
            // Multiply the uniform control by our animated signal
            return flickerIntensity.mul(flickerSignal).mul(.1);
        });

        const lightColor = color(settings.sceneColor1Alt);

        // 4. Assign the TSL effect to the light's color node
        light.colorNode = vec3(0xff, 0xaa, 0x00).mul(flickerEffect()).mul(lightColor);

        // light.colorNode = vec3(lightColor.r, lightColor.g, lightColor.b).mul(flickerEffect()).add(lightColor);
                // light.colorNode = lightColor.mul(flickerEffect());

                // light.colorNode = color(settings.sceneColor1Alt).mul(flickerEffect());
        // animatedSprites.push(animatedSprite);
    } else {
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 8);
        light.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(light);
    }
}
export function modLights () {
    //  let intensity = 10;
    // for (let i = 0; i < lightMods.length; i++) {
    //     lightMods[i].intensity = Math.sin(time * .01) * (200 * Math.random());
    //     if (Math.random() > .75) {
    //      intensity = Math.random() * 50;
    //      if ( intensity < 25 ) 
    //       intensity = 25;
    //     }
    //     lightMods[i].intensity = intensity;
    //     // Math.clamp(Math.random() * 100, 50, 100);
        
    //     // lightMods[i].intensity = Math.sin(time * 2);
    // }
}