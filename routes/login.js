exports.login = function (req, res) {
	res.render('login', {
		app: {
			id: FACEBOOK_APP_ID
		},
		user: req.user
	});
	console.log(req);
};