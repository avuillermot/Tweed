import express = require('express');
import cors = require('cors')
import url = require('url');
import { ApplicationDbTestSettings as DbSettings, ApplicationDbSettings } from './config/config';
import bodyParser = require('body-parser');
import ServiceUser from '../src/controllers/security/user.controller'

const app = express();
const PORT = 8001;
let db: DbSettings = new DbSettings();
db.connection();

app.use(cors())
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.put('/logon', async (req, res) => {
    let servUser: ServiceUser = new ServiceUser();
    
    try {
        let back:any = await servUser.logon(req.body.login, req.body.password);
        res.send(back);
    }
    catch (ex) {
        res.status(401).send();
    }
});

app.listen(PORT, () => {
    console.log('[server]: Server is running at https://localhost:%s', PORT);
});