export interface AddStep4DataRequest {
  dispatch_medium: number;
  dispatch_medium_number: string;
  remarks: string;
  reference_number: string;
  last_updated_by?: number;
}

export const convertRequestToAddStep4DataRequest = (
  request: any
): AddStep4DataRequest => ({
  dispatch_medium: Number(request.dispatch_medium),
  dispatch_medium_number: String(request.dispatch_medium_number),
  remarks: String(request.remarks),
  reference_number: String(request.reference_number),
  last_updated_by: Number(request.last_updated_by),
});
