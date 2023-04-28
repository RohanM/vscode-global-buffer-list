import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Store opened documents URIs
  const openedDocuments: Set<string> = new Set();

  // Open a file in all groups
  async function openFileInAllGroups(uri: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editorGroups = vscode.window.visibleTextEditors.map(editor => editor.viewColumn);
    const uniqueGroups = Array.from(new Set(editorGroups));

    for (const group of uniqueGroups) {
      await vscode.window.showTextDocument(document, { viewColumn: group, preview: false, preserveFocus: true });
    }

    openedDocuments.add(uri.toString());
  }

  // Open all stored documents in the new group
  async function openDocumentsInNewGroup(group: vscode.ViewColumn) {
    for (const uriString of openedDocuments) {
      const uri = vscode.Uri.parse(uriString);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, { viewColumn: group, preview: false, preserveFocus: true });
    }
  }

  // Listen for file opening events
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async (document) => {
    const uriString = document.uri.toString();
    if (!openedDocuments.has(uriString)) {
      await openFileInAllGroups(document.uri);
    }
  }));

  // Listen for new group creation events
  context.subscriptions.push(vscode.window.onDidChangeTextEditorViewColumn(async (event) => {
    if (event.viewColumn) {
      const currentGroup = event.viewColumn;
      const otherGroups = vscode.window.visibleTextEditors.map(e => e.viewColumn).filter(group => group !== currentGroup);
      const uniqueGroups = Array.from(new Set(otherGroups));

      if (uniqueGroups.length > 0) {
        await openDocumentsInNewGroup(currentGroup);
      }
    }
  }));
}

export function deactivate() {}
