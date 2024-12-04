export const watLanguage = {
  defaultToken: "",
  tokenPostfix: ".wat",

  // Keywords in WAT
  keywords: [
    "module",
    "func",
    "param",
    "result",
    "i32",
    "i64",
    "f32",
    "f64",
    "export",
    "import",
    "memory",
    "data",
    "global",
    "local",
    "table",
    "type",
    "elem",
    "start",
    "offset",
    "loop",
    "block",
    "if",
    "else",
    "then",
    "end",
    "call",
    "call_indirect",
    "get_local",
    "set_local",
    "tee_local",
    "get_global",
    "set_global",
    "br",
    "br_if",
    "return",
    "unreachable",
    "nop",
    "drop",
    "select",
    "externref",
  ],

  operators: [
    "+",
    "-",
    "*",
    "/",
    "%",
    "&&",
    "||",
    "!",
    "==",
    "!=",
    "<",
    "<=",
    ">",
    ">=",
  ],

  brackets: [{ open: "(", close: ")", token: "delimiter.parenthesis" }],

  // Tokenizer
  tokenizer: {
    root: [
      // Keywords
      [
        /\b(module|func|param|result|i32|i64|f32|f64|export|import|memory|data|global|local|table|type|elem|start|offset|loop|block|if|else|then|end|call|call_indirect|get_local|set_local|tee_local|get_global|set_global|br|br_if|return|unreachable|nop|drop|select|externref)\b/,
        "keyword",
      ],

      // Strings
      [/\".*?\"/, "string"],

      // Numbers
      [/\b\d+(\.\d+)?\b/, "number"],

      // Comments
      [/;;.*$/, "comment"],

      // Operators
      [/[+\-*/%=!<>|&]+/, "operator"],

      // Brackets
      [/[()]/, "@brackets"],
    ],
  },
};
