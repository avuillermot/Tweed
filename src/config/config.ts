import { connect, connection } from 'mongoose';

export class ApplicationDbSettings {
    protected dbUrl: string = <string>process.env.MONGOHOST;
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
            console.log(connection.name);
        }
    }

    public dropDb(): void {
        connection.dropDatabase();
    }
}

export class ApplicationSetting {
    public static jtokenSecretKey: string = "PERRIGNY21160";
}

