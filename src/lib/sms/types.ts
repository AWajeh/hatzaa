export interface SmsVerifyProvider {
  readonly name: string;
  /** Sends a one-time code to the given phone number. */
  sendCode(phoneE164: string): Promise<void>;
  /** Checks a code the user entered. Returns whether it was valid. */
  checkCode(phoneE164: string, code: string): Promise<boolean>;
}
