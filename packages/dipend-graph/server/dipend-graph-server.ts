import http, { Server } from "http";
import process from "process";

import { GraphDataHandler, RequestHandler } from "./handlers";

export class DipendGraphServer {
  private graphDataHandler: GraphDataHandler;

  private server: Server;

  private host: string;
  private port: number;

  constructor(dependencyContainer: any, config?: { host?: string; port?: number }) {
    const { envHost, envPort } = this.getEnvs();

    this.host = config?.host || envHost || "127.0.0.1";
    this.port = config?.port || envPort || 4321;

    this.graphDataHandler = new GraphDataHandler(dependencyContainer);

    this.server = http.createServer((req, res) => {
      const handler = new RequestHandler(this.graphDataHandler);
      if (req.url === "/api/data") {
        handler.apiDataRouteAction(res);
      } else {
        handler.homeRouteAction(req, res);
      }
    });
  }

  private getEnvs() {
    const envHost = process.env.DIPEND_GRAPH_SERVER_HOST;
    const envPort = process.env.DIPEND_GRAPH_SERVER_PORT
      ? parseInt(process.env.DIPEND_GRAPH_SERVER_PORT, 10)
      : undefined;

    return { envHost, envPort };
  }

  public start() {
    this.server.listen(this.port, this.host, () => {
      console.log(`Serving the Dipend Graph at http://${this.host}:${this.port}`);
    });
  }
}
