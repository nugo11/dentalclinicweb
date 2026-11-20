import { validatePhone, formatPhone } from "./phoneFormatter.js";

export const PATIENT_SHEET_NAME = "პაციენტები";
export const INSTRUCTIONS_SHEET_NAME = "ინსტრუქცია";
export const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_EXCEL_IMPORT_ROWS = 1000;

export const PATIENT_EXCEL_COLUMNS = [
  {
    key: "fullName",
    header: "სახელი და გვარი *",
    required: true,
    width: 28,
    formatDesc: "ტექსტი (მინიმუმ 2 სიმბოლო)",
    example: "მაგ: გიორგი მაისურაძე",
  },
  {
    key: "phone",
    header: "ტელეფონი *",
    required: true,
    width: 20,
    formatDesc: "მობილური (5XX XX XX XX) ან ქალაქის (032 X XX XX XX)",
    example: "595 12 34 56",
  },
  {
    key: "actualRegion",
    header: "რეგიონი / ქალაქი *",
    required: true,
    width: 22,
    formatDesc: "ტექსტი",
    example: "თბილისი",
  },
  {
    key: "actualResidenceAddress",
    header: "ფაქტობრივი მისამართი *",
    required: true,
    width: 30,
    formatDesc: "ტექსტი",
    example: "ჭავჭავაძის გამზ. N12",
  },
  {
    key: "personalId",
    header: "პირადი ნომერი (11 ნიშნა)",
    required: false,
    width: 24,
    formatDesc: "ზუსტად 11 ციფრი (სასურველია Text ფორმატი, რათა 0 არ წაიშალოს)",
    example: "01001012345",
  },
  {
    key: "birthDate",
    header: "დაბადების თარიღი (YYYY-MM-DD)",
    required: false,
    width: 28,
    formatDesc: "YYYY-MM-DD ან DD.MM.YYYY (არაუმეტეს დღევანდელი თარიღისა)",
    example: "1990-05-15",
  },
  {
    key: "email",
    header: "ელ-ფოსტა",
    required: false,
    width: 26,
    formatDesc: "ვალიდური ელ-ფოსტის მისამართი",
    example: "giorgi@example.com",
  },
  {
    key: "gender",
    header: "სქესი (მამრობითი/მდედრობითი)",
    required: false,
    width: 28,
    formatDesc: "მამრობითი, მდედრობითი (ან დატოვეთ ცარიელი)",
    example: "მამრობითი",
  },
  {
    key: "bloodGroup",
    header: "სისხლის ჯგუფი",
    required: false,
    width: 18,
    formatDesc: "O+, O-, A+, A-, B+, B-, AB+, AB- (ან N/A)",
    example: "O+",
  },
  {
    key: "allergies",
    header: "ალერგიები",
    required: false,
    width: 26,
    formatDesc: "ტექსტი",
    example: "პენიცილინი",
  },
  {
    key: "chronicDiseases",
    header: "ქრონიკული დაავადებები",
    required: false,
    width: 28,
    formatDesc: "ტექსტი",
    example: "",
  },
  {
    key: "importantNote",
    header: "მნიშვნელოვანი შენიშვნა",
    required: false,
    width: 28,
    formatDesc: "ტექსტი",
    example: "",
  },
];

const HEADER_ALIASES = {
  fullName: [
    "სახელი და გვარი",
    "სახელი გვარი",
    "სრული სახელი",
    "სრული სახელი და გვარი",
    "პაციენტი",
    "fullname",
    "full name",
    "name",
  ],
  phone: ["ტელეფონი", "ტელეფონის ნომერი", "მობილური", "phone", "mobile", "tel"],
  actualRegion: ["რეგიონი / ქალაქი", "რეგიონი", "ქალაქი", "actualregion", "region", "city"],
  actualResidenceAddress: [
    "ფაქტობრივი მისამართი",
    "მისამართი",
    "actualresidenceaddress",
    "address",
  ],
  personalId: ["პირადი ნომერი", "პ/ნ", "personalid", "personal id", "id"],
  birthDate: ["დაბადების თარიღი", "დაბ. თარიღი", "birthdate", "birth date", "dob"],
  email: ["ელ-ფოსტა", "ელ.ფოსტა", "ელფოსტა", "ფოსტა", "email", "e-mail"],
  gender: ["სქესი", "gender", "sex"],
  bloodGroup: ["სისხლის ჯგუფი", "ჯგუფი", "bloodgroup", "blood group"],
  allergies: ["ალერგიები", "ალერგია", "allergies", "allergy"],
  chronicDiseases: [
    "ქრონიკული დაავადებები",
    "დაავადებები",
    "chronicdiseases",
    "chronic diseases",
    "diseases",
  ],
  importantNote: ["მნიშვნელოვანი შენიშვნა", "შენიშვნა", "კომენტარი", "importantnote", "note", "notes"],
};

