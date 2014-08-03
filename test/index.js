var Lab = require('lab');
var Hapi = require('hapi');
var jwt = require('jwt-simple');


var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;

const GOODSECRET = 'good';
const BADSECRET = 'bad';

describe('Bearer', function ( ) {
  var basicHandler = function (request, reply) {
    reply('ok');
  };

  var server = new Hapi.Server({ debug: false });

  before(function (done) {
    server.pack.register(require('../'), function (err) {
      expect(err).to.not.exist;

      server.auth.strategy('default', 'bearer-access-token', true, {
        validateFunc: function(decoded, request, callback) {
          if (decoded.error) {
            callback(decoded.error);
          } else if (decoded.credentials === false) {
            console.log("no credentials");
            callback(null, decoded.auth);
          } else {
            callback(null, decoded.auth,  { token: decoded });
          }
        },
        secret: GOODSECRET
      });

      server.route([
        { method: 'POST', path: '/basic', handler: basicHandler, config: { auth: 'default' } },
        { method: 'POST', path: '/basic_default_auth', handler: basicHandler, config: { } }
      ]);

      done();
    });
  });

  it('returns a reply on successful auth with correct bearer token', function (done) {
    var token = jwt.encode({ auth: true }, GOODSECRET);

    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer " + token } };

    server.inject(request, function (res) {
      expect(res.result).to.exist;
      expect(res.result).to.equal('ok');
      done();
    });
  });

  it('returns a reply on successful auth with access_token set', function (done) {
    var token = jwt.encode({ auth: true }, GOODSECRET);

    var request = { method: 'POST', url: '/basic?access_token=' + token };

    server.inject(request, function (res) {
      expect(res.result).to.exist;
      expect(res.result).to.equal('ok');
      done();
    });
  });

  it('returns an error when auth is set to required by default', function (done) {
    var request = { method: 'POST', url: '/basic_default_auth' };

    server.inject(request, function (res) {
      expect(res.result).to.exist;
      expect(res.statusCode).to.equal(401);
      done();
    });
  });

  it('returns an error when an incorrect secret is used to encode the token', function (done) {
    var token = jwt.encode({ auth: true }, BADSECRET);

    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer " + token } };

    server.inject(request, function (res) {
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  it('returns an error when an incomplete token is sent', function (done) {
    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer" } };

    server.inject(request, function (res) {
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  it('returns an error when auth is invalid', function (done) {
    var token = jwt.encode({ auth: false }, GOODSECRET);

    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer " + token } };

    server.inject(request, function (res) {
      expect(res.statusCode).to.equal(401);
      done();
    });
  });

  it('returns an error when an error is detected', function (done) {
    var token = jwt.encode({ auth: false, error: 'some error' }, GOODSECRET);

    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer " + token } };

    server.inject(request, function (res) {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  it('returns an error credentials are not returned', function (done) {
    var token = jwt.encode({ auth: true, credentials: false }, GOODSECRET);

    var request = { method: 'POST', url: '/basic', headers: { authorization: "Bearer " + token } };

    server.inject(request, function (res) {
      expect(res.statusCode).to.equal(500);
      done();
    });
  });

});
