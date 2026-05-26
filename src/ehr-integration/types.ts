export interface Patient {
  patientId: string;
  personalId: string;
  birthDate: string; // YYYY-MM-DD
  bloodGroupRhFactor: number;
  actualRegion: string;
  actualResidenceAddress: string;
  phone?: string;
  email?: string;
  gender?: string;
  anamnesisVitae?: any;
}

export interface Doctor {
  userId: string;
  personalId: string;
  birthDate: string; // YYYY-MM-DD
}

export interface Prescription {
  drugId: string;
  icd10: string;
  drugCount: number;
  ds: string;
  wasUsed: 1 | 2; // 1 = Treatment, 2 = Anesthesia
  price: number;
}

export interface EHRCredentials {
  username?: string;
  password?: string;
}

export interface UsedMedicalItem {
  section?: string;
  itemId?: string;
  itemGroupId?: string;
  itemDescription?: string;
  itemQuantity: number;
  itemPrice: number;
}

export interface Visit {
  visitId: string;
  ehrId?: string;
  ehrNo: string;
  patientId: string;
  doctorId: string;
  startDate: string; // YYYY-MM-DDTHH:mm:ss
  endDate: string; // YYYY-MM-DDTHH:mm:ss
  status: string;
  diagnoses: Array<{ icd10: string; isPrimary: boolean }>;
  procedures: Array<{
    ncsp: string;
    icd10: string;
    procedureEndDate: string;
    procedureResult: string;
    price: number;
  }>;
  prescriptions: Prescription[];
  calculations: {
    directCosts: {
      salary: Array<{ persId?: string; section?: string; amount: number }>;
      usedMedicalItems: UsedMedicalItem[];
    };
    addition?: { amount: number };
  };
}
