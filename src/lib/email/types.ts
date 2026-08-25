export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  readonly name: string;
  send(params: SendEmailParams): Promise<void>;
}
