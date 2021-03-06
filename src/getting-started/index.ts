// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as path from "path";
import { loadTextFromFile, getExtensionContext } from "../utils";
import { sendInfo, instrumentOperation } from "vscode-extension-telemetry-wrapper";

let javaGettingStartedView: vscode.WebviewPanel | undefined;

export async function javaGettingStartedCmdHandler(context: vscode.ExtensionContext, operationId: string) {
  if (javaGettingStartedView) {
    javaGettingStartedView.reveal();
    return;
  }

  javaGettingStartedView = vscode.window.createWebviewPanel("java.gettingStarted", "Java Getting Started", {
    viewColumn: vscode.ViewColumn.One,
  }, {
    enableScripts: true,
    enableCommandUris: true,
    retainContextWhenHidden: true
  });

  await initializeJavaGettingStartedView(context, javaGettingStartedView, onDidDisposeWebviewPanel, operationId);
}

function onDidDisposeWebviewPanel() {
  javaGettingStartedView = undefined;
}

async function initializeJavaGettingStartedView(context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, onDisposeCallback: () => void, operationId: string) {
  webviewPanel.iconPath = vscode.Uri.file(path.join(context.extensionPath, "logo.lowres.png"));
  const resourceUri = context.asAbsolutePath("./out/assets/getting-started/index.html");
  webviewPanel.webview.html = await loadTextFromFile(resourceUri);

  context.subscriptions.push(webviewPanel.onDidDispose(onDisposeCallback));
  context.subscriptions.push(webviewPanel.webview.onDidReceiveMessage(async (e) => {
    if (e.command === "tabActivated") {
      let tabId = e.tabId;
      sendInfo(operationId, {
        infoType: "tabActivated",
        tabId: tabId
      });
    }
  }));
}

export class JavaGettingStartedViewSerializer implements vscode.WebviewPanelSerializer {
  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
    if (javaGettingStartedView) {
      javaGettingStartedView.reveal();
      webviewPanel.dispose();
      return;
    }

    javaGettingStartedView = webviewPanel;
    instrumentOperation("restoreGettingStartedView", operationId => {
      initializeJavaGettingStartedView(getExtensionContext(), webviewPanel, onDidDisposeWebviewPanel, operationId);
    })();
  }
}
