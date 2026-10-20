import type { SendRequest } from "@hyperttp/types";
import type { AuthCredentials, ValueProvider } from "./types.js";
/** Key used to expose a non-secret credential identity to cache/inflight plugins. */
export declare const AUTH_IDENTITY_STATE_KEY = "@hyperttp/auth.identity";
export interface ResolvedAuthOptions {
    readonly credentials?: AuthCredentials;
    readonly identityProvider?: ValueProvider;
}
export declare function resolveAuthOptions(options: {
    readonly credentials?: AuthCredentials;
    readonly rest?: AuthCredentials;
    readonly bearer?: AuthCredentials;
    readonly getCacheKey?: ValueProvider;
}): ResolvedAuthOptions;
export declare function assertAuthConfiguration(options: ResolvedAuthOptions, hasApply: boolean): void;
export declare function applyCredentials(request: SendRequest, credentials: AuthCredentials): Promise<SendRequest>;
export declare function normalizeOrigins(origins: readonly string[] | undefined): ReadonlySet<string> | undefined;
export declare function isAllowedOrigin(request: SendRequest, allowedOrigins: ReadonlySet<string> | undefined): boolean;
//# sourceMappingURL=auth.d.ts.map