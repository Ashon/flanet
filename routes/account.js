exports.account = function(req, res) {
	res.render('account', {
		app: {
			id: process.env.FACEBOOK_APP_ID
		},
		user: req.user
	});
	console.log(req);
};