/**
 * YogaApp Effect Service - matching shopen-graphql architecture.
 *
 * Key points:
 * 1. YogaApp is an Effect.Service with scoped lifecycle
 * 2. Dependencies (ConnectRpcTransportService, DataLoaderConfigService) are yielded
 * 3. Bun.serve is managed with acquireRelease for graceful shutdown
 */

import type { Plugin } from "graphql-yoga";
import { createYoga, useExecutionCancellation } from "graphql-yoga";
import { Config, Effect } from "effect";
import { createContext, type GraphQLContext } from "./context";
import { ConnectRpcTransportService } from "./grpc/ConnectRpcService";
import { DataLoaderConfigService } from "./grpc/DataLoaderConfig";
import { schema } from "./schema";

export type { GraphQLContext };

// Plugin to cleanup ManagedRuntime after each request
export const runtimeCleanupPlugin: Plugin<GraphQLContext> = {
	onExecute() {
		return {
			async onExecuteDone(payload) {
				// This runs after the execution phase is complete
				const context = payload.args.contextValue;
				if (context.runtime) {
					try {
						await context.runtime.dispose();
					} catch (error) {
						console.error("Error disposing runtime:", error);
					}
				}
			},
		};
	},
};

const GraphqlConfig = Config.all({
	port: Config.integer("GRAPHQL_PORT").pipe(Config.withDefault(4000)),
	host: Config.string("GRAPHQL_HOST").pipe(Config.withDefault("0.0.0.0")),
	endpoint: Config.string("GRAPHQL_ENDPOINT").pipe(
		Config.withDefault("/graphql"),
	),
});

export class YogaApp extends Effect.Service<YogaApp>()("YogaApp", {
	scoped: Effect.gen(function* () {
		const config = yield* GraphqlConfig;

		// Yield shared services - these are provided via Layer
		const dataLoaderConfigService = yield* DataLoaderConfigService;
		const grpcConnectTransportService = yield* ConnectRpcTransportService;

		const yoga = createYoga({
			schema,
			maskedErrors: false,
			context: createContext(
				grpcConnectTransportService,
				dataLoaderConfigService,
			),
			graphqlEndpoint: config.endpoint,
			plugins: [runtimeCleanupPlugin, useExecutionCancellation()],
		});

		yield* Effect.logInfo(
			`GraphQL server starting...\nListening on http://${
				config.host === "0.0.0.0" ? "localhost" : config.host
			}:${config.port}`,
		);

		// Bun.serve with acquireRelease for graceful shutdown
		yield* Effect.acquireRelease(
			Effect.sync(() =>
				Bun.serve({
					port: config.port,
					hostname: config.host,
					idleTimeout: 13,
					fetch: yoga,
				}),
			),
			(server) => Effect.sync(() => server.stop()),
		);

		yield* Effect.logInfo(
			`Server ready at http://${config.host}:${config.port}${config.endpoint}`,
		);

		return { yoga } as const;
	}),
}) {}
