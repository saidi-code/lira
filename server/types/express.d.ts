// `export {}` keeps this file a *module*, which `declare global` requires — an
// empty top-level import used to serve the same purpose but was flagged as unused
// by lint. Deleting it silently disables the augmentation below (every
// `req.user` in the codebase then fails to compile: ERR TS2339).
export {};

declare global {
    namespace Express {
        interface Request {
            user?: any;
            auth?: any;
        }
    }
}
