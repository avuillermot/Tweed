import { Document } from "mongoose";

export interface IBase extends Document {
    id: string,
    createdBy: string,
    created: Date,
    updated: Date,
    updatedBy: string
}

