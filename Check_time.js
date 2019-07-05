var mysql = require('mysql');
const Monitor = require('ping-monitor');
var nodemailer = require('nodemailer');
const Nexmo = require('nexmo');
var moment = require('moment');
var moment_tz = require('moment-timezone');

require('dotenv/config')


var database = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

const nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET
});

var the_interval = 1 * 30 * 1000;

if (process.env.SERVER_LOCATION == "Sydney") {
    var timezone = "Australia/Sydney";
}
if (process.env.SERVER_LOCATION == "London") {
    var timezone = "Europe/London";
}
if (process.env.SERVER_LOCATION == "Oregon") {
    var timezone = "America/Vancouver";
}

database.connect(function (err) {

    setInterval(function () {

        console.log("Check");
        var datas = null;

        if (err) throw err;
        database.query("SELECT DISTINCT websites.id,status,type,url_ip,check_interval,websites.test_location,down_after_num_failed_checks,num_failed,check_interval_down,DATE_FORMAT(MAX(check_time),'%d %b %Y %h:%i:%s') AS check_time FROM websites INNER JOIN websites_status_checks ON websites.id = websites_status_checks.website_id WHERE is_deleted=false AND is_monitored=true GROUP BY id", function (err, results, fields) {
            if (err) throw err;
            datas = results;
            console.log(datas);
            datas.forEach(function (data) {
                if (data.test_location == process.env.SERVER_LOCATION) {
                    let tz = moment().tz(timezone).format();
                    let current_datetime = moment(new Date(tz));

                    let formatted_date = current_datetime.year() + "-" + (current_datetime.month() + 1) + "-" + current_datetime.date() + " " + current_datetime.hour() + ":" + current_datetime.minute() + ":" + current_datetime.second();
                    let date_time = moment(new Date(tz)).valueOf();
                    let check_time = new Date(data.check_time).getTime();

                    if (data.down_after_num_failed_checks > data.num_failed) {
                        console.log("check interval " + data.url_ip + ": " + data.check_interval);
                        if ((data.check_interval != null) & (data.check_time == null)) {
                            check(data, formatted_date);
                        }
                        else if ((data.check_interval != null) & ((parseInt((date_time - check_time) / 1000)) >= data.check_interval)) {
                            console.log("time_spent ->" + (parseInt((date_time - check_time) / 1000)));
                            check(data, formatted_date);
                        }
                    }
                    else {
                        console.log("check interval down " + data.url_ip + ": " + data.check_interval_down);

                        sendmail(data);

                        if ((data.check_interval_down != null) & (data.check_time == null)) {
                            check(data, formatted_date);
                        }
                        else if ((data.check_interval_down != null) & (parseInt((date_time - check_time) / 1000))) {
                            check(data, formatted_date);
                        }
                    }
                }
            });
        });
    }, the_interval);


});


function check(data, date) {
    var url = data.type + "://" + data.url_ip;
    const myMonitor = new Monitor({
        website: url.toLowerCase(),
    });

    myMonitor.on('up', function (res, state) {
        console.log(url + " - response time : " + res.responseTime);
        if (data.status == 0 | data.num_failed != 0) {
            database.query("UPDATE websites SET status = " + 1 + ",num_failed = 0 WHERE id = " + data.id, function (err, result) {
                if (err) throw err;
            });
        }
        database.query("INSERT INTO websites_status_checks (website_id, url, response_code, response_time,check_time,test_location) VALUES ('" + data.id + "','" + data.url_ip + "', '200' ,'" + res.responseTime + "','" + date + "', '" + data.test_location + "')", function (err, result) {
            if (err) throw err;
            console.log(url + " - " + "1 record inserted");
        });
        this.stop;
    });


    myMonitor.on('down', function (res) {

        console.log(url + " is down");
        var nb_failed = data.num_failed + 1;
        if (data.status == 1 & data.down_after_num_failed_checks == nb_failed) {
            database.query("UPDATE websites SET status = " + 0 + ",last_down = '" + date + "',num_failed = " + nb_failed + " WHERE id = " + data.id, function (err, result) {
                if (err) throw err;
                console.log(url + " - " + result.affectedRows + " record(s) updated");
            });
            sendsms(data);
        }
        else {
            database.query("UPDATE websites SET num_failed = " + nb_failed + " WHERE id = " + data.id, function (err, result) {
                if (err) throw err;
                console.log(url + " - " + result.affectedRows + " record(s) updated");
            });
        }
        database.query("INSERT INTO websites_status_checks (website_id, url, response_code,check_time,test_location) VALUES ('" + data.id + "','" + data.url_ip + "', '403', '" + date + "', '" + data.test_location + "')", function (err, result) {
            if (err) throw err;
            console.log(url + " - " + "1 record inserted");
        });
        this.stop;
    });


    myMonitor.on('error', function (error) {
        console.log(error);
        var nb_failed = data.num_failed + 1;
        if (data.status == 1 & data.down_after_num_failed_checks == nb_failed) {
            database.query("UPDATE websites SET status = " + 0 + ",last_down = '" + date + "',num_failed = " + nb_failed + " WHERE id = " + data.id, function (err, result) {
                if (err) throw err;
                console.log(url + " - " + result.affectedRows + " record(s) updated");
            });
            sendsms(data);
        }
        else {
            database.query("UPDATE websites SET num_failed = " + nb_failed + " WHERE id = " + data.id, function (err, result) {
                if (err) throw err;
                console.log(url + " - " + result.affectedRows + " record(s) updated");
            });
        }
        database.query("INSERT INTO websites_status_checks (website_id, url, response_code,check_time,test_location) VALUES ('" + data.id + "','" + data.url_ip + "', '404', '" + date + "', '" + data.test_location + "')", function (err, result) {
            if (err) throw err;
            console.log(url + " - " + "1 record inserted");
        });
        this.stop;
    });
}

function sendmail(data) {
    database.query("SELECT DISTINCT email FROM users INNER JOIN websites_assignees ON users.id = websites_assignees.user_id WHERE websites_assignees.website_id =" + data.id, function (err, res, fields) {
        if (err) throw err;
        console.log('email adresse ' + res[0].email);

        var mailOptions = {
            from: process.env.MAIL_FROM,
            to: res[0].email,
            subject: data.url_ip + '-> is down',
            text: 'This website is down : ' + data.type + "://www." + data.url_ip,
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}

function sendsms(data) {
    database.query("SELECT DISTINCT phone FROM users INNER JOIN websites_assignees ON users.id = websites_assignees.user_id WHERE websites_assignees.website_id =" + data.id, function (err, res, fields) {
        if (err) throw err;
        console.log('email adresse ' + res[0].phone);

        nexmo.message.sendSms(
            process.env.API_NUMBER, res[0].phone, data.url_ip + ' is down!',
            (err, responseData) => {
                if (err) {
                    console.log(err);
                } else {
                    console.dir(responseData);
                }
            }
        );
    });
}