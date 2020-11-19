import { Schema, Document, model } from "mongoose";
import moment from "moment";
import { IBase } from "../model-base";

export interface IUser extends IBase {
    lastName: string;
    firstName: string;
    email: string,
    emailConfirmed: boolean;
    phone: string;
}

const UserSchema: Schema = new Schema({
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailConfirmed: { type: Boolean, required: true, default: false },
    phone: { type: String, required: false, default: "" },
    created: { type: Date, required: true, default: moment().utc() },
    createdBy: { type: String, required: true, default: "create_account" },
    updated: { type: Date, required: true, default: moment().utc() },
    updatedBy: { type: String, required: true, default: "create_account" }
});

UserSchema.pre("save", function (next) {
    if (this["lastName"] != null) this["lastName"] = this["lastName"].toUpperCase();
    if (this["firstName"] != null) {
        if (this["firstName"].length > 0) {
            this["firstName"] = this["firstName"].substring(0, 1).toUpperCase() + this["firstName"].substring(1);
        }
    }
    this["updated"] = moment().utc();
    next();
});

UserSchema.pre("updateOne", function (next) {
    if (this.getUpdate().lastName != null) this.getUpdate().lastName = this.getUpdate().lastName.toUpperCase();
    if (this.getUpdate().firstName != null) {
        if (this.getUpdate().firstName.length > 0) {
            this.getUpdate().firstName = this.getUpdate().firstName.substring(0, 1).toUpperCase() + this.getUpdate().firstName.substring(1);
        }
    }
    this.getUpdate().updated = moment().utc();
    next();
});

export default model<IUser>('Users', UserSchema);

