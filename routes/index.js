
/*
* GET home page.
*/

exports.index = function(req, res){
	if(!req.user)
		res.render('index', {
			app : {
				id : process.env.FACEBOOK_APP_ID
			},
			title : 'Flanet Project',
			user : undefined,
			loginfo : {
				href : '/auth/facebook',
				text : '> Login with Facebook'
			}
		});
	else
		res.render('index', {
			app : {
				id : process.env.FACEBOOK_APP_ID
			},
			title : 'Hello ' + req.user.id,
			user : req.user,
			loginfo : {
				href :'/logout',
				text : '> Logout'
			}
		});
	// console.log(req);
};