const GENDER_MAP = {
  "": "not_specified",
  "არჩეული არ არის": "not_specified",
  not_specified: "not_specified",
  "უცნობი": "not_specified",
  "მამრობითი": "male",
  "მამრ": "male",
  "მამრ.": "male",
  "კაცი": "male",
  male: "male",
  m: "male",
  "მდედრობითი": "female",
  "მდედრ": "female",
  "მდედრ.": "female",
  "ქალი": "female",
  female: "female",
  f: "female",
};

const BLOOD_GROUP_MAP = {
  "": "",
  "O+": "O+",
  "O-": "O-",
  "A+": "A+",
  "A-": "A-",
  "B+": "B+",
  "B-": "B-",
  "AB+": "AB+",
  "AB-": "AB-",
  "N/A": "N/A",
  "1": "O+",
  "2": "A+",
  "3": "B+",
  "4": "AB+",
  "O (I)": "O+",
  "O(I)": "O+",
  I: "O+",
  "A (II)": "A+",
  "A(II)": "A+",
  II: "A+",
  "B (III)": "B+",
  "B(III)": "B+",
  III: "B+",
  "AB (IV)": "AB+",
  "AB(IV)": "AB+",
  IV: "AB+",
};

const normalizeHeaderText = (raw) => {
  if (raw === null || raw === undefined) return "";
  return String(raw)
    .replace(/\*+/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const cellToString = (val) => {
  if (val === null || val === undefined) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "number") {
    return Number.isFinite(val) ? String(val).trim() : "";
  }
  return String(val).trim();
};

const isValidCalendarDate = (year, month, day) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
};

const getLocalTodayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseBirthDateValue = (raw) => {
  if (raw === null || raw === undefined || raw === "") {
    return { value: "", error: null };
  }

  let year;
  let month;
  let day;

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) {
      return { value: "", error: "დაბადების თარიღის ფორმატი არასწორია" };
    }
    year = raw.getUTCFullYear();
    month = raw.getUTCMonth() + 1;
    day = raw.getUTCDate();
  } else {
    const str = cellToString(raw);
    if (!str) return { value: "", error: null };

    const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(str);
    const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(str);

    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      year = parseInt(dmyMatch[3], 10);
    } else {
      return {
        value: "",
        error: "დაბადების თარიღის ფორმატი არასწორია (გამოიყენეთ YYYY-MM-DD ან DD.MM.YYYY)",
      };
    }
  }

  if (!isValidCalendarDate(year, month, day)) {
    return { value: "", error: "მიუთითეთ რეალური კალენდარული დაბადების თარიღი" };
  }

  if (year < 1900) {
    return { value: "", error: "დაბადების თარიღი უნდა იყოს 1900 წლის შემდეგ" };
  }

  const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (formatted > getLocalTodayIso()) {
    return { value: "", error: "დაბადების თარიღი არ შეიძლება იყოს მომავალში" };
  }

  return { value: formatted, error: null };
};

const normalizePhoneCell = (raw) => {
  const str = cellToString(raw);
  if (!str) return { value: "", error: "ტელეფონის ნომერი სავალდებულოა" };

  if (/[^\d\s+\-()]/.test(str)) {
    return { value: "", error: "ტელეფონის ნომერი შეიცავს დაუშვებელ სიმბოლოებს" };
  }

  // Excel strips leading zero from Tbilisi landline numbers entered as numbers (e.g. 322110011 -> 0322110011)
  const rawDigits = str.replace(/\D/g, "");
  const candidate = rawDigits.length === 9 && rawDigits.startsWith("32") ? `0${rawDigits}` : str;

  const err = validatePhone(candidate, true);
  if (err) {
    return { value: "", error: err };
  }

  return { value: formatPhone(candidate), error: null };
};

