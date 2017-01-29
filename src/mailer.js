var nodemailer = require('nodemailer');
var P = require('bluebird');
var sparkPostTransport = require('nodemailer-sparkpost-transport');

exports.send = function(data) {
    var transport = P.promisifyAll(nodemailer.createTransport(sparkPostTransport({
        sparkPostApiKey: process.env.SPARKPOST_API_KEY,
        options: {
            open_tracking: true,
            click_tracking: true
        },
        content: {
            template_id: data.template_id
        },
        recipients: data.recipients,
        substitution_data: data.substitution_data
    })));

    return transport.sendMailAsync({
        from: data.from
    });
}

