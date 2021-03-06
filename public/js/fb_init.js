(function(userId, userName, token){
	var world = new Flanet.World({
		centerPanel : new Flanet.Panel({
			x : x,
			y : y,
			width : scale,
			height : scale,
			body : {
				friction : 1,
				restitution : 0,
				density : 10,
				liniarDamping : 0.01,
				angularDamping : 0.01
			},
			content : {
				id : userId,
				name : userName,
				imgSrc : 'https://graph.facebook.com/' + userId + '/picture?type=square',
				clicked : function(){
					FB.ui({
						method : 'feed',
						link : $(this).attr('data-url')
					},
					function(res){
						if (res !== null)
							logResponse(res);
					});
				},
				dragged : function(){}
			}
		}),
		width : width,
		height : height
	});
	// async : get friendlist - start
	$.get('https://graph.facebook.com/me/friends',{ access_token: token },
		// async callback function - start
		function(res){
			var flanet_content = [];
			var maxLength = 100;
			var length = maxLength > res.data.length ? res.data.length : maxLength;
			for(var i = 0; i < length; i++){
				var s = Math.random() * (scale - 20) + 10;
				world.addPanel(new Flanet.Panel({
					x : x + (Math.random() * 600 - 300),
					y : y + (Math.random() * 600 - 300),
					width : s,
					height : s,
					content : {
						id : res.data[i].id,
						name : res.data[i].name,
						imgSrc : 'https://graph.facebook.com/' + res.data[i].id  + '/picture?type=square',
						clicked : function(){
						/* remove panel
						var panel = Flanet.getCurrentWorld().getPanelById(this.id);
						if(panel)
							Flanet.getCurrentWorld().rmPanel(panel);
						*/
						/* feed to friend */
						var that = this;
						FB.ui({
							method: 'stream.publish',
							link: $(this).attr('data-url'),
							target_id: this.id,
							display: 'iframe'
						}, function(res){
							if (res !== null)
								logResponse(res);
						}
						);
					}
				}
			}));
			}
			
		} // async callback function - end
	); // async : get friendlist - end
	
	var stage = new Flanet.Stage({ container : 'stage' });
	Flanet.init(stage);
	stage.addWorld(world);
	stage.start();

})(userId, userName, token);
