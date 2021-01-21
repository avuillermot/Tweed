import fs from "fs";
import url from 'url';
import User, { IUser, UserHelper } from "../../models/security/user";
import Login, { ILogin, LoginHelper } from "../../models/security/login";
import Parameter, { IParameter } from "../../models/parameter";
import { manageError } from '../helper';
import { MailHelper } from "../mail-helper";
import { Router } from 'express';

let USER_ERROR: any = {
    PASSWORD_DIFF: "PASSWORD_DIFF",
    PASSWORD_SHORT: "PASSWORD_SHORT",
    EMAIL_ALREADY_EXIST: "EMAIL_ALREADY_EXIST"
};

export interface ICreateUser {
    firstName: IUser['firstName'];
    lastName: IUser['lastName'];
    password: ILogin['password'];
    confirmPassword: string;
    email: IUser['email'];
}
const router: Router = Router();

export class CreateUserController {
    public async create(user: ICreateUser): Promise<IUser> {
        let exist: IUser = await User.findOne({ email: user.email });
        if (exist != null && exist != undefined) throw new Error(USER_ERROR.EMAIL_ALREADY_EXIST);
        if (user.confirmPassword != user.password) throw new Error(USER_ERROR.PASSWORD_DIFF);
        if (user.password.length < 6) throw new Error(USER_ERROR.PASSWORD_SHORT);

        let toSave = UserHelper.format(user);
        let newUsr: IUser = await User.create(toSave);

        let login: ILogin = new Login(user);
        login.login = user.email;
        login.idUser = newUsr._id;
        login = LoginHelper.format(login);
        let newLogin: ILogin = await Login.create(login);
        return newUsr;
    }

    public async setAccountActive(clogin: string): Promise<boolean> {
        let back: boolean = true;
        let updatedBy: string = "account_active";
        let login: ILogin = await Login.findOne({ login: clogin });
        if (login != null) {
            let res: any = await Login.updateOne({ login: clogin }, { status: "ACTIVE", updatedBy: updatedBy }, { runValidators: true });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No login set active");

            res = await User.updateOne({ _id: login.idUser }, { emailConfirmed: true, updatedBy: updatedBy }, { runValidators: true });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No user set active");
        }
        else throw new Error("No user/login known");
        return back;
    }

    public async confirmAccounts(params: { email: string } = null): Promise<void> {

        let serv: MailHelper = new MailHelper();

        const htmlTemplate: Buffer = fs.readFileSync("src/html-template/confirm-account.html");
        const confirmAccountUrl: IParameter = await Parameter.findOne({ KEY: "CONFIRM_ACCOUNT_URL" });
        const confirmAccountReturnUrl: IParameter = await Parameter.findOne({ KEY: "CONFIRM_ACCOUNT_RETURN_URL" });

        const logins: ILogin[] = await Login.find({ status: 'MAIL_CONFIRMATION_TO_SEND' });
        let hasError: boolean = false;

        if (logins.length > 0) {
            for (let i: number = 0; i < logins.length; i++) {
                try {
                    console.log("Send confirm accout email for idUser :" + logins[i].idUser);
                    const user: IUser = await User.findOne({ _id: logins[i].idUser });

                    if (params == null && params.email == null) await serv.confirmAccount({ template: htmlTemplate, to: user.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE, returnUrl: confirmAccountReturnUrl.VALUE });
                    else await serv.confirmAccount({ template: htmlTemplate, to: params.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE, returnUrl: confirmAccountReturnUrl.VALUE });

                    await Login.updateOne({ _id: logins[i]._id }, { status: "WAIT_ACCOUNT_CONFIRMATION", updatedBy: 'mail_confirmation_send' }, { runValidators: true });
                }
                catch (ex) {
                    await Login.updateOne({ _id: logins[i]._id }, { status: "MAIL_CONFIRMATION_TO_SEND_ERROR", updatedBy: 'mail_confirmation_send' }, { runValidators: true });
                    hasError = true;
                }
            };
        }
        if (hasError) throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR");
    }
}

/**
 * @api {post} / [Create user & login]
 * @apiGroup CreateUser
 * @apiDescription Create & user and login in database. A email need to be send to confirm email before login.
 * @apiParam (Succes) {JSON} Body {fistName: string, lastName: string, email:string, password: string, confirmPassword: string}
 * @apiSuccess (200) {Number} HttpStatus 200
 * @apiError (500) {Number} HttpStatus 500, response includes error description
 */
router.post('/', async (req, res) => {
    try {
        let serv: CreateUserController = new CreateUserController();
        await serv.create(req.body);
        res.send();
    }
    catch (ex) {
        manageError(req, res, ex, 500);
    }
});

/**
 * @api {get} /confirm/account [Confirm account]
 * @apiGroup CreateUser
 * @apiDescription Confirm account set in query string.<br/>
 * @apiParam {QueryString} code Login of the account to confim
 * @apiParam {QueryString} returnUrl Redirect to this URL after confirmation.
 * @apiSuccess (Succes) {Number} HttpStatus 302
 * @apiError (Error) {Number} HttpStatus 500, response includes error description
 */
router.get('/confirm/account', async (req, res) => {
    try {
        const queryObject: any = url.parse(req.url, true).query;
        console.log(queryObject);
        let servUser: CreateUserController = new CreateUserController();
        await servUser.setAccountActive(queryObject.code);

        res.writeHead(302, {
            'Location': queryObject.returnUrl
        });
        res.end();
    }
    catch (ex) {
        res.status(500).send();
    }
});

/**
 * @api {put} /send/confirm/email [Send mail confirm account]
 * @apiGroup CreateUser
 * @apiDescription Select all logins with MAIL_CONFIRMATION_TO_SEND status and send a mail for each to confirm account.<br/>
 * After that, update status to WAIT_ACCOUNT_CONFIRMATION. <br/>
 * In case of error, the new status is MAIL_CONFIRMATION_TO_SEND_ERROR.
 * @apiParam {JSON} Body {forceEmail: xxxxx} <br/> Send all email to this email (use only in dev mode). In production no parameter require.
 * @apiSuccess (Succes) {Number} HttpStatus 200
 * @apiError (Error) {Number} HttpStatus 500
 */
router.put('/send/confirm/email', async (req, res) => {
    let email: string = ""

    if (req.body.forceEmail != null) {
        console.log("Send mail confirm account - force email :" + req.body.forceEmail);
        email = req.body.forceEmail;
    }
    try {
        let serv: CreateUserController = new CreateUserController();
        await serv.confirmAccounts({ email: email });
        res.send();
    }
    catch (ex) {
        manageError(req, res, ex, 500);
    }
});

export default router;