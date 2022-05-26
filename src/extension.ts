import * as vscode from 'vscode'
import { subscribeToDocumentChanges, CASE_POLICE } from './diagnostics'
import { dict } from './dict'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new CaseInfo()))

  const caseDiagnostics = vscode.languages.createDiagnosticCollection(CASE_POLICE)
  context.subscriptions.push(caseDiagnostics)

  subscribeToDocumentChanges(context, caseDiagnostics, dict)
}

export class CaseInfo implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((diagnostic) => diagnostic.code === CASE_POLICE)
      .map((diagnostic) => this.createFix(document, diagnostic.range))
  }

  private createFix(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
    const key = document.getText(range).toLowerCase()
    const correct = (dict as Record<string, string>)[key]
    const fix = new vscode.CodeAction(`Convert to ${correct}`, vscode.CodeActionKind.QuickFix)
    fix.edit = new vscode.WorkspaceEdit()
    fix.edit.replace(document.uri, range, correct)
    return fix
  }
}
