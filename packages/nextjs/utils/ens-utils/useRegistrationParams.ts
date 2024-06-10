import { useMemo } from "react";
import { yearsToSeconds } from "./ensUtils";
import { profileRecordsToRecordOptions } from "./profileRecordUtils";
import { ChildFuseReferenceType, RegistrationParameters } from "@ensdomains/ensjs/utils";
import { Address } from "viem";
import { RegistrationReducerDataItem } from "~~/enslibrary/components/@molecules/Register/types";

type Props = {
  name: string;
  owner: Address;
  registrationData: Pick<
    RegistrationReducerDataItem,
    "years" | "resolverAddress" | "secret" | "records" | "clearRecords" | "permissions" | "reverseRecord"
  >;
};

const useRegistrationParams = ({ name, owner, registrationData }: Props) => {
  const registrationParams: RegistrationParameters = useMemo(
    () => ({
      name,
      owner,
      duration: yearsToSeconds(registrationData.years),
      resolverAddress: registrationData.resolverAddress,
      secret: registrationData.secret,
      records: profileRecordsToRecordOptions(registrationData.records, registrationData.clearRecords),
      fuses: {
        named: registrationData.permissions
          ? (Object.keys(registrationData.permissions).filter(
              key => !!registrationData.permissions?.[key as ChildFuseReferenceType["Key"]],
            ) as ChildFuseReferenceType["Key"][])
          : [],
        unnamed: [],
      },
      reverseRecord: registrationData.reverseRecord,
    }),
    [owner, name, registrationData],
  );

  return registrationParams;
};

export default useRegistrationParams;
