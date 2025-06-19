export interface AddStep2DataRequest {
  pax_id: number;
  application_id: number;
  last_updated_by: number;
}

export const convertRequestToAddStep2DataRequest = (
  request: any
): AddStep2DataRequest => ({
  pax_id: Number(request.pax_id),
  application_id: Number(request.application_id),
  last_updated_by: Number(request.token_user_id),
});
