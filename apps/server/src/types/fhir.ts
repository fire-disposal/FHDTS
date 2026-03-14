export type FhirObservation = {
  resourceType: 'Observation'
  status: string
  category: Array<{
    coding: Array<{
      system: string
      code: string
    }>
  }>
  subject: { reference: string }
  valueQuantity: {
    value: number
    unit: string
  }
  effectiveDateTime: string
}
