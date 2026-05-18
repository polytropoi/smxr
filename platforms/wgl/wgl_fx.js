
import * as THREE from 'three';

import { settings } from '../../../connect/settings.js';

import { scene } from './wgl_main.mjs';

let currentFrame = 0;

let lastFrameTime = 0;
let sprite;

export function Starfield(count, size, scale, animation) {

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicNodeMaterial({color: 0xff0066});
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const positionRange = range(new THREE.Vector3(-scale, -scale, -scale), new THREE.Vector3(scale,scale,scale));
    material.positionNode = positionLocal.add(positionRange);
    // material.vertexNode = billboarding();
    scene.add(mesh);

    // material.positionNode = positionLocal.add(positionRange).Fn(({object: mesh}) => {
    //     // 
    //     const objectCenter = getMatrix().element(3).xyz;
    //     const toCamera = cameraPosition.sub(objectCenter).toVar();
    //     // set toCamera.y = 0 to only allow rotation around the y-axis (i.e. make it "cylindrical")
    //     toCamera.assign(vec3(toCamera.x, 0, toCamera.z).normalize());
    //     const up = vec3(0, 1, 0).toVar();
    //     const right = up.cross(toCamera).normalize();
    //     up.assign(toCamera.cross(right).normalize());
    //     const rotationMatrix = mat3(right, up, toCamera);
    //     return rotationMatrix.mul(positionGeometry);

    //     function getMatrix() {
    //         if (mesh.isInstancedMesh) {
    //             // Can I use tsl.instance() to make this code cleaner?
    //             // I tried using tsl.instance().instanceMatrixNode but it's always null.
    //             // Leaving this line here but commented out.
    //             // tsl.instance(mesh.count, mesh.instanceMatrix).toStack();
    //             const attribute = mesh.instanceMatrix;
    //             const matrices = attribute.array;
    //             if (mesh.count <= 1000) {
    //                 const bufferNode = buffer(matrices, 'mat4', Math.max(mesh.count, 1));
    //                 return bufferNode.element(instanceIndex);
    //             } else {
    //                 const buffer = new three.InstancedInterleavedBuffer(matrices, 16, 1);
    //                 let bufferFn = instancedBufferAttribute;
    //                 if (attribute.usage === three.DynamicDrawUsage) {
    //                     bufferFn = instancedDynamicBufferAttribute;
    //                 }
    //                 // F.Signature -> bufferAttribute( array, type, stride, offset )
    //                 const b0 = bufferFn(buffer, 'vec4', 16, 0);
    //                 const b1 = bufferFn(buffer, 'vec4', 16, 4);
    //                 const b2 = bufferFn(buffer, 'vec4', 16, 8);
    //                 const b3 = bufferFn(buffer, 'vec4', 16, 12);
    //                 return mat4(b0, b1, b2, b3);
    //             }
    //         }
    //         return modelWorldMatrix;
    //     }
    // })();

        // material.positionNode = positionLocal.add(positionRange);
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

// 1. Create a uniform node for the color
// const spriteColorUniform = uniform(new THREE.Color(0xff0000)); // Start with red

// 2. Assign the uniform node to colorNode
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