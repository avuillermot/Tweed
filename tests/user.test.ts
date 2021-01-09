import { expect } from 'chai';
import "mocha";
import UserController, { ICreateUser, IUpdateUser } from "../src/controllers/security/user.controller";
import User, { IUser} from "../src/models/security/user";
import { ApplicationDbSettings } from "../src/config/config";
import Login, { ILogin } from '../src/models/security/login';

describe('Test about user & login', () => {
    let dbSettings: ApplicationDbSettings = new ApplicationDbSettings();
    dbSettings.connection();
    dbSettings.dropDb();

    let ctrl: UserController = new UserController();
    it('First name in upper case & last name in upper case', async () => {
        
        let newUser: ICreateUser = <ICreateUser>{ firstName: "bruce", lastName: "willis", email: "a1@test.com", password: "123456", confirmPassword: "123456" };
        let user:IUser = await ctrl.create(newUser);
        expect("Bruce").equal(user.firstName);
        expect("WILLIS").equal(user.lastName);
        expect(user.created).not.equal(null, "Created ne peut pas etre null");
        expect(user.createdBy).equal("create_account", "Should be create_account");
        expect(user.updated).not.equal(null, "Created ne peut pas etre null");
        expect(user.updatedBy).equal("create_account", "Shoud be create account");
    });

    it('First name is not empty', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "", lastName: "willis", email: "a2@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user: IUser = await ctrl.create(newUser);
            expect(true, "first name is empty and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true,"first name is empty and control is ok").equal(true);
        }
    });

    it('Frst name is not null', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: null, lastName: "willis", email: "a3@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "first name is null and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "first name is null and control is ok").equal(true);
        }
    });

    it('Last name is not empty', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "bruce", lastName: "", email: "a4@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user: IUser = await ctrl.create(newUser);
            expect(true, "last name is empty and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "last name is empty and control is ok").equal(true);
        }
    });

    it('Last name is not null', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "bruce", lastName: null, email: "a5@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "last name is null and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "last name is null and control is ok").equal(true);
        }
    });

    it('Email is unique', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "bruce", lastName: "willis", email: "a1@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "Email is duplicate").equal(false);
        }
        catch (ex) {
            expect(true, "Email is unique").equal(true);
        }
    });

    it('On confirm account (from email)', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "bruce", lastName: "willis", email: "confirm@test.com", password: "123456", confirmPassword: "123456" };
        let user:IUser = await ctrl.create(newUser);
        let login: ILogin = await Login.findOne({ login: "confirm@test.com" });
        let result: boolean = await ctrl.confirmMail(login._id);
        expect(result, "Confirm mail return true").equal(true);

        login = await Login.findOne({ login: "confirm@test.com" });
        expect(login.status, "Login must be active").equal("ACTIVE");

        user = await User.findOne({ _id: user._id });
        expect(user.emailConfirmed, "User email must be confirmed").equal(true);
    });

    it('Password & confirm password different', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "harrison", lastName: "ford", email: "hford@test.com", password: "123456", confirmPassword: "12345" };
        try {
            let user: IUser = await ctrl.create(newUser);
        }
        catch (ex) {
            expect("Error: PASSWORD_DIFF").equal(ex.toString());
        }
    });

    it('Password too short', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "sylvester", lastName: "stallone", email: "sstallone@test.com", password: "12345", confirmPassword: "12345" };
        try {
            let user: IUser = await ctrl.create(newUser);
        }
        catch (ex) {
            expect("Error: PASSWORD_SHORT").equal(ex.toString());
        }
    });

    it('Update user', async () => {

        let login:ILogin = await Login.findOne({ login: "confirm@test.com" });
        let upUser: IUpdateUser = <IUpdateUser>{ firstName: "demi", lastName: "moore", id:login._id };

        let result: boolean = await ctrl.update(upUser, "current_user");
        let user:IUser = await User.findOne({ _id: login.idUser });

        expect(result, "Update not return true").equal(true);
        expect(user.lastName, "Last name is not correct").equal("MOORE");
        expect(user.updatedBy).equal("current_user", "Should be current_user");
    });

    it('No Logon', async () => {
        try {
            let result: { login: string } = await ctrl.logon("confirm@test.com", "1234567");
            expect(1).equal(2, "No login shoud be found");
        }
        catch (ex) {
            expect(ex.message).equal("Login not found", "Login should be null");
        }
       
    });

    it('Logon', async () => {
        let result: { login: string } = await ctrl.logon("confirm@test.com", "123456");
    });

    it('Generate password', async () => {
        await ctrl.saveNewPassword("confirm@test.com");
        let login:ILogin = await Login.findOne({login: "confirm@test.com"});
        expect(login.status).equal("MAIL_NEW_PASSWORD_TO_SEND", "Should be MAIL_NEW_PASSWORD_TO_SEND");
    });
});