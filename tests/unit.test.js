import test from "node:test";
import assert from "node:assert/strict";
import writeXlsxFile from "write-excel-file/node";
import {
  normalizeRole,
  isDoctorRole,
  getRoleLabel,
  FINANCE_ROLES,
} from "../src/utils/roleUtils.js";
import { escapeHtml, escapeXml, sanitizeUrl } from "../src/utils/sanitize.js";
import { getLocalDateString, getLocalMonthString } from "../src/utils/dateUtils.js";
import { cleanPhone, formatPhone, validatePhone } from "../src/utils/phoneFormatter.js";
import {
  normalizePlanId,
  getPlan,
  canAddPatient,
  canAddService,
  canAddDoctor,
} from "../src/config/plans.js";
import {
  PATIENT_SHEET_NAME,
  PATIENT_EXCEL_COLUMNS,
  parseAndValidatePatientExcel,
} from "../src/utils/patientExcelUtils.js";
import { createOtpChallenge, verifyOtpChallenge } from "../api/sms-otp.js";

test("roleUtils normalizes variants and protects finance roles", () => {
  assert.equal(normalizeRole("ექიმი"), "doctor");
  assert.equal(normalizeRole("Doctor "), "doctor");
  assert.equal(normalizeRole("ადმინისტრატორი"), "admin");
  assert.equal(normalizeRole("მენეჯერი"), "manager");
  assert.equal(normalizeRole("რეგისტრატორი"), "receptionist");
  assert.equal(normalizeRole("ბუღალტერი"), "accountant");
  assert.equal(isDoctorRole("ექიმი"), true);
  assert.equal(isDoctorRole("admin"), false);
  assert.equal(getRoleLabel("Doctor"), "ექიმი");
  assert.deepEqual(FINANCE_ROLES, ["admin", "manager", "accountant"]);
});

test("sanitize helpers escape HTML/XML and reject unsafe URLs", () => {
  assert.equal(escapeHtml('<script>alert("x")</script> & \'y\''), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;");
  assert.equal(escapeXml("<Tag a=\"1\" b='2'>A & B</Tag>"), "&lt;Tag a=&quot;1&quot; b=&apos;2&apos;&gt;A &amp; B&lt;/Tag&gt;");
  assert.equal(sanitizeUrl("https://cdn.example.com/img.png"), "https://cdn.example.com/img.png");
  assert.equal(sanitizeUrl("/logo.png"), "/logo.png");
  assert.equal(sanitizeUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeUrl("data:text/html,<script>"), "");
  assert.equal(sanitizeUrl("//evil.com/x"), "");
});

test("dateUtils formats local date and month consistently", () => {
  const sample = new Date(2026, 4, 9, 23, 55, 0); // May 9 local
  assert.equal(getLocalDateString(sample), "2026-05-09");
  assert.equal(getLocalMonthString(sample), "2026-05");
});

test("phoneFormatter cleans, formats and validates Georgian numbers", () => {
  assert.equal(cleanPhone("+995 595-12-34-56"), "595123456");
  assert.equal(formatPhone("595123456"), "595 12 34 56");
  assert.equal(formatPhone("0322123456"), "032 2 12 34 56");
  assert.equal(validatePhone("595 12 34 56", true), null);
  assert.ok(validatePhone("12345", true));
});

test("plans enforces limits and normalizes legacy plan names", () => {
  assert.equal(normalizePlanId("solo"), "business");
  assert.equal(normalizePlanId("pro"), "custom");
  assert.equal(getPlan("free").maxPatients, 50);
  assert.equal(canAddPatient("free", 49), true);
  assert.equal(canAddPatient("free", 50), false);
  assert.equal(canAddService("free", 9), true);
  assert.equal(canAddService("free", 10), false);
  assert.equal(canAddDoctor("free", 3), false);
  assert.equal(canAddDoctor("business", 6), false);
  assert.equal(canAddDoctor("custom", 14, 15), true);
  assert.equal(canAddDoctor("custom", 15, 15), false);
});

test("patientExcelUtils validates rows, skips sample row, and enforces all-or-nothing", async () => {
  const makeXlsxFile = async (name, rows) => {
    const data = rows.map((row) =>
      row.map((val) => ({ value: val ?? "", type: String }))
    );
    const buf = await writeXlsxFile(data, { sheet: PATIENT_SHEET_NAME }).toBuffer();
    return new File([buf], name, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const badExt = await parseAndValidatePatientExcel(new File(["hi"], "bad.csv"));
  assert.ok(badExt.fileError);

  const headers = PATIENT_EXCEL_COLUMNS.map((c) => c.header);
  const validFile = await makeXlsxFile("patients.xlsx", [
    headers,
    ["მაგ: გიორგი მაისურაძე", "595 12 34 56", "თბილისი", "ჭავჭავაძე 1", "01001012345", "1990-05-15", "g@a.ge", "მამრობითი", "O+", "", "", ""],
    ["ნინო კაპანაძე", "599123456", "ბათუმი", "რუსთაველის 5", "01024056789", "15.05.1992", "Nino@Test.GE", "მდედრობითი", "A+", "პენიცილინი", "ასთმა", "შენიშვნა"],
  ]);

  const validRes = await parseAndValidatePatientExcel(validFile, new Set(["11111111111"]));
  assert.equal(validRes.fileError, null);
  assert.equal(validRes.skippedSampleRow, true);
  assert.equal(validRes.validPatients.length, 1);
  assert.equal(validRes.validPatients[0].phone, "599 12 34 56");
  assert.equal(validRes.validPatients[0].birthDate, "1992-05-15");

  const invalidFile = await makeXlsxFile("invalid.xlsx", [
    headers,
    ["ა", "123", "", "", "11111111111", "2099-01-01", "bad-email", "x", "Z+", "", "", ""],
  ]);
  const invalidRes = await parseAndValidatePatientExcel(invalidFile, new Set(["11111111111"]));
  assert.ok(invalidRes.errors.length >= 6);
  assert.ok(invalidRes.errors.some((e) => e.message.includes("ბაზაში")));
});

test("sms-otp HMAC challenge creates and verifies safely", () => {
  const secret = "test-otp-secret-key-12345";
  const { challengeToken } = createOtpChallenge({
    phone: "595 12 34 56",
    code: "654321",
    purpose: "register",
    secret,
    ttlMs: 60_000,
  });

  assert.equal(
    verifyOtpChallenge({
      phone: "595123456",
      code: "654321",
      purpose: "register",
      challengeToken,
      secret,
    }),
    true
  );

  assert.equal(
    verifyOtpChallenge({
      phone: "595123456",
      code: "000000",
      purpose: "register",
      challengeToken,
      secret,
    }),
    false
  );

  assert.equal(
    verifyOtpChallenge({
      phone: "595000000",
      code: "654321",
      purpose: "register",
      challengeToken,
      secret,
    }),
    false
  );

  assert.equal(
    verifyOtpChallenge({
      phone: "595123456",
      code: "654321",
      purpose: "recovery",
      challengeToken,
      secret,
    }),
    false
  );

  assert.equal(
    verifyOtpChallenge({
      phone: "595123456",
      code: "654321",
      purpose: "register",
      challengeToken: challengeToken.slice(0, -2) + "xx",
      secret,
    }),
    false
  );

  const expired = createOtpChallenge({
    phone: "595123456",
    code: "123456",
    purpose: "register",
    secret,
    ttlMs: -10,
  });
  assert.equal(
    verifyOtpChallenge({
      phone: "595123456",
      code: "123456",
      purpose: "register",
      challengeToken: expired.challengeToken,
      secret,
    }),
    false
  );
});
