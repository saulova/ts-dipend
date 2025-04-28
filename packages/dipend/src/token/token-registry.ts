import { randomUUID } from "node:crypto";

export class TokenRegistry {
  public readonly id: string;
  public readonly token: unknown;

  constructor(token: unknown) {
    this.id = randomUUID();
    this.token = token;
  }
}
