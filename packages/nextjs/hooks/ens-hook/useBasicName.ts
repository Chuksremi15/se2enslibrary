import { useMemo } from "react";
import { useContractAddress } from "./chain/useContractAddress";
import useCurrentBlockTimestamp from "./chain/useCurrentBlockTimestamp";
import { useAddressRecord } from "./useAddressRecord";
import { useExpiry } from "./useExpiry";
import { UseOwnerReturnType, useOwner } from "./useOwner";
import { usePrice } from "./usePrice";
import { useSubgraphRegistrant } from "./useSubgraphRegistrant";
import { useValidate } from "./useValidate";
import { useWrapperData } from "./useWrapperData";
import { truncateFormat } from "@ensdomains/ensjs/utils";
import { getAddress } from "viem";
import { isLabelTooLong, yearsToSeconds } from "~~/utils/ens-utils/ensUtils";
import { getRegistrationStatus } from "~~/utils/ens-utils/registrationStatus";

const EXPIRY_LIVE_WATCH_TIME = 1_000 * 60 * 5; // 5 minutes

export type UseBasicNameOptions = {
  name?: string | null;
  normalised?: boolean;
  enabled?: boolean;
  subgraphEnabled?: boolean;
};

export const useBasicName = ({
  name,
  normalised = false,
  enabled = true,
  subgraphEnabled = true,
}: UseBasicNameOptions) => {
  const validation = useValidate({ input: name!, enabled: enabled && !!name });

  const { name: _normalisedName, isValid, isShort, isETH, is2LD } = validation;

  const normalisedName = normalised ? name! : _normalisedName;

  const commonEnabled = enabled && !!name && isValid && !isShort;

  const isRoot = name === "[root]";

  const {
    data: ownerData,
    isLoading: isOwnerLoading,
    isCachedData: isOwnerCachedData,
    refetchIfEnabled: refetchOwner,
  } = useOwner({ name: normalisedName, enabled: commonEnabled });
  const {
    data: wrapperData,
    isLoading: isWrapperDataLoading,
    isCachedData: isWrapperDataCachedData,
    refetchIfEnabled: refetchWrapperData,
  } = useWrapperData({ name: normalisedName, enabled: commonEnabled && !isRoot });
  const {
    data: expiryData,
    isLoading: isExpiryLoading,
    isCachedData: isExpiryCachedData,
    refetchIfEnabled: refetchExpiry,
  } = useExpiry({ name: normalisedName, enabled: commonEnabled && !isRoot && isETH && is2LD });
  const {
    data: priceData,
    isLoading: isPriceLoading,
    isCachedData: isPriceCachedData,
    refetchIfEnabled: refetchPrice,
  } = usePrice({
    nameOrNames: normalisedName,
    duration: yearsToSeconds(1),
    enabled: commonEnabled && !isRoot && isETH && is2LD,
  });

  const {
    data: addrData,
    isLoading: isAddrLoading,
    isCachedData: isAddrCachedData,
    refetchIfEnabled: refetchAddr,
  } = useAddressRecord({
    name: normalisedName,
    enabled: commonEnabled && !isRoot,
  });

  const publicCallsLoading =
    isOwnerLoading || isWrapperDataLoading || isExpiryLoading || isPriceLoading || isAddrLoading;

  const publicCallsCachedData =
    isOwnerCachedData || isWrapperDataCachedData || isExpiryCachedData || isPriceCachedData || isAddrCachedData;

  const expiryDate = expiryData?.expiry?.date;

  const gracePeriodEndDate =
    expiryDate && expiryData?.gracePeriod ? new Date(expiryDate.getTime() + expiryData.gracePeriod * 1000) : undefined;

  // gracePeriodEndDate is +/- 5 minutes from Date.now()
  const isTempPremiumDesynced = !!(
    gracePeriodEndDate &&
    Date.now() + EXPIRY_LIVE_WATCH_TIME > gracePeriodEndDate.getTime() &&
    gracePeriodEndDate.getTime() > Date.now() - EXPIRY_LIVE_WATCH_TIME
  );

  const blockTimestamp = useCurrentBlockTimestamp({ enabled: isTempPremiumDesynced });

  const nameWrapperAddress = useContractAddress({ contract: "ensNameWrapper" });

  const isWrapped = !!wrapperData;
  const canBeWrapped = useMemo(
    () => !!(nameWrapperAddress && !isWrapped && normalisedName?.endsWith(".eth") && !isLabelTooLong(normalisedName)),
    [nameWrapperAddress, isWrapped, normalisedName],
  );

  const registrationStatusTimestamp = useMemo(() => {
    if (!isTempPremiumDesynced) return Date.now();
    if (blockTimestamp) return Number(blockTimestamp) * 1000;
    return Date.now() - EXPIRY_LIVE_WATCH_TIME;
  }, [isTempPremiumDesynced, blockTimestamp]);

  const registrationStatus = !publicCallsLoading
    ? getRegistrationStatus({
        timestamp: registrationStatusTimestamp,
        validation,
        ownerData,
        wrapperData,
        expiryData,
        priceData,
        addrData,
      })
    : undefined;

  const { data: subgraphRegistrant } = useSubgraphRegistrant({
    name: normalisedName,
    enabled: enabled && subgraphEnabled && registrationStatus === "gracePeriod" && is2LD && isETH && !isWrapped,
  });

  const ownerDataWithSubgraphRegistrant = useMemo(() => {
    if (!ownerData) return ownerData;
    const checkSumSubgraphRegistrant = subgraphRegistrant ? getAddress(subgraphRegistrant) : undefined;
    return {
      ...ownerData,
      registrant: ownerData?.registrant ?? checkSumSubgraphRegistrant,
    } as UseOwnerReturnType;
  }, [ownerData, subgraphRegistrant]);

  const truncatedName = normalisedName ? truncateFormat(normalisedName) : undefined;

  const isLoading = publicCallsLoading;

  return {
    ...validation,
    normalisedName,
    ownerData: ownerDataWithSubgraphRegistrant,
    wrapperData,
    priceData,
    expiryDate,
    gracePeriodEndDate,
    isLoading,
    truncatedName,
    registrationStatus,
    isWrapped,
    canBeWrapped,
    isCachedData: publicCallsCachedData,
    refetchIfEnabled: () => {
      refetchOwner();
      refetchWrapperData();
      refetchExpiry();
      refetchPrice();
      refetchAddr();
    },
  };
};
