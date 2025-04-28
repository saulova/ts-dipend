import { vi } from "vitest";

export type SpiedClass<T> = {
  [K in keyof T as K extends "constructor"
    ? never
    : K extends string
      ? `${K}Spy`
      : never]: T[K];
};

export class SpyHelper {
  public static spyOnAllMethods<T extends object>(instance: T): SpiedClass<T> {
    const prototype = Object.getPrototypeOf(instance);
    const spyObject = {} as SpiedClass<T>;

    [
      ...new Set([
        ...Object.getOwnPropertyNames(prototype),
        ...Object.getOwnPropertyNames(instance),
      ]),
    ].forEach((method) => {
      if (
        (typeof prototype[method] === "function" ||
          typeof (instance as any)[method] === "function") &&
        method !== "constructor" &&
        method !== "interfaces"
      ) {
        const spyMethod = vi.spyOn(instance, method as any);
        (spyObject as any)[`${method}Spy`] = spyMethod;
      }
    });

    return spyObject;
  }
}
