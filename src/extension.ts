import * as vscode from 'vscode';
import EditorDecorator from './decorator';

export function activate(context: vscode.ExtensionContext) {
    let decorator = new EditorDecorator();
    context.subscriptions.push(decorator);
}
