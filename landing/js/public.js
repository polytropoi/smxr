if (location.hostname !== 'localhost' && window.location.protocol === 'http:') window.location.protocol = 'https:';

function getScenes() {
    console.log("tryna getScenes()");
	  var resultElement = document.getElementById('getResult1');
  	resultElement.innerHTML = '';
  //   try {
  //     const scenes = fetch('publicscenes'); //maybe later...
  //     console.log("scenes " + JSON.stringify(scenes));
  //     resultElement.innerHTML = generateSuccessHTMLOutput(scenes);
  //   } catch (e) {
  //     console.log("error " + e);
  //   }
   

  // //   .then((response) => {
  // //     // return response.json();
  // //     let resp = response.json();
  // //     console.log(resp);
  // //     resultElement.innerHTML = generateSuccessHTMLOutput(resp);
  // //   })
  // //   // .then((data) => {
  // //   //   console.log(JSON.stringify(data));
  // //   //   resultElement.innerHTML = generateSuccessHTMLOutput(data);
  // //   // })
  // //   .catch(function(e) {
  // //     console.log(e);
  // //     resultElement.innerHTML = generateErrorHTMLOutput(e);
  // //   });
	axios.get('publicscenes')
  .then(function (response) {
    // console.log(JSON.stringify(response));
	  resultElement.innerHTML = generateSuccessHTMLOutput(response);
  })
  .catch(function (error) {
    console.log(error);
    resultElement.innerHTML = generateErrorHTMLOutput(error);
  });
}

function generateSuccessHTMLOutput(response) {
	var jsonResponse = response.data;
	var arr = jsonResponse.availableScenes;
  // console.log(JSON.stringify(arr));
  const shuffledArray = arr.sort((a, b) => 0.5 - Math.random());
  let count = 0;
  let max = 30;
    // var root = "servicemedia.net/webxr";
  var html = "";
     for(var i = 0; i < shuffledArray.length; i++) {
        if (count < max) {
        // console.log("root" + root);
        var audioHtml = '<div><audio controls><source src=\x22#\x22 type=\x22audio/mp3\x22></audio></div>';
              // var audioHtml = '<div class=\x22col-md-12 pull-left\x22><audio controls><source src=\x22#\x22 type=\x22audio/mp3\x22></audio></div><hr>';   
        var keynoteHtml = "";
        var descHtml = "";
        if (shuffledArray[i].primaryAudioUrl != undefined) {
            audioHtml = '<div><audio controls><source src=\x22' + shuffledArray[i].primaryAudioUrl  + '\x22 type=\x22audio/mp3\x22></audio></div>';
        }
        if (shuffledArray[i].scenePrimaryAudioStreamURL != undefined) {
            audioHtml = '<div><audio controls><source src=\x22' + shuffledArray[i].scenePrimaryAudioStreamURL  + '\x22 type=\x22audio/mp3\x22></audio></div>';
        }
        
        if (shuffledArray[i].sceneKeynote != null) {
            keynoteHtml = '<div >Keynote: ' + shuffledArray[i].sceneKeynote + '</div><br>'
        }
        if (shuffledArray[i].sceneDescription != null) {
            descHtml = '<div >Description: ' + shuffledArray[i].sceneDescription + '</div><br>'
        }

        buttons = "<a href=\x22/landing/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Landing</a>"+
                  "<a href=\x22/aframe/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>A-Frame</a>";
                  // "<a href=\x22https://www.oculus.com/open_url/?url=https://smxr.net/aframe/" +  shuffledArray[i].sceneKey + 
                  // "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Quest</a>";
        
        if (shuffledArray[i].sceneEnabledClientTypes != undefined) {
          if (shuffledArray[i].sceneEnabledClientTypes.aframeWeb == false) {
            buttons = "<a href=\x22/landing/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Landing</a>";
          }
          if (shuffledArray[i].sceneEnabledClientTypes.pixiWeb == true) {
            buttons = buttons + "<a href=\x22/pixi/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Pixi</a>";
          }
          if (shuffledArray[i].sceneEnabledClientTypes.unityWeb == true) {
            buttons = buttons + "<a href=\x22https://servicemedia.net/unityweb/index.html?scene=" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Unity Web</a>";
          }
          if (shuffledArray[i].sceneEnabledClientTypes.mapboxWeb == true) {
            buttons = buttons + "<a href=\x22/mapbox/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Mapbox</a>";
          }    
          if (shuffledArray[i].sceneEnabledClientTypes.maplibreWeb == true) {
            buttons = buttons + "<a href=\x22/maplibre/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Maplibre</a>";
          }    
          if (shuffledArray[i].sceneEnabledClientTypes.threeWebGL == true) {
            buttons = buttons + "<a href=\x22/wgl/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>WebGL</a>";
          }  
          if (shuffledArray[i].sceneEnabledClientTypes.threeWeb == true) {
            buttons = buttons + "<a href=\x22/wgpu/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>WebGPU</a>";
          }  

          if (shuffledArray[i].sceneEnabledClientTypes.babylonWeb == true) {
            buttons = buttons + "<a href=\x22/babylon/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Babylon</a>";
          }       
        }

           
        html = html + "<div class=\x22col\x22>"+
          "<div class=\x22card shadow-sm\x22>"+
            // "<svg class=\x22bd-placeholder-img card-img-top\x22 width=\x22100%\x22 height=\x22225\x22 xmlns=\x22http://www.w3.org/2000/svg\x22 role=\x22img\x22 aria-label=\x22Placeholder: Thumbnail\x22 "+
            // "preserveAspectRatio=\x22xMidYMid slice\x22 focusable=\x22false\x22><title>Placeholder</title><rect width=\x22100%\x22 height=\x22100%\x22 fill=\x22#55595c\x22/><text x=\x2250%\x22 y=\x2250%\x22 fill=\x22#eceeef\x22 dy=\x22.3em\x22>Thumbnail</text></svg>"+
            '<a href=\x22/landing/'+ shuffledArray[i].sceneKey + '\x22 target=\x22_blank\x22>' +
            "<img src=\x22"+ shuffledArray[i].scenePostcardHalf +"\x22 class=\x22cropped1 img-fluid\x22></a>"+
            "<div class=\x22card-body\x22>"+
              "<p class=\x22card-text\x22><strong>"+shuffledArray[i].sceneTitle+"</strong></p>"+
              "<p class=\x22card-text\x22>"+shuffledArray[i].sceneDescription+"</p>"+
              "<p class=\x22card-text\x22><a href=\x22http://"+shuffledArray[i].sceneDomain+"\x22>"+shuffledArray[i].sceneDomain+"</a></p>"+
              "<div class=\x22d-flex justify-content-between align-items-center\x22>"+
                "<div class=\x22btn-group\x22>"+

                  buttons +

                  // "<a href=\x22/landing/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Landing</a>"+
                  // "<a href=\x22/webxr/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>WebXR</a>"+
                  // "<a href=\x22https://www.oculus.com/open_url/?url=https://smxr.net/webxr/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Quest</a>"+
                  
                  // "<a href=\x22/vtt/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>VTT</a>"+
                  // "<a href=\x22https://smxr.net/qrcode/" +  shuffledArray[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>QR Code</a>"+
                "</div>"+
                // "<small class=\x22text-body-secondary\x22>9 mins</small>"+
              "</div>"+
            "</div>"+
          "</div>"+
        "</div>";

        count++;
      }
     };
     return  html;

}