/**
 * Generates and downloads the official AiDent patient import .xlsx template
 */
export const downloadPatientExcelTemplate = async () => {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const headerRow = PATIENT_EXCEL_COLUMNS.map((col) => ({
    value: col.header,
    type: String,
    fontWeight: "bold",
    textColor: "#FFFFFF",
    backgroundColor: "#7C3AED",
    align: "center",
    alignVertical: "center",
    wrap: true,
    height: 30,
  }));

  const exampleRow = PATIENT_EXCEL_COLUMNS.map((col) => ({
    value: col.example || "",
    type: String,
    fontStyle: "italic",
    textColor: "#64748B",
    backgroundColor: "#F8FAFC",
    alignVertical: "center",
  }));

  const instructionHeaders = [
    {
      value: "სვეტი",
      type: String,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#1E1B4B",
      alignVertical: "center",
      height: 26,
    },
    {
      value: "სავალდებულო",
      type: String,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#1E1B4B",
      align: "center",
      alignVertical: "center",
    },
    {
      value: "ფორმატი / დაშვებული მნიშვნელობები",
      type: String,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#1E1B4B",
      alignVertical: "center",
    },
    {
      value: "მაგალითი",
      type: String,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#1E1B4B",
      alignVertical: "center",
    },
  ];

  const instructionRows = PATIENT_EXCEL_COLUMNS.map((col) => [
    { value: col.header, type: String, fontWeight: "bold", alignVertical: "center", wrap: true },
    {
      value: col.required ? "დიახ (*)" : "არა",
      type: String,
      textColor: col.required ? "#DC2626" : "#64748B",
      fontWeight: col.required ? "bold" : undefined,
      align: "center",
      alignVertical: "center",
    },
    { value: col.formatDesc, type: String, alignVertical: "center", wrap: true },
    { value: col.example || "—", type: String, alignVertical: "center" },
  ]);

  instructionRows.push([
    { value: "მნიშვნელოვანი წესები", type: String, fontWeight: "bold", textColor: "#7C3AED" },
    { value: "!", type: String, fontWeight: "bold", textColor: "#7C3AED", align: "center" },
    {
      value:
        "მე-2 სტრიქონი ('მაგ: გიორგი მაისურაძე') არის სანიმუშო ჩანაწერი და იმპორტისას ავტომატურად გამოტოვება. თუ ფაილში რაიმე შეცდომაა, არცერთი პაციენტი არ დაიმპორტდება სანამ ფაილი სრულად არ გასწორდება.",
      type: String,
      wrap: true,
    },
    { value: "—", type: String },
  ]);

  await writeXlsxFile(
    [
      {
        sheet: PATIENT_SHEET_NAME,
        data: [headerRow, exampleRow],
        columns: PATIENT_EXCEL_COLUMNS.map((c) => ({ width: c.width })),
        stickyRowsCount: 1,
      },
      {
        sheet: INSTRUCTIONS_SHEET_NAME,
        data: [instructionHeaders, ...instructionRows],
        columns: [{ width: 32 }, { width: 16 }, { width: 58 }, { width: 26 }],
        stickyRowsCount: 1,
      },
    ],
    { fontSize: 11 }
  ).toFile("aident-patients-template.xlsx");
};

/**
 * Parses and strictly validates an uploaded patient Excel workbook.
 * Returns all parsed valid patients plus a full list of row/field errors.
 */
