import Short, { uuid } from "short-uuid";
import "dotenv/config";
import { ObjectExtensions } from "../Utility/TypeExtensions";
import { UrlMapping, NewUrlMapping, urlmappings } from "../Schemas/urlmapping";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, lt } from "drizzle-orm";
import { ErrorBlock } from "../Utility/ProxyEntities";

export default class UrlEncoderService {
    private translator: Short.Translator;
    private urlHoldingDuration: number;
    private db_connection: PostgresJsDatabase<Record<string, never>>;
    constructor(databaseOption: PostgresJsDatabase<Record<string, never>>) {
        this.translator = Short();
        this.urlHoldingDuration = -1;
        this.db_connection = databaseOption;
        const urlHoldingPeriod: string = process.env.HOLD_DURATION?.toString() ?? "";
        if (!ObjectExtensions.isNullOrUndefined(urlHoldingPeriod) && !ObjectExtensions.isEmptyString(urlHoldingPeriod)) {
            this.urlHoldingDuration = parseInt(urlHoldingPeriod);
        }
    }

    public async getOriginalUrl(shortUrlId: string): Promise<string> {

        let presentShortUrl: UrlMapping[] = [];
        try {
            presentShortUrl = await this.db_connection.select().from(urlmappings).where(eq(urlmappings.shortUrlId, shortUrlId));
        }
        catch (err: any) {
            console.error(err);
            return Promise.reject(err);
        }

        if(presentShortUrl.length > 0) {
            let originalUrl: string = presentShortUrl[presentShortUrl.length - 1].originalUrl ?? "";

            if(!ObjectExtensions.isNullOrUndefined(originalUrl) && !ObjectExtensions.isEmptyString(originalUrl)) {
                return Promise.resolve(originalUrl);
            }
            else {
                let errorBody: ErrorBlock = {
                    Id: this.translator.uuid(),
                    ErrorMessage: "Invalid Url"
                };
                return Promise.reject(errorBody);
            }
        }
        else {
            let errorBody: ErrorBlock = {
                Id: this.translator.uuid(),
                ErrorMessage: "Invalid Url"
            };
            return Promise.reject(errorBody);
        }
    }

    public async generateShortUrl(originalUrl: string): Promise<string> {
        const todayDate: Date = new Date(new Date().setHours(0, 0, 0, 0));

        try {
            const deleteShortUrls: UrlMapping[] = await this.db_connection.delete(urlmappings)
                .where(lt(urlmappings.expiryDate, todayDate))
                .returning();

            if (deleteShortUrls.length > 0) {
                console.log(`[server] Expired entries deleted: Count = ${deleteShortUrls.length}`);
            }
        }
        catch (err: any) {
            console.error(err);
            return Promise.reject(err);
        }

        let presentShortUrl: UrlMapping[] = [];
        try {
            presentShortUrl = await this.db_connection.select().from(urlmappings).where(eq(urlmappings.originalUrl, originalUrl));
        }
        catch (err: any) {
            console.error(err);
            return Promise.reject(err);
        }

        let shortUrlId: string = "";
        if (presentShortUrl.length > 0) {
            shortUrlId = presentShortUrl[presentShortUrl.length - 1].shortUrlId ?? "";

            return Promise.resolve(shortUrlId);
        }
        else {
            // generate new short url
            shortUrlId = this.translator.generate();
            let shortUrlData: NewUrlMapping = {
                creationDate: todayDate,
                expiryDate: this.addDaysToToday(this.urlHoldingDuration),
                originalUrl: originalUrl,
                shortUrlId: shortUrlId
            }

            return await this.insertNewShortUrl(shortUrlData)
                .then((values: UrlMapping[]): any => {
                    if (!ObjectExtensions.isNullOrUndefined(values) && values.length > 0) {
                        let shortUrlId: string = values[values.length - 1].shortUrlId ?? "";
                        return Promise.resolve(shortUrlId)
                    }
                    else {
                        let errorBody: ErrorBlock = {
                            Id: this.translator.uuid(),
                            ErrorMessage: "Insertion failed at database level"
                        }
                        return Promise.reject(errorBody);
                    }
                })
                .catch((reason: any): any => {
                    console.error(reason);
                    return Promise.reject(reason);
                });
        }
    }

    private async insertNewShortUrl(shortUrlInfo: NewUrlMapping): Promise<UrlMapping[]> {
        try {
            return this.db_connection.insert(urlmappings).values(shortUrlInfo).returning();
        }
        catch (reason: any) {
            return Promise.reject(reason);
        }
    }

    private addDaysToToday(days: number) {
        let date = new Date(new Date().setHours(0, 0, 0, 0));
        date.setDate(date.getDate() + days);
        return date;
    }
}