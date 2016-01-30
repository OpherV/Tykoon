(function() {
	
	var DB = {
		characters: [
			{
				name: 'Ty Koon',
				id: 0,
				actions: [
					{
						id: 0,
						label: 'Create Charity'
					},
					{
						id: 1,
						label: 'Monopolize'
					},
					{
						id: 2,
						label: 'Outsource'
					}
				]
			},
			{
				name: 'Hank Underbot',
				id: 1,
				actions: [
					{
						id: 0,
						label: 'Spin'
					},
					{
						id: 1,
						label: 'Kiss the Baby'
					},
					{
						id: 2,
						label: 'Campaign'
					}
				]
			},
			{
				name: 'The News',
				id: 2,
				actions: [
					{
						id: 0,
						label: 'Sensationlaize'
					},
					{
						id: 1,
						label: 'Distort Truth'
					},
					{
						id: 2,
						label: 'Break to Commercials'
					}
				]
			},
			{
				name: 'Kat Summers',
				id: 3,
				actions: [
					{
						id: 0,
						label: 'Like'
					},
					{
						id: 1,
						label: 'Selfie'
					},
					{
						id: 2,
						label: 'Angry Post'
					}
				]
			}
		],
		Locations: [
			{
				name: 'Volcano',
				used: false
			},
			{
				name: 'Totem',
				used: false
			},
			{
				name: 'Forest',
				used: false
			},
			{
				name: 'Fountain',
				used: false
			}
		],
		Logic: [
			// TyKoon Actions
			[
				// Volcano
				{positive: 0, negative: 1},
				// Forest
				{positive: 2, negative: 1},
				// Totem
				{positive: 1, negative: 2},
				// Fountain
				{positive: 0, negative: 2}
			],
			// Hank Underbot Actions
			[
				// Volcano
				{positive: 0, negative: 1},
				// Forest
				{positive: 2, negative: 0},
				// Totem
				{positive: 2, negative: 1},
				// Fountain
				{positive: 1, negative: 2}
			],
			// The News Actions
			[
				// Volcano
				{positive: 0, negative: 2},
				// Forest
				{positive: 0, negative: 1},
				// Totem
				{positive: 2, negative: 1},
				// Fountain
				{positive: 1, negative: 0}
			],
			// Kat Summers Actions
			[
				// Volcano
				{positive: 1, negative: 2},
				// Forest
				{positive: 1, negative: 0},
				// Totem
				{positive: 0, negative: 2},
				// Fountain
				{positive: 2, negative: 0}
			]
		]
	};

	function shuffle(array) {
	  	var currentIndex = array.length, temporaryValue, randomIndex;

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
	}

	/*function run50Times() {
		testArr = [];
		for (var i = 0; i < 50; i++) {
			testArr.push(generateSeq());
		}
		console.log(testArr);
	}*/

	function generateSeq() {
		var seq = [0,1,2];
		seq.push(Math.floor(Math.random() * 3));
		seq = shuffle(seq);
		return seq;
	}


	var exports = {
		initLogic: function() {

		},

		getCharacters: function() {
			return DB.characters;
		},

		requestAction: function(characterId, actionId, locationId) {
			if (DB.Locations[locationId].used) {
				return false;
			}
			DB.Locations[locationId].used = true;
			return true;
		},

		endAction: function(characterId, actionId, locationId){
			currLogic = DB.Logic[characterId][LocationId];
			if (currLogic.positive === actionId) return 1;
			else if (currLogic.negative === actionId) return -1;
			else return 0;
		}
	};

	window.Tykoon.Logic = exports;

})();
