import { getChainContractAddress } from "viem";
import { useClient } from "wagmi";
import { ClientWithEns } from "~~/types/ens-types/ensTypes";

export const getSupportedChainContractAddress = <
  TContract extends Extract<keyof ClientWithEns["chain"]["contracts"], string>,
  TContractObject extends ClientWithEns["chain"]["contracts"][TContract],
>({
  client,
  contract,
  blockNumber,
}: {
  client: ClientWithEns;
  contract: TContract;
  blockNumber?: bigint;
}) =>
  getChainContractAddress({
    chain: client.chain,
    contract,
    blockNumber,
  }) as TContractObject["address"];

export const useContractAddress = <TContractName extends Extract<keyof ClientWithEns["chain"]["contracts"], string>>({
  contract,
  blockNumber,
}: {
  contract: TContractName;
  blockNumber?: bigint;
}) => {
  const client = useClient();

  return getSupportedChainContractAddress({
    client,
    contract,
    blockNumber,
  });
};
