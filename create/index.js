var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');
var locations = require('model-locations');
var contacts = require('model-contacts');
var Contacts = contacts.service;
var RealEstates = require('../service');

dust.loadSource(dust.compile(require('./template'), 'model-realestates-create'));

var resolution = '288x162';

var realEstateConfigs = {
    type: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the type of your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.type', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value
            }, done);
        }
    },
    title: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, null, null);
            }
            if (value.length > 100) {
                return done(null, 'Please enter a shorter value for the title of your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    offer: {
        find: function (context, source, done) {
            done(null, $('input:checked', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the offering type of your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.offer', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value
            }, done);
        }
    },
    usage: {
        find: function (context, source, done) {
            serand.blocks('radios', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value || !value.length) {
                return done(null, 'Please select the usage type of your real estate.');
            }
            done(null, null, value);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.usage', vform.elem);
            var usage = [];
            if (data.residential) {
                usage.push('residential');
            }
            if (data.commercial) {
                usage.push('commercial');
            }
            delete data.residential;
            delete data.commercial;
            serand.blocks('radios', 'create', el, {
                value: usage
            }, done);
        },
        create: function (context, data, value, done) {
            var usage = data.usage;
            data.residential = null;
            data.commercial = null;
            usage.forEach(function (use) {
                data[use] = true;
            });
            delete data.usage;
            done();
        }
    },
    extent: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (data.area) {
                    return done();
                }
                return done(null, 'Please enter at least the extent or the area of your real estate.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the extent of your land.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    area: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (data.extent) {
                    return done();
                }
                return done(null, 'Please enter at least the extent or the area of your real estate.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the area of your land.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    floors: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (['annex', 'apartment', 'house', 'building'].indexOf(data.type) !== -1) {
                    return done(null, 'Please enter the number of floors in your building.');
                }
                return done();
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the number of floors in your building.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    bedrooms: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (['annex', 'apartment', 'house'].indexOf(data.type) !== -1) {
                    return done(null, 'Please enter the number of bedrooms in your building.');
                }
                return done();
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the number of bedrooms in your building.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    bathrooms: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (['annex', 'apartment', 'house', 'room'].indexOf(data.type) !== -1) {
                    return done(null, 'Please enter the number of bathrooms in your building.');
                }
                return done();
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the number of bathrooms in your building.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    parking: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                if (['annex', 'apartment', 'house', 'building', 'room'].indexOf(data.type) !== -1) {
                    return done(null, 'Please enter the number of parking slots available in your real estate.');
                }
                return done();
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the number of parking slots in your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    price: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the price of your real estate.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid amount for the price of your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    currency: {
        find: function (context, source, done) {
            done(null, 'LKR');
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        }
    },
    description: {
        find: function (context, source, done) {
            done(null, $('textarea', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, null, value);
            }
            if (value.length < 5000) {
                return done(null, null, value);
            }
            done(null, 'Please make sure the description does not exceed 5000 characters.')
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.description', vform.elem);
            serand.blocks('textarea', 'create', el, {
                value: value
            }, done);
        },
        ready: function (context, source, done) {
            serand.blocks('textarea', 'ready', source, done);
        }
    },
    images: {
        find: function (context, source, done) {
            serand.blocks('uploads', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value || !value.length) {
                return done(null, 'Please upload images of your real estate.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.images', vform.elem);
            serand.blocks('uploads', 'create', el, {
                value: value,
                max: 5,
                min: 1
            }, done);
        }
    }
};

var findContact = function (id, contact, done) {
    if (contact) {
        return done(null, contact);
    }
    Contacts.findOne({id: id}, done);
};

var create = function (data, location, contact, done) {
    utils.loading();
    var end = function (err, data) {
        utils.loaded();
        done(err, data);
    };
    RealEstates.create(data, function (err, data) {
        if (err) {
            return end(err);
        }
        if (contact) {
            return end(null, data);
        }
        utils.transit('realestates', 'realestates', data.id, 'review', function (err) {
            if (err) {
                return end(err);
            }
            end(null, data);
        });
    });
};

var remove = function (id, done) {
    RealEstates.remove({id: id}, done);
};

var stepHandler = function (handler, done) {
    handler.find(function (err, o) {
        if (err) {
            return done(err);
        }
        handler.validate(o, function (err, errors, o) {
            if (err) {
                return done(err);
            }
            handler.update(errors, o, function (err) {
                if (err) {
                    return done(err);
                }
                if (errors) {
                    return done(null, errors);
                }
                done(null, null, o);
            });
        });
    });
};

var createHandler = function (handler, done) {
    stepHandler(handler, function (err, errors, o) {
        if (err) {
            return done(err);
        }
        if (errors) {
            return done(null, errors);
        }
        handler.create(o, done);
    })
};

var render = function (ctx, container, data, done) {
    var id = data.id;
    var sandbox = container.sandbox;
    data._ = data._ || {};
    data._.types = [
        {label: 'Annex', value: 'annex'},
        {label: 'Apartment', value: 'apartment'},
        {label: 'Building', value: 'building'},
        {label: 'House', value: 'house'},
        {label: 'Land', value: 'land'},
        {label: 'Room', value: 'room'}
    ];
    data._.offer = [
        {label: 'Sell', value: 'sell'},
        {label: 'Rent', value: 'rent'}
    ];
    data._.usage = [
        {label: 'Commercial', value: 'commercial'},
        {label: 'Residential', value: 'residential'}
    ];
    data._.back = '/realestates' + (id ? '/' + id : '');
    dust.render('model-realestates-create', data, function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var handlers = {};
        var realEstateForm = form.create(container.id, $('.tab-pane[data-name="realestate"] .step', elem), realEstateConfigs);
        handlers.realestate = realEstateForm;
        realEstateForm.render(ctx, data, function (err) {
            if (err) {
                return done(err);
            }
            locations.picker(ctx, {
                id: container.id,
                sandbox: $('.tab-pane[data-name="location"] .step', elem)
            }, {
                expand: true,
                creatable: true,
                required: true,
                label: 'Location',
                location: data.location
            }, function (err, o) {
                if (err) {
                    return done(err);
                }
                handlers.location = o;

                contacts.picker(ctx, {
                    id: container.id,
                    sandbox: $('.tab-pane[data-name="contact"] .step', elem)
                }, {
                    expand: true,
                    creatable: true,
                    required: true,
                    label: 'Contacts',
                    contact: data.contact
                }, function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    handlers.contact = o;

                    serand.blocks('steps', 'create', elem, {
                        step: function (from, done) {
                            stepHandler(handlers[from], done);
                        },
                        create: function (elem) {
                            createHandler(handlers.realestate, function (err, errors, realEstate) {
                                if (err) {
                                    return console.error(err);
                                }
                                if (errors) {
                                    return;
                                }
                                realEstate.id = realEstate.id || id;
                                createHandler(handlers.location, function (err, errors, lid, location) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    if (errors) {
                                        return;
                                    }
                                    realEstate.location = lid;
                                    createHandler(handlers.contact, function (err, errors, cid, contact) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        if (errors) {
                                            return;
                                        }
                                        realEstate.contact = cid;
                                        findContact(cid, contact, function (err, contact) {
                                            if (err) {
                                                return console.error(err);
                                            }
                                            create(realEstate, location, contact,function (err, realEstate) {
                                                if (err) {
                                                    return console.error(err);
                                                }
                                                if (contact.status === 'published') {
                                                    return serand.redirect('/realestates/' + realEstate.id);
                                                }
                                                var location = utils.resolve('realestates:///realestates/' + realEstate.id);
                                                var url = utils.query('accounts:///contacts/' + cid + '/verify', {
                                                    location: location
                                                });
                                                serand.redirect(url);
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        $('.delete', elem).click(function (e) {
                            e.stopPropagation();
                            remove(id, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                console.log('data deleted successfully');
                            });
                            return false;
                        });
                        done(null, {
                            clean: function () {
                                $('.model-realestates-create', sandbox).remove();
                            },
                            ready: function () {
                                realEstateForm.ready(ctx, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    });
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    var id = options.id;
    if (!id) {
        render(ctx, container, serand.pack({}, container), done);
        return;
    }
    RealEstates.findOne({
        id: id,
        resolution: resolution
    }, function (err, realEstate) {
        if (err) {
            return done(err);
        }
        render(ctx, container, serand.pack(realEstate, container), done);
    });
};
