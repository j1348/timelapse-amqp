require('dotenv').config();
const sender = require('./src/sender');

sender.send(process.env.CLOUDAMQP_URL, 'subscribe', {
    username: process.env.USERNAME || 'username',
    email: process.env.EMAIL || 'username@domain.com',
    substitution_data: {
        subject: 'a simple subject',
        username: process.env.USERNAME || 'username',
        password: process.env.PASSWORD || '#password#',
    }
}).catch((err) => {
    console.log(err);
    console.error("unable to send message");
});
