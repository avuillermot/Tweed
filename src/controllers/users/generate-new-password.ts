import Login, { ILogin } from "../../models/security/login";
import User, { IUser } from "../../models/security/user";
import { MailHelper } from "../mail-helper";
import { manageError } from '../helper';
import { Router } from 'express';
import generator from "generate-password";
import fs from "fs";

const router: Router = Router();

export class GenerateNewPasswordController {
    public async setGenerateNewPassword(login: string): Promise<void> {
        let res = await Login.updateOne({ login: login }, { status: "MAIL_NEW_PASSWORD_TO_SEND" });
        if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("Generate password error");
    }

    public async sendNewPasswords(params: { email: string } = null): Promise<void> {
        let serv: MailHelper = new MailHelper();
        const htmlTemplate: Buffer = fs.readFileSync("src/html-template/new-password.html");

        const logins: ILogin[] = await Login.find({ status: 'MAIL_NEW_PASSWORD_TO_SEND' });
        let hasError: boolean = false;

        if (logins.length > 0) {
            for (let i: number = 0; i < logins.length; i++) {
                let pwds: string[] = generator.generateMultiple(1, { length: 10 });
                try {
                    console.log("Send new password email for idUser :" + logins[i].idUser);

                    const user: IUser = await User.findOne({ _id: logins[i].idUser });

                    if (params == null && params.email == null) await serv.sendNewPassword({ template: htmlTemplate, to: user.email, login: logins[i].login, password: pwds[0] });
                    else await serv.sendNewPassword({ template: htmlTemplate, to: params.email, password: pwds[0], login: logins[i].login });

                    await Login.updateOne({ _id: logins[i]._id }, { status: "ACTIVE", password: pwds[0], updatedBy: 'mail_new_password_send' });
                }
                catch (ex) {
                    await Login.updateOne({ _id: logins[i]._id }, { status: "MAIL_NEW_PASSWORD_TO_SEND_EROR", updatedBy: 'mail_new_password_send' });
                    hasError = true;
                }
            };
        }
        if (hasError) throw new Error("MAIL_NEW_PASSWORD_TO_SEND_EROR");
    }
}
/**
 * @api {put} /send/generate/password [Generate password]
 * @apiGroup Password
 * @apiDescription Generate a new password and send an email with this password.
 * @apiParam {JSON} Body Optional - In dev mode, could force recipient with body JSON param {forceEmail: xxxxx}.
 * @apiSuccess (Succes) {Number} HttpCode 200
 * @apiError (Error) {Number} HttpCode 500
 */
router.put('/send/generate/password', async (req, res) => {
    let serv: GenerateNewPasswordController = new GenerateNewPasswordController();
    let email: string = ""

    if (req.body.forceEmail != null) {
        console.log("Send mail new password - force email :" + req.body.forceEmail);
        email = req.body.forceEmail;
    }
    try {
        await serv.sendNewPasswords({ email: email });
        res.send();
    }
    catch (ex) {
        manageError(req, res, ex, 500);
    }
});
/**
 * @api {put} /send/generate/password [Generate password]
 * @apiGroup Password
 * @apiDescription Change login status to generate a new password. Done by a scheduled job.
 * @apiParam {JSON} Body Login to generate a new password
 * @apiSuccess (Succes) {Number} HttpCode 200
 * @apiError (Error) {Number} HttpCode 500
 */
router.put('/ask/generate/password', async (req, res) => {
    if (req.body.login == "" || req.body.login == undefined || req.body.login == null) {
        res.status(500).send("Login value mandatory");
    }
    let serv: GenerateNewPasswordController = new GenerateNewPasswordController();

    try {
        await serv.setGenerateNewPassword(req.body.login);
        res.send();
    }
    catch (ex) {
        manageError(req, res, ex, 500);
    }
});


export default router;