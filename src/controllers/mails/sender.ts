import nodemailer from "nodemailer";
import fs from "fs";
import User, { IUser } from "../../models/security/user";
import Login, { ILogin } from "../../models/security/login";
import Parameter, { IParameter } from "../../models/parameter";

let sender: string = "";
let senderPassword: string = "";
let transporter: any = null;

let initTransporter = function () {
	transporter = nodemailer.createTransport({
		host: "smtp.live.com",
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: sender,
			pass: senderPassword
		}
	});
	console.log("Email transporter ready !");
};

Parameter.findOne({ KEY: "EMAIL_SENDER" }).then((data) => {
	sender = data.VALUE;
	if (sender != "" && senderPassword != "") initTransporter();
});

Parameter.findOne({ KEY: "EMAIL_SENDER_PASSWORD" }).then((data) => {
	senderPassword = data.VALUE;
	if (sender != "" && senderPassword != "") initTransporter();
});

const sendNewPassword = async function(params: { to: string, password: string, template: Buffer}) {

	if (params != null && params != undefined) {
		let body: string = params.template.toString();
		while (body.indexOf("{{Password}}") > -1) body = body.replace("{{Password}}", params.password);

		let message = {
			from: sender,
			to: params.to,
			subject: "Votre nouveau mot de passe",
			html: body
		};

		try {
			const response = await transporter.sendMail(message);
		}
		catch (ex) {
			console.log(ex);
			throw new Error("MAIL_NEW_PASSWORD_TO_SEND_ERROR")
		}
	}
};

export async function sendNewPasswords(params: { email: string } = null): Promise<void> {

	const htmlTemplate: Buffer = fs.readFileSync("src/html-template/new-password.html");

	const logins: ILogin[] = await Login.find({ status: 'MAIL_NEW_PASSWORD_TO_SEND' });
	let hasError: boolean = false;

	if (logins.length > 0) {
		for (let i: number = 0; i < logins.length; i++) {
			try {
				console.log("Send new password email for idUser :" + logins[i].idUser);
				const user: IUser = await User.findOne({ _id: logins[i].idUser });
				if (params == null && params.email == null) await sendNewPassword({ template: htmlTemplate, to: user.email, password: logins[i].password });
				else await sendNewPassword({ template: htmlTemplate, to: params.email, password: logins[i].password });
				await Login.updateOne({ _id: logins[i]._id }, { status: "ACTIVE", updatedBy: 'mail_new_password_send' });
			}
			catch (ex) {
				await Login.updateOne({ _id: logins[i]._id }, { status: "MAIL_NEW_PASSWORD_TO_SEND_EROR", updatedBy: 'mail_new_password_send' });
				hasError = true;
			}
		};
	}
	if (hasError) throw new Error("MAIL_NEW_PASSWORD_TO_SEND_EROR");
}

const confirmAccount = async function (params:{ template: Buffer, to: string, login: string, confirmAccountUrl: string, returnUrl: string }) {

	let body = params.template.toString();
	while (body.indexOf("{{confirmAccountUrl}}") > - 1)
		body = body.replace("{{confirmAccountUrl}}", params.confirmAccountUrl + "?code=" + params.login + "&returnUrl=" + escape(params.returnUrl));

	var message = {
		from: sender,
		to: params.to,
		text: "",
		subject: "Confirmation de votre compte",
		html: body
	};

	try {
		const response = await transporter.sendMail(message);
	}
	catch (ex) {
		console.log(ex);
		throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR")
	}
};

export async function confirmAccounts(params: { email: string } = null): Promise<void> {

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
				if (params == null && params.email == null) await confirmAccount({ template: htmlTemplate, to: user.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE, returnUrl: confirmAccountReturnUrl.VALUE });
				else await confirmAccount({ template: htmlTemplate, to: params.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE, returnUrl: confirmAccountReturnUrl.VALUE });
				await Login.updateOne({ _id: logins[i]._id }, { status: "WAIT_ACCOUNT_CONFIRMATION", updatedBy: 'mail_confirmation_send' });
			}
			catch (ex) {
				await Login.updateOne({ _id: logins[i]._id }, { status: "MAIL_CONFIRMATION_TO_SEND_ERROR", updatedBy: 'mail_confirmation_send' });
				hasError = true;
			}
		};
	}
	if (hasError) throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR");
}