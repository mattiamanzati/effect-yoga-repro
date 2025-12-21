/**
 * GraphQL Schema - matching shopen-graphql architecture.
 */

import { createSchema } from "graphql-yoga";
import { Effect } from "effect";
import { ProductService } from "./grpc/ProductService";
import type { GraphQLContext } from "./context";

export const schema = createSchema<GraphQLContext>({
	typeDefs: /* GraphQL */ `
		type Product {
			id: ID!
			name: String!
		}

		type Query {
			product(id: ID!): Product
			products(ids: [ID!]!): [Product!]!
		}
	`,
	resolvers: {
		Query: {
			product: async (_parent, { id }, ctx) => {
				return ctx.runPromise(
					Effect.gen(function* () {
						const productService = yield* ProductService;
						return yield* productService.getProduct({ id });
					}),
				);
			},
			products: async (_parent, { ids }, ctx) => {
				return ctx.runPromise(
					Effect.gen(function* () {
						const productService = yield* ProductService;
						// Use Effect.forEach instead of map + all to preserve types
						return yield* Effect.forEach(
							ids as string[],
							(id) => productService.getProduct({ id }),
							{ concurrency: "unbounded" },
						);
					}),
				);
			},
		},
	},
});
