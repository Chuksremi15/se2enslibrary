import { useQueryOptions } from "./useQuerryOptions";
import { ParsedInputResult, beautify, parseInput } from "@ensdomains/ensjs/utils";
import { useQuery } from "@tanstack/react-query";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type ValidationResult = Prettify<
  Partial<Omit<ParsedInputResult, "normalised" | "labelDataArray">> & {
    name: string;
    beautifiedName: string;
    isNonASCII: boolean | undefined;
    labelCount: number;
    labelDataArray: ParsedInputResult["labelDataArray"];
  }
>;

type UseValidateParameters = {
  input: string;
  enabled?: boolean;
};

export const tryBeautify = (name: string): string => {
  try {
    return beautify(name);
  } catch (e) {
    return name;
  }
};

const tryDecodeURIComponent = (input: string) => {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
};

export const validate = (input: string) => {
  const decodedInput = tryDecodeURIComponent(input);
  const { normalised: name, ...parsedInput } = parseInput(decodedInput);
  const isNonASCII = parsedInput.labelDataArray.some(dataItem => dataItem.type !== "ASCII");
  const outputName = name || input;

  return {
    ...parsedInput,
    name: outputName,
    beautifiedName: tryBeautify(outputName),
    isNonASCII,
    labelCount: parsedInput.labelDataArray.length,
  };
};
const defaultData = Object.freeze({
  name: "",
  beautifiedName: "",
  isNonASCII: undefined,
  labelCount: 0,
  type: undefined,
  isValid: undefined,
  isShort: undefined,
  is2LD: undefined,
  isETH: undefined,
  labelDataArray: [],
});

const tryValidate = (input: string) => {
  if (!input) return defaultData;
  try {
    return validate(input);
  } catch {
    return defaultData;
  }
};

export const useValidate = ({ input, enabled = true }: UseValidateParameters): ValidationResult => {
  const { queryKey } = useQueryOptions({
    params: { input },
    functionName: "validate",
    queryDependencyType: "independent",
    keyOnly: true,
  });

  const { data, error } = useQuery({
    queryKey,
    queryFn: () => validate(input),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    select: d =>
      Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v === "undefined" ? "" : v])) as ValidationResult,
  });

  return data || (error ? defaultData : tryValidate(input));
};
