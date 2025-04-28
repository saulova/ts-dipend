import fs from "fs";
import path from "path";
import { GraphDataHandler } from "./graph-data-handler";
import { IncomingMessage, ServerResponse } from "http";

const SCRIPT_DIR = __dirname;
const DIRECTORY = path.join(SCRIPT_DIR, "../public");

export class RequestHandler {
  constructor(private graphDataHandler: GraphDataHandler) {}

  apiDataRouteAction(res: ServerResponse) {
    res.writeHead(200, { "Content-Type": "application/json" });
    const response = JSON.stringify(this.graphDataHandler.handle());
    res.end(response);
  }

  getContentType(filePath: string) {
    const ext = path.extname(filePath);
    const contentTypes: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    return contentTypes[ext] || "application/octet-stream";
  }

  homeRouteAction(req: IncomingMessage, res: ServerResponse) {
    let filePath = path.join(
      DIRECTORY,
      req.url === undefined || req.url === "/" ? "index.html" : req.url,
    );

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) filePath = path.join(DIRECTORY, "index.html");
      fs.readFile(filePath, (error, content) => {
        if (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("500 - Internal Server Error");
        } else {
          res.writeHead(200, {
            "Content-Type": this.getContentType(filePath),
          });
          res.end(content);
        }
      });
    });
  }
}
