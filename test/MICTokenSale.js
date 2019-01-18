var MICToken = artifacts.require("./MICToken.sol");
var MICTokenSale = artifacts.require("./MICTokenSale.sol");


contract ('MICTokenSale', function(accounts) {
	var tokenSaleInstance;
	var tokenInstance;
	var tokenPrice = 1000000000000000; //in wei i.e, 10^15wei or 0.001 ether
	//1 ether  = 10^18 wei
	var admin = accounts[0];
	var buyer = accounts[1];
	var numberOfTokens;
	var tokensAvailable = 750000;
	var tokensNotForSale = 250000;

	it('initializes the contract with the correct values', function() {
		return MICTokenSale.deployed().then(function(instance) {
			tokenSaleInstance = instance;
			return tokenSaleInstance.address
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has contract address');
			return tokenSaleInstance.tokenContract();
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has a token contract address');
			return tokenSaleInstance.tokenPrice();
		}).then(function(price) {
			assert.equal(price, tokenPrice, 'token price is correct');
		});
	});

	it('facilitates token buying', function() {
		return MICToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return MICTokenSale.deployed();
		}).then(function(instance) {
			tokenSaleInstance = instance;
			//provision 75% of all tokens in the token sale
			return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
		}).then(function(receipt) {
			numberOfTokens = 10;
			return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens*tokenPrice });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Sell', 'should be the Sell event');
			assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the token');
			assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
			return tokenSaleInstance.tokensSold();
		}).then(function(amount) {
			assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
			return tokenInstance.balanceOf(buyer);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), numberOfTokens);
			return tokenInstance.balanceOf(tokenSaleInstance.address);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
			//try to buy tokens different from the ether value
			return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
			return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens*tokenPrice});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
		});
	});

	it('ends token sale', function() {
		return MICToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return MICTokenSale.deployed();
		}).then(function(instance) {
			tokenSaleInstance = instance;
			//try to end the sale from account other than the admin
			return tokenSaleInstance.endSale({ from: buyer });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'must be admin to end the sale');
			//end sale as admin
			return tokenSaleInstance.endSale({ from: admin });
		}).then(function(receipt) {
			return tokenInstance.transfer(tokenInstance.address, 749990, { from: admin });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'should be the Transfer event');
			assert.equal(receipt.logs[0].args._from, admin, 'logs the account the tokens are transferred from');
			assert.equal(receipt.logs[0].args._to, tokenInstance.address, 'logs the account the tokens are transferred to');
			assert.equal(receipt.logs[0].args._value, 749990, 'logs the transfer amount');
			return tokenInstance.balanceOf(tokenInstance.address);
		}).then(function(balance) {
			tokensNotForSale = tokensNotForSale + 749990;
			assert.equal(balance.toNumber(), tokensNotForSale, 'returns all unsold tokens back to the admin');
			//check that the token price was reset when self destruct was called
			return tokenSaleInstance.tokenPrice();
		}).then(function(price) {
			assert.equal(price.toNumber(), 0, 'token price was reset');
		});
	});
});