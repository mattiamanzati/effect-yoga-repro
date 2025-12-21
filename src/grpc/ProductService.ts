import { dataLoader } from "@effect/experimental/RequestResolver";
import { Effect, RequestResolver } from "effect";
import { ConnectRpcService } from "./ConnectRpcService";
import { DataLoaderConfigService } from "./DataLoaderConfig";
import { GetProduct, ProductResolver, type GetProductByIdRequest } from "./resolvers/GetProduct";

export class ProductService extends Effect.Service<ProductService>()(
	"ProductService",
	{

		scoped: Effect.gen(function* () {
			const configService = yield* DataLoaderConfigService;


			const productResolver = yield* ProductResolver.pipe(
				RequestResolver.contextFromServices(ConnectRpcService),
			);

			const productDataLoadedResolver = yield* productResolver.pipe(
				dataLoader(configService.getConfig("ProductResolver")),
			);

			const getProduct = (params: GetProductByIdRequest) =>
				Effect.request(GetProduct.make(params), productDataLoadedResolver);

			return {
				getProduct,
			} as const;
		}),
	},
) {}
