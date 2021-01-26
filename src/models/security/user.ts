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
    created: { type: Date, required: true, default: null },
    createdBy: { type: String, required: true, default: "create_account" },
    updated: { type: Date, required: true, default: null},
    updatedBy: { type: String, required: true, default: "create_account" }
});

UserSchema.path('email').validate(function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email); // Assuming email has a text attribute
}, 'The e-mail field must be valid.')

export class UserHelper {
    public static format(user: any): IUser {
        if (user.lastName != null && user.lastName != undefined) user.lastName = user.lastName.toUpperCase();
        if (user.firstName != null && user.firstName != undefined) {
            if (user.firstName.length > 0) {
                user.firstName = user.firstName.substring(0, 1).toUpperCase() + user.firstName.substring(1);
            }
        }
        user.updated = moment().utc().toDate();
        if (user.created == null) user.created = moment().utc().toDate();
        return user;
    }
};

export default model<IUser>('Users', UserSchema);


