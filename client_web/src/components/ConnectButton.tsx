import React, { useState, useEffect } from 'react';
import { Button, DropdownMenu, Text, Flex, Box, Badge } from '@radix-ui/themes';
import { getWallets, Wallet, WalletWithRequiredFeatures } from '@mysten/wallet-standard';
import { useWallet } from '../contexts/WalletContext';
import { popularWallets, PopularWallet } from '../config/wallets';
import './ConnectButton.css';

interface WalletInfo {
  name: string;
  icon?: string;
  url?: string;
  installed: boolean;
  wallet?: Wallet;
}

export function ConnectButton() {
  const { account, connected, connecting, connect, disconnect } = useWallet();
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
            wallet: installedWallet
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
              wallet: wallet
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
          installed: false
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
  }, []);

  const handleConnect = async (walletInfo: WalletInfo) => {
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
    disconnect();
    setIsOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <Button disabled>
        Connecting...
      </Button>
    );
  }

  if (connected && account) {
    return (
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger>
          <Button variant="soft">
            {formatAddress(account.address)}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Connected
              </Text>
              <Text size="2" weight="medium">
                {account.address}
              </Text>
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

  const installedWallets = availableWallets.filter(w => w.installed);
  const notInstalledWallets = availableWallets.filter(w => !w.installed);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <Button>
          Connect Wallet
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="connect-button-dropdown">
        {installedWallets.length > 0 && (
          <>
            <DropdownMenu.Label>
              <Text size="1" color="gray" weight="medium" className="dropdown-label">
                INSTALLED WALLETS
              </Text>
            </DropdownMenu.Label>
            {installedWallets.map((wallet) => (
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
                  <Badge color="green" variant="soft" size="1" className="wallet-badge installed">
                    Installed
                  </Badge>
                </div>
              </DropdownMenu.Item>
            ))}
            {notInstalledWallets.length > 0 && <DropdownMenu.Separator className="dropdown-separator" />}
          </>
        )}
        
        {notInstalledWallets.length > 0 && (
          <>
            <DropdownMenu.Label>
              <Text size="1" color="gray" weight="medium" className="dropdown-label">
                GET A WALLET
              </Text>
            </DropdownMenu.Label>
            {notInstalledWallets.map((wallet) => (
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
                  <Badge color="blue" variant="soft" size="1" className="wallet-badge install">
                    Install
                  </Badge>
                </div>
              </DropdownMenu.Item>
            ))}
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
} 