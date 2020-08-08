var Vehicle = require('../service');
var find = require('../find');
var user = require('user');
var serand = require('serand');
var utils = require('utils');

var hooks = {
    'query.residential': function (val) {
        return val === 'true';
    },
    'query.commercial': function (val) {
        return val === 'true';
    },
    'query.extent.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.extent.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.area.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.area.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.bedrooms.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.bedrooms.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.bathrooms.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.bathrooms.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.floors.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.floors.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.parking.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.parking.$gte': function (val) {
        return parseInt(val, 10);
    },
    'query.price.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.price.$gte': function (val) {
        return parseInt(val, 10);
    },
    'count': function (val) {
        return parseInt(val, 10);
    },
    'direction': function (val) {
        return parseInt(val, 10);
    },
    'sort.updatedAt': function (val) {
        return parseInt(val, 10);
    },
    'sort.id': function (val) {
        return parseInt(val, 10);
    }
};

var prepare = function (o) {
    Object.keys(hooks).forEach(function (path) {
        var val;
        var part;
        var hook = hooks[path];
        var parts = path.split('.');
        var pointer = o;
        while (parts.length) {
            part = parts.shift();
            val = pointer[part];
            if (!val) {
                break;
            }
            if (!parts.length) {
                pointer[part] = hook(val);
                break;
            }
            pointer = val;
        }
    });
    return o;
};


var render = function (ctx, container, paging, query, page, done) {
    Vehicle.find({
        query: prepare(query),
        resolution: '288x162'
    }, function (err, realestates, links) {
        if (err) {
            return done(err);
        }
        var pageBox = $('<div class="model-realestates-search-page" data-page="' + page + '"></div>');
        find(ctx, {
            id: container.id,
            sandbox: pageBox
        }, {
            prefix: paging.prefix,
            realestates: realestates,
            size: 4
        }, function (err, clean) {
            if (err) {
                return done(err);
            }
            if (paging.active > page) {
                container.sandbox.prepend(pageBox);
            } else {
                container.sandbox.append(pageBox);
            }
            paging.queries[page] = query;
            utils.emit('footer', 'pages', paging.end, findActivePage(container));
            done(null, clean, links);
        });
    });
};

var findActivePage = function (container) {
    var page = $('.model-realestates-search-page', container.sandbox).mostVisible().data('page');
    if (!page) {
        return 0;
    }
    return parseInt(page, 10);
};

var findActiveQuery = function (paging) {
    return paging.queries[paging.active];
}

var pushState = function (ctx, container, paging) {
    var q = utils.toData(findActiveQuery(paging)) + '&page=' + paging.active;
    utils.pushState(paging.prefix + q, $(document).find('title').text(), {
        path: paging.path + q,
        backed: true
    });
};

module.exports = function (ctx, container, options, done) {
    var loadable = options.loadable;
    var cleaners = [];
    var query = options.query;
    var page = query.page ? parseInt(query.page, 10) : 1;
    var q = query.data ? JSON.parse(query.data) : query;
    var path = '/realestates';
    var prefix = utils.resolve('realestates://' + path);
    var paging = {
        path: path,
        prefix: prefix,
        queries: {},
        start: page,
        end: page,
        active: page
    };
    render(ctx, container, paging, q, page, function (err, clean, links) {
        if (err) {
            return done(err);
        }
        if (!loadable) {
            return done(null, clean);
        }
        cleaners.push(clean);

        paging.next = links.next;
        paging.prev = links.prev;

        var scrolled = function (o) {
            var active = findActivePage(container);
            if (active === paging.active) {
                return;
            }
            paging.active = active;
            pushState(ctx, container, paging);
            utils.emit('footer', 'pages', paging.end, active);
        };

        var scrolledDown = function () {
            if (paging.pending || !paging.next) {
                return;
            }
            paging.pending = true;
            paging.end++;
            render(ctx, container, paging, paging.next.query, paging.end, function (err, clean, linkz) {
                if (err) {
                    return console.error(err);
                }
                paging.pending = false;
                cleaners.push(clean);
                paging.next = linkz.next;
                paging.prev = linkz.prev ? paging.prev : null;
            });
        };

        var scrollBuffer = function () {
            if (!paging.prev) {
                return;
            }
            setTimeout(function () {
                $('html, body').animate({scrollTop: 100});
            }, 0);
        };

        var scrolledUp = function () {
            if (paging.pending || !paging.prev || paging.start === 1) {
                return;
            }

            paging.pending = true;
            paging.start--;
            render(ctx, container, paging, paging.prev.query, paging.start, function (err, clean, linkz) {
                if (err) {
                    return console.error(err);
                }
                paging.pending = false;
                cleaners.push(clean);
                links = linkz;
                paging.next = links.next ? paging.next : null;
                paging.prev = links.prev;
                scrollBuffer();
            });
        };

        done(null, {
            clean: function () {
                utils.off('serand', 'scrolled', scrolled);
                utils.off('serand', 'scrolled down', scrolledDown);
                utils.off('serand', 'scrolled up', scrolledUp);
                cleaners.forEach(function (clean) {
                    clean();
                });
            },
            ready: function () {
                utils.on('serand', 'scrolled', scrolled);
                utils.on('serand', 'scrolled down', scrolledDown);
                utils.on('serand', 'scrolled up', scrolledUp);
                if (paging.end > 1) {
                    utils.emit('footer', 'pages', paging.end, paging.active);
                }
                if (ctx.state.backed && !paging.backed) {
                    paging.backed = true;
                    scrollBuffer();
                }
            }
        });
    });
};
