import React from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FluentProvider theme={teamsLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
