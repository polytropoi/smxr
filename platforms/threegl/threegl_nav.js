    import * as THREE from 'three';

    // import {scene, navmesh} from './threegl_main.mjs';
        import {scene, navmesh} from './threegl_main.mjs';

    import { Pathfinding, PathfindingHelper } from 'three-pathfinding';


    import { getKinematicBody, world, getKinematicAgentBodies, agentCount } from './threegl_physics.js';

    const ZONE = 'myNavmeshZone'; 
    const groupID = 0;
    let pathfinding, helper;

    export let agents = [];
    export let agentParents = [];
    // let agentCount = 20;
    export let agentsAreReady = false;


    let agentInitLocations = [];
    let arrowHelper;

    // import { uniform, sin } from 'three/tsl';
    // let agentIndex = 0;





    export function CreateAgent (agentIndex, pos) {

            const agentParent = new THREE.Object3D(); //empty
            agentParent.name = "agentParent_" + agentIndex;
            agentParent.position.set(pos.x, pos.y, pos.z);
            // agentParent.add(mesh);
            // mesh.position.set(0,1,0); //offset on parent navagent
            scene.add(agentParent);
      
        
        const options = {
            object: agentParent,
            nodeRadius: 0.1,
            speed: 4,
            // app: this,
            name: 'agent_' + agentIndex,
            npc: true
        };

        const agent = new NavAgent( options );
        agents.push(agent);
        agentParents.push(agentParent);

        // let resp = {}
        // agentMeshes.push(mesh);
        console.log("creating navagent " + agentIndex);
        // return agentParent;
        // if (RAPIER) {

        // } 
    }

            
    export async function initAgents () {
        // 
        for (let i = 0; i < agentCount; i++) {
            let pos;
            let goodPosition = false;
            // await new Promise(r => setTimeout(r, 500)); //slow the fxk down
            // for (let p = 0; p < 10; p++) {
            //     if (goodPosition) {
            //         break;
            //     }
                pos = randomNavmeshPoint();
            //     for (let d = 0; d < agentInitLocations.length; d++) {
            //         if (pos.distanceTo(agentInitLocations[d]) > 2) {
            //             goodPosition = true;
            //             break;
            //         }
            //     }
            // }
            


            const agentIndex = i;
            CreateAgent(agentIndex, pos); //cook the navagent first
            
            console.log("creating kinematic body for agent " + agentIndex);
            // kinematicBodies.push(rbody);
        }
      
    }

    export async function InitPathfinding () {
        // if (settings && settings.sceneTags && settings.sceneTags.includes("navmesh") && navmesh) {
 
        if (navmesh && navmesh.geometry) {
            try {
                pathfinding = await new Pathfinding();
                await world;
                helper = new PathfindingHelper();
                // scene.add(helper);
                // helper.reset()
                // const pathfinding = new Pathfinding();
                
                // Define a zone name
                pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
                // const theZone = pathfinding.createZone(navmesh.geometry, ZONE);
                // pathfinding.setZoneData(ZONE, theZone);
                console.log("creating navmesh " + navmesh);


            } catch (e) {
                console.log("error pathfinding init " + e);
            } finally{
                agentsAreReady = true;
                console.log( "navmesh done, initAgents()");
            //    WaitAndInitAgents();
                await initAgents();
                // await getKinematicAgentBodies();
            }

            // await initRapier();
        } else {
            // await initRapier();
        }

    }

    export function closestNavmeshPoint (testPosition) {
        // console.log("testing " + (JSON.stringify(testPosition)) + " " + navmesh + " " + pathfinding);
        if (navmesh && pathfinding) {
            const goodSpot = pathfinding.getClosestNode(testPosition, ZONE, groupID, false);
            console.log("tryna get testPosition " + JSON.stringify(testPosition) +  " vs goodSpot " + JSON.stringify(goodSpot.centroid));
            return goodSpot.centroid; 
        } else {
            if (navmesh && !pathfinding) { 
                // InitPathfinding();
                console.log("pathfinding not found!");
            }
            return null;

        }
    }
    export function randomNavmeshPoint () {
        

        if (navmesh && pathfinding) {

            const randomNode = pathfinding.getRandomNode(ZONE, groupID, new THREE.Vector3(0,0,0), 50);

            
            // console.log("random navmesh position " + JSON.stringify(randomNode));
            // randomNode 
            return randomNode;
        }
    } 

    class NavAgent{
        constructor(options){
            const fps = options.fps || 30; //default fps
            
            this.assetsPath = options.assetsPath;
            this.name = options.name || 'Player';
            
            this.animations = {};	
            
            this.worldPosition = new THREE.Vector3();

            scene.add(options.object);
            
            this.object = options.object;
            this.pathLines = new THREE.Object3D();
            this.pathColor = new THREE.Color(0xFFFFFF);
            this.nodeRadius = (options.nodeRadius) ? options.nodeRadius : 0.2;

            this.readyToNav = true;
            
            scene.add(this.pathLines);
            
            this.npc = options.npc;
            
            if (this.npc) this.dead = false;
            
            this.speed = options.speed;
            // this.app = options.app;
            
            if (pathfinding){
                this.pathfinder = pathfinding;
                this.ZONE = ZONE;
                this.navMeshGroup = this.pathfinder.getGroup(this.ZONE, this.object.position);	
            }
            if (helper) {
                this.helper = helper;
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
            this.object.userData.NavAgentInstance = this; // add this kinda class object instance to the userdata, to enable fetching instance from e.g. raycast
        }
        raycastedPosition() {
               let raycaster = new THREE.Raycaster();
                this.object.getWorldPosition(this.worldPosition);
                let testPosition = new THREE.Vector3(this.worldPosition.x, this.worldPosition.y + 10, this.worldPosition.z);
                
                let direction = new THREE.Vector3(0, -1, 0);//down                          
                console.log("tryna raycast from " + JSON.stringify(testPosition) + " dir " + direction);
                raycaster.set(testPosition, direction);

                // const origin = new THREE.Vector3(0, 0, 0);
                // const direction = new THREE.Vector3(0, 0, -1);
                arrowHelper = new THREE.ArrowHelper(direction, testPosition, 10, 0xff0000);
                scene.add(arrowHelper);
                let results = raycaster.intersectObject(navmesh, false);


                            if(results.length > 0) {
                                                console.log("gotsa navmesh intersect: " + results.length + " " +results[0].object.name + " " +  results[0].point  );
                                console.log("tryna snap to " + JSON.stringify(results[0].point)); 
                                return (results[0].point);
                                // this.helper.set
                                // this.object.position.set(results[0].point);
                                // // this.znormal = Math.abs(results[0].face.normal.z);
                                // // if (this.znormal < .1) {
                                //     // console.log(" gotsa good navmesh intersect face normal: " + this.znormal );
                                //     testPosition.y = results[0].point.y.toFixed(2); //snap y of waypoint to navmesh y
                                //     testPosition.x = results[0].point.x.toFixed(2);
                                //     testPosition.z = results[0].point.z.toFixed(2);
                                //     let waypointEl = document.createElement("a-box");
                                //     waypointEl.setAttribute('scale', '.1 .1 .1');
                                //     waypointEl.setAttribute('position', testPosition);
                                //     this.el.sceneEl.appendChild(waypointEl);
                                    
                                //     this.goodWaypoints.push(waypointEl);
                                //     goodWaypointCount++;
            
                                //     // let position = this.waypoints[i].getAttribute('position');
                                    
                                // if (settings & settings.debugMode) {
                                //     var testLineMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
                                //     var points = [];
                                //     points.push(new THREE.Vector3(testPosition.x, testPosition.y + 10, testPosition.z));
                                //     points.push(new THREE.Vector3(testPosition.x, testPosition.y - 10, testPosition.z));
                                //     var geometry = new THREE.BufferGeometry().setFromPoints(points);
                                //     var line = new THREE.Line(geometry, testLineMaterial);
            
                                //     this.el.sceneEl.object3D.add(line);
                                // }
                                // // }
                                // data.waypoints[i].
                            } 
        }
        
        newPath(pt) {
            const player = this.object;
            
            if (this.pathfinder===undefined) {
                this.calculatedPath = [ pt.clone() ];
                this.setTargetDirection();
                return;
            }
            // if (Math.random() > .7) {
            //     return;
            // }
                    
            // Calculate a path to the target and store it
            this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);
            
            if (this.calculatedPath && this.calculatedPath.length) {
                this.action = 'walk';
                
                this.setTargetDirection();
                
                // if (debug.showPath && !this.npc){
                	// this.showPathLines();
                // }
            } else {
                this.action = 'idle';

                //if we get stuck in bad navmesh spot
                const closestNode = this.pathfinder.getClosestNode(player.position, this.ZONE, this.navMeshGroup, true);

                if (closestNode) {
                    // The closest point on the navmesh surface
                    this.calculatedPath = null;
                    const closestPoint = new THREE.Vector3(closestNode.centroid.x, closestNode.centroid.y, closestNode.centroid.z);
                    console.log(JSON.stringify(player.position) + " vs pllayer postion to " + JSON.stringify(closestPoint));
                    player.position.set(closestPoint);
                     this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);
                    // You can now use closestPoint for other operations,
                    // such as the start or end point for findPath()
                } else {
                    // console.log("LOST PLAYER!");
                    // this.destroy();
                    // this.resetAgent();
                    // this.readyToNav = !this.readyToNav;
                    // this.snapToNavmesh();


                }           

               

                 if (this.calculatedPath && this.calculatedPath.length) {
                    this.action = 'walk';
                    
                    this.setTargetDirection();
                    console.log("retargeting agent...");
                    this.readyToNav = true;
                 }
                // if (this.pathLines) scene.remove(this.pathLines);


            }
        }
        agentRaycastHit () {
            const closestNode = this.pathfinder.getClosestNode(this.object.position, this.ZONE, this.navMeshGroup, true);

            if (closestNode) {
                this.readyToNav = !this.readyToNav;    
                // if (this.readyToNav) {
                //         this.object.traverse((child) => {
                //         if (child.isMesh) {
                //            child.material.color
                //         }
                //         });
                // }
            } else {
                console.log("don't interrupt now, cain't find a spot to stop");
            }
        }
        resetAgent() {
            const player = this.object;
            this.readyToNav = false;
            this.calculatedPath = null;
          
            const targetPosition = this.raycastedPosition();
            console.log("raycasted position is " + JSON.stringify(targetPosition));
// helper.reset();     
                helper.setPlayerPosition( player.position.copy( targetPosition ) )
				const groupID = this.pathfinder.getGroup(ZONE, player.position, true);
				const closestNode = this.pathfinder.getClosestNode( player.position, ZONE, groupID, true );

				

				if ( closestNode ) {
                    helper.setNodePosition( closestNode.centroid );
                    // helper.setPlayerPosition( player.position.copy( targetPosition ) )
                    this.readyToNav = true;
                }
                //   helper.reset();
                

            // this.snapToNavmesh()
            //  const closestNode = this.pathfinder.getClosestNode(player.position, this.ZONE, this.navMeshGroup, true);
            //  if (closestNode) {
            //         // The closest point on the navmesh surface
            //         const closestPoint = new THREE.Vector3(closestNode.centroid.x, closestNode.centroid.y, closestNode.centroid.z);
            //         console.log("resetting agent " +  JSON.stringify(player.position) + " vs pllayer postion to " + JSON.stringify(closestPoint));
            //         player.position.set(closestPoint);
            //         this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);
            //         this.readyToNav = true;
            //         // You can now use closestPoint for other operations,
            //         // such as the start or end point for findPath()
            //     } else {
                    console.log("tryna RESET PLAYER!");
            //         // this.destroy();
            //     } 
        }
        randomPath() {
            console.log("tryna set random path");
            this.newPath(randomNavmeshPoint());
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
            if (this.pathLines) scene.remove(this.pathLines);

            const material = new THREE.LineBasicMaterial({
                color: this.pathColor,
                linewidth: 2
            });

            const player = this.object;
            const self = this;
            
            const geometry = new THREE.BufferGeometry();
            geometry.vertices.push(player.position);

            // Draw debug lines
            this.calculatedPath.forEach( function(vertex){
                geometry.vertices.push(vertex.clone().add(new THREE.Vector3(0, self.app.debug.offset, 0)));
            });

            this.pathLines = new THREE.Line( geometry, material );
            scene.add( this.pathLines );

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
                // this.object.material.colorNode.scale = sin(dt).mul(0.75);
            // }
            if (this.readyToNav) {
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
                            
                            }
                        }else{
                            this.setTargetDirection();
                        }
                    } this.action = 'idle';
                } else{
                    // if (this.npc && !this.dead) this.newPath(randomNavmeshPoint());
                    this.newPath(randomNavmeshPoint());
                }
            } else {
                // this.raycastedPosition();
            }
        }
    }

    export { NavAgent as NavAgent };