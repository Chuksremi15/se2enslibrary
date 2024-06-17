import { useMemo } from "react";
import { useContractAddress } from "./chain/useContractAddress";
import { useBlockTimestamp } from "./useBlockTimestamp";
import { useEstimateGasWithStateOverride } from "./useEstimateGasWithStateOverride";
import { useGasPrice } from "./useGasPrice";
import { usePrice } from "./usePrice";
import { makeCommitment } from "@ensdomains/ensjs/utils";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { RegistrationReducerDataItem } from "~~/enslibrary/components/@molecules/Register/types";
import useRegistrationParams from "~~/utils/ens-utils/useRegistrationParams";

type UseEstimateFullRegistrationParameters = {
  registrationData: RegistrationReducerDataItem;
  name: string;
};

// BigInt.prototype["toJSON"] = function () {
//   return this.toString();
// };

export const useEstimateFullRegistration = ({ registrationData, name }: UseEstimateFullRegistrationParameters) => {
  const { address } = useAccount();
  const { data: gasPrice, isLoading: gasPriceLoading } = useGasPrice();

  const registrationParams = useRegistrationParams({
    name,
    owner: address || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    registrationData,
  });

  const { data: price } = usePrice({ nameOrNames: name, duration: registrationParams.duration });

  const ethRegistrarControllerAddress = useContractAddress({
    contract: "ensEthRegistrarController",
  });

  const commitment = useMemo(() => makeCommitment(registrationParams), [registrationParams]);

  const { data: blockTimestamp } = useBlockTimestamp();
  // default to use block timestamp as reference
  // if no block timestamp, use local time as fallback

  const timestampReference = useMemo(() => (blockTimestamp ? Number(blockTimestamp) : Date.now()), [blockTimestamp]);

  const fiveMinutesAgoInSeconds = useMemo(() => Math.floor(timestampReference / 1000) - 60 * 5, [timestampReference]);

  const { data, isLoading } = useEstimateGasWithStateOverride({
    transactions: [
      {
        name: "commitName",
        data: registrationParams,
      },
      {
        name: "registerName",
        data: registrationParams,
        stateOverride: [
          {
            address: ethRegistrarControllerAddress,
            stateDiff: [
              {
                slot: 1,
                keys: [commitment],
                value: BigInt(fiveMinutesAgoInSeconds),
              },
            ],
          },
          {
            address: registrationParams.owner,
            balance: price ? price.base + price.premium + parseEther("10") : undefined,
          },
        ],
      },
    ],
    enabled: !!ethRegistrarControllerAddress && !!price,
  });

  const yearlyFee = price?.base;
  const premiumFee = price?.premium;
  const hasPremium = !!premiumFee && premiumFee > 0n;
  const totalYearlyFee = yearlyFee || 0n;

  return {
    estimatedGasFee: data.gasCost,
    estimatedGasLoading: isLoading || gasPriceLoading,
    yearlyFee,
    totalYearlyFee,
    hasPremium,
    premiumFee,
    gasPrice,
    years: registrationData.years,
  };
};
