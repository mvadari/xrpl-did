import { Errors } from './errors'

export async function parseAndValidateJson(res: Response): Promise<any> {
  let doc: unknown
  try {
    doc = await res.json()
  } catch (e: any) {
    console.log(e.message)
    throw new Error(Errors.invalidJson)
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new Error(Errors.invalidJson)
  }
  return doc
}
