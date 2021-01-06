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
    let _update = this["_update"];
    if (_update["lastName"] != null) _update["lastName"] = _update["lastName"].toUpperCase(); 
    if (_update["firstName"] != null) {
        if (_update["firstName"].length > 0) {
            _update["firstName"] = _update["firstName"].substring(0, 1).toUpperCase() + _update["firstName"].substring(1);
        }
    }
    _update["updated"] = moment().utc();
    next();
});

export default model<IUser>('Users', UserSchema);

