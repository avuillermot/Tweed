import express = require('express');
import https = require('https');
import fs = require('fs');
import cors = require('cors')
import moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { ApplicationDbSettings as DbSettings, ApplicationSetting } from './config/config';
import bodyParser = require('body-parser');
import ServiceUser from '../src/controllers/security/user.controller'

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
/**
 * @api {put} /logon [Logon]
 * @apiDescription Log a user and return token
 * @apiSuccess (200) [{token}] id [token id]
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
        res.status(401).send();
    }
});

/**
 * @api {get} /alive [Keep alive]
 * @apiDescription Indicate if web site is alive
 * @apiSuccess (200) [{String}]
 */
app.get('/alive', async (req, res) => {
    res.send("OK TWEED");
});

https.createServer(options, app).listen(process.env.PORT, () => {
    console.log('[server]: Server is running at https://localhost:%s', process.env.PORT);
});