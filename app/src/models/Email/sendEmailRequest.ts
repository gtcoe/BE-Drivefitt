/**
 * Type definition for the email request
 */
export enum EMAIL_TYPE {
  WELCOME = 1,
  PASSWORD_RESET = 2,
  APPLICATION_STATUS = 3,
  CREDENTIALS = 4,
  DOCUMENT_CHECKLIST = 5
}

export interface SendEmailRequest {
  emails: string[];
  type: EMAIL_TYPE;
  data?: Record<string, any>; // Optional data for email templates
}

/**
 * Convert the Express request to our SendEmailRequest model
 */
export const convertRequestToSendEmailRequest = (
  requestBody: any
): SendEmailRequest => {
  return {
    emails: requestBody.emails || [],
    type: requestBody.type,
    data: requestBody.data || {}
  };
}; 