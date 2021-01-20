import nodemailer from "nodemailer";
import Parameter from "../models/parameter";


export class MailHelper {

	private static sender: string = "";
	private static password: string = "";
	private static transporter: any = null;

	constructor() {
		const initTransporter = function () {
			MailHelper.transporter = nodemailer.createTransport({
				host: "smtp.live.com",
				port: 587,
				secure: false, // true for 465, false for other ports
				auth: {
					user: MailHelper.sender,
					pass: MailHelper.password
				}
			});
			console.log("Email transporter ready !");
		};

		if (MailHelper.sender == "") {
			Parameter.findOne({ KEY: "EMAIL_SENDER" }).then((data) => {
				MailHelper.sender = data.VALUE;
				if (MailHelper.sender != "" && MailHelper.password != "") initTransporter();
			});
		}

		if (MailHelper.password == "") {
			Parameter.findOne({ KEY: "EMAIL_SENDER_PASSWORD" }).then((data) => {
				MailHelper.password = data.VALUE;
				if (MailHelper.sender != "" && MailHelper.password != "") initTransporter();
			});
		}
	}

	public async sendNewPassword (params: { to: string, password: string, login: string, template: Buffer }) {
		if (params != null && params != undefined) {
			let body: string = params.template.toString();
			while (body.indexOf("{{Password}}") > -1) body = body.replace("{{Password}}", params.password);
			while (body.indexOf("{{Login}}") > -1) body = body.replace("{{Login}}", params.login);

			let message = {
				from: MailHelper.sender,
				to: params.to,
				subject: "Votre nouveau mot de passe",
				html: body
			};

			try {
				const response = await MailHelper.transporter.sendMail(message);
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
			from: MailHelper.sender,
			to: params.to,
			text: "",
			subject: "Confirmation de votre compte",
			html: body
		};

		try {
			const response = await MailHelper.transporter.sendMail(message);
		}
		catch (ex) {
			console.log(ex);
			throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR")
		}
	};

}