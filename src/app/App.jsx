import "@/styles/variables.css";
import "@/styles/globals.css";
import "@/styles/components.css";
import "@/styles/utilities.css";
import { I18nProvider } from "@/i18n";
import AppProviders from "./providers";
import AppRouter from "./AppRouter";

export default function App() {
  return (
    <I18nProvider>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </I18nProvider>
  );
}
