import { useQueryOptions } from "./useQuerryOptions";
import { GetOwnerParameters, GetOwnerReturnType, getOwner } from "@ensdomains/ensjs/public";
import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { ConfigWithEns, CreateQueryKey, PartialBy, QueryConfig } from "~~/types/ensTypes";
import { getIsCachedData } from "~~/utils/ens-utils/getIsCachedData";
import { prepareQueryOptions } from "~~/utils/ens-utils/prepareQueryOptions";

type OwnerContract = "nameWrapper" | "registry" | "registrar";

export type UseOwnerParameters<TContract extends OwnerContract | undefined = OwnerContract | undefined> = PartialBy<
  GetOwnerParameters<TContract>,
  "name"
>;

export type UseOwnerReturnType<TContract extends OwnerContract | undefined = undefined> = GetOwnerReturnType<TContract>;

type UseOwnerConfig<TContract extends OwnerContract | undefined = OwnerContract | undefined> = QueryConfig<
  UseOwnerReturnType<TContract>,
  Error
>;

export type UseOwnerQueryKey<TContract extends OwnerContract | undefined = undefined> = CreateQueryKey<
  UseOwnerParameters<TContract>,
  "getOwner",
  "standard"
>;

export const getOwnerQueryFn =
  (config: ConfigWithEns) =>
  async <TContract extends OwnerContract | undefined = undefined>({
    queryKey: [{ name, ...params }, chainId],
  }: QueryFunctionContext<UseOwnerQueryKey<TContract>>) => {
    if (!name) throw new Error("name is required");

    const client = config.getClient({ chainId });

    return getOwner(client, { name, ...params });
  };

export const useOwner = <
  TContract extends OwnerContract | undefined = undefined,
  const TParams extends UseOwnerParameters<TContract> = UseOwnerParameters<TContract>,
>({
  enabled = true,
  gcTime,
  staleTime,
  scopeKey,
  ...params
}: TParams & UseOwnerConfig<TContract>) => {
  const initialOptions = useQueryOptions({
    params,
    scopeKey,
    functionName: "getOwner",
    queryDependencyType: "standard",
    queryFn: getOwnerQueryFn,
  });

  const preparedOptions = prepareQueryOptions({
    queryKey: initialOptions.queryKey,
    queryFn: initialOptions.queryFn,
    enabled: enabled && !!params.name,
    gcTime,
    staleTime,
  });

  const query = useQuery(preparedOptions);

  return {
    ...query,
    refetchIfEnabled: preparedOptions.enabled ? query.refetch : () => {},
    isCachedData: getIsCachedData(query),
  };
};
