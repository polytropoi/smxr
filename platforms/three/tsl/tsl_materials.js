
import * as THREE from "three";
import { protozoa, polkaDots, brain } from "tsl-textures";
import { floor, Fn, max, min, positionLocal, normalLocal, sub, time, vec3, vec4 } from 'three/tsl';

import { uniform, sin } from 'three/tsl';

// const hslHelper = Fn( ([ h, s, l, n ])=>{
// 	var k = n.add( h.mul( 12 ) ).mod( 12 );
// 	var a = s.mul( min( l, sub( 1, l ) ) );
// 	return l.sub( a.mul( max( -1, min( min( k.sub( 3 ), sub( 9, k ) ), 1 ) ) ) );
// });

// const hsl = Fn( ([ h, s, l ]) => {
// 	h = h.fract().add( 1 ).fract();
// 	s = s.clamp( 0, 1 );
// 	l = l.clamp( 0, 1 );
// 	var r = hslHelper( h, s, l, 0 );
// 	var g = hslHelper( h, s, l, 8 );
// 	var b = hslHelper( h, s, l, 4 );
// 	return vec3( r, g, b );
// });

// function fragNode () {
//     const t = time.mul(0.2).fract();
//     const p = positionLocal.x.add(0.3).sub(t);
//     // const hue = floor(p.mul(10)).mul(0.1);
//     // const sat = hue.mod(1).oneMinus().mul(0.5);
//     // const col = hsl(hue, 1, sat);
//     return p;
// }
const timeUniform = uniform(0);
export function returnMaterial (name) {

    const mat = new THREE.MeshPhysicalNodeMaterial({
        color: 0xCCCCCC,
        roughness: .5,
        metalness: 0.1,
        transparent: true,
        opacity: .75,
        
    });


    // mat.fragmentNode = fragNode();
    switch (name) {
        case 'polkadot' :
            mat.colorNode = polkaDots ( {
                count: 2,
                size: 0.6,
                blur: 0.22,
                color: new THREE.Color(0),
                background: new THREE.Color(16777215),
                seed: timeUniform
            } );

            return mat;
        break;
        case 'protozoa' :
            mat.colorNode = protozoa ( {
                scale: 1.5,
                fat: 0.7,
                amount: 0.4,
                color: new THREE.Color(['red']),
                subcolor: new THREE.Color('blue'),
                background: new THREE.Color('blue'), //vec4( 1, 0, 0, 0.5 ),
                seed: timeUniform
            } );

            return mat;
        break;
        
        case 'brain' :
            mat.colorNode = brain ( {
                scale: 2,
                smooth: 0.5,
                wave: 0.5,
                speed: 2.5,
                color: new THREE.Color('orange'),
                background: new THREE.Color('red'),
                seed: 11            
            } );

            mat.normalNode = brain ( {
                scale: 1.9,
                smooth: 0.5,
                wave: 0.5,
                speed: 2.5,
                color: new THREE.Color('green'),
                background: new THREE.Color("black"),
                seed: 11
            } );
            mat.positionNode = Fn(() => {
                const pos = positionLocal;      // Original vertex position
                const norm = normalLocal;        // Vertex normal direction
                
                // Calculate displacement amount (changes over time and position)
                const displacement = sin(time.mul(6.0).add(pos.y.mul(5.0))).mul(0.075);
                
                // Move vertex along its normal
                return pos.add(norm.mul(displacement));
            })();
            return mat;
        break;    

        default:

        console.log("No match");
    }
}



export const DotNoiseMaterial = () => {
  const materialRef = new THREE.NodeMaterial();

  const { scale, speed, steps, color } = useControls({
    scale: { value: 20, min: 5, max: 30, step: 0.1 },
    speed: { value: 0.07, min: 0, max: 0.15, step: 0.01 },
    steps: { value: 8, min: 3, max: 20, step: 1 },
    color: { value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
  })

  const dotNoiseShader = useMemo(() => dotNoise({ scale: 20, speed: 0.5 }), [])

  const colorizedMaterial = useMemo(() => {
    // Get the grayscale noise value
    const noiseValue = dotNoiseShader.nodes.colorNode.x

    // Quantize/step the noise to create distinct levels
    const steppedNoise = floor(noiseValue.mul(uniform(steps))).div(uniform(steps - 1))

    // Create colorful visualization using trigonometric functions with steps
    const hue = steppedNoise.mul(6.28318).mul(uniform(color))

    // Generate RGB components using phase-shifted sine waves
    const r = sin(hue).mul(0.5).add(0.5)
    const g = sin(hue.add(2.094)).mul(0.5).add(0.5) // +120 degrees
    const b = sin(hue.add(4.188)).mul(0.5).add(0.5) // +240 degrees

    const colorNode = vec3(r, g, b)

    return { colorNode }
  }, [dotNoiseShader.nodes.colorNode, steps, color])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.needsUpdate = true
    }
  }, [steps, color])

  dotNoiseShader.uniforms.scale.value = scale
  dotNoiseShader.uniforms.speed.value = speed

  return materialRef
}

// export function getRainbowMaterial() {


//     function fragNode () {
//     const t = time.mul(0.2).fract();
//     const p = positionLocal.x.add(0.3).sub(t);
//     const hue = floor(p.mul(10)).mul(0.1);
//     const sat = hue.mod(1).oneMinus().mul(0.5);
//     //   const alpha = 
//     const col = hsl(hue, 1, sat, 1);
//     return col;
//     }


//     const mat = new THREE.NodeMaterial();
//     mat.transparent = true;
//     mat.roughnessNode = .1;
//     mat.fragmentNode = fragNode();

//   return mat;
// }