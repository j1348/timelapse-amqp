require('dotenv').config();
const amqp = require('amqplib');
let amqpConn = null;

function start() {
    amqp.connect(process.env.CLOUDAMQP_URL)
      .then((conn) => {
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
      })
      .catch(() => {
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
      var body = msg.content.toString();
      console.log(" [x] Received '%s'", body);
      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg);
      }, 100);
    }

    return ch
      .assertQueue(queueName, {durable: true})
      .then(function() { ch.prefetch(1); })
      .then(function() {
        ch.consume(queueName, doWork, {noAck: false});
        console.log(" [*] Waiting for messages. To exit press CTRL+C");
      });
  });
}

start();
