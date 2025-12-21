import { Effect, Layer, ManagedRuntime } from "effect";
import type { YogaInitialContext } from "graphql-yoga";
import {
	ConnectRpcService,
	ConnectRpcTransportService,
} from "./grpc/ConnectRpcService";
import { DataLoaderConfigService } from "./grpc/DataLoaderConfig";
import { ProductService } from "./grpc/ProductService";

export type RuntimeContext = ConnectRpcService | ProductService | DataLoaderConfigService;

export type GraphQLContext = YogaInitialContext & {
	runPromise: <A, E>(effect: Effect.Effect<A, E, RuntimeContext>) => Promise<A>;
	runtime: ManagedRuntime.ManagedRuntime<RuntimeContext, never>;
};

export const createContext = (
	connectRpcTransportService: ConnectRpcTransportService,
	dataLoaderConfigService: DataLoaderConfigService,
) => {
	return async (initialContext: YogaInitialContext): Promise<GraphQLContext> => {
		const authHeader = initialContext.request.headers.get("authorization") ?? "";
		const accessToken = authHeader.replace("Bearer ", "");

		console.log(`\n[Context] Creating context for request with token="${accessToken}"`);

		
		const connectRpcLayer = ConnectRpcService.MakeWithRequestContext({
			accessToken: accessToken || "",
			signal: initialContext.request.signal,
		}).pipe(
			Layer.provide(
				Layer.succeed(ConnectRpcTransportService, connectRpcTransportService),
			),
		);

		//in production this add ~20ms overhead
		const servicesLayer = Layer.mergeAll(
			ProductService.Default,
			connectRpcLayer,
			Layer.succeed(DataLoaderConfigService, dataLoaderConfigService),
		).pipe(
			Layer.provide(connectRpcLayer),
			Layer.provide(
				Layer.succeed(DataLoaderConfigService, dataLoaderConfigService),
			),
		);

		
		const runtime = ManagedRuntime.make(servicesLayer);

		const runPromise = <A, E>(effect: Effect.Effect<A, E, RuntimeContext>) => {
			return runtime.runPromise(effect);
		};

		return {
			...initialContext,
			runPromise,
			runtime,
		};
	};
};
