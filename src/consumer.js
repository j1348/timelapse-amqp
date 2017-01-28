require('dotenv').config();
const mailer = require("./mailer");
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
        });
        console.log("[AMQP] connected");
        amqpConn = conn;
        whenConnected();
    }).catch(() => {
        console.error("[AMQP]", err.message);
        return setTimeout(start, 1000);
    });
}

function whenConnected() {
    console.log('whenConnected');
    worker('subscribe');
}

function worker(queueName) {
    return amqpConn.createChannel().then(function(ch) {
        function doWork(msg) {
            const body = JSON.parse(msg.content.toString());
            const data = {
                from: 'Timelapse <me@jfroffice.me>',
                to: body.email,
                template_id: "my-nice-template",
                substitution_data: body.substitution_data,
                recipients: [{
                    address: {
                        email: body.email,
                        name: body.username
                    }
                }]
            };
            console.log(data);

            mailer.send(data)
                .then(function(response) {
                    console.log(response);
                    console.log(" [x] Done");
                    ch.ack(msg);
                })
                .catch(function(err) {
                    console.log('mailer.send(..).catch');
                    console.log(err);
                });
        }

        return ch.assertQueue(queueName, {
            durable: true
        }).then(function() {
            ch.prefetch(1);
        }).then(function() {
            ch.consume(queueName, doWork, { noAck: false });
            console.log(" [*] Waiting for messages. To exit press CTRL+C");
        });
    });
}

start();
