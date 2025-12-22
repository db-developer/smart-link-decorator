
describe( "Running 00.initial/10.00.dom.test.ts", () => {
  test("Initially testing DOM renderer", () => {
    const el = document.createElement("div");
    el.textContent = "Hallo Welt";
    expect(el.textContent).toBe("Hallo Welt");
  })
});