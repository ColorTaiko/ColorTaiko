export class NoPatternError extends Error {
  constructor(message, trioMap) {
    super(message);
    this.name = "NoPatternError";
    this.trioMap = trioMap;
  }
}