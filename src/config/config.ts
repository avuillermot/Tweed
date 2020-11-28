import { connect, connection } from 'mongoose';

export class ApplicationDbSettings {
    protected dbUrl: string = "mongodb://localhost:27017/mytest";
    protected debug: boolean = true;

    public connection(): void {
        connection.on('error', err => {
            console.log(err);
        });
        connect(this.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).catch(error => console.log(error));
        if (this.debug) {
            console.log("open connection :");
            console.log(connection.host);
            console.log(connection.port);
        }
        }

    public dropCollection(collection: string): void {
        connection.dropCollection(collection);
    }
}

export class ApplicationDbTestSettings extends ApplicationDbSettings {
    constructor() {
        super();
        this.dbUrl = "mongodb://localhost:27017/unitTestDb";
    }
}

export class ApplicationSetting {
    public static jtokenSecretKey: string = "PERRIGNY21160";
}

