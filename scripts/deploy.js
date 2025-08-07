const { ethers } = require("hardhat");
const { utils } = require("ethers");

async function main() {
  const NAME = 'Peace Token';
  const SYMBOL = 'PEACE';
  const MAX_SUPPLY = '1000000';
  const PRICE = utils.parseUnits('0.025', 'ether');

  // Deploy Token
  const Token = await ethers.getContractFactory('Token');
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY);
  await token.deployed();
  console.log(`Token deployed to: ${token.address}\n`);

  // Deploy Crowdsale
  const Crowdsale = await ethers.getContractFactory('Crowdsale');
  const crowdsale = await Crowdsale.deploy(
    token.address,
    PRICE,
    utils.parseUnits(MAX_SUPPLY, 'ether')
  );
  await crowdsale.deployed();
  console.log(`Crowdsale deployed to: ${crowdsale.address}\n`);

  // Send tokens to Crowdsale
  const transaction = await token.transfer(
    crowdsale.address,
    utils.parseUnits(MAX_SUPPLY, 'ether')
  );
  await transaction.wait();
  console.log(`Tokens transferred to Crowdsale\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
