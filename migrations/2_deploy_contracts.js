const LightpointToken = artifacts.require("LightpointToken");
const LightpointTokenSale = artifacts.require("LightpointTokenSale");
const LightpointMarketplace = artifacts.require("LightpointMarketplace");

module.exports = function(deployer) {
  deployer.deploy(LightpointToken, 1000000).then(function(){
    return deployer.deploy(LightpointTokenSale, LightpointToken.address, 1000000000000000).then(function(){
      return deployer.deploy(LightpointMarketplace, LightpointToken.address);
    });
  })
};