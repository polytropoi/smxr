import * as THREE from 'three';
import { vec2, float, fract, sin, dot, uv, floor, Fn, max, min, positionLocal, sub, time, vec3, vec4, mix, cos, step, mod, abs } from 'three/tsl';

import { scene } from '../wgpu_main.mjs';

const whiteNoise = Fn( ( [ p ] ) => {
    return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ).mul( 43758.5453 ) );
} );

const random2D = Fn( ( [ p ] ) => {

    return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ).mul( 43758.5453 ) );

} );

const valueNoise = Fn( ( [ p ] ) => {

    const i = floor( p ).toVar();
    const f = fract( p ).toVar();
    
    const u = f.mul( f ).mul( float( 3 ).sub( f.mul( 2 ) ) );
    
    const a = random2D( i );
    const b = random2D( i.add( vec2( 1, 0 ) ) );
    const c = random2D( i.add( vec2( 0, 1 ) ) );
    const d = random2D( i.add( vec2( 1, 1 ) ) );
    
    return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y );

} );

const randomGradient = Fn( ( [ p ] ) => {

    const angle = fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ).mul( 43758.5453 ) ).mul( Math.PI * 2 );
    return vec2( cos( angle ), sin( angle ) );

} );

const perlinNoise = Fn( ( [ p ] ) => {

    const i = floor( p ).toVar();
    const f = fract( p ).toVar();
    
    const u = f.mul( f ).mul( float( 3 ).sub( f.mul( 2 ) ) );
    
    const g00 = randomGradient( i );
    const g10 = randomGradient( i.add( vec2( 1, 0 ) ) );
    const g01 = randomGradient( i.add( vec2( 0, 1 ) ) );
    const g11 = randomGradient( i.add( vec2( 1, 1 ) ) );
    
    const d00 = dot( g00, f );
    const d10 = dot( g10, f.sub( vec2( 1, 0 ) ) );
    const d01 = dot( g01, f.sub( vec2( 0, 1 ) ) );
    const d11 = dot( g11, f.sub( vec2( 1, 1 ) ) );
    
    return mix( mix( d00, d10, u.x ), mix( d01, d11, u.x ), u.y ).add( 0.5 );

} );


const permute = Fn( ( [ x ] ) => mod( x.mul( 34 ).add( 1 ).mul( x ), 289 ) );

const simplexNoise2D = Fn( ( [ v ] ) => {

    // Constants: (3-sqrt(3))/6, (sqrt(3)-1)/2, -1+2*(3-sqrt(3))/6, 1/41
    const C = vec4( 0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439 );
    
    // First corner
    const i = floor( v.add( dot( v, vec2( C.y, C.y ) ) ) );
    const x0 = v.sub( i ).add( dot( i, vec2( C.x, C.x ) ) );
    
    // Determine which simplex: i1 = (x0.x > x0.y) ? vec2(1,0) : vec2(0,1)
    const i1x = step( x0.y, x0.x );
    const i1y = float( 1 ).sub( i1x );
    
    // Offsets for other corners
    const x1 = x0.sub( vec2( i1x, i1y ) ).add( C.x );
    const x2 = x0.add( C.z );  // C.z = -1 + 2*C.x
    
    // Permutations
    const ii = mod( i, 289 );
    const p = permute(
        permute( vec3( ii.y, ii.y.add( i1y ), ii.y.add( 1 ) ) )
            .add( vec3( ii.x, ii.x.add( i1x ), ii.x.add( 1 ) ) )
    );
    
    // Radial falloff from corners
    const m = max( float( 0.5 ).sub( vec3( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ) ) ), 0 );
    const m4 = m.mul( m ).mul( m ).mul( m );
    
    // Gradients from permutation polynomial
    const x_grad = fract( p.mul( C.w ) ).mul( 2 ).sub( 1 );
    const h = abs( x_grad ).sub( 0.5 );
    const ox = floor( x_grad.add( 0.5 ) );
    const a0 = x_grad.sub( ox );
    
    // Normalize gradients implicitly
    const m4_norm = m4.mul( float( 1.79284291400159 ).sub( float( 0.85373472095314 ).mul( a0.mul( a0 ).add( h.mul( h ) ) ) ) );
    
    // Gradient dot products
    const g = vec3(
        a0.x.mul( x0.x ).add( h.x.mul( x0.y ) ),
        a0.y.mul( x1.x ).add( h.y.mul( x1.y ) ),
        a0.z.mul( x2.x ).add( h.z.mul( x2.y ) )
    );
    
    // Scale to [-1, 1] then remap to [0, 1]
    return float( 130 ).mul( dot( m4_norm, g ) ).mul( 0.5 ).add( 0.5 );

} );


const domainWarp = Fn(([ p ]) => {
  const q = vec2(
    simplexNoise2D(p),
    simplexNoise2D(p.add(vec2(5.2, 1.3)))
  );

  const r = vec2(
    simplexNoise2D(p.add(q.mul(uWarpStrength)).add(vec2(1.7, 9.2))),
    simplexNoise2D(p.add(q.mul(uWarpStrength)).add(vec2(8.3, 2.8)))
  );

  return simplexNoise2D(p.add(r.mul(0.5)));
});

export function getRainbowMaterial() { 

	const hslHelper = Fn( ([ h, s, l, n ])=>{
		var k = n.add( h.mul( 12 ) ).mod( 12 );
		var a = s.mul( min( l, sub( 1, l ) ) );
		return l.sub( a.mul( max( -1, min( min( k.sub( 3 ), sub( 9, k ) ), 1 ) ) ) );
	});
	const random = Math.random();
	const hsl = Fn( ([ h, s, l, a ]) => {
		h = h.fract().add( 1 ).fract();
		s = s.clamp( 0, 1 );
		l = l.clamp( 0, 1 );
		// a = Math.random();
		var r = hslHelper( h, s, l, 0 );
		var g = hslHelper( h, s, l, 8 );
		var b = hslHelper( h, s, l, 4 );
		return vec4( r, g, b, a );
	});


	function fragNode () {

	const noiseValue = simplexNoise2D( uv() );
	const t = time.mul(Math.random() * .05).fract();
	//   const p = positionLocal.x.add(0.3).sub(t);
	const p = positionLocal.x.add(noiseValue.mul(4)).mul(t);

	//   const hue = p.mul(random * 10).add(noiseValue.mul(t))
	//   const hue = p.mul(10).mul(noiseValue.mul(4)).sub(t);
	// const hue = floor(p.mul(6)).mul(Math.random()).sub(noiseValue);

	const hue = floor(p.mul(10)).mul(Math.random()).sub(noiseValue);
	const sat = hue.mod(1).oneMinus().mul(0.5);
	//   const alpha = 
	  const col = hsl(hue, 1, sat, 1);
  return col;
}


// const mat = new THREE.NodeMaterial();

const mat = new THREE.NodeMaterial();
mat.transparent = true;
mat.roughnessNode = .1;
mat.fragmentNode = fragNode();
mat.emissionNode = fragNode();
mat.envNode = scene.environment;

// mat.envMap = scene.environmentNode;
// mat.colorNode = float( perlinNoise( uv() )); 


  return mat;
}

// export default getRainbowMaterial;