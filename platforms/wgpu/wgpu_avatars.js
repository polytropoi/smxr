
import { userData, room, avatars } from '../../../connect/connect.js';

eventEl.addEventListener('avatar-event', AvatarEvent);

async function AvatarEvent(event) {
    console.log("gotsa avatarEvent " + JSON.stringify(event.details));
    if (event.details.type == "create") {
        // https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb
        const model = await LoadModel('https://servicemedia.s3.amazonaws.com/assets/models/avatar1c.glb');
        const material = new THREE.MeshStandardMaterial( { color: event.details.color } ); //color is passed in socket handshake, and appended to username
        const avatarModel = model.scene;
        material.needsUpdate = true;
        // index = 0;
        avatarModel.traverse(node => {
            if (node.name == "head" || node.name == "body") { //not the eyes!
            node.material = material;
            }
        });
        avatarModel.name = event.details.socketID;
        scene.add(avatarModel);
        console.log("created avatar with socketID " + event.details.socketID );
        avatars[event.details.socketID].sceneAvatar = new SceneAvatar(avatarModel);
    } else if (event.details.type == "move") {
        //find by name
        const targetAvatar = avatars[event.details.socketID];
        if (targetAvatar) {
            const avatarModel = scene.getObjectByName(event.details.socketID);
            if (avatarModel) {
            console.log("gotsa avatarmodel name " + targetAvatar.name + " color " + targetAvatar.color + " socketiD " + event.details.socketID);
            avatarModel.position.set(event.details.posX,event.details.posY,event.details.posZ);
            avatarModel.rotation.set(event.details.rotX,event.details.rotY,event.details.rotZ);
            } else {
                console.log("caint find no avatarModel for " +event.details.socketID);
            }
        }
    }

}

class SceneAvatar { //must be a socket connection!
    constructor (model, locData) {
        this.model = model;
        // this.targetPosition = new THREE.Vector3();

    }

    setTargetPosition (targetPosition) {
        this.targetPosition = targetPosition;
    }

    update(deltaTime) {

    }
}

