import express = require('express');
import https = require('https');
import fs from 'fs';
import cors from 'cors';
import { ApplicationDbSettings as DbSettings, ApplicationSetting } from './config/config';
import bodyParser from 'body-parser';
import routerLogon from '../src/controllers/users/logon-user';
import routerCreateUser from '../src/controllers/users/create-user';
import routerPassword from '../src/controllers/users/generate-new-password';
import routerUpdateUser from '../src/controllers/users/update-user';

console.log("WORKSPACE:" + __dirname);
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

app.use(routerLogon);
app.use(routerCreateUser);
app.use(routerPassword);
app.use(routerUpdateUser);

/**
 * @api {get} /alive [Keep alive]
 * @apiGroup Monitoring
 * @apiDescription Indicate if web site is alive
 * @apiSuccess (200) {String} _ OK TWEED
 */
app.get('/alive', async (req, res) => {
    res.send("OK TWEED");
});

https.createServer(options, app).listen(process.env.PORT, () => {
    console.log('[server]: Server is running at https://localhost:%s', process.env.PORT);
});
