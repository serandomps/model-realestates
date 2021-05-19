var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');
var user = require('user');
var RealEstates = require('../service');
var Locations = require('model-locations').service;

var allProvinces = Locations.allProvinces();

dust.loadSource(dust.compile(require('./template'), 'model-realestates-filter'));

var findQuery = function (vform, done) {
    vform.find(function (err, data) {
        if (err) {
            return done(err);
        }
        vform.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            if (errors) {
                return vform.update(errors, data, done);
            }
            toAPIQuery(data, function (err, data) {
                if (err) {
                    return done(err);
                }
                done(null, data);
            });
        });
    });
};

var findDistricts = function (province, done) {
    if (!province) {
        return done(null, Locations.allDistricts());
    }
    return done(null, Locations.districtsByProvince(province));
};

var findCities = function (province, district, done) {
    if (district) {
        return done(null, Locations.citiesByDistrict(district));
    }
    if (province) {
        return done(null, Locations.citiesByProvince(province));
    }
    done(null, Locations.allCities());
};

var toAPIQuery = function (o, done) {
    var query = {};
    if (o.user) {
        query.user = o.user;
    }
    if (o.type) {
        query.type = o.type;
    }
    if (o.usage && o.usage.length) {
        o.usage.forEach(function (usage) {
            query[usage] = true;
        });
    }
    if (o.offer && o.offer.length) {
        query.offer = {
            $in: o.offer
        };
    }
    if (o['extent-gte']) {
        query.extent = query.extent || (query.extent = {});
        query.extent.$gte = o['extent-gte'];
    }
    if (o['extent-lte']) {
        query.extent = query.extent || (query.extent = {});
        query.extent.$lte = o['extent-lte'];
    }
    if (o['area-gte']) {
        query.area = query.area || (query.area = {});
        query.area.$gte = o['area-gte'];
    }
    if (o['area-lte']) {
        query.area = query.area || (query.area = {});
        query.area.$lte = o['area-lte'];
    }
    if (o['bedrooms-gte']) {
        query.bedrooms = query.bedrooms || (query.bedrooms = {});
        query.bedrooms.$gte = o['bedrooms-gte'];
    }
    if (o['bedrooms-lte']) {
        query.bedrooms = query.bedrooms || (query.bedrooms = {});
        query.bedrooms.$lte = o['bedrooms-lte'];
    }
    if (o['bathrooms-gte']) {
        query.bathrooms = query.bathrooms || (query.bathrooms = {});
        query.bathrooms.$gte = o['bathrooms-gte'];
    }
    if (o['bathrooms-lte']) {
        query.bathrooms = query.bathrooms || (query.bathrooms = {});
        query.bathrooms.$lte = o['bathrooms-lte'];
    }
    if (o['floors-gte']) {
        query.floors = query.floors || (query.floors = {});
        query.floors.$gte = o['floors-gte'];
    }
    if (o['floors-lte']) {
        query.floors = query.floors || (query.floors = {});
        query.floors.$lte = o['floors-lte'];
    }
    if (o['parking-gte']) {
        query.parking = query.parking || (query.parking = {});
        query.parking.$gte = o['parking-gte'];
    }
    if (o['parking-lte']) {
        query.parking = query.parking || (query.parking = {});
        query.parking.$lte = o['parking-lte'];
    }
    if (o['price-gte']) {
        query.price = query.price || (query.price = {});
        query.price.$gte = o['price-gte'];
    }
    if (o['price-lte']) {
        query.price = query.price || (query.price = {});
        query.price.$lte = o['price-lte'];
    }
    if (o['location-province']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({group: 'location', name: 'province', value: o['location-province']});
    }
    if (o['location-district']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({group: 'location', name: 'district', value: o['location-district']});
    }
    if (o['location-city']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({group: 'location', name: 'city', value: o['location-city']});
    }
    if (o['location-postal']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({group: 'location', name: 'postal', value: o['location-postal']});
    }
    done(null, query);
};

