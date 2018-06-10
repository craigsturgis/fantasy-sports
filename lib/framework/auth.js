var OAuth2 = require("oauth").OAuth2,
    Q = require("q"),
    URL = require('url');

function Auth() {
}

Auth.prototype.refreshAuthentication = function(request, reply) {
    var deferred = Q.defer();

    // this.getOAuth().refreshOAuthAccessToken(
    //     request.session.auth.credentials.token,
    //     request.session.auth.credentials.secret,
    //     request.session.auth.credentials.oauthSessionHandle,
    //     function(error, oauth_access_token, oauth_access_token_secret, results2) {
    //         if(error) {
    //             reply(error);
    //         }
    //         else {
    //             // store the access token in the session
    //             request.session.auth.credentials.token = oauth_access_token;
    //             //request.cookies.accessToken = oauth_access_token;
    //             request.session.auth.credentials.secret = oauth_access_token_secret;
    //             request.session.auth.credentials.timestamp = new Date();
    //             // request.session.oauthSessionHandle = results2.oauth_session_handle;
    //             // request.session.xoauthYahooGuid = results2.xoauth_yahoo_guid;
    //
    //             deferred.resolve();
    //         }
    // });

    this.getOAuth().getOAuthAccessToken(
        request.session.auth.credentials.refresh_token,
        {
            'grant_type':'refresh_token',
            'redirect_uri': this.config.callback
        },
        //function(error, oauth_access_token, oauth_refresh_token, results2) {
        function(error, oauth_access_token, oauth_refresh_token) {
            if(error) {
                reply(error);
            }
            else {
                // store the access token in the session
                request.session.auth.credentials.token = oauth_access_token;
                // request.cookies.access_token = oauth_access_token;
                request.session.auth.credentials.refresh_token = oauth_refresh_token;
                request.session.auth.credentials.timestamp = new Date();
                // request.session.oauthSessionHandle = results2.oauth_session_handle;
                // request.session.xoauthYahooGuid = results2.xoauth_yahoo_guid;

                deferred.resolve();
            }
    });

    return deferred.promise;
};

Auth.prototype.endAuthentication = function(request, reply) {
    var uri = request.url;
    var parsed = URL.parse(uri, true);

    request.session.auth.credentials.code = parsed.query.code;

    this.getOAuth().getOAuthAccessToken(
        request.session.auth.credentials.code,
        {
          'grant_type':'authorization_code',
          'redirect_uri': this.config.callback
        },
        //function(error, oauth_access_token, oauth_refresh_token, results2) {
        function(error, oauth_access_token, oauth_refresh_token) {
            if(error) {
                reply(error);
            }
            else {
                // store the access token in the session
                request.session.auth.credentials.token = oauth_access_token;
                // request.cookies.access_token = oauth_access_token;
                request.session.auth.credentials.refresh_token = oauth_refresh_token;
                request.session.auth.credentials.timestamp = new Date();
                // request.session.oauthSessionHandle = results2.oauth_session_handle;
                // request.session.xoauthYahooGuid = results2.xoauth_yahoo_guid;

                reply.redirect("/");
            }
    });
};

Auth.prototype.beginAuthentication = function(request, reply) {

    var oa = this.getOAuth();

    console.dir(oa);

    // oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret) {
    //     if(!request.session.auth){
    //       request.session.auth = {};
    //     }
    //
    //     if(!request.session.auth.credentials){
    //         request.session.auth.credentials = {};
    //     }
    //     request.session.auth.credentials.token = oauth_token;
    //     request.session.auth.credentials.secret = oauth_token_secret;
    //
    //     // TODO: move to some config
    //     reply.redirect("https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=" + oauth_token + "&oauth_callback=" + oa._authorize_callback);
    // });

    var authURL = oa.getAuthorizeUrl({
        redirect_uri: this.config.callback,
        response_type: 'code'
    });

    reply.redirect(authURL);
};

Auth.prototype.setupMiddleware = function() {
    this.express.use(this.authenticateMiddleware.bind(this));
};

Auth.prototype.isTokenExpired = function(timestamp) {
    return (Math.round(((new Date() - new Date(timestamp)) % 86400000) / 3600000) >= 1);
};

Auth.prototype.getOAuth = function() {
    return new OAuth2(
        this.config.oauthKey,
        this.config.oauthSecret,
        'https://api.login.yahoo.com',
        '/oauth2/request_auth',
        '/oauth2/get_token',
        null
    );
};

exports = module.exports = Auth;