function showScenes(response) {
	var jsonResponse = response.data;
    var arr = jsonResponse.availableScenes;
    shuffle(arr);
    var html = "<div class=\x22row\x22>";
     for(var i = 0; i < arr.length; i++) {
      
      html = html + "<div class=\x22col\x22>"+
          "<div class=\x22card shadow-sm\x22>"+
            // "<svg class=\x22bd-placeholder-img card-img-top\x22 width=\x22100%\x22 height=\x22225\x22 xmlns=\x22http://www.w3.org/2000/svg\x22 role=\x22img\x22 aria-label=\x22Placeholder: Thumbnail\x22 "+
            // "preserveAspectRatio=\x22xMidYMid slice\x22 focusable=\x22false\x22><title>Placeholder</title><rect width=\x22100%\x22 height=\x22100%\x22 fill=\x22#55595c\x22/><text x=\x2250%\x22 y=\x2250%\x22 fill=\x22#eceeef\x22 dy=\x22.3em\x22>Thumbnail</text></svg>"+
            '<a href=\x22/landing/'+ arr[i].sceneKey + '\x22 target=\x22_blank\x22>' +
            "<img src=\x22"+ arr[i].scenePostcardHalf +"\x22 class=\x22cropped1 img-fluid\x22></a>"+
            "<div class=\x22card-body\x22>"+
              "<p class=\x22card-text\x22><strong>"+arr[i].sceneTitle+"</strong></p>"+
              "<p class=\x22card-text\x22>"+arr[i].sceneDescription+"</p>"+
              "<div class=\x22d-flex justify-content-between align-items-center\x22>"+
                "<div class=\x22btn-group\x22>"+
                  "<a href=\x22/landing/" +  arr[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>Landing</a>"+
                  "<a href=\x22/aframe/" +  arr[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>A-Frame</a>"+
                  "<a href=\x22https://smxr.net/qrcode/" +  arr[i].sceneKey + "\x22 target=\x22_blank\x22 type=\x22button\x22 class=\x22btn btn-sm btn-outline-secondary\x22>QR Code</a>"+
                "</div>"+
                // "<small class=\x22text-body-secondary\x22>9 mins</small>"+
              "</div>"+
            "</div>"+
          "</div>"+
        "</div>";

     };
     return  html + "</div>";

}
var shuffle = function (array) {

	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;

};
function generateErrorHTMLOutput(error) {
  return  '<h4>Result</h4>' + 
          '<h5>Message:</h5> ' + 
          '<pre>' + error.message + '</pre>' +
          '<h5>Status:</h5> ' + 
          '<pre>' + error.response.status + ' ' + error.response.statusText + '</pre>' +
          '<h5>Headers:</h5>' + 
          '<pre>' + JSON.stringify(error.response.headers, null, '\t') + '</pre>' + 
          '<h5>Data:</h5>' + 
          '<pre>' + JSON.stringify(error.response.data, null, '\t') + '</pre>'; 
}