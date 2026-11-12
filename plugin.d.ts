import type { HyperPlugin } from "@hyperttp/types";
import type { AuthPluginOptions } from "./types.js";
declare module "@hyperttp/types" {
    interface HyperClientOptions {
        /** Used by withAuth() when no explicit options are provided. */
        auth?: AuthPluginOptions;
    }
}
/** Creates a blocking START-phase plugin for outgoing authentication. */
export declare function withAuth(options?: AuthPluginOptions): HyperPlugin;
//# sourceMappingURL=plugin.d.ts.map