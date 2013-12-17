
var config = { };

// should end in /
config.rootUrl  = process.env.ROOT_URL                  || 'http://flanet.herokuapp.com/';

config.facebook = {
    appId:          process.env.FACEBOOK_APPID          || '1400435640201754',
    appSecret:      process.env.FACEBOOK_APPSECRET      || 'c5bfd96f8dec9520f1dd1d5795c2d623',
    appNamespace:   process.env.FACEBOOK_APPNAMESPACE   || 'flanetproject',
    redirectUri:    process.env.FACEBOOK_REDIRECTURI    ||  config.rootUrl + 'login/callback'
};

module.exports = config;
