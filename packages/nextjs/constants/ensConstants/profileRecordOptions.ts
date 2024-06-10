export type ProfileRecordGroup = "general" | "media" | "address" | "social" | "website" | "other" | "custom";

export type ProfileRecordType = "text" | "addr" | "contenthash" | "abi";

export type ProfileRecord = {
  key: string;
  value?: string;
  type: ProfileRecordType;
  group: ProfileRecordGroup;
};
