# `@hyperttp/auth`

Protocol-agnostic authentication plugin for **outgoing** Hyperttp requests.

It attaches dynamic credentials without requiring applications to copy tokens into every request. The plugin runs in the blocking `START` phase, so authentication can run before later crypto, cache, or inflight plugins.

> `@hyperttp/types@^0.4.2` exposes request lifecycle hooks only. This package does **not** authenticate inbound `core.listen()` requests or reject TCP connections. That requires a server-side hook in HyperCore/a protocol receiver.

## Install

```sh
bun add @hyperttp/auth @hyperttp/types
```

## REST credentials

### Bearer token

```ts
import { withAuth } from "@hyperttp/auth";

client.use(
  withAuth({
    allowedOrigins: ["https://api.example.com"],
    rest: {
      type: "bearer",
      getToken: () => session.accessToken,
      // Optional: a non-secret cache/inflight scope.
      getCacheKey: () => `tenant:${session.tenantId}:user:${session.userId}`,
    },
  }),
);
```

### Basic authentication

```ts
client.use(
  withAuth({
    rest: {
      type: "basic",
      username: "service",
      getPassword: () => secretStore.get("service-password"),
    },
  }),
);
```

### API key

```ts
client.use(
  withAuth({
    rest: {
      type: "api-key",
      location: "header", // or "query"
      name: "x-api-key",
      getValue: () => env.API_KEY,
    },
  }),
);
```

`rest` expects the protocol input to be an object with `headers` and, for a query API key, a string `url`. The original request is never mutated.

## Custom protocol adapter

The core auth plugin does not assume a request has HTTP headers. Use `apply` for gRPC metadata, signed protocols, or another transport-specific shape:

```ts
client.use(
  withAuth({
    protocol: "grpc",
    apply: async (request) => ({
      ...request,
      input: {
        ...request.input,
        metadata: {
          ...request.input.metadata,
          authorization: `Bearer ${await session.getAccessToken()}`,
        },
      },
    }),
  }),
);
```

Use `shouldAuthenticate(request, requestContext)` to selectively opt out of authentication.

## Origin and cache safety

- When `allowedOrigins` is configured, credentials are added **only** to absolute request URLs whose origin matches the allow-list. Requests with relative or unparseable URLs are skipped.
- `getCacheKey()` is saved to `RequestContext.state` under `AUTH_IDENTITY_STATE_KEY`. The built-in `@hyperttp/cache` and `@hyperttp/inflight` default keys use that value to isolate identities.
- Never return access tokens, passwords, or API keys from `getCacheKey()`: `RequestContext.state` is intended for cross-plugin coordination and may be observed by logging or metrics integrations.
- The plugin does not log credential values.

## Scope

The initial version provides credential attachment and identity propagation. Token refresh, single-flight refresh coordination, and protocol-specific server authentication are intentionally outside the current API.
