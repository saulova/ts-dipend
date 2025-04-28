import http, { Server } from "http";
import process from "process";

import { GraphDataHandler, RequestHandler } from "./handlers";
import { IDependencyContainerGraph } from "./interfaces";

export class DipendGraphServer {
  private graphDataHandler: GraphDataHandler;

  private server: Server;

  constructor(
    dependencyContainer: IDependencyContainerGraph,
    private host?: string,
    private port?: number,
  ) {
    const { envHost, envPort } = this.getEnvs();

    this.host = host || envHost;
    this.port = port || envPort;

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
    const envHost = process.env.SERVER_HOST || "127.0.0.1";
    const envPort = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 4321;
    return { envHost, envPort };
  }

  public start() {
    this.server.listen(this.port, this.host, () => {
      console.log(`Serving the Dipend Graph at http://${this.host}:${this.port}`);
    });
  }
}
