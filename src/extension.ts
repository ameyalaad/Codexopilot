import * as vscode from "vscode";
import { Configuration, OpenAIApi } from "openai";
import { assert } from "console";

const apiKey = "@YOUR_API_KEY_HERE@";
const engineId = "code-cushman-001";

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "codexopilot" is now active');

  console.log("Configuring OpenAI API");
  const config = new Configuration({
    apiKey: apiKey,
  });
  const openapi = new OpenAIApi(config);

  console.log(`Testing engine ${engineId}`);
  openapi
    .createCompletion(engineId, {
      prompt: "Say this is a test",
    })
    .then((value) => {
      assert(value.data.choices !== undefined);
      console.log("Test Success: Engine working");
    })
    .catch((reason) => {
      console.log(reason);
      vscode.window.showErrorMessage(
        `Error: Failed to reach engine ${engineId}`
      );
    });

  console.log("Registering the 'predict' command");
  const predict = "codexopilot.predict";
  const handlePredict = () => {
    console.log("Predict called");
    if (vscode.window.activeTextEditor) {
      let lineData = vscode.window.activeTextEditor.document
        .getText(
          new vscode.Range(
            vscode.window.activeTextEditor.selection.active.with(undefined, 0),
            vscode.window.activeTextEditor.selection.active
          )
        )
        .trim();
      if (lineData === "") {
        return;
      } else {
        openapi
          .createCompletion(engineId, {
            prompt: lineData,
            max_tokens: 64,
            temperature: 0,
          })
          .then((value) => {
            if (value.data.choices) {
              console.log(value.data.choices[0].text);
              vscode.window.showInformationMessage(
                value.data.choices[0].text
                  ? value.data.choices[0].text
                  : "Nothing predicted"
              );
            }
          })
          .catch((reason) => {
            console.log(reason);
          });
      }
    }
  };
  context.subscriptions.push(
    vscode.commands.registerCommand(predict, handlePredict)
  );

  vscode.window.onDidChangeTextEditorSelection((event) => {
    let lineData = event.textEditor.document.getText(
      new vscode.Range(
        event.textEditor.selection.active.with(undefined, 0),
        event.textEditor.selection.active
      )
    );
    if (lineData.trim() === "") {
      return;
    } else {
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
