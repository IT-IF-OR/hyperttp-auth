import type { HyperPlugin } from "@hyperttp/types";
import type { AuthPluginOptions } from "./types.js";
declare module "@hyperttp/types" {
    interface HyperClientOptions {
        /** Auth plugin configuration made available to other Hyperttp plugins. */
        auth?: AuthPluginOptions;
    }
}
/**
 * Creates a blocking, START-phase plugin that attaches credentials to outgoing
 * requests. REST conveniences expect an object input with a `url` and/or
 * `headers` property; other protocols should use `apply`.
 */
export declare function withAuth(options?: AuthPluginOptions): HyperPlugin;
//# sourceMappingURL=plugin.d.ts.map