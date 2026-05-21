import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { CoinsProvider } from "./context/CoinsContext";
import { QuizProvider } from "./context/QuizContext";
import { StoreProvider } from "./context/StoreContext";
import { ThemeProvider } from "./context/ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <UserProvider>
          <CoinsProvider>
            <QuizProvider>
              <StoreProvider>
                <ThemeProvider>
                  <App />
                </ThemeProvider>
              </StoreProvider>
            </QuizProvider>
          </CoinsProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
