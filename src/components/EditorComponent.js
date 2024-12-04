import { useEffect, useRef } from "react";
import { Box, rgbToHex, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";

// Wasm Text Format editor highlighting
import { watLanguage } from "../languages/WATLanguageConfig";
import { DEFAULT_JS_CODE, DEFAULT_WAT_CODE } from "../constants";

// The 'wabt' module is loaded asynchronously (First from <script> tag, then async Wasm module)
let wabt = undefined;
const { decode } = require("@webassemblyjs/wasm-parser");

// Editor options
const editorOptions = {
  fontSize: 16,
  tabSize: 2,
  minimap: {
    enabled: false,
  },
  wordWrap: "on",
  fontFamily: '"Fira Code", monospace',
};

export default function EditorComponent() {
  if (wabt === undefined) {
    wabt = null;
    window.WabtModule().then((wabtModule) => {
      wabt = wabtModule;
    });
  }

  const theme = useTheme();

  // Refs to store the editor instances
  const refs = useRef({
    inputWATCode: null,
    inputJSCode: null,
    outputAST: null,
    outputConsole: null,

    // One-time monaco initialization flag
    monacoInitialized: false,

    // One-time first evaluation flag
    evaluationInitialized: false,

    // Cancel Wasm evaluations
    identity: null,
  });

  // Function to initialize Monaco editor
  // 1) Set background color to match MUI theme
  // 2) Register the WAT language
  function initializeMonaco(monaco) {
    if (refs.current.monacoInitialized) return;
    refs.current.monacoInitialized = true;

    // Function to define a custom theme with the selected background color
    const defineCustomTheme = () => {
      monaco.editor.defineTheme("customTheme", {
        base: "vs-dark", // Use 'vs' for light theme base or 'vs-dark' for dark theme
        inherit: true,
        rules: [],
        colors: {
          "editor.background": rgbToHex(theme.palette.background.default),
        },
      });
      monaco.editor.setTheme("customTheme");
    };

    defineCustomTheme();

    const registerWATLanguage = () => {
      monaco.languages.register({ id: "wat" });

      monaco.languages.setMonarchTokensProvider("wat", watLanguage);

      monaco.languages.setLanguageConfiguration("wat", {
        brackets: [["(", ")"]],
        autoClosingPairs: [{ open: "(", close: ")" }],
      });
    };
    registerWATLanguage();
  }

  // Store the monaco instance when the editor mounts
  const handleEditorDidMount = (key) => (editor, monaco) => {
    refs.current[key] = { editor, monaco };
    initializeMonaco(monaco);

    // Once all editors are mounted, trigger the first evaluation
    // This prevents the user from having to change the code to trigger the evaluation
    if (
      !refs.current.evaluationInitialized &&
      refs.current.inputWATCode &&
      refs.current.inputJSCode &&
      refs.current.outputAST &&
      refs.current.outputConsole
    ) {
      refs.current.evaluationInitialized = true;
      safeRefresh();
    }
  };

  // Evaluate the WASM code
  const refresh = async () => {
    const identity = {};
    refs.current.identity = identity;
    const checkIdentity = (fn) => {
      return (...args) => {
        if (refs.current.identity !== identity) return;
        fn(...args);
      };
    };

    const jsCode = refs.current["inputJSCode"].editor.getValue();
    const watCode = refs.current["inputWATCode"].editor.getValue();

    const wasmModule = wabt.parseWat("module.wat", watCode);
    const { buffer } = wasmModule.toBinary({});

    const ast = decode(buffer);

    refs.current["outputAST"].editor.setValue(JSON.stringify(ast, null, 2));

    const evaluateCode = async () => {
      const consoleEditor = refs.current["outputConsole"].editor;

      const clearConsole = checkIdentity(() => consoleEditor.setValue(""));
      const printConsole = checkIdentity((...messages) =>
        consoleEditor.setValue(
          consoleEditor.getValue() + Array.from(messages).join(" ") + "\n"
        )
      );

      clearConsole();

      // Mock 'console' object to capture logs
      let console = { log: printConsole, clear: clearConsole };

      // Prepare 'env' object
      let env;
      try {
        let __env;
        eval(jsCode + "\n\n__env = env;");
        env = __env;
      } catch (error) {
        console.log("Error evaluating JS code:", error);
        return;
      }

      if (!env) {
        console.log("No 'env' object defined in JS code");
        return;
      }

      // Run the WASM binary
      // Instantiate the WASM module
      const wasmModule = await WebAssembly.instantiate(buffer, {
        env,
      });

      // Access exported functions
      const { exports } = wasmModule.instance;

      // Call the exported function named `main`
      if (exports.main) {
        const result = exports.main(); // Run the function
        console.log("WASM function returned:", result);
      } else {
        console.log('No "main" function exported in WASM module');
      }
    };

    await evaluateCode();
  };

  // Run the user's code and catch any errors
  const safeRefresh = () => {
    refresh().catch((err) => {
      refs.current["outputConsole"].editor.setValue(err.toString());
    });
  };

  return (
    <Box display="flex" width="100vw" height="100vh">
      <Box
        display="flex"
        flexDirection="column"
        maxWidth="50vw"
        flex={1}
        width="100%"
      >
        <Editor
          height="50vh"
          defaultValue={DEFAULT_WAT_CODE}
          language="wat"
          onMount={handleEditorDidMount("inputWATCode")}
          onChange={safeRefresh}
          options={editorOptions}
        />

        <Editor
          height="50vh"
          defaultValue={DEFAULT_JS_CODE}
          language="javascript"
          onMount={handleEditorDidMount("inputJSCode")}
          onChange={safeRefresh}
          options={editorOptions}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        maxWidth="50vw"
        flex={1}
        width="100%"
      >
        <Editor
          height="50vh"
          language="json"
          onMount={handleEditorDidMount("outputAST")}
          options={{
            ...editorOptions,
            readOnly: true,
          }}
        />

        <Editor
          height="50vh"
          language="plaintext"
          onMount={handleEditorDidMount("outputConsole")}
          options={{
            ...editorOptions,
            readOnly: true,
          }}
        />
      </Box>
    </Box>
  );
}
