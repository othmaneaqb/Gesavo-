import { languages, translations } from "./translations";

const flattenKeys = (value, prefix = "") => Object.entries(value).flatMap(
  ([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return nested && typeof nested === "object"
      ? flattenKeys(nested, path)
      : [path];
  },
);

describe("FR/EN/AR translations", () => {
  test("all locales expose the same translation keys", () => {
    const frenchKeys = flattenKeys(translations.fr).sort();
    expect(flattenKeys(translations.en).sort()).toEqual(frenchKeys);
    expect(flattenKeys(translations.ar).sort()).toEqual(frenchKeys);
  });

  test("translation values contain no common mojibake markers", () => {
    const serialized = JSON.stringify(translations);
    expect(serialized).not.toMatch(/Ã.|Â.|â(?:€|™|œ|ž|”|€¦|€”|˜)|�/u);
    expect(translations.fr.auth.loginSubtitle).toContain("Accédez à");
    expect(translations.fr.settings.teamAccounts).toBe("Comptes équipe");
    expect(translations.ar.auth.loginTitle).toMatch(/[\u0600-\u06ff]/u);
  });

  test("Arabic is the only right-to-left locale", () => {
    expect(languages.find(item => item.code === "ar").dir).toBe("rtl");
    expect(languages.filter(item => item.dir === "ltr").map(item => item.code))
      .toEqual(["fr", "en"]);
  });
});
