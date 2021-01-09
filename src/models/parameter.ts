import { Schema, Document, model } from "mongoose";


export interface IParameter extends Document {
    id: string,
    KEY: string,
    VALUE: string
}

const ParameterSchema: Schema = new Schema({
    KEY: { type: String, required: true, unique: true },
    VALUE: { type: String, required: true }

});

export default model<IParameter>('Parameter', ParameterSchema);