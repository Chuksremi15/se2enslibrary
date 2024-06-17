import { useMemo } from "react";
import { formatUnits } from "viem";
import { useEstimateFullRegistration } from "~~/hooks/ens-hook/useEstimateRegistration";
import { CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE } from "~~/utils/ens-utils/contants";

type Props = ReturnType<typeof useEstimateFullRegistration> & { unit: String };

export const FullInvoice = ({
  years,
  totalYearlyFee,
  estimatedGasFee,
  hasPremium,
  premiumFee,
  gasPrice,
  unit = "eth",
}: Props) => {
  const invoiceItems = useMemo(
    () => [
      {
        label: "invoice yearRegistration",
        bufferPercentage: CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE,
        value: totalYearlyFee,
      },
      {
        label: "invoice estimatedNetworkFee",
        value: estimatedGasFee,
      },
      ...(hasPremium
        ? [
            {
              label: "invoice temporaryPremium",
              value: premiumFee,
              bufferPercentage: CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE,
            },
          ]
        : []),
    ],
    [years, totalYearlyFee, estimatedGasFee, hasPremium, premiumFee],
  );

  const filteredItems = invoiceItems
    .map(({ value, bufferPercentage }) =>
      value && unit === "eth" && bufferPercentage ? (value * bufferPercentage) / 100n : value,
    )
    .filter((x): x is bigint => !!x);
  const total = filteredItems.reduce((a, b) => a + b, 0n);
  const hasEmptyItems = filteredItems.length !== invoiceItems.length;

  return (
    <div className="bg-base-200 flex flex-col gap-y-2 rounded-xl px-4 py-4 my-3">
      {" "}
      <>
        filteredItems.map(())
        <div className="flex justify-between font-body text-sm ">
          <h6>
            {years} {years > 1 ? " years" : " year"} registration
          </h6>{" "}
          <h6>updatedPrice ETH</h6>
        </div>
        <div className="flex justify-between font-body text-sm ">
          <h6>Est. network fee</h6> <h6>{formatUnits(estimatedGasFee, 18)} ETH</h6>
        </div>
        <div className="flex justify-between font-body text-sm ">
          <h6>Estimated total</h6> <h6>totalFee ETH</h6>
        </div>
      </>
    </div>
  );
};

export const Invoice = () => {
  return (
    <div>
      <div>FullInvoice</div>

      <div className="flex justify-between font-body text-sm ">
        <h6>Estimated total</h6> <h6>totalFee ETH</h6>
      </div>
    </div>
  );
};
