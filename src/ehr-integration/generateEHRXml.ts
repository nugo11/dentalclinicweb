import { Patient, Doctor, Visit } from './types';

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}

/**
 * Generates the Planned Ambulatory XML payload (გეგმიური ამბულატორია)
 */
export function generateEHRXml(patient: Patient, doctor: Doctor, visit: Visit): string {
  // Construct the base XML structure
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<EHR>\n`;

  // 1. EHRInfo
  xml += `  <EHRInfo>
    <EHRNo>${escapeXml(visit.ehrNo)}</EHRNo>
    <CaseNo></CaseNo>
    <ResponsiblePersonID>${escapeXml(doctor.personalId)}</ResponsiblePersonID>
    <ResponsiblePersonBDate>${escapeXml(doctor.birthDate)}</ResponsiblePersonBDate>
    <EHRStartDate>${visit.startDate}</EHRStartDate>
    <EHREndDate>${visit.endDate}</EHREndDate>
    <EHRVisibleStatus>1</EHRVisibleStatus>
  </EHRInfo>\n`;

  // 2. PatientInfo
  xml += `  <PatientInfo>
    <PatientIDnumber>${escapeXml(patient.personalId)}</PatientIDnumber>
    <PatientDateOfBirth>${escapeXml(patient.birthDate)}</PatientDateOfBirth>
    <PatientGender>${patient.gender === 'female' ? 2 : patient.gender === 'male' ? 1 : 99}</PatientGender>
    <BloodGroupRhFactor>${patient.bloodGroupRhFactor}</BloodGroupRhFactor>
    <PatientActualRegion>${escapeXml(patient.actualRegion)}</PatientActualRegion>
    <PatientActualResidenceAddress>${escapeXml(patient.actualResidenceAddress)}</PatientActualResidenceAddress>
    <PatientPhone>${escapeXml(patient.phone || '')}</PatientPhone>
    <PatientEMail>${escapeXml(patient.email || '')}</PatientEMail>
  </PatientInfo>\n`;

  // 3. AnamnesisVitae (Life Anamnesis - using dummy/empty tags based on specs if data isn't provided, 
  // but preserving structure to avoid missing required wrappers if any. 
  // We'll skip optional inner tags if data is missing, but keeping the container if required)
  xml += `  <AnamnesisVitae>
    <DiseaseHistoryTraumaPathologicalConditions></DiseaseHistoryTraumaPathologicalConditions>
    <AlergiesAndAdverceReactions></AlergiesAndAdverceReactions>
  </AnamnesisVitae>\n`;

  // 4. Hospitalization (Ambulatory Episode)
  xml += `  <Hospitalization>\n`;
  xml += `    <Visits>
      <Record>
        <VisitStartDate>${visit.startDate}</VisitStartDate>
        <VisitEndDate>${visit.endDate}</VisitEndDate>
        <VisitComment></VisitComment>
      </Record>
    </Visits>\n`;
  
  xml += `    <ResponsiblePersons>
      <Record>
        <ResponsiblePersonID>${escapeXml(doctor.personalId)}</ResponsiblePersonID>
        <ResponsiblePersonBDate>${escapeXml(doctor.birthDate)}</ResponsiblePersonBDate>
      </Record>
    </ResponsiblePersons>\n`;

  xml += `    <AnamnesisMorbi>
      <TypeOfHospitalization>1</TypeOfHospitalization>
      <Simptoms>${escapeXml(visit.anamnesisMorbi?.symptoms || '')}</Simptoms>
    </AnamnesisMorbi>\n`;

  xml += `    <TreatmentProcess>\n`;
  
  // Procedures (ClinicalDiagnosticExploration or OtherActivity)
  if (visit.procedures && visit.procedures.length > 0) {
    xml += `      <OtherActivity>\n`;
    for (const proc of visit.procedures) {
      xml += `        <Record>
          <NCSP>${escapeXml(proc.ncsp)}</NCSP>
          <ICD10>${escapeXml(proc.icd10)}</ICD10>
          <ProcedureEndDate>${proc.procedureEndDate}</ProcedureEndDate>
          <ProcedureResult>${escapeXml(proc.procedureResult)}</ProcedureResult>
          <Price>${proc.price}</Price>
        </Record>\n`;
    }
    xml += `      </OtherActivity>\n`;
  }

  // Prescriptions (Medications and Anesthesia)
  if (visit.prescriptions && visit.prescriptions.length > 0) {
    xml += `      <Prescription>\n`;
    for (const rx of visit.prescriptions) {
      xml += `        <Record>
          <ICD10>${escapeXml(rx.icd10)}</ICD10>
          <DrugID>${escapeXml(rx.drugId)}</DrugID>
          <Linked>1</Linked>
          <DrugNameGE></DrugNameGE>
          <DrugCount>${rx.drugCount}</DrugCount>
          <Price>${rx.price}</Price>
          <DS>${escapeXml(rx.ds)}</DS>
          <WasUsed>${rx.wasUsed}</WasUsed>
        </Record>\n`;
    }
    xml += `      </Prescription>\n`;
  }

  xml += `    </TreatmentProcess>\n`;
  xml += `  </Hospitalization>\n`;

  // 5. Discharge (Final Diagnosis)
  xml += `  <Discharge>
    <FinalDiagnosis>
      <PrimaryDisease>
        <ICD10>${escapeXml(visit.diagnoses.find(d => d.isPrimary)?.icd10 || '')}</ICD10>
        <Illness>1</Illness>
      </PrimaryDisease>
    </FinalDiagnosis>
    <HospitalizationOutcome>
      <HospitalizationResult>1</HospitalizationResult>
      <ConditionAtTheMoment>2</ConditionAtTheMoment>
      <DoctorComment></DoctorComment>
    </HospitalizationOutcome>
  </Discharge>\n`;

  xml += `</EHR>`;

  return xml;
}
