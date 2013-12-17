var async = require('async');
var express = require('express');
var util = require('util');
var faceplate = require('faceplate');
var path = require('path');
// create an express webserver
var app = express();

var FACEBOOK_APP_ID = '1400435640201754';
var FACEBOOK_SECRET = 'c5bfd96f8dec9520f1dd1d5795c2d623';

var port = process.env.PORT || 3000;

app.configure(function(){
  app.set('id', FACEBOOK_APP_ID);
  app.set('name', 'flanet');
  app.set('port', port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', { pretty: true });
  app.locals.pretty = true;
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret'));
  app.use(express.session({ secret: 'secret' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(faceplate.middleware({
    app_id: FACEBOOK_APP_ID,
    secret: FACEBOOK_SECRET,
    scope: 'user_likes, user_photos, user_status, user_activities, publish_actions, user,goups, user_subscriptions'
  }));

  app.use(function(req, res, next){
    res.locals.host = req.headers['host'];
    res.locals.scheme = req.headers['x-forwarded-proto'] || 'http';
    res.locals.url = function(path){
      return res.locals.scheme + res.locals.url_no_scheme(path);
    };
    res.locals.url_no_scheme = function(path){
      return '://' + res.locals.host + path;
    };
    next();
  });

});

function render_page(req, res) {
  req.facebook.app(function(app) {
    console.log(app);
    req.facebook.me(function(user) {
      res.render('index.ejs', {
        "layout":    false,
        "req":       req,
        "app":       {"id":FACEBOOK_APP_ID,"name":"flanet"},
        "user":      user
      });
    });
  });
}

function handle_facebook_request(req, res) {
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
        render_page(req, res);
      });

} else {
  render_page(req, res);
}
}

app.get('/', handle_facebook_request);
app.post('/', handle_facebook_request);

app.listen(port, function() {
  console.log("Listening on " + port + "\napp : " + app);
});
