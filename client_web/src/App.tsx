import { Box, Flex } from "@radix-ui/themes";
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { EventManagerPage } from './pages/EventManagerPage';
import MintPage from './pages/MintPage';
import Footer from './components/Footer';
import { ConnectButton } from './components/ConnectButton';
import { BASE_URL } from './config';

function App() {
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <a href="/">
            <img src={`${BASE_URL}/images/logo.png`} alt="SUI POAP Logo" style={{ height: '60px', width: 'auto' }} />
          </a>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventmanager" element={<EventManagerPage />} />
        <Route path="/mint" element={<MintPage />} />
      </Routes>
      {/* <WalletStatus /> */}
      <Footer />
    </>
  );
}

export default App;
