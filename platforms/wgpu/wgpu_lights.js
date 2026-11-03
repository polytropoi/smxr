
import * as THREE from 'three';

import { scene, animatedSprites } from './wgpu_main.mjs';
import { uniform, Fn, vec3, sin, time, color, positionLocal} from 'three/tsl';

import { ClusteredLighting } from 'three/addons/lighting/ClusteredLighting.js'

import { CreateSprites, CreateAnimatedSprite } from './wgpu_fx.js';

import { settings } from '../../../connect/settings.js';

export let lightMods = [];

export let sunLight;

export let skyAmbientLight;

export let waterAmbientLight;

export let clusteredLighting;

export const clusteredLights = [];
export const spotLights = [];
export const spotTargets = [];
let spotIndex;

export function InitClusteredLights () {
    clusteredLighting = new ClusteredLighting(1024, 32, 24, 64);
    return clusteredLighting;
}
export function InitSceneLights () {
            sunLight = new THREE.DirectionalLight( settings.sceneColor1, 1 );
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
            skyAmbientLight = new THREE.HemisphereLight( settings.sceneColor2, settings.sceneColor3, .5 );
    
            scene.add( sunLight );
            scene.add( skyAmbientLight );
            scene.add( waterAmbientLight );
            AssignSpotLightTargets();

}


export function create_Light(locationData) {
    console.log("tryna create light ");
    const light = new THREE.PointLight( 0xff0000, 5, 50 );
    light.position.set(locationData.x, locationData.y, locationData.z);
    scene.add(light);
    lightMods.push(light);
}

export function CreateSpotLight(locationData, parent, target) {

    console.log("tryna create spot light with color data " + locationData.color);
     let color1 = "blue";
        // if (locationData.color) {
        //     color1 = locationData.color;
        // }
        
        console.log("adding default light color " + color1 + " " + parseFloat(locationData.yscale) * 16 + " at location " + locationData.x + locationData.y + locationData.z );
        const light = new THREE.SpotLight( color1, parseFloat(locationData.yscale) * 16, parseFloat(locationData.yscale) * 64);
        // Set angle to 45 degrees (converted from degrees to radians)
            // light.angle = (Math.PI / 4) * -1; 

            // Soften the edges of the cone (0 = hard edge, 1 = very soft)
            light.decay = .5;
            light.penumbra = 0.5; 

        if (settings && !settings.sceneTags.includes("clustered lighting")) {
            light.castShadow = true;
        }
       
        scene.add(light);
        light.position.set(locationData.x, locationData.y, locationData.z);
        light.target = target;


        // 1. Calculate the sin offset over time
        // const speed = 2.0;
        // const amplitude = 1.5;
        // const yOffset = sin( time.mul( speed ) ).mul( amplitude );

        // // 2. Apply it to the object's local position vector
        // const animatedPosition = vec3( positionLocal.x, positionLocal.y.add( yOffset ), positionLocal.z );
        // target.position.set(animatedPosition.x, animatedPosition.y, animatedPosition.z);

        // if (spotTargets.length && spotIndex < spotTargets.length) {
        //     console.log("using spot target " + spotIndex + " of " + spotTargets.length);
        //     light.target = spotTargets[spotIndex];
        //     spotIndex++;
        // }

        
        if (parent) {
            parent.attach(light);    
        }
        spotLights.push(light);
}

