
var responsesUrls = [
	'assets/sounds/underbot/response1.mp3',
	'assets/sounds/underbot/response2.mp3',
	'assets/sounds/underbot/response3.mp3'
];
howls = [];
for (var i = 0; i < responsesUrls.length; i++) {
	var response = new Howl({
	  	urls: responsesUrls[i]
	});
	howls.push(response);
}

Tykoon.howls.underbot = howls;
