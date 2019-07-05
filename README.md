# heartbeatclient

This application is an internal project for [Increaseo](https://www.increaseo.com/). 
Thanks to this applcation, we can get the response time of every website manage by Increaseo.<br>
![Increaseo](https://media.licdn.com/dms/image/C510BAQHhgvihBsFNjA/company-logo_200_200/0?e=2159024400&v=beta&t=MkOLX3NblHZ5BcWoda_UK2SzAWsy6P1xPLrz11hfEqg)


## Getting Started


### Installation

First of all create a git repository on your computer : 
``` 
>  mkdir heartbeatclient
>  cd heartbeatclient 
>  git init
```

It's almost done, you just have to clone the project : 
```
>  git clone https://github.com/increaseo/heartbeatclient.git
```


### Running Project

Last step, to run the application, you've to use these commands:
```
>  cd heartbeatclient
>  npm install mysql
>  npm install ping-monitor
>  npm install nodemailer
>  npm install nexmo
>  npm install moment
>  npm install moment-timezone
>  node Check_time.js
```
Well done! now you can use the application.


## Build With
* [Node.js](https://nodejs.org/en/)
    * [MySQL](https://www.npmjs.com/package/mysql) - Used to communicate with the database
    * [ping-monitor](https://www.npmjs.com/package/ping-monitor) - Used to get the response time
    * [Nodemailer](https://www.npmjs.com/package/nodemailer) - Used to send mail
    * [Nexmo](https://www.npmjs.com/package/nexmo) - Used to send SMS
    * [Moment.js](https://www.npmjs.com/package/moment) - Used to get the time
    * [Moment Timezone](https://momentjs.com/timezone/) - Used to change the timezone
    

## MySQL

```javascript
var mysql = require('mysql');

var database = mysql.createConnection({
    host: "localhost",
    user: "user",
    password: "secret",
    database: "my_db"
});

database.connect(function (err) {
    database.query("SELECT * FROM your_database", function (err, results, fields) {
    if (err) throw err;
    // the response from the database is in results
    // do what you want here
    });
});
``` 


## ping-monitor

```javascript
const Monitor = require('ping-monitor');

const myMonitor = new Monitor({
    website: "http://www.test.com",
});

myMonitor.on('up', function (res, state) {
    // your code here
    res.responseTime // Get response time
    this.stop;
});

myMonitor.on('down', function (res, state) {
    // your code here
    this.stop;
});

myMonitor.on('error', function (error) {
    // your code here
    this.stop;
});
``` 


## Nodemailer

```javascript
var nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "smtp.googlemail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: "example@gmail.com",
        pass: "example"
    }
});

var mailOptions = {
    from: "exampleSendTo@gmail.com",
    to: "exampleReceiveFrom@gmail.com",
    subject: "This is a mail",
    text: "Hello, it's me",
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
``` 


## Nexmo

To use Nexmo, you've to create an account on [Nexmo](https://www.nexmo.com/).
```javascript
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
    apiKey: "Your API Key",
    apiSecret: "Your API Secret"
});

nexmo.message.sendSms(
    "Your number on nexmo", "Number who'll receive your SMS", "Your message",
    (err, responseData) => {
        if (err) {
            console.log(err);
        } else {
            console.dir(responseData);
        }
    }
);
``` 

    
## Author
* **Mark Bucknell** 
* **Benjamin Démolin**


## Contributor
You can use the `staging` branch to do a pull request!