export function AssignSpotLightTargets() {

    // spotLights.forEach(light => {
    //     light.target = 
    // });
    // for (let i = 0; i < spotLights.length; i++) {
    //     console.log("tryna assign spotlight " + i);
    //     if (spotTargets[i]) {
    //         console.log("gotsa spotlight target "+ i);
    //         spotLights[i].target = spotTargets[i];
    //     }
    // }

}
export function CreatePointLight(locationData, parent) {

    console.log("tryna create point light with color data " + locationData.color);


    if (!locationData.yscale) {
        locationData.yscale = 1;
    }
    if (locationData.locationTags && locationData.locationTags.includes("fire")) {
        console.log("tryna create fire size " + locationData.yscale);
        const modValue = locationData.yscale; 
        // if (modvalue > )
        let color1 = settings.sceneColor1Alt;
        if (locationData.color) {
            color1 = locationData.color;
        }
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 16);
        
        
        scene.add(light);
        if (parent) {
            parent.attach(light);    
        }
        light.position.set(locationData.x, locationData.y, locationData.z);

        const animatedSprite = CreateAnimatedSprite("fireanim1", locationData.yscale, 50, 6, 6);
        scene.add(animatedSprite);
        animatedSprite.raycast = () => {}; //mmkay...
        
        if (parent) {
            parent.attach(animatedSprite);    
        }
        animatedSprite.position.set(locationData.x, locationData.y, locationData.z);
        if (!clusteredLighting) {
            const flickerIntensity = uniform(1.0);

            const flickerEffect = Fn(() => {
                
                const baseWave = sin(time.mul(20.0)); // Fast movement
                const microChanges = sin(time.mul(50.0)).mul(0.5); // Tiny jitters
                
                const flickerSignal = baseWave.add(microChanges).mul(0.25).add(0.75);

                return flickerIntensity.mul(flickerSignal).mul(.1);
            });

            const lightColor = color(settings.sceneColor1Alt);

            light.colorNode = vec3(0xff, 0xaa, 0x00).mul(flickerEffect()).mul(lightColor);
        }

    } else if (locationData.locationTags && locationData.locationTags.includes("fire2")) {
        // console.log("tryna create fire size " + locationData.yscale);
        
        // const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 0);
        // light.position.set(locationData.x, locationData.y, locationData.z);
        // scene.add(light);
        
        // lightMods.push(light);

        // const smoke = CreateSprites(6, parseFloat(locationData.yscale), parseFloat(locationData.yscale), null);
        // smoke.position.set(locationData.x, locationData.y, locationData.z);
        // scene.add(smoke);
        //     // }
        // const animatedSprite = CreateAnimatedSprite("fireanim1", locationData.yscale, 10, 6, 6);
        // scene.add(animatedSprite);
        // animatedSprite.position.set(locationData.x, locationData.y, locationData.z);
        // animatedSprites.push(animatedSprite);

    } else if (locationData.locationTags &&  locationData.locationTags.includes("candle")) {

        
        console.log("tryna create candle size " + locationData.yscale);
    
        const light = new THREE.PointLight( settings.sceneColor1Alt, parseFloat(locationData.yscale), parseFloat(locationData.yscale) * 8);
                    // const light = new THREE.PointLight( settings.sceneColor1Alt, 100, 100);
                    // light.intensity = .1;
        light.position.set(locationData.x, locationData.y, locationData.z);
        scene.add(light);
        
        const animatedSprite = CreateAnimatedSprite("candle1", locationData.yscale, 25, 8, 8);
        scene.add(animatedSprite);
        animatedSprite.position.set(locationData.x, locationData.y, locationData.z);
        animatedSprite.raycast = () => {};
        if (!clusteredLighting) {
            const flickerIntensity = uniform(1.0);

            const flickerEffect = Fn(() => {
                
                const baseWave = sin(time.mul(20.0)); // Fast movement
                const microChanges = sin(time.mul(50.0)).mul(0.5); // Tiny jitters
                
                const flickerSignal = baseWave.add(microChanges).mul(0.25).add(0.75);

                return flickerIntensity.mul(flickerSignal).mul(.1);
            });

            const lightColor = color(settings.sceneColor1Alt);

            light.colorNode = vec3(0xff, 0xaa, 0x00).mul(flickerEffect()).mul(lightColor);
        }


    } else if (locationData.locationTags && locationData.locationTags.includes("point")) {
        let color1 = settings.sceneColor1Alt;
        if (locationData.color) {
            color1 = locationData.color;
        }
        const light = new THREE.PointLight( color1, parseFloat(locationData.yscale) * 8, parseFloat(locationData.yscale) * 8);
                scene.add(light);
         if (parent) {
            parent.attach(light);    
        }
        light.position.set(locationData.x, locationData.y, locationData.z);

    } else { //default is point
         let color1 = settings.sceneColor1Alt;
        if (locationData.color) {
            color1 = locationData.color;
        }
        
        console.log("adding default light color " + color1 + " " + parseFloat(locationData.yscale) * 16 + " at location " + locationData.x + locationData.y + locationData.z );
        const light = new THREE.PointLight( color1, parseFloat(locationData.yscale) * 4, parseFloat(locationData.yscale) * 16, 1);
        if (settings && !settings.sceneTags.includes("clustered lighting")) {
            light.castShadow = true;
        }
       
        scene.add(light);
        light.position.set(locationData.x, locationData.y, locationData.z);
        if (parent) {
            parent.attach(light);    
        }
        // light.position.set(locationData.x, locationData.y, locationData.z);

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