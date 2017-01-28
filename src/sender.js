require('dotenv').config();
const amqp = require('amqplib');
let amqpConn = null;

function start() {
    amqp.connect(process.env.CLOUDAMQP_URL).then((conn) => {
        conn.on("error", function(err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function() {
            console.error("[AMQP] close connection");
            //return setTimeout(start, 1000);
        });
        console.log("[AMQP] connected");
        amqpConn = conn;
        whenConnected();
    }).catch((err) => {
        console.error("[AMQP]", err.message);
        return setTimeout(start, 1000);
    });
}

function whenConnected() {
    console.log('whenConnected');
    send('subscribe', {
        username: process.env.USERNAME || 'username',
        email: process.env.EMAIL || 'username@domain.com',
        substitution_data: {
          subject: 'A subject of Matter!',
          username: process.env.USERNAME || 'username',
          password: process.env.PASSWORD || '#password#',
        }
    });
}

function send(queueName, data) {
    amqpConn.createChannel().then(function(ch) {
        var msg = JSON.stringify(data);
        console.log(msg);
        return ch
          .assertQueue(queueName, { durable: true })
          .then(function(_qok) {
            // NB: `sentToQueue` and `publish` both return a boolean
            // indicating whether it's OK to send again straight away, or
            // (when `false`) that you should wait for the event `'drain'`
            // to fire before writing again. We're just doing the one write,
            // so we'll ignore it.
            ch.sendToQueue(queueName, new Buffer(msg));
            console.log(" [x] Sent '%s'", msg);
            return ch.close();
          });
    }).finally(function() {
        amqpConn.close();
    });
}
start();
