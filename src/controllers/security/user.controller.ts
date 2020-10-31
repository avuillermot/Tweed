import User, { IUser } from "../../models/security/user";
import Login, { ILogin } from "../../models/security/login";

let USER_ERROR: any = {
    PASSWORD_DIFF: "PASSWORD_DIFF",
    PASSWORD_SHORT: "PASSWORD_SHORT" 
};

export interface ICreateUser {
    firstName: IUser['firstName'];
    lastName: IUser['lastName'];
    password: ILogin['password'];
    confirmPassword: string;
    email: IUser['email'];
}

export interface IUpdateUser {
    id: ILogin["_id"];
    firstName: IUser['firstName'];
    lastName: IUser['lastName'];
}

export default class ServiceUser {
    public async create(user: ICreateUser): Promise<IUser> {

        if (user.confirmPassword != user.password) throw new Error(USER_ERROR.PASSWORD_DIFF);
        if (user.password.length < 6) throw new Error(USER_ERROR.PASSWORD_SHORT);

        let newUsr: IUser = await User.create(<any>user);

        let login: ILogin = new Login(user);
        login.login = user.email;
        login.idUser = newUsr._id;
        let newLogin: ILogin = await Login.create(login);
        return newUsr;
    }

    public async confirmMail(id: string): Promise<boolean> {
        let back: boolean = true;
        let updatedBy: string = "confirm_mail";
        let login: ILogin = await Login.findOne({ _id: id });
        if (login != null) {
            let res: any = await Login.updateOne({ _id: id }, { status: "ACTIVE", updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No login set active");

            res = await User.updateOne({ _id: login.idUser }, { emailConfirmed: true, updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No user set active");
        }
        else throw new Error("No user/login known");
        return back;
    }

    public async update(user: IUpdateUser): Promise<boolean> {
        let back: boolean = true;
        let updatedBy: string = "update_user";
        let login: ILogin = await Login.findOne({ _id: user.id });
        if (login != null) {
            let res: any = await User.updateOne({ _id: login.idUser }, { lastName: user.lastName, firstName: user.firstName, updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) back = false;
        }
        else back = false;
        return back;
    }
}