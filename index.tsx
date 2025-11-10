import React from "react";
import ReactDOM from "react-dom/client";
// Fix: Add .tsx extension for explicit module resolution.
import App from "./App.tsx";
import "./index.css";
import { ToastProvider } from "./contexts/ToastContext.tsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.tsx";

console.log("index.tsx: Starting app initialization");
console.log("index.tsx: React version:", React.version);
console.log("index.tsx: Document ready state:", document.readyState);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("index.tsx: Could not find root element");
  throw new Error("Could not find root element to mount to");
}

console.log("index.tsx: Root element found:", rootElement);
console.log(
  "index.tsx: Root element innerHTML before:",
  rootElement.innerHTML.substring(0, 100)
);

const root = ReactDOM.createRoot(rootElement);

console.log("index.tsx: React root created, attempting to render");

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("index.tsx: App rendered successfully");

  // Check after a brief delay if content appeared
  setTimeout(() => {
    const content = rootElement.innerHTML;
    console.log(
      "index.tsx: Root element innerHTML after render:",
      content.substring(0, 200)
    );
    if (content.length < 50) {
      console.warn("index.tsx: WARNING - Very little content rendered!");
    }
  }, 100);
} catch (error) {
  console.error("index.tsx: Error during render:", error);
  console.error(
    "index.tsx: Error stack:",
    error instanceof Error ? error.stack : "No stack"
  );

  // Fallback: try to render something simple
  try {
    rootElement.innerHTML = `
      <div style="padding: 2rem; color: #ef4444; background: #fff; min-height: 100vh;">
        <h1>Failed to render app</h1>
        <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">${
          error instanceof Error ? error.message : String(error)
        }</pre>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
      </div>
    `;
  } catch (fallbackError) {
    console.error("index.tsx: Even fallback render failed:", fallbackError);
  }
}
