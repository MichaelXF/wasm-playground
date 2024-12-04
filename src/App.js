import { theme } from "./theme";
import AppRouter from "./AppRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
