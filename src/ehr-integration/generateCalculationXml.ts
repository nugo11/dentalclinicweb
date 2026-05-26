import { Visit } from './types';

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
 * Generates the Calculation XML payload
 */
export function generateCalculationXml(visit: Visit): string {
  const calc = visit.calculations;
  if (!calc) return '<Calculation></Calculation>';

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<Calculation>\n`;

  // 1. DirectCosts
  xml += `  <DirectCosts>\n`;
  xml += `    <SalaryOfTheStaffParticipatingInTheProcedure>\n`;
  
  if (calc.directCosts?.salary && calc.directCosts.salary.length > 0) {
    xml += `      <SumAmount></SumAmount>\n`;
    for (const sal of calc.directCosts.salary) {
      xml += `      <Record>
        <Section>${escapeXml(sal.section || '')}</Section>
        <PersID>${escapeXml(sal.persId || '')}</PersID>
        <PersDescription></PersDescription>
        <Amount>${sal.amount}</Amount>
      </Record>\n`;
    }
  } else {
    xml += `      <SumAmount>0</SumAmount>\n`;
  }
  xml += `    </SalaryOfTheStaffParticipatingInTheProcedure>\n`;

  xml += `    <UsedMedicalItems>\n`;
  if (calc.directCosts?.usedMedicalItems && calc.directCosts.usedMedicalItems.length > 0) {
    for (const item of calc.directCosts.usedMedicalItems) {
      xml += `      <Record>
        <Section>${escapeXml(item.section || '')}</Section>
        <ItemID>${escapeXml(item.itemId || '')}</ItemID>
        <ItemGroupID>${escapeXml(item.itemGroupId || '')}</ItemGroupID>
        <ItemQuantity>${item.itemQuantity}</ItemQuantity>
        <ItemDescription>${escapeXml(item.itemDescription || '')}</ItemDescription>
        <ItemPrice>${item.itemPrice}</ItemPrice>
      </Record>\n`;
    }
  }
  xml += `    </UsedMedicalItems>\n`;
  xml += `  </DirectCosts>\n`;

  // 2. InDirectCosts
  xml += `  <InDirectCosts>\n`;
  xml += `    <AdministrationSalary>\n      <SumAmount>0</SumAmount>\n    </AdministrationSalary>\n`;
  xml += `    <OperatingCosts>\n      <SumAmount>0</SumAmount>\n    </OperatingCosts>\n`;
  xml += `    <AmortizationOfRealEstate>\n      <SumAmount>0</SumAmount>\n    </AmortizationOfRealEstate>\n`;
  xml += `    <AmortizationOfMedicalEquipment>\n      <SumAmount>0</SumAmount>\n    </AmortizationOfMedicalEquipment>\n`;
  xml += `    <AmortizationOfNonMedicalEquipment>\n      <SumAmount>0</SumAmount>\n    </AmortizationOfNonMedicalEquipment>\n`;
  xml += `  </InDirectCosts>\n`;

  // 3. Addition (Markup)
  xml += `  <Addition>\n`;
  if (calc.addition && calc.addition.amount > 0) {
    xml += `    <Amount>${calc.addition.amount}</Amount>\n`;
  } else {
    xml += `    <Amount>0</Amount>\n`;
  }
  xml += `  </Addition>\n`;

  xml += `</Calculation>`;
  return xml;
}
