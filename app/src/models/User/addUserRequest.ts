export type AddUserRequest = {
  name: string;
  email: string;
  status?: number;
  type: number;
  last_updated_by: number;

  password?: string;
  password_valid_till?: string;
  password_requested?: number;
  last_logged_in_at?: number;
};

export const convertRequestToAddUserRequest = (
  request: any
): AddUserRequest => ({
  name: String(request.name),
  email: String(request.email),
  status: Number(request.status),
  type: Number(request.type),
  last_updated_by: Number(request.token_user_id),
});
