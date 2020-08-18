var messages = require('model-messages');

var RealEstates = require('../service');

module.exports = function (ctx, container, options, done) {
    RealEstates.findOne({id: options.about}, function (err, realestate) {
        if (err) {
            return done(err);
        }
        messages.create(ctx, container, {
            about: realestate
        }, done);
    });
};