var fromURLQuery = function (query, done) {
    var o = {
        _: query._,
        user: query.user,
        type: query.type || ''
    };
    if (query.residential) {
        o.usage = o.usage || [];
        o.usage.push('residential');
    }
    if (query.commercial) {
        o.usage = o.usage || [];
        o.usage.push('commercial');
    }
    if (query.offer) {
        o.offer = query.offer.$in;
    }
    if (query.extent) {
        if (query.extent.$gte) {
            o['extent-gte'] = query.extent.$gte;
        }
        if (query.extent.$lte) {
            o['extent-lte'] = query.extent.$lte;
        }
    }
    if (query.area) {
        if (query.area.$gte) {
            o['area-gte'] = query.area.$gte;
        }
        if (query.area.$lte) {
            o['area-lte'] = query.area.$lte;
        }
    }
    if (query.bedrooms) {
        if (query.bedrooms.$gte) {
            o['bedrooms-gte'] = query.bedrooms.$gte;
        }
        if (query.bedrooms.$lte) {
            o['bedrooms-lte'] = query.bedrooms.$lte;
        }
    }
    if (query.bathrooms) {
        if (query.bathrooms.$gte) {
            o['bathrooms-gte'] = query.bathrooms.$gte;
        }
        if (query.bathrooms.$lte) {
            o['bathrooms-lte'] = query.bathrooms.$lte;
        }
    }
    if (query.floors) {
        if (query.floors.$gte) {
            o['floors-gte'] = query.floors.$gte;
        }
        if (query.floors.$lte) {
            o['floors-lte'] = query.floors.$lte;
        }
    }
    if (query.parking) {
        if (query.parking.$gte) {
            o['parking-gte'] = query.parking.$gte;
        }
        if (query.parking.$lte) {
            o['parking-lte'] = query.parking.$lte;
        }
    }
    if (query.price) {
        if (query.price.$gte) {
            o['price-gte'] = query.price.$gte;
        }
        if (query.price.$lte) {
            o['price-lte'] = query.price.$lte;
        }
    }
    var tags = query.tags || [];
    tags.forEach(function (tag) {
        var name = tag.name;
        if (tag.group !== 'location') {
            return;
        }
        o['location-' + name] = tag.value;
    });
    var key;
    var value;
    var oo = {};
    for (key in o) {
        if (!o.hasOwnProperty(key)) {
            continue;
        }
        value = o[key];
        if (!value) {
            continue;
        }
        oo[key] = o[key];
    }
    done(null, oo);
};

var redirect = function (ctx, query) {
    var q = utils.toQuery({
        query: query,
        count: 30
    });
    var path = '/realestates' + (q ? '?' + q : '');
    serand.redirect(path);
};

