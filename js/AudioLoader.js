var sounds = {
	underbot: {
		responses: [
			'assets/sounds/underbot/response1.mp3',
			'assets/sounds/underbot/response2.mp3',
			'assets/sounds/underbot/response3.mp3'
		]
	},
	tykoon: {
		responses: [
			'assets/sounds/tykoon/response1.mp3',
			'assets/sounds/tykoon/response2.mp3',
			'assets/sounds/tykoon/response3.mp3',
			'assets/sounds/tykoon/response4.mp3',
			'assets/sounds/tykoon/response5.mp3',
			'assets/sounds/tykoon/response6.mp3'
		]
	},
	kat: {
		responses: [
			'assets/sounds/kat/response1.mp3',
			'assets/sounds/kat/response2.mp3',
			'assets/sounds/kat/response3.mp3',
			'assets/sounds/kat/response4.mp3',
			'assets/sounds/kat/response5.mp3'
		]
	},
};


soundManager.setup({

    // where to find the SWF files, if needed
    url: '/path/to/swf-directory/',
	debugMode: false,

    onready: function() {
    	Tykoon.sounds = [];
    	var response;

    	var responseArray = [];
    	for (var i = 0; i < sounds.tykoon.responses.length; i++) {
			response = soundManager.createSound({
			  	url: sounds.tykoon.responses[i]
			});
			responseArray.push(response);
		}		
		Tykoon.sounds[0] = responseArray;


		responseArray = [];
      	for (i = 0; i < sounds.underbot.responses.length; i++) {
			response = soundManager.createSound({
			  	url: sounds.underbot.responses[i]
			});
			responseArray.push(response);
		}

		Tykoon.sounds[1] = responseArray;

		responseArray = [];
      	for (i = 0; i < sounds.kat.responses.length; i++) {
			response = soundManager.createSound({
			  	url: sounds.kat.responses[i]
			});
			responseArray.push(response);
		}

		Tykoon.sounds[2] = responseArray;
    },

    ontimeout: function() {
      // Uh-oh. No HTML5 support, SWF missing, Flash blocked or other issue
    }

});


