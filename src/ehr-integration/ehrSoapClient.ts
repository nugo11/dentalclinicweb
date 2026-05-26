import axios from 'axios';
import { Patient, Doctor, Visit, EHRCredentials } from './types';
import { validateForEHR, EHRValidationError } from './ehrValidationGuard';
import { generateEHRXml } from './generateEHRXml';
import { generateCalculationXml } from './generateCalculationXml';

// Use environment variables for the URL
const EHR_WS_URL = import.meta.env?.VITE_EHR_WS_URL || '/api/ehr/ws.asmx';

/**
 * Escapes XML specifically for SOAP Body where the EHRXml itself is a string parameter.
 * Some SOAP clients require the inner XML to be HTML-encoded.
 */
function encodeXmlForSoap(xml: string): string {
  return xml.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

/**
 * Sends a SOAP request using axios.
 */
async function sendSoapRequest(actionName: string, bodyContent: string) {
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyContent}
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await axios.post(EHR_WS_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `http://tempuri.org/${actionName}`
      },
      timeout: 30000 // 30 seconds
    });
    
    // Parse the XML response for application-level errors
    if (typeof response.data === 'string') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, "text/xml");
      
      const faultString = doc.querySelector("faultstring");
      if (faultString) {
        throw new Error(`SOAP Fault: ${faultString.textContent}`);
      }

      // Check common EHR error tags
      const errorMessage = doc.querySelector("ErrorMessage") || doc.querySelector("ErrorDescription") || doc.querySelector("ErrorDescr") || doc.querySelector("ResultValue");
      const errorCode = doc.querySelector("ErrorCode") || doc.querySelector("errorCode") || doc.querySelector("Status");

      const msg = errorMessage?.textContent;
      const code = errorCode?.textContent;
      const returnedEhrId = doc.querySelector("EHRID")?.textContent || doc.querySelector("ehrID")?.textContent;

      if (returnedEhrId === "0" || msg || (code && code !== "0" && code !== "1" && code.toLowerCase() !== "success")) {
        // Fallback: extract all text from the XML to get a hint
        const rawText = response.data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, 250);
        const finalMsg = msg || rawText;
        throw new EHRValidationError(`ჯანდაცვის სერვერის პასუხი: ${finalMsg} (კოდი: ${code})`);
      }
      return { raw: response.data, ehrId: returnedEhrId !== "0" ? returnedEhrId : undefined };
    }

    return { raw: response.data };
  } catch (error: any) {
    console.error(`SOAP Request Failed for action ${actionName}:`, error.message);
    if (error.response) {
      console.error('SOAP Fault:', error.response.data);
    }
    throw error;
  }
}

/**
 * Sends Planned Ambulatory record to EHR (Create)
 */
export async function sendPlannedAmbulatory(patient: Patient, doctor: Doctor, visit: Visit, creds: EHRCredentials) {
  // 1. Strict Validation
  validateForEHR(patient, doctor, visit, false);

  // 2. Generate XML
  const ehrXml = generateEHRXml(patient, doctor, visit);
  
  // 3. Build SOAP Body
  const bodyContent = `
    <SendPlannedAmbulatory xmlns="http://tempuri.org/">
      <UserName>${creds.username}</UserName>
      <UserPass>${creds.password}</UserPass>
      <EHRXml>${encodeXmlForSoap(ehrXml)}</EHRXml>
    </SendPlannedAmbulatory>
  `;

  // 4. Send Request
  const response = await sendSoapRequest('SendPlannedAmbulatory', bodyContent);
  return response;
}

/**
 * Updates an existing Planned Ambulatory record (Update/Replace)
 */
export async function replacePlannedAmbulatory(patient: Patient, doctor: Doctor, visit: Visit, creds: EHRCredentials) {
  // 1. Strict Validation for Update Mode
  validateForEHR(patient, doctor, visit, true);

  if (!visit.ehrId) {
    throw new Error("Cannot replace record without an existing EHRID.");
  }

  // 2. Generate XML
  const ehrXml = generateEHRXml(patient, doctor, visit);
  
  // 3. Build SOAP Body
  const bodyContent = `
    <ReplacePlannedAmbulatory xmlns="http://tempuri.org/">
      <UserName>${creds.username}</UserName>
      <UserPass>${creds.password}</UserPass>
      <EHRID>${visit.ehrId}</EHRID>
      <EHRXml>${encodeXmlForSoap(ehrXml)}</EHRXml>
    </ReplacePlannedAmbulatory>
  `;

  // 4. Send Request
  const response = await sendSoapRequest('ReplacePlannedAmbulatory', bodyContent);
  return response;
}

/**
 * Sends Calculation for the episode
 */
export async function sendCalculation(visit: Visit, creds: EHRCredentials) {
  if (!visit.ehrId) {
    throw new Error("Cannot send calculation without an existing EHRID.");
  }

  const calcXml = generateCalculationXml(visit);

  const bodyContent = `
    <SendCalculation xmlns="http://tempuri.org/">
      <UserName>${creds.username}</UserName>
      <UserPass>${creds.password}</UserPass>
      <EHRID>${visit.ehrId}</EHRID>
      <EHRXml>${encodeXmlForSoap(calcXml)}</EHRXml>
    </SendCalculation>
  `;

  const response = await sendSoapRequest('SendCalculation', bodyContent);
  return response;
}
