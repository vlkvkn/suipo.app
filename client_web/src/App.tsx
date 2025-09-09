import { Box, Flex } from "@radix-ui/themes";
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { EventManagerPage } from './pages/EventManagerPage';
import MintPage from './pages/MintPage';
import Footer from './components/Footer';
import { ConnectButton } from './components/ConnectButton';
import { BASE_URL } from './config';
import './App.css';
import PoapsPage from './pages/PoapsPage';

function App() {

  return (
    <div className="app-container">
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        className="app-header"
      >
        <Box>
          <a href="/">
            <img src={`${BASE_URL}/images/logo.png`} alt="SUI POAP Logo" className="app-logo" />
          </a>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventmanager" element={<EventManagerPage />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/poaps" element={<PoapsPage />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
