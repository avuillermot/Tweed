import { Schema, Document, model } from "mongoose";
import moment from "moment";

export interface ILog extends Document {
    application: string,
    httpMethod: string,
    service: string,
    requestBody: string,
    requestQuery: string,
    environment: string,
    statusCode: number,
    statusMessage: string,
    created: Date,
    message: string,
    level: string
}

const LogSchema: Schema = new Schema({
    application: { type: String, required: false, default: 'tweed' },
    service: { type: String, required: false},
    requestBody: { type: String, required: false},
    requestQuery: { type: String, required: false },
    environment: { type: String, required: false, default: 'local' },
    created: { type: Date, required: false },
    message: { type: String, required: false },
    level: { type: String, required: false, default: 'info' },
    statusCode: { type: Number, required: false },
    statusMessage: { type: String, required: false }
});
const Log = model<ILog>('Log', LogSchema);
export default Log;

export class Logger {
    public static async write(item: ILog) {
        if (item.statusCode != 200) item.level = 'error';
        item.created = moment().utc().toDate();
        Log.create(item);
	}
}