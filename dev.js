var express = require('express')
	, util = require('util')

var port = process.env.PORT || 3000;

var app = express();
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

// page routing
app.get('/', function(req, res){
	res.render('dev', {});
});

app.listen(port, function(){
console.log("http listen : " + port);
});
