import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ethers } from "ethers";
import '../styles/App.css';

// Components
import Navigation from "./Navigation";
import Buy from './Buy';
import Info from './Info';
import Progress from './Progress';
import Loading from './Loading';

// ABIs
import TOKEN_ABI from '../abis/Token.json';
import CROWDSALE_ABI from '../abis/Crowdsale.json';

// Config
import config from '../config.json';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: "Crowdsale App",
      jsonRpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
    }),
  ],
  chains: [mainnet, sepolia, hardhat],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`),
    [hardhat.id]: http(), // localhost:8545
  },
});

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);

  const [price, setPrice] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const { chainId } = await provider.getNetwork();

      const token = new ethers.Contract(config[chainId].token.address, TOKEN_ABI, provider);
      const crowdsale = new ethers.Contract(config[chainId].crowdsale.address, CROWDSALE_ABI, provider);
      setCrowdsale(crowdsale);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);

      const accountBalance = ethers.utils.formatUnits(await token.balanceOf(account), 18);
      setAccountBalance(accountBalance);

      const price = ethers.utils.formatUnits(await crowdsale.price(), 18);
      setPrice(price);

      const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18);
      setMaxTokens(maxTokens);

      const tokensSold = ethers.utils.formatUnits(await crowdsale.tokensSold(), 18);
      setTokensSold(tokensSold);

      setIsLoading(false);
    } catch (err) {
      console.error("Blockchain data loading failed:", err);
    }
  };

  useEffect(() => {
    if (isLoading) loadBlockchainData();
  }, [isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider chains={[mainnet, sepolia, hardhat]}>
          <Container>
            <Navigation />
            <h1 className='my-4 text-center'>Introducing Peace Token</h1>

            {isLoading ? (
              <Loading />
            ) : (
              <>
                <p className='text-center'>
                  <strong>Current Price:</strong> {price} ETH
                </p>
                <Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
                <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
              </>
            )}

            <hr />

            {account && (
              <Info account={account} accountBalance={accountBalance} />
            )}
          </Container>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
