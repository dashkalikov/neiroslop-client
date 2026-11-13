export function registrationPayload({ passwordConfirmation, ...credentials }) {
  return credentials.password === passwordConfirmation ? credentials : null;
}
