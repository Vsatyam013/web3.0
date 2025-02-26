import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { TransactionsProvider } from "./context/TransactionContext";

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <TransactionsProvider>
      <App />
    </TransactionsProvider>
  </StrictMode>
);
