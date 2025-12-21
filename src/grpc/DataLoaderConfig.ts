import { Effect } from "effect";

export interface DataLoaderSettings {
	window: number;
	maxBatchSize: number;
}

export class DataLoaderConfigService extends Effect.Service<DataLoaderConfigService>()(
	"DataLoaderConfigService",
	{
		effect: Effect.succeed({
			globalConfig: {
				window: 10,
				maxBatchSize: 100,
			},
			getConfig: (_name: string): DataLoaderSettings => ({
				window: 10,
				maxBatchSize: 100,
			}),
		}),
	},
) {}
