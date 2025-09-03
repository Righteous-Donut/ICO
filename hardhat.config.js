// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { REACT_APP_ALCHEMY_API_KEY, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${REACT_APP_ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${REACT_APP_ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
};
