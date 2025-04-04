/**
 * Formats a phone number by removing all non-digit characters except the leading +
 * @param phoneNumber The phone number to format
 * @returns The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Keep the leading + if it exists
  if (phoneNumber.startsWith("+")) {
    return "+" + phoneNumber.substring(1).replace(/\D/g, "");
  }

  // Otherwise just remove all non-digit characters
  return phoneNumber.replace(/\D/g, "");
};

/**
 * Compares two phone numbers to see if they match, ignoring formatting differences
 * @param phone1 First phone number
 * @param phone2 Second phone number
 * @returns True if the phone numbers match
 */
export const comparePhoneNumbers = (
  phone1: string,
  phone2: string
): boolean => {
  const formatted1 = formatPhoneNumber(phone1);
  const formatted2 = formatPhoneNumber(phone2);

  // If both have country codes (start with +), compare directly
  if (formatted1.startsWith("+") && formatted2.startsWith("+")) {
    return formatted1 === formatted2;
  }

  // If one has a country code and the other doesn't, compare the last digits
  if (formatted1.startsWith("+") && !formatted2.startsWith("+")) {
    return formatted1.endsWith(formatted2);
  }

  if (!formatted1.startsWith("+") && formatted2.startsWith("+")) {
    return formatted2.endsWith(formatted1);
  }

  // If neither has a country code, compare directly
  return formatted1 === formatted2;
};
