import nodemailer = require("nodemailer");
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

/*exports.sendCheckMail = async function (params: {firstName:string, email:strn}) {

	if (to != null && to != undefined) {
		let info = await transporter.sendMail({
			from: 'avuillermot@hotmail.com', // sender address
			to: to.email, // list of receivers
			subject: "xxxxx Confirmer votre adresse mail !", // Subject line
			//text: "Cliquez sur ce lien pour confirmer votre adresse mail : www.lequipe.fr", // plain text body
			html: "<div>Bonjour" + to.firstName + "!</div><div>Cliquez sur ce lien pour confirmer votre adresse mail <a href='config.domain/confirm/email/" + to.email + "'>Ouvrir</a></div>" // html body
		});

		console.log("Message sent: %s", info.messageId);
	}
};*/

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

const confirmAccount = async function (email: string, username: string) {

	let html = username + "Pour confirmer votre adresse e-mail, veuillez cliquer sur le lien suivant :";
	html += ""
	html += "Si vous avez des questions concernant la plateforme, n’hésitez pas à nous contacter à contact@allodocteur.fr";

	var message = {
		from: sender,
		to: email,
		subject: "Confirmation de votre compte",
		text: "Plaintext version of the message",
		html: html
	};

	try {
		const response = await transporter.sendMail(message);
	}
	catch (ex) {
		throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR")
	}
};

export async function confirmAccounts(params: { email: string } = null): Promise<void> {

	const logins: ILogin[] = await Login.find({ status: 'MAIL_CONFIRMATION_TO_SEND' });
	let hasError: boolean = false;

	if (logins.length > 0) {
		for (let i: number = 0; i < logins.length; i++) {
			try {
				const user: IUser = await User.findOne({ _id: logins[i].idUser });
				if (params == null && params.email == null) confirmAccount(user.email, user.email);
				else {
					await confirmAccount(params.email, user.email);
					await Login.updateOne({ _id: logins[i]._id }, { status: "WAIT_ACCOUNT_CONFIRMATION" });
				}
			}
			catch (ex) {
				console.log("MAIL_CONFIRMATION_TO_SEND_ERROR");
				hasError = true;
			}
		};
	}
	if (hasError) throw new Error("MAIL_CONFIRMATION_TO_SEND_ERROR");
}