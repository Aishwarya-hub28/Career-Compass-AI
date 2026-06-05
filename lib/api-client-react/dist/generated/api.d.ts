import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GeminiConversation, GeminiConversationInput, GeminiConversationWithMessages, GeminiError, GeminiMessage, GeminiMessageInput, HealthStatus } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListGeminiConversationsUrl: () => string;
/**
 * @summary List all conversations
 */
export declare const listGeminiConversations: (options?: RequestInit) => Promise<GeminiConversation[]>;
export declare const getListGeminiConversationsQueryKey: () => readonly ["/api/gemini/conversations"];
export declare const getListGeminiConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listGeminiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGeminiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGeminiConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGeminiConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listGeminiConversations>>>;
export type ListGeminiConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List all conversations
 */
export declare function useListGeminiConversations<TData = Awaited<ReturnType<typeof listGeminiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGeminiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateGeminiConversationUrl: () => string;
/**
 * @summary Create a new conversation
 */
export declare const createGeminiConversation: (geminiConversationInput: GeminiConversationInput, options?: RequestInit) => Promise<GeminiConversation>;
export declare const getCreateGeminiConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGeminiConversation>>, TError, {
        data: BodyType<GeminiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGeminiConversation>>, TError, {
    data: BodyType<GeminiConversationInput>;
}, TContext>;
export type CreateGeminiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createGeminiConversation>>>;
export type CreateGeminiConversationMutationBody = BodyType<GeminiConversationInput>;
export type CreateGeminiConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new conversation
*/
export declare const useCreateGeminiConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGeminiConversation>>, TError, {
        data: BodyType<GeminiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGeminiConversation>>, TError, {
    data: BodyType<GeminiConversationInput>;
}, TContext>;
export declare const getGetGeminiConversationUrl: (id: number) => string;
/**
 * @summary Get conversation with messages
 */
export declare const getGeminiConversation: (id: number, options?: RequestInit) => Promise<GeminiConversationWithMessages>;
export declare const getGetGeminiConversationQueryKey: (id: number) => readonly [`/api/gemini/conversations/${number}`];
export declare const getGetGeminiConversationQueryOptions: <TData = Awaited<ReturnType<typeof getGeminiConversation>>, TError = ErrorType<GeminiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGeminiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGeminiConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGeminiConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getGeminiConversation>>>;
export type GetGeminiConversationQueryError = ErrorType<GeminiError>;
/**
 * @summary Get conversation with messages
 */
export declare function useGetGeminiConversation<TData = Awaited<ReturnType<typeof getGeminiConversation>>, TError = ErrorType<GeminiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGeminiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteGeminiConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteGeminiConversation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteGeminiConversationMutationOptions: <TError = ErrorType<GeminiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGeminiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteGeminiConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteGeminiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteGeminiConversation>>>;
export type DeleteGeminiConversationMutationError = ErrorType<GeminiError>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteGeminiConversation: <TError = ErrorType<GeminiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteGeminiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteGeminiConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getListGeminiMessagesUrl: (id: number) => string;
/**
 * @summary List messages in a conversation
 */
export declare const listGeminiMessages: (id: number, options?: RequestInit) => Promise<GeminiMessage[]>;
export declare const getListGeminiMessagesQueryKey: (id: number) => readonly [`/api/gemini/conversations/${number}/messages`];
export declare const getListGeminiMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listGeminiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGeminiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGeminiMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGeminiMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listGeminiMessages>>>;
export type ListGeminiMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List messages in a conversation
 */
export declare function useListGeminiMessages<TData = Awaited<ReturnType<typeof listGeminiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGeminiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendGeminiMessageUrl: (id: number) => string;
/**
 * @summary Send a message and receive an AI response (SSE stream)
 */
export declare const sendGeminiMessage: (id: number, geminiMessageInput: GeminiMessageInput, options?: RequestInit) => Promise<unknown>;
export declare const getSendGeminiMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendGeminiMessage>>, TError, {
        id: number;
        data: BodyType<GeminiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendGeminiMessage>>, TError, {
    id: number;
    data: BodyType<GeminiMessageInput>;
}, TContext>;
export type SendGeminiMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendGeminiMessage>>>;
export type SendGeminiMessageMutationBody = BodyType<GeminiMessageInput>;
export type SendGeminiMessageMutationError = ErrorType<unknown>;
/**
* @summary Send a message and receive an AI response (SSE stream)
*/
export declare const useSendGeminiMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendGeminiMessage>>, TError, {
        id: number;
        data: BodyType<GeminiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendGeminiMessage>>, TError, {
    id: number;
    data: BodyType<GeminiMessageInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map