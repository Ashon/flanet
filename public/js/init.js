(function(){
	var world = new Flanet.World({
		centerPanel : new Flanet.Panel({
			x : x,
			y : y,
			width : scale,
			height :scale,
			body : {
				friction : 1,
				restitution : 0,
				density : 10,
				liniarDamping : 0.01,
				angularDamping : 0.01
			},
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
			body : {
				friction : 1,
				restitution : .01,
				density : 1,
				liniarDamping : 0.04,
				angularDamping : 0.02
			},
			content : {
				id : '0',
				name : string[i],
				imgSrc : ''
			}
		}));
	}

	var c1 = $('.kineticjs-content').find('canvas');
	var ctx1 = c1[0].getContext('2d');
	var c2 = $('.header').find('canvas');
	var ctx2 = c2[0].getContext('2d');

	var blurry = function(){
		ctx2.putImageData(ctx1.getImageData(0, 0, c2.width(), c2.height()), 0, 0);
	}

	Flanet.animation_extra = blurry;
})();