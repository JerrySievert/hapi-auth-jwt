# Hapi JWT Bearer Token

[![Build Status](https://travis-ci.org/jerrysievert/hapi-auth-jwt.svg?branch=master)](https://travis-ci.org/jerrysievert/hapi-auth-jwt)

[Hapi](https://github.com/spumko/hapi) Bearer and JWT Authentication

Bearer authentication requires validating a token passed in by either the bearer authorization header, or by an access_token query parameter. The `'bearer-access-token'` scheme takes the following options:

- `validateFunc` - (required) a token lookup and validation function with the signature `function (token, request, callback)` where:
    - `token` - the decoded and authenticated JSON Web Token.
    - `request` - the request object.
    - `callback` - a callback function with the signature `function (err, isValid, credentials)` where:
        - `err` - an internal error.
        - `isValid` - `true` if access is to be granted, otherwise `false`.
        - `credentials` - a credentials object passed back to the application in `request.auth.credentials`. Typically, `credentials` are only
          included when `isValid` is `true`, but there are cases when the application needs to know who tried to authenticate even when it fails
          (e.g. with authentication mode `'try'`).
- `secret` - (required) the secret for decoding the JWT Bearer Token

```javascript
var Hapi = require('hapi');

var server = Hapi.createServer('localhost', 8080, {
  cors: true
});

server.pack.register(require('hapi-auth-jwt'), function (err) {
  server.auth.strategy('simple', 'bearer-access-token', {
    validateFunc: function (token, request, callback) {
      if (token.username === "valid user"){
        callback(null, true, { token: token })
      } else {
        callback(null, false, { token: token })
      }
    },
    secret: "mysecret"
  });

  server.route({ method: 'GET', path: '/', config: { auth: 'simple' } });

  server.start(function () {
    console.log('Server started at: ' + server.info.uri);
  });
});
```