
import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import { scene } from './wgpu_main.mjs';

import { spritesheetUV, uv, texture, billboarding, floor, Fn, max, min, positionLocal, range, normalLocal, sub, time, add, vec2, vec3, vec4, uniform, sin, buffer, instanceIndex, cameraPosition, mat3, positionGeometry, instancedBufferAttribute } from 'three/tsl';
import { activeObjex } from './wgpu_locations.js';



let currentFrame = 0;

let lastFrameTime = 0;
let sprite;

export function InstancedSprites(count, size, scale, animation, type) {

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

        if (!type) {
            type = "explosion";
        }
        if (!scale) {
            scale = 10;
        }
        const positions = [];

        for ( let i = 0; i < count; i ++ ) {

            positions.push( 200 * Math.random() - 100, 200 * Math.random() - 100, 200 * Math.random() - 100 );

        }

        const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );

        // texture
        let map, animationSpeed, columns, rows;

        if (type == "explosion") {
            const spriteEl = document.getElementById("explosion1");
            map = new THREE.TextureLoader().load( spriteEl.src);
            map.colorSpace = THREE.SRGBColorSpace;
            columns = 8;
            rows = 8;
            animationSpeed = 10.0; // Frames per second
            scale = 16;
        } else if (type == "smoke") {
              const spriteEl = document.getElementById("smoke1");
            map = new THREE.TextureLoader().load( spriteEl.src);
            map.colorSpace = THREE.SRGBColorSpace;
            columns = 6;
            rows = 5;
            animationSpeed = 12.0; // Frames per second
        } else if (type == "fire") {
              const spriteEl = document.getElementById("fireanim1");
            map = new THREE.TextureLoader().load( spriteEl.src);
            // map.colorSpace = THREE.SRGBColorSpace;
            columns = 6;
            rows = 6;
            animationSpeed = 10.0; // Frames per second
        } else if (type == "candle") {
              const spriteEl = document.getElementById("candle1");
            map = new THREE.TextureLoader().load( spriteEl.src);
            // map.colorSpace = THREE.SRGBColorSpace;
            columns = 8;
            rows = 8;
            animationSpeed = 10.0; // Frames per second
            scale = 4;
        } else if (type == "clouds") {
              const spriteEl = document.getElementById("plasma");
            map = new THREE.TextureLoader().load( spriteEl.src);
            // map.colorSpace = THREE.SRGBColorSpace;
            columns = 8;
            rows = 8;
            animationSpeed = 10.0; // Frames per second
            scale = 4;
        } else if (type == "plasma") {
              const spriteEl = document.getElementById("plasma");
            map = new THREE.TextureLoader().load( "https://s3.us-east-1.amazonaws.com/servicemedia.net/media/pictures/spritesheets/plasma_bubble.png");
            // map.colorSpace = THREE.SRGBColorSpace;
            columns = 12;
            rows = 7;
            animationSpeed = 10.0; // Frames per second
            scale = 4;
        }
        

        
        /////////////////
        const totalFrames = columns * rows;
        const timeOffsets = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Give each sprite a completely random starting point in time
            timeOffsets[i] = Math.random() * 100.0; 
        }

        // Convert data arrays into WebGPU-compatible TSL instanced attributes
        const timeOffsetAttribute = instancedBufferAttribute(new THREE.InstancedBufferAttribute(timeOffsets, 1));

        // --- 3. CUSTOM TSL SPRITESHEET FUNCTION ---
        const spriteSheetUV = Fn(() => {
            // Unique timeline for this specific instance
            const localTime = time.add(timeOffsetAttribute); 
            
            // Determine current frame index
            const currentFrame = floor(localTime.mul(animationSpeed)).mod(totalFrames);
            
            // Calculate 2D column and row index
            const col = currentFrame.mod(columns);
            const row = floor(currentFrame.div(columns));
            
            // Scale standard UV coordinates to match one single tile size
            const tileSize = vec2(1.0 / columns, 1.0 / rows);
            const baseUV = uv().mul(tileSize);
            
            // Offset UV coordinate to point to the correct tile
            // In WebGPU/TSL, flip row calculation if textures read inverted
            const uvOffset = vec2(col.mul(tileSize.x), row.mul(tileSize.y));
            
            return baseUV.add(uvOffset);
        });

        //////////

        // 3. Create the TSL node for calculating UVs
        // spritesheetUV( countNode, uvNode, frameNode )
        const animatedUV = spritesheetUV( //sweet
            vec2(columns, rows), 
            uv(), 
            time.mul(animationSpeed)
        );

        // material

        // map.minFilter = THREE.NearestFilter; // Sharp pixel art
        // map.magFilter = THREE.NearestFilter;
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        const spritematerial = new THREE.SpriteNodeMaterial( { sizeAttenuation: true, alphaTest: 0.5 } );
        spritematerial.colorNode = texture(map, spriteSheetUV());
        // spritematerial.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );
        spritematerial.positionNode = instancedBufferAttribute( positionAttribute );

                            // const riseOffset = sin(add(time.mul(.1), instanceIndex.toFloat().mul(0.2))).mul(5.0);

                    // Apply to the material's position node (rising along the Y axis)
                    // spritematerial.positionNode = add(positionLocal, vec3(0.0, riseOffset, 0.0));
        spritematerial.rotationNode = time.add( instanceIndex ).sin();
        spritematerial.scaleNode = uniform( scale );

        					spritematerial.needsUpdate = true;
					// spritematerial.scaleNode.value = material.sizeAttenuation ? 15 : 0.03;
        // sprites

        const particles = new THREE.Sprite( spritematerial );
        particles.count = count;
        particles.userData = {}
        particles.frustumCulled = false;


        scene.add( particles );
        activeObjex.push(particles);

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

        scene.add( particles );
        return particles;


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


    // class BirdGeometry extends THREE.BufferGeometry {

    //         constructor() {

    //             super();

    //             const points = 3 * 3;

    //             const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );

    //             this.setAttribute( 'position', vertices );

    //             let v = 0;

    //             function verts_push() {

    //                 for ( let i = 0; i < arguments.length; i ++ ) {

    //                     vertices.array[ v ++ ] = arguments[ i ];

    //                 }

    //             }

    //             const wingsSpan = 20;

    //             // Body
    //             verts_push(
    //                 0, 0, - 20,
    //                 0, - 8, 10,
    //                 0, 0, 30
    //             );

    //             // Left Wing
    //             verts_push(
    //                 0, 0, - 15,
    //                 - wingsSpan, 0, 5,
    //                 0, 0, 15
    //             );

    //             // Right Wing
    //             verts_push(
    //                 0, 0, 15,
    //                 wingsSpan, 0, 5,
    //                 0, 0, - 15
    //             );

    //             this.scale( 0.2, 0.2, 0.2 );

    //         }

    //     }
