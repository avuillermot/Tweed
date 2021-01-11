import generator from "generate-password";
import User, { IUser } from "../../models/security/user";
import Login, { ILogin } from "../../models/security/login";

let USER_ERROR: any = {
    PASSWORD_DIFF: "PASSWORD_DIFF",
    PASSWORD_SHORT: "PASSWORD_SHORT",
    ALREADY_EXIST: "ALREADY_EXIST"
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

        let exist: IUser = await User.findOne({ email: user.email });
        if (exist != null && exist != undefined) throw new Error(USER_ERROR.ALREADY_EXIST);
        if (user.confirmPassword != user.password) throw new Error(USER_ERROR.PASSWORD_DIFF);
        if (user.password.length < 6) throw new Error(USER_ERROR.PASSWORD_SHORT);

        let newUsr: IUser = await User.create(<any>user);

        let login: ILogin = new Login(user);
        login.login = user.email;
        login.idUser = newUsr._id;
        let newLogin: ILogin = await Login.create(login);
        return newUsr;
    }

    public async setAccountActive(clogin: string): Promise<boolean> {
        let back: boolean = true;
        let updatedBy: string = "account_active";
        let login: ILogin = await Login.findOne({ login: clogin });
        if (login != null) {
            let res: any = await Login.updateOne({ login: clogin }, { status: "ACTIVE", updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No login set active");

            res = await User.updateOne({ _id: login.idUser }, { emailConfirmed: true, updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("No user set active");
        }
        else throw new Error("No user/login known");
        return back;
    }

    public async update(user: IUpdateUser, updatedBy: string): Promise<boolean> {
        let back: boolean = true;
        let login: ILogin = await Login.findOne({ _id: user.id });
        if (login != null) {
            let res: any = await User.updateOne({ _id: login.idUser }, { lastName: user.lastName, firstName: user.firstName, updatedBy: updatedBy });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) back = false;
        }
        else back = false;
        return back;
    }

    public async logon(login: string, password: string): Promise<{ login: string, email:string, entity:string }> {
        let logins: ILogin[] = await Login.find({ login: login, password: password, status: "ACTIVE" });
        
        if (logins.length == 0) throw new Error("Login not found");
        if (logins.length > 1) throw new Error("Too many login");

        let currentLogin: ILogin = logins[0];

        return { login: currentLogin.login, email: currentLogin.login, entity: "" };
    }

    public async saveNewPassword(login: string): Promise<void> {
        let pwds:string[] = generator.generateMultiple(1, { length: 10 });
        let res = await Login.updateOne({ login: login }, { password: pwds[0], status: "MAIL_NEW_PASSWORD_TO_SEND" });
        if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) throw new Error("Generate password error");
    }
}