(function(){
	var world = new Flanet.World({
		centerPanel : new Flanet.Panel({
			x : x,
			y : y,
			width : scale,
			height :scale,
			content : {
				id : '0',
				name : 'Greetings~',
				imgSrc : ''
			}
		}),
		width : width,
		height : height
	});
	Flanet.addWorld(world);
	var string = [
	"This is Panel."
	, "Just Drag it."
	, "Click to Fb feed"
	, "yeah~"
	, "have a nice day~"
	];
	for(var i = 0 ; i < 5; i ++){  
		var s = Math.random() * (scale - 10) + 20;
		world.addPanel(new Flanet.Panel({
			x : x + (Math.random() * 600 - 300),
			y : y + (Math.random() * 600 - 300),
			width : s,
			height : s,
			content : {
				id : '0',
				name : string[i],
				imgSrc : '',
			}
		}));
	}
})();