export interface FieldConfig {
  type: "number" | "string" | "object" | "array";
  required: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  items?: FieldConfig;
  properties?: { [key: string]: FieldConfig };
}

export interface ValidationSchema {
  body?: {
    [key: string]: FieldConfig;
  };
  param?: {
    [key: string]: FieldConfig;
  };
}
