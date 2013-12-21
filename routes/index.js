
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
			loginfo : '<a href="/auth/facebook">&gt; Login with Facebook</a>'
		});
	else
		res.render('index', {
			app : {
				id : process.env.FACEBOOK_APP_ID
			},
			title : 'Hello ' + req.user.id,
			user : req.user,
			loginfo : '<a href="/logout">&gt; Logout</a>'
		});
	// console.log(req);
};