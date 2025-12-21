import { Context } from "effect";

export interface RequestContextType {
	readonly accessToken: string;
	readonly signal: AbortSignal;
}

// Context to hold the access token for the current request
export class RequestContext extends Context.Tag("RequestContext")<
	RequestContext,
	RequestContextType
>() {}

// Convenience function to provide auth context
export const withRequestContext = ({
	accessToken,
	signal,
}: {
	accessToken: string;
	signal: AbortSignal;
}) => RequestContext.of({ accessToken, signal });
