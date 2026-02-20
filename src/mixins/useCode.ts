import { Code } from '@onto-med/top-api'

export default function (this: void) {
  const codeEquals = (code1?: Code, code2?: Code) => {
    if (!code1 || !code2) return false
    return code1.codeSystem.uri == code2.codeSystem.uri && code1.code == code2.code
  }

  return {
    codeEquals,
  }
}
