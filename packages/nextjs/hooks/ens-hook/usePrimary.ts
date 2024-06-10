import { useQueryOptions } from "./useQuerryOptions";
import { tryBeautify } from "./useValidate";
import { GetNameParameters, GetNameReturnType, getName } from "@ensdomains/ensjs/public";
import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { ConfigWithEns, CreateQueryKey, PartialBy, QueryConfig } from "~~/types/ens-types/ensTypes";
import { emptyAddress } from "~~/utils/ens-utils/contants";
import { getIsCachedData } from "~~/utils/ens-utils/getIsCachedData";
import { prepareQueryOptions } from "~~/utils/ens-utils/prepareQueryOptions";

type UsePrimaryNameParameters = PartialBy<GetNameParameters, "address"> & {
  allowMismatch?: boolean;
};

type UsePrimaryNameReturnType = (NonNullable<GetNameReturnType> & { beautifiedName: string }) | null;

type UsePrimaryNameConfig = QueryConfig<UsePrimaryNameReturnType, Error>;

type QueryKey<TParams extends UsePrimaryNameParameters> = CreateQueryKey<TParams, "getName", "standard">;

export const getPrimaryNameQueryFn =
  (config: ConfigWithEns) =>
  async <TParams extends UsePrimaryNameParameters>({
    queryKey: [{ address, ...params }, chainId],
  }: QueryFunctionContext<QueryKey<TParams>>) => {
    if (!address) throw new Error("address is required");

    const client = config.getClient({ chainId });

    const res = await getName(client, { address, ...params });

    if (!res || !res.name || (!res.match && !params.allowMismatch)) return null;

    return {
      ...res,
      beautifiedName: tryBeautify(res.name),
    };
  };

export const usePrimaryName = <TParams extends UsePrimaryNameParameters>({
  // config
  enabled = true,
  gcTime,
  staleTime,
  scopeKey,
  // params
  allowMismatch = false,
  ...params
}: TParams & UsePrimaryNameConfig) => {
  const initialOptions = useQueryOptions({
    params: { ...params, allowMismatch },
    scopeKey,
    functionName: "getName",
    queryDependencyType: "standard",
    queryFn: getPrimaryNameQueryFn,
  });

  const preparedOptions = prepareQueryOptions({
    queryKey: initialOptions.queryKey,
    queryFn: initialOptions.queryFn,
    enabled: enabled && !!params.address && params.address !== emptyAddress,
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
