
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();


// fb
var fb = require('fb');
var fbConfig = require('./config');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// check fb config
if(!fbConfig.facebook.appId || !fbConfig.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*
function render_page(req, res, title) {
  req.facebook.app(function(app) {
    req.facebook.me(function(user) {
      res.render('index', {
      	"title" : title,
        layout:    false,
        req:       req,
        app:       app,
        user:      user
      });
    });
  });
}

exports.index = function(req, res){
// if the user is logged in
  if (req.facebook.token) {
    async.parallel([
      function(cb) {
        // query 4 friends and send them to the socket for this socket id
        req.facebook.get('/me/friends', { limit : 50 }, function(friends) {
          req.friends = friends;
          cb();
        });
      },
      function(cb) {
        // query 16 photos and send them to the socket for this socket id
        req.facebook.get('/me/photos', { limit : 16 }, function(photos) {
          req.photos = photos;
          cb();
        });
      },
      function(cb) {
        // query 4 likes and send them to the socket for this socket id
        req.facebook.get('/me/likes', { limit : 4 }, function(likes) {
          req.likes = likes;
          cb();
        });
      },
      function(cb) {
    	  req.facebook.get('/me/feed', { limit : 100 }, function(feeds){
    		req.feeds = feeds;
    		cb();
    	  });
      },
      function(cb) {
        // use fql to get a list of my friends that are using this app
        req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
          req.friends_using_app = result;
          cb();
        });
      }
    ], function() {
      render_page(req, res,"logged");
    });

  } else {
    render_page(req, res,"not logged");
  }
};*/