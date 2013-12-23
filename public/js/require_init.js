require.config({
	paths :{
		jquery : '/lib/jquery-1.7.2'
	},
	baseUrl: '/'
});
require([
	'jquery'], function($){
		require([
		'lib/dev/kinetic-v4.7.4.min',
		'lib/box2djs.0.2.0.jquery.min',
		'lib/dev/flanet-v1.0.6'],
		function(kinetic, box2d, Flanet){
			$('document').ready(function(){
				var container = $('#stage');
				container.width($(window).width());
				container.height($(window).height());
				var width = container.width();
				var height = container.height();
				var x = width * 0.5;
				var y = height * 0.5;
				var scale = 50;
			//flanet initialize
				Flanet.init({ container : 'stage' });
			blur = (function(){
				$('canvas.blurred')[0].width = $('.header').width();
				$('canvas.blurred')[0].height = 53;

				var c1 = $('.kineticjs-content').find('canvas');
				var ctx1 = c1[0].getContext('2d');
				var c2 = $('.blur_wrapper').find('canvas');
				var ctx2 = c2[0].getContext('2d');

				Flanet.animation_extra = function(){
					ctx2.putImageData(ctx1.getImageData(0, 0, c2.width(), c2.height()), 0, 0);
				};
			})();

			(function(Flanet){
				var world = new Flanet.World({
					centerPanel : new Flanet.Panel({
						x : x,
						y : y,
						width : scale,
						height :scale,
						body : {
							friction : 1,
							restitution : 0.01,
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
				"This is Panel.",
				"Just Drag it.",
				"Click to Fb feed",
				"yeah~",
				"have a nice day~"
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
							restitution : 0.01,
							density : 1,
							liniarDamping : 0.0,
							angularDamping : 0.02
						},
						content : {
							id : '0',
							name : string[i],
							imgSrc : ''
						}
					}));
				}
			})(Flanet);

			Flanet.start();
		}
		);
}
)});