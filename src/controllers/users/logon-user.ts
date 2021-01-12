import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Login, { ILogin } from "../../models/security/login";
import { ApplicationSetting } from './../../config/config';
import { manageError } from '../helper';
import { Router } from 'express';

const router: Router = Router();

export class LogonController {
    public async logon(login: string, password: string): Promise<{ login: string, email: string, entity: string }> {
        let logins: ILogin[] = await Login.find({ login: login, password: password, status: "ACTIVE" });
        if (logins.length == 0) logins = await Login.find({ login: login, password: password, status: "MAIL_NEW_PASSWORD_TO_SEND" });

        if (logins.length == 0) throw new Error("Login not found");
        if (logins.length > 1) throw new Error("Too many login");

        let currentLogin: ILogin = logins[0];

        return { login: currentLogin.login, email: currentLogin.login, entity: "" };
    }
}

/**
 * @api {put} /logon [Log a user]
 * @apiGroup Users
 * @apiDescription Log a user and return token. Login and password are sent in body.
 * @apiParam {JSON} Body {login: xxxxx, password: xxxx}
 * @apiSuccess (Succes) {JSON} Token Token encrypted (token id, login, entities[], email, expire, type credentials[])
 * @apiError (Error) {Number} HttpCode 401
 */
router.put('/logon', async (req, res) => {
    let serv: LogonController = new LogonController();

    try {
        let back: { login: string, email: string } = await serv.logon(req.body.login, req.body.password);
        let body: any = { id: uuidv4(), created: moment.utc(), login: back.login, entities: [], email: back.email, expire: moment.utc().add(8, "hours").toDate(), type: "USER", credentials: [] };
        let encrypt: string = await jwt.sign(body, ApplicationSetting.jtokenSecretKey);
        res.send({ token: encrypt });
    }
    catch (ex) {
        manageError(req, res, ex, 401);
    }
});

export default router;