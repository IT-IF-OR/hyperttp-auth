import type { HyperPlugin } from "@hyperttp/types";
import {
  AUTH_IDENTITY_STATE_KEY,
  applyCredentials,
  assertAuthConfiguration,
  isAllowedOrigin,
  normalizeOrigins,
  resolveAuthOptions,
} from "./auth.js";
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
export function withAuth(options?: AuthPluginOptions): HyperPlugin {
  if (!options) {
    return { name: "hyperttp-auth" };
  }

  const allowedOrigins = normalizeOrigins(options.allowedOrigins);
  const protocol = options.rest ? "rest" : options.protocol;
  const resolved = resolveAuthOptions(options);
  assertAuthConfiguration(resolved, Boolean(options.apply));

  return {
    name: "hyperttp-auth",
    phase: "START",
    mode: "blocking",
    onRequest: async (request, _pluginContext, requestContext) => {
      if (protocol && request.protocol !== protocol) {
        return;
      }

      if (!isAllowedOrigin(request, allowedOrigins)) {
        return;
      }

      if (
        options.shouldAuthenticate &&
        !(await options.shouldAuthenticate(request, requestContext))
      ) {
        return;
      }

      if (resolved.identityProvider && requestContext) {
        const identity = await resolved.identityProvider();
        if (identity) {
          requestContext.state[AUTH_IDENTITY_STATE_KEY] = identity;
        }
      }

      let authenticatedRequest = request;
      if (resolved.credentials) {
        authenticatedRequest = await applyCredentials(authenticatedRequest, resolved.credentials);
      }

      if (options.apply) {
        const result = await options.apply(authenticatedRequest, { requestContext });
        authenticatedRequest = result ?? authenticatedRequest;
      }

      return authenticatedRequest;
    },
  };
}
