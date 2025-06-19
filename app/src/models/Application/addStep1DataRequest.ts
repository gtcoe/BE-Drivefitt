export interface AddStep1DataRequest {
  pax_type: number;
  country_of_residence: number;
  client_user_id: number;
  state_of_residence: number;
  file_number: string;
  service_type: number;
  referrer: string;
  citizenship: number;
  last_updated_by: number;

  status?: number;
  reference_number?: string;
}

export const convertRequestToAddStep1DataRequest = (
  request: any
): AddStep1DataRequest => ({
  pax_type: Number(request.pax_type),
  country_of_residence: Number(request.country_of_residence),
  client_user_id: Number(request.client_user_id),
  state_of_residence: Number(request.state_of_residence),
  file_number: String(request.file_number),
  service_type: Number(request.service_type),
  referrer: String(request.referrer),
  citizenship: Number(request.citizenship),
  last_updated_by: Number(request.token_user_id),
});
