import * as vscode from "vscode";
import { Configuration, OpenAIApi } from "openai";
import { assert } from "console";

var apiKey: string | undefined = undefined;
const engineId = "code-cushman-001";
var openapi: OpenAIApi | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "codexopilot" is now active');

  // const provider = vscode.languages.registerCompletionItemProvider("*", {
  //   provideCompletionItems(
  //     document: vscode.TextDocument,
  //     position: vscode.Position,
  //     token: vscode.CancellationToken,
  //     context: vscode.CompletionContext
  //   ) {
  //     const simpleCompletion = new vscode.CompletionItem("Hello World");
  //     return [simpleCompletion];
  //   },
  // });
  // context.subscriptions.push(provider);

  if (apiKey !== undefined) {
    console.log("Configuring OpenAI API");
    const config = new Configuration({
      apiKey: apiKey,
    });
    openapi = new OpenAIApi(config);

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
  } else {
    console.log(`apiKey: ${apiKey}`);
    vscode.window.showWarningMessage(
      `Api key not found. Use the "Register API Key" command to register a new api key`
    );
  }

  console.log("Registering the 'registerApiKey' command");
  const registerApiKey = "codexopilot.registerApiKey";
  const handleRegisterApiKey = () => {
    let options: vscode.InputBoxOptions = {
      prompt:
        "Visit beta.openai.com and enter your API key here. The API key is stored only for the duration of the current session",
      placeHolder: "API Key",
      title: "Enter API Key",
    };
    vscode.window.showInputBox(options, undefined).then((value) => {
      if (value === undefined || value === "") {
        console.log(`apiKey: ${apiKey}`);
        vscode.window.showWarningMessage(
          `Invalid API Key. Use the "Register API Key" command to re-register a new api key`
        );
      }
      apiKey = value;
      console.log("Configuring OpenAI API");
      const config = new Configuration({
        apiKey: apiKey,
      });
      openapi = new OpenAIApi(config);
    });
  };

  console.log("Registering the 'predict' command");
  const predict = "codexopilot.predict";
  const handlePredict = () => {
    console.log("Predict called");
    if (vscode.window.activeTextEditor) {
      var lineData = vscode.window.activeTextEditor.document
        .getText(
          new vscode.Range(
            vscode.window.activeTextEditor.selection.active.with(undefined, 0),
            vscode.window.activeTextEditor.selection.active
          )
        )
        .trim();
      if (lineData === "") {
        lineData = vscode.window.activeTextEditor.document
          .getText(
            new vscode.Range(
              // Predict using the previous line unless there is no content
              vscode.window.activeTextEditor.selection.active.with(
                vscode.window.activeTextEditor.selection.active.line === 0
                  ? 0
                  : vscode.window.activeTextEditor.selection.active.line - 1,
                0
              ),
              vscode.window.activeTextEditor.selection.active
            )
          )
          .trim();
      }

      if (!apiKey) {
        console.log(`apiKey: ${apiKey}`);
        vscode.window.showWarningMessage(
          `Api key not found. Use the "Register API Key" command to register a new api key`
        );
      } else {
        if (!openapi) {
          console.log("OpenAPI not defined");
          vscode.window.showErrorMessage(
            `Error: Failed to instantiate API, reset the API key to retry`
          );
          return;
        }
        openapi
          .createCompletion(engineId, {
            prompt: lineData,
            max_tokens: 64,
            temperature: 0,
          })
          .then((value) => {
            if (value.data.choices) {
              console.log(value.data.choices[0].text);

              // No need to show prompt, we are directly editing the code
              // vscode.window.showInformationMessage(
              //   value.data.choices[0].text
              //     ? value.data.choices[0].text
              //     : "Nothing predicted"
              // );

              // We directly edit the code
              const oldPosition =
                vscode.window.activeTextEditor!.selection.active;
              vscode.window.activeTextEditor?.edit((editBuilder) => {
                if (value.data.choices) {
                  // I dont know why but value.data.choices is giving an error if this isn't done
                  // Even though it is being checked above
                  editBuilder.insert(
                    oldPosition,
                    value.data.choices[0].text
                      ? `\n${value.data.choices[0].text}`
                      : ""
                  );
                }
              });

              // Although we can also insert a snippet string, not recommended as this is technically entirely text, and not a fillable snippet
              // let snippetString = new vscode.SnippetString(
              //   `\n${value.data.choices[0].text}`
              // );
              // vscode.window.activeTextEditor?.insertSnippet(snippetString);
            }
          })
          .catch((reason) => {
            console.log(reason);
          });
      }
    }
  };
  context.subscriptions.push(
    vscode.commands.registerCommand(registerApiKey, handleRegisterApiKey),
    vscode.commands.registerCommand(predict, handlePredict)
  );

  // Trigger on command, not always
  // vscode.window.onDidChangeTextEditorSelection((event) => {
  //   let lineData = event.textEditor.document.getText(
  //     new vscode.Range(
  //       event.textEditor.selection.active.with(undefined, 0),
  //       event.textEditor.selection.active
  //     )
  //   );
  //   if (lineData.trim() === "") {
  //     return;
  //   } else {
  //   }
  // });
}

// this method is called when your extension is deactivated
export function deactivate() {}
