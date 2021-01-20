import { Schema, model } from "mongoose";
import moment from "moment";
import { IBase } from "../model-base";

export interface ILogin extends IBase {
    idUser: string,
    login: string,
    password: string,
    status: string,
    lastConnection: Date,
    created: Date,
    updated: Date,
    updatedBy: string
}

const LoginSchema: Schema = new Schema({
    idUser: { type: String, required: true },
    login: { type: String, required: false, unique: true },
    password: { type: String, required: true, minlength: 6 },
    status: { type: String, required: true, default: "MAIL_CONFIRMATION_TO_SEND" },
    lastConnection: { type: Date, required: false, default: null },
    created: { type: Date, required: true, default: null },
    createdBy: { type: String, required: true, default: "create_account" },
    updated: { type: Date, required: true, default: null },
    updatedBy: { type: String, required: true, default: "create_account" }
});

LoginSchema.pre("validate", function (next) {
    this.set("updated",moment().utc());
    if (this.get("created") == null) this.set("created", moment().utc());
    next();
});

export default model<ILogin>('Login', LoginSchema);



