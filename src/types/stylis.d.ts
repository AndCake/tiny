declare module "stylis" {
  export interface StyleisOptions {
    prefix?: boolean;
    compress?: boolean;
    semicolon?: boolean;
  }

  export type Middleware = (element: string) => string;

  export function compile(
    selector: string,
    options?: StyleisOptions,
  ): string[];

  export function serialize(
    compiled: string[],
    callback: Middleware,
  ): string;

  export function middleware(
    callbacks: Middleware[],
  ): Middleware;

  export function prefixer(element: string): string;
  export function stringify(element: string): string;

  interface Stylis {
    compile: typeof compile;
    serialize: typeof serialize;
    middleware: typeof middleware;
    prefixer: typeof prefixer;
    stringify: typeof stringify;
  }

  export default Stylis;
}
