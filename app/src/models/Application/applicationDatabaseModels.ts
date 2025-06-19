/**
 * Database model interfaces for the application
 */

export interface PassengerData {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  phone?: string;
  processing_branch: number;
  passport_number: string;
  passport_date_of_issue: string;
  passport_date_of_expiry: string;
  passport_issue_at: string;
  count_of_expired_passport: number | string;
  expired_passport_number: string;
  address_line_1: string;
  address_line_2?: string;
  country: number | string;
  state: number | string;
  city: number | string;
  zip: string;
  occupation: string;
  position: string;
  status?: number;
  last_updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationData {
  id?: number;
  reference_number?: string | number;
  pax_type?: number;
  country_of_residence?: number;
  client_user_id: number;
  state_of_residence?: number;
  citizenship?: number;
  service_type?: number;
  referrer?: string;
  file_number_1?: string;
  travel_date?: string;
  interview_date?: string;
  file_number_2?: string;
  is_travel_date_tentative?: number;
  priority_submission?: number;
  visa_country?: number;
  visa_category?: number;
  nationality?: number;
  state_id?: number;
  entry_type?: number;
  remarks?: string;
  mi_fields?: string | any;
  status?: number;
  queue?: number;
  external_status?: number;
  team_remarks?: string;
  client_remarks?: string;
  billing_remarks?: string;
  dispatch_medium?: number;
  dispatch_medium_number?: string;
  last_updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationPassengerMapping {
  id?: number;
  application_id: number;
  passenger_id: number;
  status?: number;
  last_updated_by?: number;
  created_at?: string;
  updated_at?: string;
} 