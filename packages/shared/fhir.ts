export function formatFhirObservation(data: {
  patientId: string
  value: number
  unit: string
  code?: string
}): Record<string, unknown> {
  return {
    resourceType: 'Observation',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: data.code || 'vital-signs',
          },
        ],
      },
    ],
    subject: { reference: `Patient/${data.patientId}` },
    valueQuantity: {
      value: data.value,
      unit: data.unit,
    },
    effectiveDateTime: new Date().toISOString(),
  }
}

export function validateObservation(
  data: unknown
): data is { patientId: string; value: number; unit: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'patientId' in data &&
    'value' in data &&
    'unit' in data &&
    typeof (data as Record<string, unknown>).patientId === 'string' &&
    typeof (data as Record<string, unknown>).value === 'number'
  )
}
