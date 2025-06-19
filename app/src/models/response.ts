class Response {
  status: boolean;
  statusCode: number;
  message?: string;
  data: Record<string, any>;

  constructor(status: boolean = false, statusCode: number = 200) {
    this.status = status;
    this.statusCode = statusCode;
    this.data = {}; // Initialize data as an empty object
  }

  setStatus(status: boolean): void {
    this.status = status;
  }

  setStatusCode(statusCode: number): void {
    this.statusCode = statusCode;
  }

  setMessage(message: string): void {
    this.message = message;
  }

  setData(key: string, value: any): void {
    this.data[key] = value;
  }

  getData(key: string): any {
    return this.data[key];
  }

  updateFromResponse(response: Partial<Response>): void {
    if (response.status !== undefined) this.status = response.status;
    if (response.statusCode !== undefined)
      this.statusCode = response.statusCode;
    if (response.message !== undefined) this.message = response.message;
    if (response.data !== undefined) this.data = response.data;
  }
  set(response: Response): void {
    this.statusCode = response.statusCode;
    this.status = response.status;
    this.data = response.data;
    this.message = response.message;
  }
}

export default Response;
