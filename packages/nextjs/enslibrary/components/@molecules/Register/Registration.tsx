import React, { ChangeEventHandler, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PlusMinusControl } from "./PlusMinusControl";
import { RegistrationReducerDataItem } from "./types";
import { useAccount, useChainId } from "wagmi";
import { useContractAddress } from "~~/hooks/ens-hook/chain/useContractAddress";
import { useBasicName } from "~~/hooks/ens-hook/useBasicName";
import { useEstimateFullRegistration } from "~~/hooks/ens-hook/useEstimateRegistration";
import { usePrimaryName } from "~~/hooks/ens-hook/usePrimary";
import useRegistrationReducer from "~~/hooks/ens-hook/useRegistrationReducer";
import { createChangeEvent } from "~~/utils/ens-utils/synthenticEvent";

type Props = {
  nameDetails: ReturnType<typeof useBasicName>;
  isLoading: boolean;
};

export const Registration = ({ nameDetails }: Props) => {
  const chainId = useChainId();
  const { address } = useAccount();

  const selected = useMemo(
    () => ({ name: nameDetails.normalisedName, address: address!, chainId }),
    [address, chainId, nameDetails.normalisedName],
  );

  const primary = usePrimaryName({ address });

  let hasPrimaryName = !!primary.data?.name;

  const { dispatch, item } = useRegistrationReducer(selected);

  const [years, setYears] = useState(item.years);

  const resolverAddress = useContractAddress({ contract: "ensPublicResolver" });

  let registrationData = item;

  const [reverseRecord, setReverseRecord] = useState(() =>
    registrationData.started ? registrationData.reverseRecord : !hasPrimaryName,
  );

  //property for clearRecords is originally resolverExists but is set to true for safety/time. A hook can be written to check if resolverExists

  const fullEstimate = useEstimateFullRegistration({
    name: nameDetails.normalisedName,
    registrationData: {
      ...registrationData,
      reverseRecord,
      years,
      records: [{ key: "ETH", value: resolverAddress, type: "addr", group: "address" }],
      clearRecords: true,
      resolverAddress,
    },
  });

  useEffect(() => {
    if (fullEstimate) console.log(fullEstimate);
  }, [fullEstimate]);

  return (
    <div className="flex flex-col gap-y-4 py-2 px-6 bg-base-100 w-[500px]  rounded-xl shadow-sm">
      <h5 className="text-xl font-medium text-start self-start">Register {nameDetails.beautifiedName}</h5>

      <PlusMinusControl
        minValue={1}
        value={years}
        onChange={e => {
          const newYears = parseInt(e.target.value);
          if (!Number.isNaN(newYears)) setYears(newYears);
        }}
      />

      <div className="bg-base-200 flex flex-col gap-y-2 rounded-xl px-4 py-4 my-3">
        {" "}
        <>
          <div className="flex justify-between font-body text-sm ">
            <h6>
              {years} {years > 1 ? " years" : " year"} registration
            </h6>{" "}
            <h6>updatedPrice ETH</h6>
          </div>
          <div className="flex justify-between font-body text-sm ">
            <h6>Est. network fee</h6> <h6>gasPriceEstimate ETH</h6>
          </div>
          <div className="flex justify-between font-body text-sm ">
            <h6>Estimated total</h6> <h6>totalFee ETH</h6>
          </div>
        </>
      </div>
    </div>
  );
};
