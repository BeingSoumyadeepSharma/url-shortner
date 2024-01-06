import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from "dotenv";
import { ObjectExtensions } from '../Utility/TypeExtensions';
import { ErrorBlock } from '../Utility/ProxyEntities';
import Short from 'short-uuid';

export default class PostgreConnection {
    private connectionString: string;
    private translator: Short.Translator;
    constructor(options?: any){
        this.translator = Short();
        dotenv.config();
        this.connectionString = process.env.DATABASE_URL?.toString() ?? "";
    }

    public async generateMigrations(): Promise<void> {
        if(!ObjectExtensions.isNullOrUndefined(this.connectionString) && !ObjectExtensions.isEmptyString(this.connectionString)){
            const migrationClient: postgres.Sql<{}> = postgres(this.connectionString, { max: 1 });
            const db: PostgresJsDatabase<Record<string,never>> = drizzle(migrationClient);
            await migrate(db, { migrationsFolder: "drizzle" });
            await migrationClient.end();
            return Promise.resolve();
        }
        else{
            let errorBody: ErrorBlock = {
                ErrorMessage: "Connection String is Missing from the Configurations."
            }
            return Promise.reject(errorBody);
        }
    }

    public async createQueryClient(): Promise<PostgresJsDatabase<Record<string,never>>> {
        if(!ObjectExtensions.isNullOrUndefined(this.connectionString) && !ObjectExtensions.isEmptyString(this.connectionString)){
            const queryClient: postgres.Sql<{}> = postgres(this.connectionString);
            const db: PostgresJsDatabase<Record<string,never>> = drizzle(queryClient);
            return Promise.resolve(db);
        }
        else {
            let errorBody: ErrorBlock = {
                Id: this.translator.uuid(),
                ErrorMessage: "Connection String is Missing from the Configurations."
            }
            return Promise.reject(errorBody);
        }
    }
}