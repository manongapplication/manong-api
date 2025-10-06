export interface PaymongoError {
  errors: {
    code: string;
    detail: string;
    source?: {
      pointer?: string;
      attribute?: string;
    };
  }[];
}
