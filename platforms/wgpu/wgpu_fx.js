
import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import { scene } from './wgpu_main.mjs';

import { billboarding, floor, Fn, max, min, positionLocal, range, normalLocal, sub, time, add, vec3, vec4, uniform, sin, buffer, instanceIndex, cameraPosition, mat3, positionGeometry, instancedBufferAttribute } from 'three/tsl';


let currentFrame = 0;

let lastFrameTime = 0;
let sprite;

export function Starfield(count, size, scale, animation) {

    // const geometry = new THREE.PlaneGeometry(size, size);
    // const material = new THREE.MeshBasicNodeMaterial({color: 0xff0066});
    // const mesh = new THREE.InstancedMesh(geometry, material, count);
    // const positionRange = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));

    // //  if (locData.locationTags && locData.loca    tionTags.includes("rise")) {

    //     const offset = sin(add(time.mul(.01), instanceIndex.toFloat().mul(0.2))).mul(50.0);

    //     // Apply to the material's position node (rising along the Y axis)
    //     // sampleMaterial.positionNode = add(positionLocal, vec3(0.0, 0.0, riseOffset));
    //     // }
    //     material.positionNode = positionLocal.add(positionRange, vec3(offset, offset, offset));
    //     // material.vertexNode = billboarding();
    //     scene.add(mesh);

            // const count = 10000;

        const positions = [];

        for ( let i = 0; i < count; i ++ ) {

            positions.push( 200 * Math.random() - 100, 200 * Math.random() - 100, 200 * Math.random() - 100 );

        }

        const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );

        // texture

        const spriteEl = document.getElementById("explosion1");
        const map = new THREE.TextureLoader().load( "https://servicemedia.s3.amazonaws.com/assets/pics/camlock_button_128.png");
        map.colorSpace = THREE.SRGBColorSpace;

        // material

        const spritematerial = new THREE.SpriteNodeMaterial( { sizeAttenuation: true, map, alphaMap: map, alphaTest: 0.5 } );
        spritematerial.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );
        spritematerial.positionNode = instancedBufferAttribute( positionAttribute );
        spritematerial.rotationNode = time.add( instanceIndex ).sin();
        spritematerial.scaleNode = uniform( 15 );

        					spritematerial.needsUpdate = true;
					// spritematerial.scaleNode.value = material.sizeAttenuation ? 15 : 0.03;
        // sprites

        const particles = new THREE.Sprite( spritematerial );
        particles.count = count;

        scene.add( particles );

}

export function CreateSprites (count, size, scale, animation) {
    const positions = [];

        for ( let i = 0; i < count; i ++ ) {

            positions.push( scale * Math.random() - scale/2, scale * Math.random() - scale/2, scale * Math.random() - scale/2 );

        }

        const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );

        // texture

        const url = document.getElementById("cloud1").src;
        const map = new THREE.TextureLoader().load( url );
        map.colorSpace = THREE.SRGBColorSpace;

        // material

        const material = new THREE.SpriteNodeMaterial( { 
            sizeAttenuation: true,  
            map: map, 
            transparent: true, 
            alphaToCoverage: true, 
            alphaMap: map, 
            // alphaTest: 0.1, 
            depthWrite: false, 
            // depthTest: false
            } );
        // material.color.setHSL( Math.random(), Math.random(), Math.random(), THREE.SRGBColorSpace );

        // material.color.setHex( settings.sceneColor1Alt, THREE.SRGBColorSpace );
        const color = new THREE.Color(settings.sceneColor2Alt);
        material.color = color;

        // const spriteColorUniform = uniform(new THREE.Color(0xff0000)); // Start with red

 
        // material.colorNode = spriteColorUniform;
        // material.colorNode = new THREE.Color(settings.sceneColor2);
        material.positionNode = instancedBufferAttribute( positionAttribute );
        material.rotationNode = time.add( instanceIndex ).sin().mul(.1);
        //   material.vertexNode = billboarding();
        material.scaleNode = uniform( size );
        // sprites

        const particles = new THREE.Sprite( material );
        particles.count = count;

        return particles;
        scene.add( partic/les );

}


    export function CreateAnimatedSprite(name, scale, speed, rows, cols) {

        const frameDuration = speed; // milliseconds per frame
        
        const totalFrames = rows * cols;
        const textureLoader = new THREE.TextureLoader();
        const url = document.getElementById(name).src;
        const spriteMap = textureLoader.load(url, (texture) => {
            // Configure texture for sprite sheet animation
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            // Set the repeat to show only one frame initially (1/cols, 1/rows)
            texture.repeat.set(1 / cols, 1 / rows);
        });

        // 4. Create the sprite material and object
        // const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap, transparent: true });
                const material = new THREE.SpriteNodeMaterial( { 
                    sizeAttenuation: true,  
                    map: spriteMap, 
                    transparent: true, 
                    // alphaToCoverage: true, 
                    // alphaMap: spriteMap, 
                    // alphaTest: 0.01, 
                    // depthWrite: false, 
                    // depthTest: false
                    } );
        sprite = new THREE.Sprite(material);
        sprite.scale.set(scale, scale, 1); // Scale the sprite up

        
        function update (timestamp) {
            // timestamp = performance.now()
            // timestamp = time();
            // 5. Animation logic
            if (timestamp - lastFrameTime > frameDuration) {
                // Calculate current frame index and position in the texture atlas
                const frameX = currentFrame % cols;
                const frameY = Math.floor(currentFrame / cols);

                // Update the texture offset (top-left corner of the frame)
                // Y offset is inverted in Three.js textures
                sprite.material.map.offset.x = frameX / cols;
                sprite.material.map.offset.y = (rows - 1 - frameY) / rows;

                currentFrame = (currentFrame + 1) % totalFrames;
                lastFrameTime = timestamp;
            }
        }

        sprite.userData.update = update();
        // scene.add(sprite);
        return {sprite, update};
        // scene.add(sprite);
    }


    class BirdGeometry extends THREE.BufferGeometry {

            constructor() {

                super();

                const points = 3 * 3;

                const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );

                this.setAttribute( 'position', vertices );

                let v = 0;

                function verts_push() {

                    for ( let i = 0; i < arguments.length; i ++ ) {

                        vertices.array[ v ++ ] = arguments[ i ];

                    }

                }

                const wingsSpan = 20;

                // Body
                verts_push(
                    0, 0, - 20,
                    0, - 8, 10,
                    0, 0, 30
                );

                // Left Wing
                verts_push(
                    0, 0, - 15,
                    - wingsSpan, 0, 5,
                    0, 0, 15
                );

                // Right Wing
                verts_push(
                    0, 0, 15,
                    wingsSpan, 0, 5,
                    0, 0, - 15
                );

                this.scale( 0.2, 0.2, 0.2 );

            }

        }
