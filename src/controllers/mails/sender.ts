import nodemailer = require("nodemailer");
import User, { IUser } from "../../models/security/user";
import Login, { ILogin } from "../../models/security/login";

const transporter = nodemailer.createTransport({
	host: "smtp.live.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: "",
		pass: ""
	}
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
		from: "",
		to: "",
		subject: "Confirmation de votre compte",
		text: "Plaintext version of the message",
		html: html
	};

	const response = await transporter.sendMail(message);
};

export async function confirmAccounts(params: { email: string } = null) {
	let emails: string[] = new Array<string>();
	const logins: ILogin[] = await Login.find({ status: 'MAIL_CONFIRMATION_TO_SEND' });

	logins.forEach(async (value) => {
		const user: IUser = await User.findOne({ _id: value.idUser });
		if (params == null && params.email == null) confirmAccount(user.email, user.email);
		else {
			try {
				confirmAccount(params.email, user.email);
				const result = await Login.updateOne({ _id: value._id }, { status: "WAIT_ACCOUNT_CONFIRMATION" });
			}
			catch (ex) {

			}
		}
	});
	return emails;
}