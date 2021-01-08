import express = require('express');
import https = require('https');
import fs = require('fs');
import cors = require('cors')
import moment = require('moment');
import sendmail from 'sendmail';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { ApplicationDbSettings as DbSettings, ApplicationSetting } from './config/config';
import bodyParser from 'body-parser';
import ServiceUser from '../src/controllers/security/user.controller';

console.log("WORKSPACE:"+__dirname);
const options = {
    key: fs.readFileSync('./src/config/key.pem'),
    cert: fs.readFileSync('./src/config/cert.pem')
};

const app = express();
let db: DbSettings = new DbSettings();
db.connection();

app.use(cors())
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    next();
});

const manageError = function (req, res, exception, httpCode) {
    console.log(exception);
    if (exception.message != null && exception.message != undefined && exception.message != "") res.status(500).send(exception.message);
    else res.status(500).send(exception);
}
/**
 * @api {put} /logon [Logon]
 * @apiDescription Log a user and return token. Login and password are sent in body.
 * @apiParam {JSON} body {login: xxxxx, password: xxxx}
 * @apiSuccess (200) {JSON} token encrypted (token id, login, entities[], email, expire, type credentials[])
 */
app.put('/logon', async (req, res) => {
    let servUser: ServiceUser = new ServiceUser();
    
    try {
        let back: { login: string, email: string } = await servUser.logon(req.body.login, req.body.password);
        let body: any = { id: uuidv4(), created: moment.utc(), login: back.login, entities:[], email: back.email, expire: moment.utc().add(8, "hours").toDate(), type: "USER", credentials: [] };
        let encrypt: string = await jwt.sign(body, ApplicationSetting.jtokenSecretKey);
        res.send({ token: encrypt });
    }
    catch (ex) {
        manageError(req, res, ex, 401);
    }
});

/**
 * @api {post} / [Create user & login]
 * @apiDescription Create & user and login in database. A email need to be send to confirm email before login.
 * @apiSuccess (200)
 */
app.post('/', async (req, res) => {
    try {
        let servUser: ServiceUser = new ServiceUser();
        await servUser.create(req.body);
        res.send();
    }
    catch (ex) {
        manageError(req, res, ex, 500);
    }
});

app.put('/send/confirm/email', async (req, res) => {
    console.log("send email");
    let email: string = ""

    if (req.body.forceEmail != null) {
        console.log("Force email :" + req.body.forceEmail);
        email = req.body.forceEmail;
    }
    sendmail({
        from: 'xxxxx@gmail.com',
        to: email,
        subject: 'test sendmail',
        html: 'Mail of test sendmail ',
    }, function (err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
    });
    res.send();
});
/**
 * @api {get} /alive [Keep alive]
 * @apiDescription Indicate if web site is alive
 * @apiSuccess (200) {String} _ OK TWEED
 */
app.get('/alive', async (req, res) => {
    res.send("OK TWEED");
});

https.createServer(options, app).listen(process.env.PORT, () => {
    console.log('[server]: Server is running at https://localhost:%s', process.env.PORT);
});