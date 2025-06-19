export interface SearchRequest {
  reference_number: string;
  customer_type: number;
  customer: number;
  name: string;
  visa_branch: number;
  entry_generation_branch: number;
  from_date: string;
  to_date: string;
  queue: number;
  status: number;
  country: number;
  billing_to_company: string;
}

export const convertRequestToSearchRequest = (
  request: any
): SearchRequest => ({
  reference_number: String(request.reference_number),
  customer_type: Number(request.customer_type),
  customer: Number(request.customer),
  name: String(request.name),
  visa_branch: Number(request.visa_branch),
  entry_generation_branch: Number(request.entry_generation_branch),
  from_date: String(request.from_date),
  to_date: String(request.to_date),
  queue: Number(request.queue),
  status: Number(request.status),
  country: Number(request.country),
  billing_to_company: String(request.billing_to_company),
});
