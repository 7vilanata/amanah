import type { ZodError } from "zod";

export type ActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function successResult(message: string): ActionResult {
  return {
    success: true,
    message,
  };
}

export function errorResult(message: string, fieldErrors?: Record<string, string[] | undefined>): ActionResult {
  return {
    success: false,
    message,
    fieldErrors,
  };
}

export function zodErrorResult(error: ZodError): ActionResult {
  const flattened = error.flatten();

  return {
    success: false,
    message: "Validasi gagal. Periksa kembali data yang diisi.",
    fieldErrors: flattened.fieldErrors,
  };
}
