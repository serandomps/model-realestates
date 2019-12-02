var list = require('../find');

module.exports = function (ctx, container, options, done) {
    options = options || {};
    list(ctx, container, {
        title: 'Recently Added',
        query: options.query,
        external: options.external,
        secondary: true,
        size: 12
    }, done);
};
