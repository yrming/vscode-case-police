import * as vscode from 'vscode'

export const CASE_POLICE = 'Case Police'

export function refreshDiagnostics(
  doc: vscode.TextDocument,
  caseDiagnostics: vscode.DiagnosticCollection,
  detectDict: Record<string, string>
): void {
  const diagnostics: vscode.Diagnostic[] = []

  for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
    const lineOfText = doc.lineAt(lineIndex)
    const regex = buildRegex(detectDict)
    Array.from(lineOfText.text.matchAll(regex)).forEach((match) => {
      const [, key] = match
      if (key) {
        diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex, key, detectDict[key]))
      }
    })
  }

  caseDiagnostics.set(doc.uri, diagnostics)
}

function buildRegex(dictionary: Record<string, string>): RegExp {
  const keys = Object.keys(dictionary)
  const regex = new RegExp(`\\b(${keys.join('|')})\\b`, 'g')
  return regex
}

function createDiagnostic(
  doc: vscode.TextDocument,
  lineOfText: vscode.TextLine,
  lineIndex: number,
  caseStr: string,
  correctStr: string
): vscode.Diagnostic {
  const index = lineOfText.text.indexOf(caseStr)

  const range = new vscode.Range(lineIndex, index, lineIndex, index + caseStr.length)

  const diagnostic = new vscode.Diagnostic(
    range,
    `${correctStr}, not ${caseStr}, Make the case correct, PLEASE!, ${range.start.line}-${range.end.line}`,
    vscode.DiagnosticSeverity.Warning
  )
  diagnostic.code = CASE_POLICE
  return diagnostic
}

export function subscribeToDocumentChanges(
  context: vscode.ExtensionContext,
  caseDiagnostics: vscode.DiagnosticCollection,
  detectDict: Record<string, string>
): void {
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, caseDiagnostics, detectDict)
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDiagnostics(editor.document, caseDiagnostics, detectDict)
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      refreshDiagnostics(e.document, caseDiagnostics, detectDict)
    )
  )

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => caseDiagnostics.delete(doc.uri))
  )
}
