    import * as THREE from 'three';

    import {scene, navmesh} from './three_main.mjs';

    import { Pathfinding } from 'three-pathfinding';

import { uniform, sin, mul, add, time } from 'three/tsl';


    const ZONE = 'myNavmeshZone'; 
    const groupID = 0;
    let pathfinding;

    export let agents = [];

    import { returnMaterial } from './tsl/tsl_materials.js'

    // import { uniform, sin } from 'three/tsl';
    export function CreateAgent (pos) {
            
        const geometry = new THREE.CapsuleGeometry( 1, 1, 4, 8, 1 );
        // const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: .5, color: 'orange' });
        const material = returnMaterial('brain');
        const mesh = new THREE.Mesh( geometry, material );
                    const timeUniform = uniform(0);
        // material.colorNode.scale = sin(timeUniform).mul(0.75).add(0.3);

        // material.colorNode.scale = sin(timeUniform).mul(0.75);

        // mesh.position.set(-0.88, 0.03, -0.38);
        // console.log("position object is type " + pos.type);
        mesh.position.set(pos.x, pos.y, pos.z);

        // const time = uniform(0.0);

        // Use sin() to create a pulsing effect for the emissive intensity
        // sin(time * 2.0) oscillates between -1 and 1
        // mul(0.3) dampens the effect
        // add(0.7) shifts the range to 0.4 to 1.0 (never completely dark)
        // const pulse = sin(time.mul(2.0)).mul(0.3).add(0.7);

        // Assign the pulsing value to the emissiveNode, multiplied by a base color
        // For this example, we'll use a simple vec3 for color
        // material.emissiveNode = new THREE.Color(1, 0.5, 0).add(pulse);
        // mesh.userData = {
        //     update: function () {
        //         material.colorNode.size  
        //     }
        // }


        // scene.add(mesh);
        
        
        const options = {
            object: mesh,
            nodeRadius: 0.05,
            speed: 2,
            // app: this,
            name: 'agent'
        };

        const agent = new NavAgent( options );
        agents.push(agent);
            
    } 
                
    export function InitPathfinding () {
        // if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh") && navmesh) {
        if (navmesh) {
            pathfinding = new Pathfinding();
            // const pathfinding = new Pathfinding();
            
            // Define a zone name
            pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));

            console.log("looking for navmesh " + navmesh);
            for (let i = 0; i < 100; i++) {

                CreateAgent(randomNavmeshPoint());
                
            }
        }
    }


    export function randomNavmeshPoint () {
        const randomNode = pathfinding.getRandomNode(ZONE, groupID);
        return randomNode;
    } 

    class NavAgent{
        constructor(options){
            const fps = options.fps || 30; //default fps
            
            this.assetsPath = options.assetsPath;
            this.name = options.name || 'Player';
            
            this.animations = {};	
            
            scene.add(options.object);
            
            this.object = options.object;
            this.pathLines = new THREE.Object3D();
            this.pathColor = new THREE.Color(0xFFFFFF);
            this.nodeRadius = (options.nodeRadius) ? options.nodeRadius : 0.2;
            
            scene.add(this.pathLines);
            
            this.npc = options.npc;
            
            if (this.npc) this.dead = false;
            
            this.speed = options.speed;
            this.app = options.app;
            
            if (pathfinding){
                this.pathfinder = pathfinding;
                this.ZONE = ZONE;
                this.navMeshGroup = this.pathfinder.getGroup(this.ZONE, this.object.position);	
            }
            
            const clip = options.clip;
            const self = this;
            
            const pt = this.object.position.clone();
            pt.z += 10;
            this.object.lookAt(pt);
            
            if (options.anims){ 
                //Use this option to crop a single animation into multiple clips
                this.mixer = new THREE.AnimationMixer(options.object);
                options.anims.forEach(function(anim){
                    self.animations[anim.name] = THREE.AnimationUtils.subclip(clip, anim.name, anim.start, anim.end);
                });
            }
            
            if (options.animations){
                //Use this option to set multiple animations directly
                this.mixer = new THREE.AnimationMixer(options.object);
                options.animations.forEach( (animation)=>{
                    self.animations[animation.name.toLowerCase()] = animation;
                })
            }
        }
        
        newPath(pt){
            const player = this.object;
            
            if (this.pathfinder===undefined){
                this.calculatedPath = [ pt.clone() ];
                this.setTargetDirection();
                return;
            }
                    
            // Calculate a path to the target and store it
            this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);
            
            if (this.calculatedPath && this.calculatedPath.length) {
                this.action = 'walk';
                
                this.setTargetDirection();
                
                // if (debug.showPath && !this.npc){
                // 	this.showPathLines();
                // }
            } else {
                this.action = 'idle';
                if (this.pathLines) scene.remove(this.pathLines);
            }
        }
        
        setTargetDirection(){
            const player = this.object;
            const pt = this.calculatedPath[0].clone();
            pt.y = player.position.y;
            const quaternion = player.quaternion.clone();
            player.lookAt(pt);
            this.quaternion = player.quaternion.clone();
            player.quaternion.copy(quaternion);
        }
        
        showPathLines(){
            if (this.pathLines) this.app.scene.remove(this.pathLines);

            const material = new THREE.LineBasicMaterial({
                color: this.pathColor,
                linewidth: 2
            });

            const player = this.object;
            const self = this;
            
            const geometry = new THREE.Geometry();
            geometry.vertices.push(player.position);

            // Draw debug lines
            this.calculatedPath.forEach( function(vertex){
                geometry.vertices.push(vertex.clone().add(new THREE.Vector3(0, self.app.debug.offset, 0)));
            });

            this.pathLines = new THREE.Line( geometry, material );
            this.app.scene.add( this.pathLines );

            // Draw debug spheres except the last one. Also, add the player position.
            const debugPath = [player.position].concat(this.calculatedPath);
            const geo = new THREE.SphereBufferGeometry( this.nodeRadius );
            const mat = new THREE.MeshBasicMaterial( {color: this.pathColor} );
            const offset = this.app.debug.offset | 0;
            
            debugPath.forEach(function( vertex ){
                const node = new THREE.Mesh( geo, mat );
                node.position.copy(vertex);
                node.position.y += offset;
                self.pathLines.add( node );
            });
        }
        
        set action(name){
            //Make a copy of the clip if this is a remote player
            if (this.actionName == name.toLowerCase()) return;
            
            const clip = this.animations[name.toLowerCase()];
            
            delete this.curAction;
            
            if (clip!==undefined){
                const action = this.mixer.clipAction( clip );
                action.loop = clip.loop;
                action.time = 0;
                this.mixer.stopAllAction();
                this.actionName = name.toLowerCase();
                this.actionTime = Date.now();
                action.fadeIn(0.5);	
                action.play();
                this.curAction = action;
            }
        }
        
        update(dt){
            const speed = this.speed;
            const player = this.object;
            
            if (this.mixer) this.mixer.update(dt);
            
            // if (player.material.colorNode) {
                // player.material.colorNode.seed = dt / 10000;
                // player.material.colorNode.seed = performance.now() * 0.1;
                this.object.material.colorNode.scale = sin(dt).mul(0.75);
            // }
            if (this.calculatedPath && this.calculatedPath.length) {
                const targetPosition = this.calculatedPath[0];

                const vel = targetPosition.clone().sub(player.position);
                
                let pathLegComplete = (vel.lengthSq()<0.01);
                
                if (!pathLegComplete) {
                    //Get the distance to the target before moving
                    const prevDistanceSq = player.position.distanceToSquared(targetPosition);
                    vel.normalize();
                    // Move player to target
                    if (this.quaternion) player.quaternion.slerp(this.quaternion, 0.1);
                    player.position.add(vel.multiplyScalar(dt * speed));
                    //Get distance after moving, if greater then we've overshot and this leg is complete
                    const newDistanceSq = player.position.distanceToSquared(targetPosition);
                    pathLegComplete = (newDistanceSq > prevDistanceSq);
                } 
                
                if (pathLegComplete){
                    // Remove node from the path we calculated
                    this.calculatedPath.shift();
                    if (this.calculatedPath.length==0){
                        if (this.npc){
                            this.newPath(randomNavmeshPoint());
                        }else{
                            player.position.copy( targetPosition );
                            this.action = 'idle';
                        }
                    }else{
                        this.setTargetDirection();
                    }
                }
            }else{
                // if (this.npc && !this.dead) this.newPath(randomNavmeshPoint());
                this.newPath(randomNavmeshPoint());
            }
        }
    }

    export { NavAgent as NavAgent };