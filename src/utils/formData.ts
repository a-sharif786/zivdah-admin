/**
 * Builds a multipart/form-data payload matching the backend's
 * @RequestPart("data") ProductRequestDto/BannerRequestDto + @RequestPart("image") FilePart
 * contract used by product/banner create & update. The "data" part must be a JSON-typed
 * blob (not a plain string field), or Spring's multipart resolver won't bind it correctly.
 */
export function buildMultipart<T>(payload: T, file?: File | Blob | null): FormData {
  const form = new FormData();
  form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (file) {
    form.append('image', file);
  }
  return form;
}
