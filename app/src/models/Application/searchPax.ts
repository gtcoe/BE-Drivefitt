export interface SearchPaxRequest {
  pax_name: string;
  passport_number: string;
  reference_number: string;
}

export const convertRequestToSearchPaxRequestt = (
  request: any
): SearchPaxRequest => ({
  pax_name: String(request.pax_name),
  passport_number: String(request.passport_number),
  reference_number: String(request.reference_number),
});