var configs = {
    user: {
        find: function (context, source, done) {
            done(null, context.user);
        },
        render: function (ctx, vform, data, value, done) {
            var context = {user: data.user};
            $('.user', vform.elem).on('click', '.exclude', function () {
                delete context.user;
                findQuery(vform, function (err, query) {
                    if (err) {
                        return console.error(err);
                    }
                    redirect(ctx, query);
                });
            });
            done(null, context);
        }
    },
    type: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.type', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    offer: {
        find: function (context, source, done) {
            serand.blocks('radios', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.offer', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    usage: {
        find: function (context, source, done) {
            serand.blocks('radios', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.usage', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'extent-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.extent-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'extent-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.extent-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'area-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.area-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'area-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.area-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'bedrooms-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.bedrooms-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'bedrooms-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.bedrooms-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'bathrooms-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.bathrooms-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'bathrooms-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.bathrooms-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'floors-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.floors-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'floors-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.floors-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'parking-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.parking-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'parking-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.parking-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'price-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.price-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'price-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.price-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'location-province': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, function (err, province) {
                if (err) {
                    return done(err);
                }
                done(null, province);
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-province', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    serand.blocks('select', 'update', $('.location-district', vform.elem), {
                        value: ''
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        serand.blocks('select', 'update', $('.location-city', vform.elem), {
                            value: ''
                        }, function (err) {
                            if (err) {
                                return done(err);
                            }
                            serand.blocks('select', 'update', $('.location-postal', vform.elem), {
                                value: ''
                            }, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                findQuery(vform, function (err, query) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    redirect(ctx, query);
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-district': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-district', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-district', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var province = Locations.provinceByDistrict(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            serand.blocks('select', 'update', $('.location-city', vform.elem), {
                                value: ''
                            }, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                serand.blocks('select', 'update', $('.location-postal', vform.elem), {
                                    value: ''
                                }, function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-city': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-city', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-city', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var city = Locations.findCity(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: city.province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            var districtSource = $('.location-district', vform.elem);
                            serand.blocks('select', 'update', districtSource, {
                                value: city.district
                            }, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                var postalSource = $('.location-postal', vform.elem);
                                serand.blocks('select', 'update', postalSource, {
                                    value: city.postal
                                }, function (err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-postal': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-postal', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-postal', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var city = Locations.cityByPostal(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: city.province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            var districtSource = $('.location-district', vform.elem);
                            serand.blocks('select', 'update', districtSource, {
                                value: city.district
                            }, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                var citySource = $('.location-city', vform.elem);
                                serand.blocks('select', 'update', citySource, {
                                    value: city.name
                                }, function (err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    }
};

var findUser = function (usr, done) {
    if (!usr) {
        return done();
    }
    user.findOne(usr, done);
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    options = options || {};

    fromURLQuery(_.cloneDeep(options.query) || {}, function (err, query) {
        if (err) {
            return done(err);
        }
        query._ = query._ || (query._ = {});

        findUser(query.user, function (err, user) {
            if (err) {
                return done(err);
            }
            query._.user = user;
            query._.container = container.id;
            query._.offer = [
                {label: 'Sell', value: 'sell'},
                {label: 'Rent', value: 'rent'}
            ];
            query._.usage = [
                {label: 'Residential', value: 'residential'},
                {label: 'Commercial', value: 'commercial'}
            ];

            query._.types = [{label: 'Any Type', value: ''}].concat(RealEstates.types());

            var provinces = [{label: 'Any Province', value: ''}];
            query._.provinces = provinces.concat(_.map(allProvinces, function (province) {
                return {
                    label: province,
                    value: province
                };
            }));
            findDistricts(query['location-province'], function (err, districts) {
                if (err) {
                    return done(err);
                }
                var districtsData = [{label: 'Any District', value: ''}];
                query._.districts = districtsData.concat(_.map(districts, function (district) {
                    return {
                        label: district,
                        value: district
                    };
                }));
                findCities(query['location-province'], query['location-district'], function (err, cities) {
                    if (err) {
                        return done(err);
                    }
                    var citiesData = [{label: 'Any City', value: ''}];
                    var postalsData = [{label: 'Any Postal Code', value: ''}];
                    query._.cities = citiesData.concat(_.map(cities, function (city) {
                        return {
                            label: city.name,
                            value: city.name
                        };
                    }));
                    query._.postals = postalsData.concat(_.map(cities, function (city) {
                        return {
                            label: city.postal,
                            value: city.postal
                        }
                    }));

                    dust.render('model-realestates-filter', serand.pack(query, container), function (err, out) {
                        if (err) {
                            return done(err);
                        }

                        var elem = sandbox.append(out);
                        var vform = form.create(container.id, elem, configs);

                        vform.render(ctx, query, function (err) {
                            if (err) {
                                return done(err);
                            }
                            done(null, function () {
                                $('.model-realestates-filter', sandbox).remove();
                            });
                        });
                    });
                });
            });
        });
    });
};
