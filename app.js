require('dotenv').config();
const jwt = require('jsonwebtoken');
const mailer = require("./src/mailer");
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

function processData(body) {
    return {
        from: 'Timelapse <me@jfroffice.me>',
        to: body.email,
        template_id: "my-nice-template",
        substitution_data: {
            subject: 'a simple subject',
            username: body.username,
            password: body.password,
            verifyURL: process.env.API_URL + body.verifyURL
        },
        recipients: [{
            address: {
                email: body.email,
                name: body.username
            }
        }]
    };
}

function whenConnected() {
    worker('subscribe');
}

function worker(queueName) {
    return amqpConn.createChannel().then(function(ch) {
        function doWork(msg) {
            const body = JSON.parse(msg.content.toString());
            const data = processData(body);

            mailer.send(data)
                .then(function(response) {
                    console.log(response);
                    console.log(" [x] Done");
                    ch.ack(msg);
                })
                .catch(function(err) {
                    console.log('failed to deliver email to ' + body.email);
                    /*console.log(err);*/
                    ch.nack(msg, false, false);
                });
        }

        return ch.assertQueue(queueName, {
            durable: true
        }).then(function() {
            ch.prefetch(1);
        }).then(function() {
            ch.consume(queueName, doWork, {
                noAck: false
            });
            console.log(" [*] Waiting for messages. To exit press CTRL+C");
        });
    });
}

start();
