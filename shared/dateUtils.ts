export const toDateKey = (value?: string | Date | null): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

export const isSameDateKey = (
  value: string | Date | null | undefined,
  compareKey: string,
): boolean => {
  const key = toDateKey(value);
  return key !== "" && key === compareKey;
};

export const isBeforeDateKey = (
  value: string | Date | null | undefined,
  compareKey: string,
): boolean => {
  const key = toDateKey(value);
  return key !== "" && key < compareKey;
};

export const isAfterDateKey = (
  value: string | Date | null | undefined,
  compareKey: string,
): boolean => {
  const key = toDateKey(value);
  return key !== "" && key > compareKey;
};
