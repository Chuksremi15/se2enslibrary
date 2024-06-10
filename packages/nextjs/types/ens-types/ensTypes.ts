import { UseInfiniteQueryOptions, UseQueryOptions } from "@tanstack/react-query";
import type { Account, Address, Client, Hex, TransactionReceipt, Transport } from "viem";
import { SupportedChain } from "~~/constants/chains";
import { wagmiConfig } from "~~/services/web3/ensWagmiConfig";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type ConnectorClientWithEns = Client<Transport, SupportedChain, Account>;
export type ConfigWithEns = typeof wagmiConfig;
export type ClientWithEns = ReturnType<ConfigWithEns["getClient"]>;

export type QueryDependencyType = "standard" | "graph" | "independent";
export type CreateQueryKey<
  TParams extends {},
  TFunctionName extends string,
  TQueryDependencyType extends QueryDependencyType,
> = TQueryDependencyType extends "graph"
  ? readonly [
      params: TParams,
      chainId: SupportedChain["id"],
      address: Address | undefined,
      scopeKey: string | undefined,
      functionName: TFunctionName,
      graphKey: "graph",
    ]
  : readonly [
      params: TParams,
      chainId: TQueryDependencyType extends "independent" ? undefined : SupportedChain["id"],
      address: TQueryDependencyType extends "independent" ? undefined : Address | undefined,
      scopeKey: string | undefined,
      functionName: TFunctionName,
    ];

export type QueryConfig<TData, TError, TSelectData = TData> = Pick<
  UseQueryOptions<TData, TError, TSelectData>,
  "gcTime" | "enabled" | "staleTime"
> & {
  /** Scope the cache to a given context. */
  scopeKey?: string;
};

export type PartialBy<TType, TKeys extends keyof TType> = Partial<Pick<TType, TKeys>> & Omit<TType, TKeys>;
