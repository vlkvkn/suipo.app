import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css";
import { BrowserRouter as Router } from 'react-router-dom';
import { SUI_NETWORK } from './config';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { WalletProvider } from "./contexts/WalletContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <Theme appearance="light">
      <QueryClientProvider client={queryClient}>
        <WalletProvider suinetwork={SUI_NETWORK} autoConnect={true}>
          <Router>
            <App />
          </Router>
        </WalletProvider>
      </QueryClientProvider>
    </Theme>
  // </React.StrictMode>,
);
