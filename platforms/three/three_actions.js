
export function ActionSwitch (event) {
    const type = event.target.dataset.markertype;
    const eventdata = event.target.dataset.eventdata;
    const tags = event.target.dataset.tags;
    
    console.log(type + " " + eventdata + " " + tags);


    switch (type) {
        case "gate":
            EnterSceneGate(eventdata);
        break;
    }
}

export class SceneObject {
    constructor(object, objectData) {

        this.object = object;
        this.objectData = objectData;
        this.object.sceneObjectInstance = this;
        console.log("new sceneObject " + JSON.stringify(this.objectData));
    }
}


function EnterSceneGate (eventData) {

    if (eventData != null && eventData != "") {
        console.log("tryna gate with eventData " + eventData);
        if (eventData.toString().toLowerCase().includes("tag")) { //if it's a tag look up matches
            if (eventData.toString().toLowerCase().includes("~")) {
                const tagSplit = eventData.toString().toLowerCase().split("~");
                (async () => { //hrm where to put this?
                    try {
                    console.log("tryna fetch scenes with tags " + tagSplit[1]);
                    const response = await fetch('/scenedata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                        tags: tagSplit[1]
                        })
                    });
                    const data = await response.json();
                    if (data.short_id) {
                        // let url = "/webxr/" + data.short_id;
                        window.location.href = "/three/" + data.short_id;
                        // that.dialogEl.components.mod_dialog.showPanel("Go to " + data.sceneTitle +" ?", "href~"+ url, "gatePass", 5000 );
                    } else {
                        console.log("no scenes found with tags " + eventData);
                    }
                    } catch(error) {
                        console.log(error);
                    } 
                })();  
            }
        } else { //if not a tag assume it's a short_id
            console.log("no tags but going to " + eventData);
            window.location.href = "/three/" + eventData;
        // window.location.href = locData.eventData;
        }
        
    } else { //otherwise go to a random domain scene
        console.log("tryna go to random domain scene");
        let ascenesEl = document.getElementById("availableScenesControl");
        if (ascenesEl) {
        let asControl = ascenesEl.components.available_scenes_control; //available scenes in this domain
        if (asControl) {
            let scene = asControl.returnRandomScene();
            let url = "/three/" + scene.sceneKey;
            window.location.href = url; 
            
        }
        }
    }
}
