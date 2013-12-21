
/*
* GET home page.
*/

exports.index = function(req, res){
	res.render('index', { app : {id : FACEBOOK_APP_ID}, user: req.user });
	console.log(req);
};