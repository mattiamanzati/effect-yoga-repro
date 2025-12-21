import { Effect, Request, RequestResolver } from "effect";
import { ConnectRpcService } from "../ConnectRpcService";

export interface Product {
	id: string;
	name: string;
}

export interface GetProductByIdRequest {
	id: string;
}

export class GetProduct extends Request.TaggedClass("GetProduct")<
	Product,
	Error,
	GetProductByIdRequest
> {
	static make(payload: GetProductByIdRequest) {
		return new GetProduct(payload);
	}
}

export const ProductResolver = RequestResolver.makeBatched<
	GetProduct,
	ConnectRpcService
>((requests) =>
	Effect.gen(function* () {
		console.log(`[DataLoader] Batching ${requests.length} product requests`);

		const connect = yield* ConnectRpcService;
		const ids = requests.map((r) => r.id);

		const products = yield* connect.product.getProducts(ids);

		const resultMap = new Map(products.map((p) => [p.id, p]));

		yield* Effect.forEach(requests, (request) => {
			const product = resultMap.get(request.id);
			if (!product) {
				return Request.completeEffect(
					request,
					Effect.fail(new Error(`Product ${request.id} not found`)),
				);
			}
			return Request.completeEffect(request, Effect.succeed(product));
		});
	}).pipe(
		Effect.catchAll((error) =>
			Effect.forEach(requests, (request) =>
				Request.completeEffect(request, Effect.fail(error)),
			),
		),
	),
);
