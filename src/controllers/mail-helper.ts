import generator from "generate-password";
import nodemailer from "nodemailer";
import fs from "fs";
import User, { IUser } from "../models/security/user";
import Login, { ILogin } from "../models/security/login";
import Parameter, { IParameter } from "../models/parameter";

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

export class MailHelper {

	public async sendNewPassword (params: { to: string, password: string, login: string, template: Buffer }) {

		if (params != null && params != undefined) {
			let body: string = params.template.toString();
			while (body.indexOf("{{Password}}") > -1) body = body.replace("{{Password}}", params.password);
			while (body.indexOf("{{Login}}") > -1) body = body.replace("{{Login}}", params.login);

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
	}

	public async confirmAccount (params: { template: Buffer, to: string, login: string, confirmAccountUrl: string, returnUrl: string }) {

		let body = params.template.toString();
		while (body.indexOf("{{confirmAccountUrl}}") > - 1)
			body = body.replace("{{confirmAccountUrl}}", params.confirmAccountUrl + "?code=" + params.login + "&returnUrl=" + escape(params.returnUrl));
		while (body.indexOf("{{login}}") > - 1)
			body = body.replace("{{login}}", params.login);

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

}