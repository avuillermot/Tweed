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

export async function sendNewPassword (params: { firstName: string, email:string, password: string, domain: string }) {

	if (params != null && params != undefined) {
		console.log(params.email);
		let info = await transporter.sendMail({
			from: 'avuillermot@hotmail.com', // sender address
			to: params.email, // list of receivers
			subject: "xxxxx Confirmer votre adresse mail !", // Subject line
			//text: "Cliquez sur ce lien pour confirmer votre adresse mail : www.lequipe.fr", // plain text body
			html: "<div>Bonjour " + params.firstName + ", </div><div>Votre nouveau mot passe est : " + params.password + ". Cliquez sur ce lien pour confirmer votre adresse mail <a href='" + params.domain + "'>Ouvrir</a></div>" // html body
		});

		//console.log("Message sent: %s", info.messageId);
	}
};

const confirmAccount = async function (params:{ template: Buffer, to: string, login: string, confirmAccountUrl: string }) {

	let body = params.template.toString();
	body = body.replace("{{confirmAccountUrl}}", params.confirmAccountUrl + "?code=" + params.login + "&returnUrl=" + escape("https://monecole.fr/"));

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
	const confirmAccountUrl : IParameter = await Parameter.findOne({ KEY: "CONFIRM_ACCOUNT_URL" });

	const logins: ILogin[] = await Login.find({ status: 'MAIL_CONFIRMATION_TO_SEND' });
	let hasError: boolean = false;

	if (logins.length > 0) {
		for (let i: number = 0; i < logins.length; i++) {
			try {
				console.log("Send confirm accout email for idUser :" + logins[i].idUser);
				const user: IUser = await User.findOne({ _id: logins[i].idUser });
				if (params == null && params.email == null) await confirmAccount({ template: htmlTemplate, to: user.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE });
				else await confirmAccount({ template: htmlTemplate, to: params.email, login: logins[i].login, confirmAccountUrl: confirmAccountUrl.VALUE });
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