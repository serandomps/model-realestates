var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var RealEstate = require('../service');
var user = require('user');

var locations = require('locations');
var Locations = locations.service;

var recent = require('../recent');

var redirect = serand.redirect;

var token;

dust.loadSource(dust.compile(require('./template'), 'realestates-model-findone'));
dust.loadSource(dust.compile(require('./actions'), 'realestates-model-findone-actions'));
dust.loadSource(dust.compile(require('./status'), 'realestates-model-findone-status'));
dust.loadSource(dust.compile(require('./details'), 'realestates-model-findone-details'));
dust.loadSource(dust.compile(require('./annex'), 'realestates-model-findone-annex'));
dust.loadSource(dust.compile(require('./apartment'), 'realestates-model-findone-apartment'));
dust.loadSource(dust.compile(require('./building'), 'realestates-model-findone-building'));
dust.loadSource(dust.compile(require('./house'), 'realestates-model-findone-house'));
dust.loadSource(dust.compile(require('./land'), 'realestates-model-findone-land'));
dust.loadSource(dust.compile(require('./room'), 'realestates-model-findone-room'));

var findLocation = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/locations/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

var findContact = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    RealEstate.findOne({id: options.id, resolution: '800x450'}, function (err, realEstate) {
        if (err) {
            return done(err);
        }
        async.parallel({
            location: function (found) {
                findLocation(realEstate.location, function (ignored, location) {
                    if (location) {
                        location.country = Locations.findCountry(location.country);
                    }
                    found(null, location);
                });
            },
            contact: function (found) {
                findContact(realEstate.contact, function (ignored, contact) {
                    found(null, contact);
                });
            },
            user: function (found) {
                user.findOne(realEstate.user, found);
            }
        }, function (err, o) {
            if (err) {
                return done(err);
            }
            realEstate._.privileged = options.privileged;
            realEstate._.user = o.user;
            realEstate._.contact = o.contact;
            realEstate._.location = o.location;
            if (token && token.user.id === realEstate.user) {
                realEstate._.edit = true;
                realEstate._.bumpable = utils.bumpable(realEstate);
            }
            realEstate._.bumped = (realEstate.createdAt !== realEstate.updatedAt);
            realEstate._.offer = utils.capitalize(realEstate.type) + ' for ' + (realEstate.offer === 'sell' ? 'Sale' : 'Rent');
            utils.workflow('model', function (err, workflow) {
                if (err) {
                    return done(err);
                }
                var transitions = workflow.transitions[realEstate.status];
                var status = _.filter(Object.keys(transitions), function (action) {
                    return utils.permitted(ctx.user, realEstate, action);
                });
                realEstate._.status = status.length ? status : null;
                realEstate._.editing = (realEstate.status === 'editing');
                dust.render('realestates-model-findone', serand.pack(realEstate, container), function (err, out) {
                    if (err) {
                        return done(err);
                    }
                    var elem = sandbox.append(out);
                    locations.findone(ctx, {
                        id: container.id,
                        sandbox: $('.location', elem),
                        parent: elem
                    }, {
                        required: true,
                        label: 'Location of the real estate',
                        id: realEstate.location
                    }, function (ignored, o) {
                        recent(ctx, {
                            id: container.id,
                            sandbox: $('.recent', elem)
                        }, {}, function (err, o) {
                            if (err) {
                                return done(err);
                            }
                            elem.on('click', '.status-buttons .dropdown-item', function () {
                                utils.loading();
                                var action = $(this).data('action');
                                utils.transit('realestates', 'realestates', realEstate.id, action, function (err) {
                                    utils.loaded();
                                    if (err) {
                                        return console.error(err);
                                    }
                                    if (action === 'edit') {
                                        return redirect('/realestates/' + realEstate.id + '/edit');
                                    }
                                    redirect('/realestates/' + realEstate.id);
                                });
                                return false;
                            });
                            elem.on('click', '.bumpup', function () {
                                utils.loading();
                                utils.bumpup('realestates', 'realestates', realEstate.id, function (err) {
                                    utils.loaded();
                                    if (err) {
                                        return console.error(err);
                                    }
                                    redirect('/realestates/' + realEstate.id);
                                });
                            });
                            done(null, {
                                clean: function () {
                                    $('.realestates-model-findone', sandbox).remove();
                                },
                                ready: function () {
                                    var i;
                                    var o = [];
                                    var images = realEstate._.images;
                                    var length = images.length;
                                    var image;
                                    for (i = 0; i < length; i++) {
                                        image = images[i];
                                        o.push({
                                            href: image.url,
                                            thumbnail: image.url
                                        });
                                    }
                                    blueimp.Gallery(o, {
                                        container: $('.blueimp-gallery-carousel', sandbox),
                                        carousel: true,
                                        thumbnailIndicators: true,
                                        stretchImages: true
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};

utils.on('user', 'ready', function (tk) {
    token = tk;
});

utils.on('user', 'logged in', function (tk) {
    token = tk;
});

utils.on('user', 'logged out', function (tk) {
    token = null;
});
