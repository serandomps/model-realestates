var utils = require('utils');

var types = _.sortBy([
    {value: 'annex', label: 'Annex'},
    {value: 'apartment', label: 'Apartment'},
    {value: 'building', label: 'Building'},
    {value: 'house', label: 'House'},
    {value: 'land', label: 'Land'},
    {value: 'room', label: 'Room'}
], 'value');

var locations = function (realEstates, done) {
    realEstates.forEach(function (realEstate) {
        var tag = _.find(realEstate.tags, function (tag) {
            return tag.server && tag.group === 'location' && tag.name === 'city';
        });
        realEstate._.type = exports.type(realEstate.type);
        realEstate._.city = tag && tag.value;
    });
    done(null, realEstates);
};

var title = function (realestate) {
    if (realestate.title) {
        return realestate.title;
    }
    var suffix = function (title) {
        if (realestate.offer === 'sell') {
            return title + ' for Sale';
        }
        return title + ' for Rent';
    }
    if (realestate.type === 'annex') {
        return suffix(realestate.bedrooms + ' Bed Annex');
    }
    if (realestate.type === 'house') {
        return suffix(realestate.bedrooms + ' Bed, ' + realestate.floors + ' Story House');
    }
    if (realestate.type === 'land') {
        return suffix(realestate.extent + '<small>p</small> ' + (realestate.commercial ? 'Commercial' : 'Residential') + ' Land');
    }
    if (realestate.type === 'apartment') {
        return suffix(realestate.bedrooms + ' Bed Apartment');
    }
    if (realestate.type === 'building') {
        return suffix(realestate.area + '<small>ft<sup>2</sup></small> Building');
    }
    if (realestate.type === 'room') {
        return suffix(realestate.area + '<small>ft<sup>2</sup></small> Room');
    }
};

var update = function (realEstates, options, done) {
    realEstates.forEach(function (realEstate) {
        realEstate._ = {};
        realEstate._.title = title(realEstate);
        realEstate._[realEstate.type] = true;
        realEstate.description = (realEstate.description !== '<p><br></p>') ? realEstate.description : null;
    });
    utils.cdns(realEstates, function (err) {
        if (err) {
            return done(err);
        }
        locations(realEstates, function (err, realEstates) {
            if (err) {
                return done(err);
            }
            done(null, realEstates);
        });
    });
};

exports.findOne = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('apis:///v/realestates/' + options.id),
        dataType: 'json',
        success: function (data) {
            update([data], options, function (err, realEstates) {
                done(err, data);
            });
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.find = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('apis:///v/realestates' + utils.toData(options.query)),
        dataType: 'json',
        success: function (data, status, xhr) {
            update(data, options, function (err, data) {
                if (err) {
                    return done(err);
                }
                var o;
                var query;
                var links = utils.links(xhr.getResponseHeader('Link'));
                if (links.prev) {
                    o = utils.fromUrl(links.prev);
                    query = o.query;
                    links.prev = {
                        url: links.prev,
                        query: JSON.parse(query.data)
                    }
                }
                if (links.next) {
                    o = utils.fromUrl(links.next);
                    query = o.query;
                    links.next = {
                        url: links.next,
                        query: JSON.parse(query.data)
                    }
                }
                done(null, data, links);
            });
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.remove = function (options, done) {
    $.ajax({
        method: 'DELETE',
        url: utils.resolve('apis:///v/realestates/' + options.id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.create = function (options, done) {
    $.ajax({
        url: utils.resolve('apis:///v/realestates' + (options.id ? '/' + options.id : '')),
        type: options.id ? 'PUT' : 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(options),
        success: function (data) {
            update([data], options, function (err) {
                if (err) {
                    return done(err);
                }
                done(null, data);
            });
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};


exports.types = function () {
    return types;
};

exports.type = function (value) {
    var type = _.find(types, function (type) {
        return type.value === value;
    });
    return type.label;
};
