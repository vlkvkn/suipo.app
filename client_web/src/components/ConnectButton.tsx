import { useState, useEffect, useMemo } from 'react';
import { Button, DropdownMenu, Text, Flex, Badge } from '@radix-ui/themes';
import { getWallets, Wallet, WalletWithRequiredFeatures } from '@mysten/wallet-standard';
import { useWallet } from '../contexts/WalletContext';
import { useZkLogin } from '../hooks/useZkLogin';
import { popularWallets } from '../config/wallets';
import './ConnectButton.css';

interface WalletInfo {
  name: string;
  icon?: string;
  url?: string;
  installed: boolean;
  wallet?: Wallet;
  isZkLogin?: boolean;
  type?: 'wallet' | 'zklogin';
}

export function ConnectButton() {
  const { account, connected, connecting, connect, disconnect } = useWallet();
  const { isAuthenticated, isLoading: zkLoginLoading, userAddress, login: zkLogin, logout: zkLogout } = useZkLogin();
  const [isOpen, setIsOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    // Get available wallets and check installation status
    const updateWallets = () => {
      try {
        const wallets = getWallets().get();
        console.log('Detected wallets:', wallets.map(w => ({ name: w.name, icon: w.icon })));
        
        // Deduplicate wallets by name to avoid duplicates
        const uniqueWallets = wallets.filter((wallet, index, self) => 
          index === self.findIndex(w => w.name === wallet.name)
        );
        
        const walletInfos: WalletInfo[] = popularWallets.map(popularWallet => {
          // Check if this is zkLogin by type field
          if (popularWallet.type === 'zklogin') {
            return {
              ...popularWallet,
              installed: true, // zkLogin is always available
              isZkLogin: true,
              type: popularWallet.type as 'zklogin'
            };
          }

          const installedWallet = uniqueWallets.find(w => {
            const walletName = w.name.toLowerCase();
            const popularName = popularWallet.name.toLowerCase();
            
            // Direct match
            if (walletName === popularName) return true;
            
            // Partial match
            if (walletName.includes(popularName) || popularName.includes(walletName)) return true;
            
            // Special case for Phantom Wallet
            if (popularName.includes('phantom')) {
              return walletName.includes('phantom');
            }
            
            return false;
          });
          
          return {
            ...popularWallet,
            installed: !!installedWallet,
            wallet: installedWallet,
            type: (popularWallet.type as 'wallet') || 'wallet'
          };
        });

        // Add any other installed wallets that aren't in our popular list
        uniqueWallets.forEach(wallet => {
          // Check if this wallet is already in the popular list
          const isInPopularList = walletInfos.some(info => 
            info.wallet && info.wallet.name === wallet.name
          );
          
          if (!isInPopularList) {
            walletInfos.push({
              name: wallet.name,
              icon: wallet.icon,
              installed: true,
              wallet: wallet,
              type: 'wallet'
            });
          }
        });

        console.log('Final wallet list:', walletInfos.map(w => ({ name: w.name, installed: w.installed })));
        setAvailableWallets(walletInfos);
      } catch (error) {
        console.error('Error getting wallets:', error);
        // Fallback to popular wallets list with all marked as not installed
        setAvailableWallets(popularWallets.map(wallet => ({
          ...wallet,
          installed: false,
          type: (wallet.type as 'wallet' | 'zklogin') || 'wallet'
        })));
      }
    };

    // Initial update
    updateWallets();

    // Listen for wallet registry changes
    const unsubscribe = getWallets().on('register', updateWallets);
    
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Memoize wallet filtering to prevent unnecessary re-renders
  const { installedWallets, zkLoginWallets, notInstalledWallets } = useMemo(() => {
    const installed = availableWallets.filter(w => w.installed && w.type !== 'zklogin');
    const zkLogin = availableWallets.filter(w => w.type === 'zklogin');
    const notInstalled = availableWallets.filter(w => !w.installed);
    
    return { installedWallets: installed, zkLoginWallets: zkLogin, notInstalledWallets: notInstalled };
  }, [availableWallets]);

  const handleConnect = async (walletInfo: WalletInfo) => {
    if (walletInfo.type === 'zklogin') {
      // Handle zkLogin
      try {
        await zkLogin();
      } catch (error) {
        console.error('Failed to connect zkLogin:', error);
        alert('Failed to connect zkLogin. Please try again.');
      }
      return;
    }

    if (!walletInfo.installed || !walletInfo.wallet) {
      // Open wallet installation page
      if (walletInfo.url) {
        window.open(walletInfo.url, '_blank');
      }
      return;
    }

    try {
      // Cast to WalletWithRequiredFeatures for the connect function
      await connect(walletInfo.wallet as WalletWithRequiredFeatures);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = () => {
    if (isAuthenticated) {
      zkLogout();
    } else {
      disconnect();
    }
    setIsOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show loading state for either wallet connection or zkLogin
  if (connecting || zkLoginLoading) {
    return (
      <Button disabled>
        Connecting...
      </Button>
    );
  }

  // Show connected state for either wallet or zkLogin
  if ((connected && account) || (isAuthenticated && userAddress)) {
    const currentAddress = account?.address || userAddress;
    const isZkLoginConnected = isAuthenticated && userAddress;

    return (
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger>
          <Button variant="soft">
            {formatAddress(currentAddress!)}
            {isZkLoginConnected && (
              <Badge color="green" variant="soft" size="1" style={{ marginLeft: '8px' }}>
                zkLogin
              </Badge>
            )}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Connected
              </Text>
              <Text size="2" weight="medium">
                {currentAddress}
              </Text>
              {isZkLoginConnected && (
                <Text size="1" color="gray">
                  zkLogin (Google)
                </Text>
              )}
            </Flex>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onClick={handleDisconnect}>
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    );
  }

  const renderWalletSection = (
    wallets: WalletInfo[], 
    title: string, 
    badgeColor: 'green' | 'blue', 
    badgeText: string,
    showSeparator: boolean = false
  ) => {
    if (wallets.length === 0) return null;

    return (
      <>
        <DropdownMenu.Label>
          <Text size="1" color="gray" weight="medium" className="dropdown-label">
            {title}
          </Text>
        </DropdownMenu.Label>
        {wallets.map((wallet) => (
          <DropdownMenu.Item key={wallet.name} onClick={() => handleConnect(wallet)}>
            <div className="wallet-item">
              {wallet.icon && (
                <img 
                  src={wallet.icon} 
                  alt={wallet.name} 
                  className="wallet-icon"
                />
              )}
              <Text className="wallet-name">
                {wallet.name}
              </Text>
              <Badge color={badgeColor} variant="soft" size="1" className={`wallet-badge ${badgeColor === 'green' ? 'installed' : 'install'}`}>
                {badgeText}
              </Badge>
            </div>
          </DropdownMenu.Item>
        ))}
        {showSeparator && <DropdownMenu.Separator className="dropdown-separator" />}
      </>
    );
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <Button>
          Connect Wallet
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="connect-button-dropdown">
        {/* zkLogin section - always at the top */}
        {renderWalletSection(
          zkLoginWallets, 
          'ZKLOGIN', 
          'green', 
          'Available', 
          installedWallets.length > 0 || notInstalledWallets.length > 0
        )}

        {/* Installed wallets section */}
        {renderWalletSection(
          installedWallets, 
          'INSTALLED WALLETS', 
          'green', 
          'Installed', 
          notInstalledWallets.length > 0
        )}
        
        {/* Not installed wallets section */}
        {renderWalletSection(
          notInstalledWallets, 
          'GET A WALLET', 
          'blue', 
          'Install'
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
} 