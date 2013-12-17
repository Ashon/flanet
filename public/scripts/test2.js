/**
 * @author Ashon
 */

function addTest(width, height, x, y, scale){
	var Panel = new Flanet.Panel({
		x : x,
		y : y,
		width : scale,
		height :scale,
		content : user_content
	});
	
	var world = new Flanet.World({
		centerPanel : Panel,
		width : width,
		height : height
	});
	Flanet.addWorld(world);
	
	for(var i = 0; i < f_content.length; i++){
		var s = Math.random() * (scale - 20) + 10;
		world.addPanel(new Flanet.Panel({
			x : x + (Math.random() * 600 - 300),
			y : y + (Math.random() * 600 - 300),
			width : s,
			height : s,
			content : f_content[i]
		}));
	}
};