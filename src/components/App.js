import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ethers } from "ethers";
import "../styles/App.css";

// Components
import Navigation from "./Navigation";
import Buy from "./Buy";
import Info from "./Info";
import Progress from "./Progress";
import Loading from "./Loading";

// ABIs
import TOKEN_ABI from "../abis/Token.json";
import CROWDSALE_ABI from "../abis/Crowdsale.json";

// Config (addresses per chainId)
import config from "../config.json";

const queryClient = new QueryClient();

// Wagmi/RainbowKit config
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
    [hardhat.id]: http("http://127.0.0.1:8545"), // explicit localhost
  },
});

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState("0");

  const [price, setPrice] = useState("0");
  const [maxTokens, setMaxTokens] = useState("0");
  const [tokensSold, setTokensSold] = useState("0");

  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unsupportedNetwork, setUnsupportedNetwork] = useState(false);

  const loadBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        console.warn("No injected provider (window.ethereum) found.");
        setIsLoading(false);
        return;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Request accounts and network
      const [selected] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const net = await web3Provider.getNetwork();
      const id = Number(net.chainId);
      setChainId(id);

      // Ensure we have config for this chain
      const netConfig = config[String(id)];
      if (!netConfig || !netConfig.token?.address || !netConfig.crowdsale?.address) {
        console.warn(`No contract addresses configured for chainId ${id}.`);
        setUnsupportedNetwork(true);
        setIsLoading(false);
        return;
      }

      // Setup contracts (read-only via provider)
      const token = new ethers.Contract(netConfig.token.address, TOKEN_ABI, web3Provider);
      const sale = new ethers.Contract(netConfig.crowdsale.address, CROWDSALE_ABI, web3Provider);
      setCrowdsale(sale);

      const checksum = ethers.utils.getAddress(selected);
      setAccount(checksum);

      // Parallel reads
      const [bal, rawPrice, rawMax, rawSold] = await Promise.all([
        token.balanceOf(checksum),
        sale.price(),
        sale.maxTokens(),
        sale.tokensSold(),
      ]);

      setAccountBalance(ethers.utils.formatUnits(bal, 18));
      setPrice(ethers.utils.formatUnits(rawPrice, 18));
      setMaxTokens(ethers.utils.formatUnits(rawMax, 18));
      setTokensSold(ethers.utils.formatUnits(rawSold, 18));

      setIsLoading(false);
    } catch (err) {
      console.error("Blockchain data loading failed:", err);
      // Always release the spinner so the page doesn’t look blank
      setIsLoading(false);
    }
  };

  // Reload when the page mounts or when user switches chain/accounts
  useEffect(() => {
    loadBlockchainData();

    if (window.ethereum) {
      const handleChainChanged = () => {
        setIsLoading(true);
        setUnsupportedNetwork(false);
        loadBlockchainData();
      };
      const handleAccountsChanged = () => {
        setIsLoading(true);
        loadBlockchainData();
      };

      window.ethereum.on?.("chainChanged", handleChainChanged);
      window.ethereum.on?.("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener?.("chainChanged", handleChainChanged);
        window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider chains={[mainnet, sepolia, hardhat]}>
          <Container>
            <Navigation />
            <h1 className="my-4 text-center">Introducing Peace Token</h1>

            {isLoading && <Loading />}

            {!isLoading && unsupportedNetwork && (
              <div
                style={{
                  margin: "1rem auto",
                  maxWidth: 720,
                  padding: "1rem",
                  borderRadius: 8,
                  background: "#fff3cd",
                  color: "#664d03",
                  border: "1px solid #ffe69c",
                }}
              >
                <strong>Unsupported network:</strong> No contract addresses configured for{" "}
                <code>chainId {chainId ?? "unknown"}</code>. Please switch to{" "}
                <strong>Localhost (31337)</strong>, <strong>Sepolia (11155111)</strong>, or{" "}
                <strong>Mainnet (1)</strong>, and ensure <code>config.json</code> has the correct addresses.
              </div>
            )}

            {!isLoading && !unsupportedNetwork && (
              <>
                <p className="text-center">
                  <strong>Current Price:</strong> {price} ETH
                </p>
                <Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
                <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
                <hr />
                {account && <Info account={account} accountBalance={accountBalance} />}
              </>
            )}
          </Container>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
