import { Patient, Doctor, Visit } from './types';

export class EHRValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EHRValidationError';
  }
}

/**
 * Validates the data before sending to EHR.
 * Throws EHRValidationError if any critical field is missing or invalid.
 */
export function validateForEHR(patient: Patient, doctor: Doctor, visit: Visit, isUpdate: boolean = false) {
  // 1. Patient Validation
  if (!patient.personalId || patient.personalId.length !== 11) {
    throw new EHRValidationError("პაციენტის პირადი ნომერი აუცილებელია და უნდა შედგებოდეს 11 ციფრისგან.");
  }
  if (!patient.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(patient.birthDate)) {
    throw new EHRValidationError("პაციენტის დაბადების თარიღი აუცილებელია (ფორმატი: წწწწ-თთ-დდ).");
  }
  if (!patient.bloodGroupRhFactor) {
    throw new EHRValidationError("პაციენტის სისხლის ჯგუფი და რეზუსი აუცილებელია.");
  }
  if (!patient.actualRegion || !patient.actualResidenceAddress) {
    throw new EHRValidationError("პაციენტის ფაქტობრივი რეგიონი და მისამართი აუცილებელია.");
  }

  // 2. Doctor Validation
  if (!doctor.personalId || doctor.personalId.length !== 11) {
    throw new EHRValidationError("ექიმის პირადი ნომერი აუცილებელია და უნდა შედგებოდეს 11 ციფრისგან.");
  }
  if (!doctor.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(doctor.birthDate)) {
    throw new EHRValidationError("ექიმის დაბადების თარიღი აუცილებელია (ფორმატი: წწწწ-თთ-დდ).");
  }

  // 3. Visit/Order Validation
  if (!visit.startDate || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(visit.startDate)) {
    throw new EHRValidationError("ვიზიტის დაწყების თარიღი აუცილებელია.");
  }
  if (!visit.endDate || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(visit.endDate)) {
    throw new EHRValidationError("ვიზიტის დასრულების თარიღი აუცილებელია.");
  }

  // Check prescriptions for anesthesia requirement
  if (visit.prescriptions && visit.prescriptions.length > 0) {
    for (const rx of visit.prescriptions) {
      if (rx.wasUsed !== 1 && rx.wasUsed !== 2) {
        throw new EHRValidationError(`დანიშნულებას მედიკამენტისთვის ${rx.drugId} უნდა ჰქონდეს 'wasUsed' სტატუსი: 1 (მკურნალობა) ან 2 (ანესთეზია).`);
      }
    }
  }

  // Check calculation items
  if (visit.calculations?.directCosts?.usedMedicalItems) {
    for (const item of visit.calculations.directCosts.usedMedicalItems) {
      if (!item.itemId) {
        if (!item.itemGroupId || !item.itemDescription) {
          throw new EHRValidationError("გამოყენებულ მასალას აკლია ItemID. შესაბამისად, აუცილებელია ItemGroupID და დასახელების მითითება.");
        }
      }
    }
  }

  // 4. Update Mode Validation (ReplacePlannedAmbulatory constraints)
  if (isUpdate) {
    if (!visit.ehrId) {
      throw new EHRValidationError("EHRID აუცილებელია ვიზიტის განახლებისთვის (Update).");
    }
  }
}
