import User, { IUser, UserHelper } from "../../models/security/user";
import Login, { ILogin } from "../../models/security/login";
import { Router } from 'express';

export interface IUpdateUser {
    id: ILogin["_id"];
    firstName: IUser['firstName'];
    lastName: IUser['lastName'];
}

const router: Router = Router();
export class UpdateUserController {
    public async update(user: IUpdateUser, updatedBy: string): Promise<boolean> {
        let back: boolean = true;
        let login: ILogin = await Login.findOne({ _id: user.id });
        if (login != null) {
            let toSave = UserHelper.format(user);
            toSave.updatedBy = updatedBy;
            let res: any = await User.updateOne({ _id: login.idUser }, toSave, { runValidators: true });
            if (res.n == res.nModified && res.ok == res.nModified && res.ok != 1) back = false;
        }
        else back = false;
        return back;
    }
}

export default router;