export const parseAndValidatePatientExcel = async (file, existingPersonalIds = new Set()) => {
  const emptyResult = (fileError) => ({
    validPatients: [],
    errors: [],
    totalRows: 0,
    skippedSampleRow: false,
    fileError,
  });

  if (!file) {
    return emptyResult("გთხოვთ აირჩიოთ ექსელის ფაილი.");
  }

  const fileName = (file.name || "").toLowerCase();
  if (!fileName.endsWith(".xlsx")) {
    return emptyResult("დაშვებულია მხოლოდ .xlsx ფორმატის ექსელის ფაილი.");
  }

  if (file.size > MAX_EXCEL_FILE_BYTES) {
    return emptyResult("ფაილის ზომა არ უნდა აღემატებოდეს 5 MB-ს.");
  }

  let rows;
  try {
    const { readSheet, SheetNotFoundError } = await import("read-excel-file/browser");
    try {
      rows = await readSheet(file, PATIENT_SHEET_NAME);
    } catch (sheetErr) {
      if (sheetErr instanceof SheetNotFoundError || sheetErr?.name === "SheetNotFoundError") {
        rows = await readSheet(file, 1);
      } else {
        throw sheetErr;
      }
    }
  } catch (err) {
    console.error("Excel parse error:", err);
    return emptyResult(
      "ფაილის წაკითხვა ვერ მოხერხდა. დარწმუნდით, რომ ატვირთულია დაუზიანებელი .xlsx ფაილი."
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return emptyResult("ფაილი ცარიელია. გთხოვთ გამოიყენოთ ოფიციალური შაბლონი.");
  }

  // Map header columns
  const headerRow = rows[0] || [];
  const colIndexByKey = {};

  headerRow.forEach((cellVal, idx) => {
    const normalized = normalizeHeaderText(cellVal);
    if (!normalized) return;
    for (const [fieldKey, aliases] of Object.entries(HEADER_ALIASES)) {
      if (colIndexByKey[fieldKey] === undefined && aliases.includes(normalized)) {
        colIndexByKey[fieldKey] = idx;
      }
    }
  });

  const requiredKeys = ["fullName", "phone", "actualRegion", "actualResidenceAddress"];
  const missingHeaders = requiredKeys.filter((k) => colIndexByKey[k] === undefined);
  if (missingHeaders.length > 0) {
    return emptyResult(
      "ფაილის სტრუქტურა არ ემთხვევა AiDent-ის ექსელის ფორმას. გთხოვთ ჩამოტვირთოთ და გამოიყენოთ ოფიციალური შაბლონი."
    );
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_EXCEL_IMPORT_ROWS) {
    return emptyResult(
      `ერთ ჯერზე შესაძლებელია მაქსიმუმ ${MAX_EXCEL_IMPORT_ROWS} ჩანაწერის იმპორტი.`
    );
  }

  const validPatients = [];
  const errors = [];
  const seenPersonalIds = new Map();
  let skippedSampleRow = false;
  let totalRows = 0;

  const getVal = (row, key) => {
    const idx = colIndexByKey[key];
    return idx !== undefined ? row[idx] : undefined;
  };

  dataRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // 1-based Excel row (row 1 is header)
    const cells = Array.isArray(row) ? row : [];

    // Skip completely empty rows
    const hasAnyValue = Object.values(colIndexByKey).some((colIdx) => {
      const str = cellToString(cells[colIdx]);
      return str.length > 0;
    });
    if (!hasAnyValue) return;

    const fullName = cellToString(getVal(cells, "fullName"));
    if (fullName.startsWith("მაგ:")) {
      skippedSampleRow = true;
      return;
    }

    totalRows += 1;
    const rowErrors = [];

    // 1. fullName (required)
    if (!fullName || fullName.length < 2) {
      rowErrors.push({
        rowNumber,
        field: "სახელი და გვარი",
        message: "სრული სახელი და გვარი სავალდებულოა (მინიმუმ 2 სიმბოლო)",
      });
    }

    // 2. phone (required)
    const phoneRes = normalizePhoneCell(getVal(cells, "phone"));
    if (phoneRes.error) {
      rowErrors.push({
        rowNumber,
        field: "ტელეფონი",
        message: phoneRes.error,
      });
    }

    // 3. actualRegion (required)
    const actualRegion = cellToString(getVal(cells, "actualRegion"));
    if (!actualRegion) {
      rowErrors.push({
        rowNumber,
        field: "რეგიონი / ქალაქი",
        message: "რეგიონი / ქალაქი სავალდებულოა",
      });
    }

    // 4. actualResidenceAddress (required)
    const actualResidenceAddress = cellToString(getVal(cells, "actualResidenceAddress"));
    if (!actualResidenceAddress) {
      rowErrors.push({
        rowNumber,
        field: "ფაქტობრივი მისამართი",
        message: "ფაქტობრივი მისამართი სავალდებულოა",
      });
    }

    // 5. personalId (optional, 11 digits & unique)
    const rawPid = cellToString(getVal(cells, "personalId")).replace(/[\s-]/g, "");
    let personalId = "";
    if (rawPid) {
      if (!/^\d{11}$/.test(rawPid)) {
        rowErrors.push({
          rowNumber,
          field: "პირადი ნომერი",
          message:
            "პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან (0-ით დაწყებულ ნომერზე გამოიყენეთ Text ფორმატი)",
        });
      } else if (seenPersonalIds.has(rawPid)) {
        rowErrors.push({
          rowNumber,
          field: "პირადი ნომერი",
          message: `პირადი ნომერი დუბლირებულია ფაილში (იხ. სტრიქონი #${seenPersonalIds.get(rawPid)})`,
        });
      } else if (existingPersonalIds.has(rawPid)) {
        rowErrors.push({
          rowNumber,
          field: "პირადი ნომერი",
          message: "პაციენტი ამ პირადი ნომრით უკვე რეგისტრირებულია ბაზაში",
        });
      } else {
        personalId = rawPid;
        seenPersonalIds.set(rawPid, rowNumber);
      }
    }

    // 6. birthDate (optional)
    const birthDateRes = parseBirthDateValue(getVal(cells, "birthDate"));
    if (birthDateRes.error) {
      rowErrors.push({
        rowNumber,
        field: "დაბადების თარიღი",
        message: birthDateRes.error,
      });
    }

    // 7. email (optional)
    const rawEmail = cellToString(getVal(cells, "email")).toLowerCase();
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      rowErrors.push({
        rowNumber,
        field: "ელ-ფოსტა",
        message: "ელ-ფოსტის ფორმატი არასწორია",
      });
    }

    // 8. gender (optional)
    const rawGender = cellToString(getVal(cells, "gender")).toLowerCase();
    const mappedGender = GENDER_MAP[rawGender];
    if (mappedGender === undefined) {
      rowErrors.push({
        rowNumber,
        field: "სქესი",
        message: "სქესი უნდა იყოს 'მამრობითი' ან 'მდედრობითი'",
      });
    }

    // 9. bloodGroup (optional)
    const rawBlood = cellToString(getVal(cells, "bloodGroup")).toUpperCase();
    const mappedBloodGroup = BLOOD_GROUP_MAP[rawBlood];
    if (mappedBloodGroup === undefined) {
      rowErrors.push({
        rowNumber,
        field: "სისხლის ჯგუფი",
        message: "სისხლის ჯგუფი არასწორია (დაშვებულია: O+, O-, A+, A-, B+, B-, AB+, AB-)",
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    validPatients.push({
      fullName,
      phone: phoneRes.value,
      actualRegion,
      actualResidenceAddress,
      personalId,
      birthDate: birthDateRes.value,
      email: rawEmail,
      gender: mappedGender,
      bloodGroup: mappedBloodGroup,
      allergies: cellToString(getVal(cells, "allergies")),
      chronicDiseases: cellToString(getVal(cells, "chronicDiseases")),
      importantNote: cellToString(getVal(cells, "importantNote")),
    });
  });

  if (totalRows === 0) {
    return {
      validPatients: [],
      errors: [],
      totalRows: 0,
      skippedSampleRow,
      fileError: skippedSampleRow
        ? "ფაილში სანიმუშო ჩანაწერის გარდა სხვა პაციენტი ვერ მოიძებნა. გთხოვთ შეავსოთ პაციენტების მონაცემები მე-3 სტრიქონიდან (ან წაშალოთ სანიმუშო სტრიქონი)."
        : "ფაილში პაციენტების ჩანაწერები ვერ მოიძებნა.",
    };
  }

  return {
    validPatients,
    errors,
    totalRows,
    skippedSampleRow,
    fileError: null,
  };
};
