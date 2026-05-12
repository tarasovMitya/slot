export type FieldType = "stepper" | "select" | "toggle";

export interface SelectOption {
  label: string;
  value: string;
  price: number;
}

export interface ServiceField {
  id: string;
  type: FieldType;
  label: string;
  defaultValue?: number | string | boolean;
  priceMultiplier?: boolean;
  price?: number;
  options?: SelectOption[];
  min?: number;
  max?: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  fields: ServiceField[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  services: Service[];
}

export interface FieldValues {
  [fieldId: string]: number | string | boolean;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  comment?: string;
}

export interface ScheduleInfo {
  date: string;
  time: string;
}

export type Step =
  | "category"
  | "service"
  | "parameters"
  | "datetime"
  | "auth"
  | "checkout"
  | "success";

export interface PriceBreakdownItem {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  items: PriceBreakdownItem[];
  total: number;
}
