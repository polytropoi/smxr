import * as THREE from 'three/webgpu'; // Import from webgpu entry point

import { texture, vec2, time, mix } from 'three/tsl';
// // Example conceptual nodes
// const fireTexture = texture(textureLoader.load('fire.png'));
// const animatedFire = fireTexture.uv(vec2(time, 0)); // Basic animation



let renderer, scene, camera, clock;

let currentFrame = 0;
const frameDuration = 25; // milliseconds per frame
let lastFrameTime = 0;
let sprite;

export function Fire() {

	// textures

        const textureLoader = new THREE.TextureLoader();

        const cellularTexture = textureLoader.load( './textures/noises/voronoi/grayscale-256x256.png' );
        const perlinTexture = textureLoader.load( './textures/noises/perlin/rgb-256x256.png' );

        // gradient canvas

        const gradient = {};
        gradient.element = document.createElement( 'canvas' );
        gradient.element.width = 128;
        gradient.element.height = 1;
        gradient.context = gradient.element.getContext( '2d' );

        gradient.colors = [
            '#090033',
            '#5f1f93',
            '#e02e96',
            '#ffbd80',
            '#fff0db',
        ];

        gradient.texture = new THREE.CanvasTexture( gradient.element );
        gradient.texture.colorSpace = THREE.SRGBColorSpace;

        gradient.update = () => {

            const fillGradient = gradient.context.createLinearGradient( 0, 0, gradient.element.width, 0 );

            for ( let i = 0; i < gradient.colors.length; i ++ ) {

                const progress = i / ( gradient.colors.length - 1 );
                const color = gradient.colors[ i ];
                fillGradient.addColorStop( progress, color );

            }

            gradient.context.fillStyle = fillGradient;
            gradient.context.fillRect( 0, 0, gradient.element.width, gradient.element.height );

            gradient.texture.needsUpdate = true;

        };

        gradient.update();

        // flame 1 material

        const flame1Material = new THREE.SpriteNodeMaterial( { side: THREE.DoubleSide } );

        flame1Material.colorNode = Fn( () => {

            // main UV
            const mainUv = uv().toVar();
            mainUv.assign( spherizeUV( mainUv, 10 ).mul( 0.6 ).add( 0.2 ) ); // spherize
            mainUv.assign( mainUv.pow( vec2( 1, 2 ) ) ); // stretch
            mainUv.assign( mainUv.mul( 2, 1 ).sub( vec2( 0.5, 0 ) ) ); // scale

            // gradients
            const gradient1 = sin( time.mul( 10 ).sub( mainUv.y.mul( TWO_PI ).mul( 2 ) ) ).toVar();
            const gradient2 = mainUv.y.smoothstep( 0, 1 ).toVar();
            mainUv.x.addAssign( gradient1.mul( gradient2 ).mul( 0.2 ) );

            // cellular noise
            const cellularUv = mainUv.mul( 0.5 ).add( vec2( 0, time.negate().mul( 0.5 ) ) ).mod( 1 );
            const cellularNoise = texture( cellularTexture, cellularUv, 0 ).r.oneMinus().smoothstep( 0, 0.5 ).oneMinus();
            cellularNoise.mulAssign( gradient2 );

            // shape
            const shape = mainUv.sub( 0.5 ).mul( vec2( 3, 2 ) ).length().oneMinus().toVar();
            shape.assign( shape.sub( cellularNoise ) );

            // gradient color
            const gradientColor = texture( gradient.texture, vec2( shape.remap( 0, 1, 0, 1 ), 0 ) );

            // output
            const color = mix( gradientColor, vec3( 1 ), shape.step( 0.8 ) );
            const alpha = shape.smoothstep( 0, 0.3 );
            return vec4( color.rgb, alpha );

        } )();

        // flame 2 material

        const flame2Material = new THREE.SpriteNodeMaterial( { side: THREE.DoubleSide } );

        flame2Material.colorNode = Fn( () => {

            // main UV
            const mainUv = uv().toVar();
            mainUv.assign( spherizeUV( mainUv, 10 ).mul( 0.6 ).add( 0.2 ) ); // spherize
            mainUv.assign( mainUv.abs().pow( vec2( 1, 3 ) ).mul( mainUv.sign() ) ); // stretch
            mainUv.assign( mainUv.mul( 2, 1 ).sub( vec2( 0.5, 0 ) ) ); // scale

            // perlin noise
            const perlinUv = mainUv.add( vec2( 0, time.negate().mul( 1 ) ) ).mod( 1 );
            const perlinNoise = texture( perlinTexture, perlinUv, 0 ).sub( 0.5 ).mul( 1 );
            mainUv.x.addAssign( perlinNoise.x.mul( 0.5 ) );

            // gradients
            const gradient1 = sin( time.mul( 10 ).sub( mainUv.y.mul( TWO_PI ).mul( 2 ) ) );
            const gradient2 = mainUv.y.smoothstep( 0, 1 );
            const gradient3 = oneMinus( mainUv.y ).smoothstep( 0, 0.3 );
            mainUv.x.addAssign( gradient1.mul( gradient2 ).mul( 0.2 ) );

            // displaced perlin noise
            const displacementPerlinUv = mainUv.mul( 0.5 ).add( vec2( 0, time.negate().mul( 0.25 ) ) ).mod( 1 );
            const displacementPerlinNoise = texture( perlinTexture, displacementPerlinUv, 0 ).sub( 0.5 ).mul( 1 );
            const displacedPerlinUv = mainUv.add( vec2( 0, time.negate().mul( 0.5 ) ) ).add( displacementPerlinNoise ).mod( 1 );
            const displacedPerlinNoise = texture( perlinTexture, displacedPerlinUv, 0 ).sub( 0.5 ).mul( 1 );
            mainUv.x.addAssign( displacedPerlinNoise.mul( 0.5 ) );

            // cellular noise
            const cellularUv = mainUv.add( vec2( 0, time.negate().mul( 1.5 ) ) ).mod( 1 );
            const cellularNoise = texture( cellularTexture, cellularUv, 0 ).r.oneMinus().smoothstep( 0.25, 1 );

            // shape
            const shape = step( mainUv.sub( 0.5 ).mul( vec2( 6, 1 ) ).length(), 0.5 );
            shape.assign( shape.mul( cellularNoise ) );
            shape.mulAssign( gradient3 );
            shape.assign( step( 0.01, shape ) );

            // output
            return vec4( vec3( 1 ), shape );

        } )();

        // billboarding - follow the camera rotation only horizontally

        flame1Material.vertexNode = billboarding();
        flame2Material.vertexNode = billboarding();

        // meshes

        const flame1 = new THREE.Sprite( flame1Material );
        flame1.center.set( 0.5, 0 );
        flame1.scale.x = 0.5; // optional
        flame1.position.x = - 0.5;
        scene.add( flame1 );

        const flame2 = new THREE.Sprite( flame2Material );
        flame2.center.set( 0.5, 0 );
        flame2.position.x = 0.5;
        scene.add( flame2 );

    }

    export function AnimatedSprite() {

        const rows = 6;
        const cols = 6;
        const totalFrames = rows * cols;
        const textureLoader = new THREE.TextureLoader();
        const url = document.getElementById("fireanim1").src;
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
                    alphaTest: 0.01, 
                    // depthWrite: false, 
                    // depthTest: false
                    } );
        sprite = new THREE.Sprite(material);
        sprite.scale.set(32, 32, 1); // Scale the sprite up

        
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

   