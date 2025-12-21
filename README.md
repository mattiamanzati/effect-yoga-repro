# Effect + Yoga Reproduction

Minimal reproduction of shopen-graphql architecture with Effect + GraphQL Yoga + Effect DataLoader.

## Quick Start

```bash
bun install
bun run start
```

## Example Request

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-token" \
  -d '{"query": "{ products(ids: [\"1\", \"2\"]) { id name } }"}'
```

