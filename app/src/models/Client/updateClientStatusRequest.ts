export type UpdateClientStatusRequest = {
  user_id: number;
  status: number;
  last_updated_by: number;
};

export const convertRequestToUpdateClientStatusRequest = (
  request: any
): UpdateClientStatusRequest => ({
  status: Number(request.status),
  user_id: Number(request.user_id),
  last_updated_by: Number(request.token_user_id),
});
