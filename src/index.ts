import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import PostgreConnection from "./Connection/connect";
import cors, { CorsOptions } from 'cors';
import { ShortUrlRequest, ShortUrlResponse } from "./Utility/ProxyEntities";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ObjectExtensions } from "./Utility/TypeExtensions";
import UrlEncoderService from "./Services/UrlEncoderService";
import { v4 as uuidv4 } from "uuid";
import morgan from "morgan";

dotenv.config();

const app: Express = express();
const port: any = process.env.PORT || 3000;

const connect_obj: PostgreConnection = new PostgreConnection();
connect_obj.generateMigrations();

app.use(express.json());
app.use(morgan('tiny'));
app.disable("x-powered-by");

const corsOptions: CorsOptions = {
  origin: "*",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  methods: "POST"
};

app.get("/", cors(), (req: Request, res: Response) => {
  let net_conn = {
    error: "Not Found"
  }
  return res.status(404).json(net_conn);
});

app.get("/:shortUrlId", cors(), async (req: Request, res: Response) => {
  let shortUrl: string = req.params.shortUrlId;
  console.log(`[server]: Search Id ===> ${shortUrl}`);
  await connect_obj.createQueryClient()
    .then((db_conn: PostgresJsDatabase<Record<string, never>>): any => {
      if (!ObjectExtensions.isNullOrUndefined(db_conn)) {
        let UrlEncoder: UrlEncoderService = new UrlEncoderService(db_conn);

        UrlEncoder.getOriginalUrl(shortUrl)
          .then((value: string): any => {
            if (!ObjectExtensions.isNullOrUndefined(value) && !ObjectExtensions.isEmptyString(value)) {
              //return res.status(302).redirect(value);
              return res.status(200).json({originalUrl: value});
            }
            else {
              let errorBody = {
                id: uuidv4(),
                errorMessage: "Invalid Url: Failed to redirect."
              };

              return res.status(400).json(errorBody);
            }
          })
          .catch((reason: any): any => {
            let errorBody = {
              id: uuidv4(),
              errorMessage: "Exception in the server",
              error: reason
            };

            return res.status(500).json(errorBody);
          });
      }
      else {
        let errorBody = {
          id: uuidv4(),
          errorMessage: "Database connection failed."
        };

        return res.status(400).json(errorBody);
      }
    })
    .catch((reason: any): any => {
      let errorBody = {
        id: uuidv4(),
        errorMessage: "Exception in the server: \r\n" + JSON.stringify(reason)
      };

      return res.status(500).json(errorBody);
    });
});

app.post("/shorturl", cors(corsOptions), async (req: Request, res: Response) => {
  let urlRequest: ShortUrlRequest = {};
  if (!ObjectExtensions.isNullOrUndefined(req.body.urlString) && !ObjectExtensions.isEmptyString(req.body.urlString)) {
    urlRequest = {
      originalUrl: req.body.urlString
    };
  }
  else {
    return res.status(400).json({ error: "Bad Request"});
  }

  console.log(`[server]: Request Logged: \r\n ${JSON.stringify(urlRequest)}`);
  await connect_obj.createQueryClient()
    .then((db_conn: PostgresJsDatabase<Record<string, never>>): any => {
      if (!ObjectExtensions.isNullOrUndefined(db_conn)) {
        let UrlEncoder: UrlEncoderService = new UrlEncoderService(db_conn);

        let shortUrl: string = "";
        UrlEncoder.generateShortUrl(urlRequest.originalUrl ?? "")
          .then((value: string): any => {
            if (!ObjectExtensions.isNullOrUndefined(value) && !ObjectExtensions.isEmptyString(value)) {
              shortUrl = value;

              let response: ShortUrlResponse = {
                id: uuidv4(),
                shortUrl: shortUrl
              };

              return res.status(200).send(response);
            }
            else {
              let errorBody = {
                id: uuidv4(),
                errorMessage: "Failed to generate short url"
              };

              return res.send(500).send(errorBody);
            }
          })
          .catch((reason: any): any => {
            let errorBody = {
              id: uuidv4(),
              errorMessage: "Exception in the server: \r\n" + JSON.stringify(reason)
            };

            return res.send(500).send(errorBody);
          });
      }
      else {
        let errorBody = {
          id: uuidv4(),
          errorMessage: "Database connection failed."
        };

        return res.send(500).send(errorBody);
      }
    })
    .catch((reason: any): any => {
      let errorBody = {
        id: uuidv4(),
        errorMessage: "Exception in the server: \r\n" + JSON.stringify(reason)
      };

      return res.send(500).send(errorBody);
    });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});