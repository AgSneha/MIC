var MICToken = artifacts.require("./MICToken.sol");
var MICTokenSale = artifacts.require("./MICTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(MICToken, 1000000).then(function() {
  	//token price is 0.001 Ether
  	var tokenPrice = 1000000000000000;
  	return deployer.deploy(MICTokenSale, MICToken.address, tokenPrice);
  });
  
};