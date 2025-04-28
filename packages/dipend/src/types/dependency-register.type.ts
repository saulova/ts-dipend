import { TClassConstructor } from "./class-constructor.type";

export type TDependencyRegister<T> = {
  lifecycle: string;
  instance?: T;
  classConstructor?: TClassConstructor;
  builder?: () => T;
  dependenciesClassConstructor?: Array<unknown>;
};
