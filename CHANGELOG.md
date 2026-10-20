# Changelog

## [1.0.0] - 2026-10-20

### Added

- Added a protocol-agnostic outgoing authentication plugin with dynamic Bearer, Basic, and API-key credentials.
- Added `allowedOrigins`, per-request `shouldAuthenticate`, and custom `apply()` adapters for non-REST protocols.
- Added non-secret authentication identity propagation through `RequestContext.state` for cache and inflight partitioning.

### Fixed

- Preserved `Headers`, header tuples, and object headers when attaching authentication credentials.

### Documentation

- Documented REST authentication, custom protocol adapters, origin safety, and cache/inflight identity isolation.
