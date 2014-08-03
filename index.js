var Boom = require('boom');
var Hoek = require('hoek');
var jwt  = require('jwt-simple');

function register (plugin, options, next) {
  plugin.auth.scheme('bearer-access-token', function (server, options) {

    Hoek.assert(options, 'Missing bearer auth strategy options');
    Hoek.assert(typeof options.validateFunc === 'function',
      'options.validateFunc must be a valid function in bearer scheme');

    var settings = Hoek.clone(options);

    var scheme = {
      authenticate: function authenticate (request, reply) {
        var req = request.raw.req;
        var authorization = req.headers.authorization;

        var token;
        var decoded;

        if (authorization !== undefined) {
          var parts = authorization.split(/\s+/);

          if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
            return reply(Boom.badRequest('Bad HTTP authentication header format', 'Bearer'));
          }

          token = parts[1];
        } else if (request.query.access_token) {
          token = request.query.access_token;

          delete request.query.access_token;
        } else {
          return reply(Boom.unauthorized('Must include a Bearer Token', 'Bearer'));
        }

        try {
          decoded = jwt.decode(token, settings.secret);
        } catch (err) {
          return reply(Boom.badRequest('Unable to decode Bearer Token', 'Bearer'));
        }

        settings.validateFunc(decoded, request, function (err, isValid, credentials) {
          if (err) {
            return reply(err, { credentials: credentials, log: { tags: ['auth', 'bearer'], data: err } });
          }

          if (!isValid) {
            return reply(Boom.unauthorized('Bad token', 'Bearer'), { credentials: credentials });
          }

          if (typeof credentials !== 'object') {
            return reply(Boom.badImplementation('Bad token string received for Bearer auth validation'), { log: { tags: 'token' } });
          }

          // Authenticated (must contain object with credentials property)
          return reply(null, { credentials: credentials });
        });
      }
    };

    return scheme;
  });

  next();
}


exports.register = register;
exports.register.attributes = {
    pkg: require('./package.json')
};
