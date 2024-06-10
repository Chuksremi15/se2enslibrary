"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchResult } from "./SearchResult";
import { SearchItem } from "./types";
import {
  GetExpiryReturnType,
  GetOwnerReturnType,
  GetPriceReturnType,
  GetWrapperDataReturnType,
} from "@ensdomains/ensjs/public";
import { isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { queryClient } from "~~/components/ScaffoldEthAppWithProviders";
import { createQueryKey } from "~~/hooks/ens-hook/useQuerryOptions";
import { ValidationResult, useValidate, validate } from "~~/hooks/ens-hook/useValidate";
import { yearsToSeconds } from "~~/utils/ens-utils/ensUtils";
import { getRegistrationStatus } from "~~/utils/ens-utils/registrationStatus";

export const SearchInput = () => {
  const [inputVal, setInputVal] = useState("");
  const [selected, setSelected] = useState(0);
  const [toggle, setToggle] = useState(false);

  const router = useRouter();
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
        value: "emptyText",
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
        value: "Invalid name",
      };
    }
    if (isETH && is2LD && isShort) {
      return {
        type: "error",
        value: "Too short",
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
    let path = selectedItem.type === "address" ? `/address/${selectedItem.value}` : `/register/${selectedItem.value}`;

    if (selectedItem.type === "nameWithDotEth" || selectedItem.type === "name") {
      const currentValidation =
        queryClient.getQueryData<ValidationResult>(
          createQueryKey({
            queryDependencyType: "independent",
            functionName: "validate",
            params: { input: selectedItem.value },
          }),
        ) || validate(selectedItem.value);

      console.log("currentValidation :", currentValidation);
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

      console.log("ownerData :", ownerData);
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

        console.log("registrationStatus", registrationStatus);
        if (registrationStatus === "available") {
          path = `/register/${selectedItem.value}`;
        }
      }
    }

    setInputVal("");
    searchInputRef.current?.blur();
    router.push(path);
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

  const clearInputValue = () => {
    setInputVal("");
  };

  return (
    <div className="flex flex-col items-center gap-y-2">
      <div className="flex items-center w-[350px] relative">
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

        <div
          onClick={() => clearInputValue()}
          className="absolute right-4 hover:scale-95 text-gray-500 transition-all duration-200 cursor-pointer"
        >
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

      {
        <div
          className={`${
            searchItem.value !== "emptyText" ? "opacity-100" : "opacity-0"
          }  transition-opacity ease-in duration-200`}
        >
          <SearchResult
            value={searchItem.value || normalisedOutput}
            type={searchItem.type}
            clickCallback={handleSearch}
          />
        </div>
      }
    </div>
  );
};
