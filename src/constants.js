export const DEFAULT_JS_CODE = `// Define the 'env' object with a 'consoleLog' function
const env = {
  consoleLog: (value) => {
    console.log(value);  
  }
};
`;

export const DEFAULT_WAT_CODE = `(module
  ;; Import the \`console.log\` function from the environment
  (import "env" "consoleLog" (func $console_log (param i32)))

  ;; Export a function that adds 100 and 50 and logs the result
  (func (export "main") (param $a i32) (param $b i32)
    (local $result i32)
    ;; Perform the addition
    i32.const 100
    i32.const 50
    i32.add
    ;; Store the result in a local variable
    local.set $result
    ;; Call console.log with the result
    local.get $result
    call $console_log
  )
)`;
