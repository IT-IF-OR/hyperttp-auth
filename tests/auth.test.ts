import type { RequestContext, SendRequest } from "@hyperttp/types";
import { describe, expect, it } from "vitest";
import { AUTH_IDENTITY_STATE_KEY, withAuth } from "../src/index.js";

function request(input: Record<string, unknown>, protocol = "rest"): SendRequest {
  return { protocol, input };
}

function context(): RequestContext {
  return {
    requestId: "request-1",
    startTime: Date.now(),
    meta: {},
    state: {},
  };
}

describe("withAuth", () => {
  it("adds a Bearer token without mutating the original request", async () => {
    const plugin = withAuth({
      rest: { type: "bearer", getToken: () => "access-token" },
    });
    const original = request({
      url: "https://api.example.com/me",
      headers: { accept: "application/json" },
    });

    const result = await plugin.onRequest?.(original, undefined, context());

    expect(result).toMatchObject({
      input: {
        headers: {
          accept: "application/json",
          authorization: "Bearer access-token",
        },
      },
    });
    expect(original.input).toEqual({
      url: "https://api.example.com/me",
      headers: { accept: "application/json" },
    });
  });

  it.each([
    ["Headers", new Headers({ accept: "application/json" })],
    ["header tuples", [["accept", "application/json"]]],
  ] as const)("preserves %s when adding credentials", async (_kind, headers) => {
    const plugin = withAuth({
      rest: { type: "bearer", getToken: () => "access-token" },
    });

    const result = await plugin.onRequest?.(
      request({ url: "https://api.example.com/me", headers }),
    );

    expect(result).toMatchObject({
      input: {
        headers: {
          accept: "application/json",
          authorization: "Bearer access-token",
        },
      },
    });
  });

  it("uses the latest Basic-auth password from its provider", async () => {
    const plugin = withAuth({
      rest: {
        type: "basic",
        username: "service",
        getPassword: () => "secret",
      },
    });

    const result = await plugin.onRequest?.(request({ url: "https://api.example.com" }));

    expect(result).toMatchObject({
      input: { headers: { authorization: "Basic c2VydmljZTpzZWNyZXQ=" } },
    });
  });

  it("places a REST API key in the query string", async () => {
    const plugin = withAuth({
      rest: {
        type: "api-key",
        location: "query",
        name: "api_key",
        getValue: () => "key value",
      },
    });

    const result = await plugin.onRequest?.(request({ url: "/users?page=1" }));

    expect(result).toMatchObject({
      input: { url: "/users?page=1&api_key=key+value" },
    });
  });

  it("does not expose credentials to origins outside the allow-list", async () => {
    const plugin = withAuth({
      allowedOrigins: ["https://api.example.com"],
      rest: { type: "bearer", getToken: () => "access-token" },
    });

    const result = await plugin.onRequest?.(request({ url: "https://other.example.com/me" }));

    expect(result).toBeUndefined();
  });

  it("does not expose credentials for a relative URL when an allow-list is configured", async () => {
    const plugin = withAuth({
      allowedOrigins: ["https://api.example.com"],
      rest: { type: "bearer", getToken: () => "access-token" },
    });

    expect(await plugin.onRequest?.(request({ url: "/me" }))).toBeUndefined();
  });

  it("shares only the non-secret auth identity through request state", async () => {
    const plugin = withAuth({
      bearer: {
        getToken: () => "do-not-store-me",
        getCacheKey: () => "tenant:7:user:42",
      },
    });
    const requestContext = context();

    const result = await plugin.onRequest?.(
      request({ url: "https://api.example.com/me" }),
      undefined,
      requestContext,
    );

    expect(requestContext.state).toEqual({
      [AUTH_IDENTITY_STATE_KEY]: "tenant:7:user:42",
    });
    expect(JSON.stringify(requestContext.state)).not.toContain("do-not-store-me");
    expect(result).toMatchObject({
      input: { headers: { authorization: "Bearer do-not-store-me" } },
    });
  });

  it("delegates non-REST protocols to a custom adapter", async () => {
    const plugin = withAuth({
      protocol: "grpc",
      apply: (current) => ({
        ...current,
        input: {
          ...(current.input as Record<string, unknown>),
          metadata: { authorization: "Bearer grpc-token" },
        },
      }),
    });

    const result = await plugin.onRequest?.(request({ method: "GetUser" }, "grpc"));

    expect(result).toMatchObject({
      input: { metadata: { authorization: "Bearer grpc-token" } },
    });
  });
});
