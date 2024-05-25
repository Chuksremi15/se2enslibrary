"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchItem } from "./Types";
import {
  GetExpiryReturnType,
  GetOwnerReturnType,
  GetPriceReturnType,
  GetWrapperDataReturnType,
} from "@ensdomains/ensjs/public";
import { isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { queryClient } from "~~/components/ScaffoldEthAppWithProviders";
import { createQueryKey } from "~~/hooks/ens-hook/useQuerryOptions";
import { ValidationResult, useValidate, validate } from "~~/hooks/ens-hook/useValidate";
import { yearsToSeconds } from "~~/utils/ens-utils/ensUtils";
import { getRegistrationStatus } from "~~/utils/ens-utils/registrationStatus";

export const SearchInput = () => {
  const [inputVal, setInputVal] = useState("");
  const [selected, setSelected] = useState(0);
  const [toggle, setToggle] = useState(false);

  const { address } = useAccount();
  const chainId = useChainId();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const inputIsAddress = useMemo(() => isAddress(inputVal), [inputVal]);

  const isEmpty = inputVal === "";

  const { isValid, isETH, is2LD, isShort, type, name } = useValidate({
    input: inputVal,
    enabled: !inputIsAddress && !isEmpty,
  });

  const searchItem: SearchItem = useMemo(() => {
    if (isEmpty) {
      return {
        type: "text",
        value: "search.emptyText",
      };
    }
    if (inputIsAddress) {
      return {
        type: "address",
      };
    }
    if (!isValid) {
      return {
        type: "error",
        value: "search.errors.invalid",
      };
    }
    if (isETH && is2LD && isShort) {
      return {
        type: "error",
        value: "search.errors.tooShort",
      };
    }
    if (type === "label") {
      return {
        type: "nameWithDotEth",
      };
    }
    return {
      type: "name",
    };
  }, [isEmpty, inputIsAddress, isValid, isETH, is2LD, isShort, type]);

  useEffect(() => {
    console.log(searchItem);
  }, [searchItem]);

  const handleFocusIn = useCallback(() => setToggle(true), [toggle]);
  const handleFocusOut = useCallback(() => setToggle(false), [toggle]);

  const normalisedOutput = useMemo(() => (inputIsAddress ? inputVal : name), [inputIsAddress, inputVal, name]);

  const handleSearch = useCallback(() => {
    let selectedItem = searchItem as SearchItem;
    if (!selectedItem) return;
    if (selectedItem.type === "error" || selectedItem.type === "text") return;
    if (selectedItem.type === "nameWithDotEth") {
      selectedItem = {
        type: "name",
        value: `${normalisedOutput}.eth`,
      };
    }
    if (!selectedItem.value) {
      selectedItem.value = normalisedOutput;
    }
    if (selectedItem.type === "name") {
      const labels = selectedItem.value.split(".");
      const isDotETH = labels.length === 2 && labels[1] === "eth";
      if (isDotETH && labels[0].length < 3) {
        return;
      }
    }
    let path = selectedItem.type === "address" ? `/address/${selectedItem.value}` : `/profile/${selectedItem.value}`;
    if (selectedItem.type === "nameWithDotEth" || selectedItem.type === "name") {
      const currentValidation =
        queryClient.getQueryData<ValidationResult>(
          createQueryKey({
            queryDependencyType: "independent",
            functionName: "validate",
            params: { input: selectedItem.value },
          }),
        ) || validate(selectedItem.value);
      if (currentValidation.is2LD && currentValidation.isETH && currentValidation.isShort) {
        return;
      }
      const ownerData = queryClient.getQueryData<GetOwnerReturnType>(
        createQueryKey({
          address,
          chainId,
          functionName: "getOwner",
          queryDependencyType: "standard",
          params: { name: selectedItem.value },
        }),
      );
      const wrapperData = queryClient.getQueryData<GetWrapperDataReturnType>(
        createQueryKey({
          address,
          chainId,
          functionName: "getWrapperData",
          queryDependencyType: "standard",
          params: { name: selectedItem.value },
        }),
      );
      const expiryData = queryClient.getQueryData<GetExpiryReturnType>(
        createQueryKey({
          address,
          chainId,
          functionName: "getExpiry",
          queryDependencyType: "standard",
          params: { name: selectedItem.value },
        }),
      );
      const priceData = queryClient.getQueryData<GetPriceReturnType>(
        createQueryKey({
          address,
          chainId,
          functionName: "getPrice",
          queryDependencyType: "standard",
          params: { name: selectedItem.value, duration: yearsToSeconds(1) },
        }),
      );
      if (ownerData) {
        const registrationStatus = getRegistrationStatus({
          timestamp: Date.now(),
          validation: currentValidation,
          ownerData,
          wrapperData,
          expiryData,
          priceData,
        });
        if (registrationStatus === "available") {
          path = `/register/${selectedItem.value}`;
        }
      }
    }
    if ("isHistory" in selectedItem) {
      delete (selectedItem as SearchItem & { isHistory?: boolean }).isHistory;
    }
    // setHistory((prev) => [
    //   ...prev
    //     .filter((item) => !(item.value === selectedItem.value && item.type === selectedItem.type))
    //     .slice(0, 25),
    //   { ...selectedItem, lastAccessed: Date.now() } as HistoryItem,
    // ])
    setInputVal("");
    searchInputRef.current?.blur();
    // router.pushWithHistory(path)
  }, [normalisedOutput, queryClient, searchItem, selected, chainId, address]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        return handleSearch();
      }
    },
    [handleSearch],
  );

  useEffect(() => {
    const searchInput = searchInputRef.current;
    searchInput?.addEventListener("keydown", handleKeyDown);
    searchInput?.addEventListener("focusin", handleFocusIn);
    searchInput?.addEventListener("focusout", handleFocusOut);
    return () => {
      searchInput?.removeEventListener("keydown", handleKeyDown);
      searchInput?.removeEventListener("focusin", handleFocusIn);
      searchInput?.removeEventListener("focusout", handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut, handleKeyDown, searchInputRef]);

  return (
    <div className="flex flex-col items-center gap-y-2">
      <div className="flex items-center w-full relative">
        <input
          className="input rounded-xl h-14 focus:outline-0 focus:border-blue-300 w-[350px] mx-auto  focus:text-black focus:text-lg  px-4 border  placeholder:text-gray-400 placeholder:text-lg text-gray-400 transition-all duration-300"
          placeholder="Search for a name"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          readOnly={false}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          data-testid="search-input-box-fake"
          ref={searchInputRef}
        />

        <div className="absolute right-4 hover:scale-95 text-gray-500 transition-all duration-200 cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
      </div>

      <div className="w-[350px] bg-white h-[50px] rounded-lg shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <div className="h-6 w-6 bg-blue-500 rounded-full" />{" "}
          <p className=" font-medium text-base lowercase">Chuksremi.eth</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <div className="py-[3px] px-[8px]  capitalize flex items-centern justify-center text-center text-xs bg-green-50 text-green-500 rounded-full  font-body font-medium cursor-pointer">
            Available
          </div>
          <div className="w-0 h-0 border-l-gray-300 border-t-transparent border-b-transparent  border-r-[0px] border-l-[7px] border-t-[7px] border-b-[7px] bg-white "></div>
        </div>
      </div>
    </div>
  );
};
