var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var RealEstate = require('../service');
var user = require('user');

var locations = require('model-locations');
var Locations = locations.service;

var contacts = require('model-contacts');
var Contacts = contacts.service;

var recent = require('../recent');

var redirect = serand.redirect;

var token;

dust.loadSource(dust.compile(require('./template'), 'model-realestates-findone'));
dust.loadSource(dust.compile(require('./actions'), 'model-realestates-findone-actions'));
dust.loadSource(dust.compile(require('./status'), 'model-realestates-findone-status'));
dust.loadSource(dust.compile(require('./details'), 'model-realestates-findone-details'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    RealEstate.findOne({id: options.id}, function (err, realEstate) {
        if (err) {
            return done(err);
        }
        async.parallel({
            location: function (found) {
                Locations.findOne({id: realEstate.location}, function (ignored, location) {
                    if (location) {
                        location.country = Locations.findCountry(location.country);
                    }
                    found(null, location);
                });
            },
            contact: function (found) {
                Contacts.findOne({id: realEstate.contact}, function (ignored, contact) {
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
            if (!realEstate._.location) {
                realEstate._.location = Locations.locateByTags(realEstate.tags);
            }
            if (token && token.user.id === realEstate.user) {
                realEstate._.edit = true;
                realEstate._.bumpable = utils.bumpable(realEstate);
            }
            realEstate._.bumped = (realEstate.createdAt !== realEstate.updatedAt);
            realEstate._.offer = (realEstate.offer === 'sell' ? 'sells' : 'rents');
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
                dust.render('model-realestates-findone', serand.pack(realEstate, container), function (err, out) {
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
                        location: realEstate._.location
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
                                if (action === 'edit') {
                                    redirect('/realestates/' + realEstate.id + '/edit');
                                    return false;
                                }
                                utils.transit('realestates', 'realestates', realEstate.id, action, function (err) {
                                    utils.loaded();
                                    if (err) {
                                        return console.error(err);
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
                                return false;
                            });
                            done(null, {
                                clean: function () {
                                    $('.model-realestates-findone', sandbox).remove();
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
                                            href: image.x800,
                                            thumbnail: image.x160
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
