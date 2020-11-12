import { expect } from 'chai';
import "mocha";
import UserController, { ICreateUser, IUpdateUser } from "../src/controllers/security/user.controller";
import User, { IUser} from "../src/models/security/user";
import { ApplicationDbTestSettings } from "../src/config/config";
import Login, { ILogin } from '../src/models/security/login';

describe('Test about user & login', () => {
    let dbSettings: ApplicationDbTestSettings = new ApplicationDbTestSettings();
    dbSettings.connection();
    dbSettings.dropCollection("users");
    dbSettings.dropCollection("logins");

    let ctrl: UserController = new UserController();
    it('First name in upper case & last name in upper case', async () => {
        
        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "vuillermot", email: "a1@test.com", password: "123456", confirmPassword: "123456" };
        let user:IUser = await ctrl.create(newUser);
        expect("Alex").equal(user.firstName);
        expect("VUILLERMOT").equal(user.lastName);
    });

    it('First name is not empty', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "", lastName: "vuillermot", email: "a2@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user: IUser = await ctrl.create(newUser);
            expect(true, "first name is empty and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true,"first name is empty and control is ok").equal(true);
        }
    });

    it('Frst name is not null', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: null, lastName: "vuillermot", email: "a3@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "first name is null and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "first name is null and control is ok").equal(true);
        }
    });

    it('Last name is not empty', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "", email: "a4@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user: IUser = await ctrl.create(newUser);
            expect(true, "last name is empty and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "last name is empty and control is ok").equal(true);
        }
    });

    it('Last name is not null', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: null, email: "a5@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "last name is null and control is not ok").equal(false);
        }
        catch (ex) {
            expect(true, "last name is null and control is ok").equal(true);
        }
    });

    it('Email is unique', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "vuillermot", email: "a1@test.com", password: "123456", confirmPassword: "123456" };
        try {
            let user:IUser = await ctrl.create(newUser);
            expect(true, "Email is duplicate").equal(false);
        }
        catch (ex) {
            expect(true, "Email is unique").equal(true);
        }
    });

    it('Confirm email', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "vuillermot", email: "confirm@test.com", password: "123456", confirmPassword: "123456" };
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

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "vuillermot", email: "confirm@test.com", password: "123456", confirmPassword: "12345" };
        try {
            let user: IUser = await ctrl.create(newUser);
        }
        catch (ex) {
            expect("Error: PASSWORD_DIFF").equal(ex.toString());
        }
    });

    it('Password too short', async () => {

        let newUser: ICreateUser = <ICreateUser>{ firstName: "alex", lastName: "vuillermot", email: "confirm@test.com", password: "12345", confirmPassword: "12345" };
        try {
            let user: IUser = await ctrl.create(newUser);
        }
        catch (ex) {
            expect("Error: PASSWORD_SHORT").equal(ex.toString());
        }
    });

    it('Update user', async () => {

        let login:ILogin = await Login.findOne({ login: "confirm@test.com" });
        let upUser: IUpdateUser = <IUpdateUser>{ firstName: "eleonore", lastName: "rouhana", id:login._id };

        let result: boolean = await ctrl.update(upUser);
        let user:IUser = await User.findOne({ _id: login.idUser });

        expect(result, "Update not return true").equal(true);
        expect(user.lastName, "Last name is not correct").equal("ROUHANA");
    });

    it('Logon', async () => {

        let result: { login: string } = await ctrl.logon("confirm@test.com", "123456");
        console.log(result);
        //let login: ILogin = await Login.findOne({ login: "confirm@test.com", password: "123456" });


    });

    it('Generate password', async () => {

        let result:boolean = await ctrl.generatePassword("confirm@test.com","avuillermot@hotmail.com");
        //let login: ILogin = await Login.findOne({ login: "confirm@test.com", password: "123456" });


    });
});