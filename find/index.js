var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var RealEstate = require('../service');

dust.loadSource(dust.compile(require('./template'), 'model-realestates-find'));
dust.loadSource(dust.compile(require('./annex'), 'model-realestates-find-annex'));
dust.loadSource(dust.compile(require('./apartment'), 'model-realestates-find-apartment'));
dust.loadSource(dust.compile(require('./building'), 'model-realestates-find-building'));
dust.loadSource(dust.compile(require('./house'), 'model-realestates-find-house'));
dust.loadSource(dust.compile(require('./land'), 'model-realestates-find-land'));
dust.loadSource(dust.compile(require('./room'), 'model-realestates-find-room'));

var fetch = function (options, done) {
    if (options.realestates) {
        return done(null, options);
    }
    var o = _.cloneDeep(options);
    o.resolution = o.resolution || '288x162';
    o.prefix = utils.resolve('realestates:///realestates');
    RealEstate.find(o, function (err, realestates) {
        if (err) {
            return done(err);
        }
        o.realestates = realestates;
        done(null, o);
    });
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    fetch(options, function (err, o) {
        if (err) {
            return done(err);
        }
        dust.render('model-realestates-find', serand.pack(o, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, function () {
                $('.model-realestates-find', sandbox).remove();
            });
        });
    });
};
