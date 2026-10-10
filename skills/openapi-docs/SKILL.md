---
name: openapi-docs
description: Add or refresh OpenAPI docs, JSDoc code comments, and the swagger packages for this Express API.
disable-model-invocation: true
---

# OpenAPI docs

The JSDoc blocks on the route handlers are the contract. The spec is built from them at startup and served at `/openapi.json` and `/api-docs`. Never hand-write a separate spec file.

Run the steps in order. Each step ends on its completion criterion. Do not start the next step until the current one holds.

## 1. Survey

List every `router.get|post|put|delete` call in `src/routes/*.js` as `METHOD /path`. For each, record the handler's name, the status codes it returns (`res.status(...)`, and implicit 200 for `res.json`), whether it reads a request body, and whether it already has a JSDoc block.

Done when: every route call appears in the list and every row names all of its status codes.

## 2. Packages

Install `swagger-jsdoc` and `swagger-ui-express` as dependencies, and `@apidevtools/swagger-parser` as a dev dependency. Skip any package already in `package.json`.

Done when: all three appear in `package.json` and `npm ls` reports no errors.

## 3. Shared schemas

Create `src/openapi.js`. It builds the spec with `swagger-jsdoc`:
- `openapi: '3.0.3'`
- `info` taken from `package.json` (name, version, description)
- `apis` set to `src/routes/*.js` and `src/app.js`, joined from `__dirname` so paths resolve regardless of cwd. Any file that carries `@openapi` blocks must be listed here, or its docs are silently dropped.

Define reusable schemas under `components.schemas`: `Location`, `LocationInput`, `Offer`, `OfferInput`, `Error`. Copy field names, types, and limits from the validators in the route files, so the schemas match what the code accepts.

Done when: `node -e "require('./src/openapi')"` loads and `components.schemas` contains all five schemas.

## 4. Annotate routes

Above each route handler, add a JSDoc block with an `@openapi` tag containing:
- `summary` and `tags`
- `parameters` for path and query params
- `requestBody` referencing `LocationInput` or `OfferInput` where the handler reads the body
- `responses` for every status code recorded in step 1, including 400 and 404 where the handler returns them

Reference schemas with `$ref`. Do not repeat schema bodies inline.

Done when: every route from step 1 has an `@openapi` block, and each block's response codes match the codes its handler returns.

## 5. Document the code

Add a JSDoc block to every top-level function in `src/`: validators, pick helpers, `nextId`, and the router and app setup. Each block gives a one-line summary, then `@param` and `@returns` where they apply, then any rule the code does not make obvious. The cascade on location delete is an example of such a rule.

Done when: every top-level function in `src/` has a JSDoc block.

## 6. Serve the docs

In `src/app.js`, before the 404 handler, add:
- `GET /openapi.json` returning the spec from `src/openapi.js`
- `swagger-ui-express` mounted at `/api-docs`

Keep Express code in `app.js`. `src/openapi.js` stays free of Express.

Done when: the server starts and `/openapi.json` and `/api-docs/` both respond 200 (checked in step 8).

## 7. Test

Add `tests/openapi.test.js` using the `freshApp` helper:
- the spec passes `SwaggerParser.validate`
- `GET /openapi.json` returns 200 with `openapi` set to `3.0.3`
- the spec's `paths` include `/api/locations`, `/api/locations/{id}`, `/api/offers`, and `/api/offers/{id}`
- `GET /api-docs/` returns 200

Done when: `npm test` passes with the new file included.

## 8. Verify

Run `npm test`. Then run `npm start` in the background, `curl` `/openapi.json` and `/api-docs/`, and stop the server.

Done when: tests pass and both URLs return 200.

## Refreshing

To refresh after route or validation changes, re-run from step 1. Step 1 re-surveys the routes, so only annotations for changed routes should move. Leave annotations that still match the code alone.

## Report

End with: files changed, packages added, the test result, and any route or function left without docs and why.
