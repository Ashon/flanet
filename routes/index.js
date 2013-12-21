
/*
* GET home page.
*/

exports.index = function(req, res){
	res.render('index', { app : {id : process.env.FACEBOOK_APP_ID}, user: req.user });
	console.log(req);
};