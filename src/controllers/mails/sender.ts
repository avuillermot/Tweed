import nodemailer = require("nodemailer");

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