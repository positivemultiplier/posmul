import { failure, isFailure, isSuccess, success } from "../index";

describe("Result helper functions", () => {
  it("isSuccess should return true for success", () => {
    const r = success(1);
    expect(isSuccess(r)).toBe(true);
    expect(isFailure(r)).toBe(false);
  });

  it("isFailure should return true for failure", () => {
    const r = failure(new Error("oops"));
    expect(isFailure(r)).toBe(true);
    expect(isSuccess(r)).toBe(false);
  });
});
