export type UpdateUserStatusRequest = {
  user_id: number;
  status: number;
  last_updated_by: number;
};

export const convertRequestToUpdateUserStatusRequest = (
  request: any
): UpdateUserStatusRequest => ({
  status: Number(request.status),
  user_id: Number(request.user_id),
  last_updated_by: Number(request.token_user_id),
});
