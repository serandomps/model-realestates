var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var RealEstate = require('../service');

dust.loadSource(dust.compile(require('./template'), 'realestates-model-find'));
dust.loadSource(dust.compile(require('./annex'), 'realestates-model-find-annex'));
dust.loadSource(dust.compile(require('./apartment'), 'realestates-model-find-apartment'));
dust.loadSource(dust.compile(require('./building'), 'realestates-model-find-building'));
dust.loadSource(dust.compile(require('./house'), 'realestates-model-find-house'));
dust.loadSource(dust.compile(require('./land'), 'realestates-model-find-land'));
dust.loadSource(dust.compile(require('./room'), 'realestates-model-find-room'));

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
        dust.render('realestates-model-find', serand.pack(o, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, function () {
                $('.realestates-model-find', sandbox).remove();
            });
        });
    });
};
