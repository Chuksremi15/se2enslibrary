import type { Account, Address, Client, Hex, TransactionReceipt, Transport } from "viem";
import { SupportedChain } from "~~/contants/chains";
import { wagmiConfig } from "~~/services/web3/ensWagmiConfig";

export type ConfigWithEns = typeof wagmiConfig;

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
