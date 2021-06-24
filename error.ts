export class HandleError extends Error {
  code: number;
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
