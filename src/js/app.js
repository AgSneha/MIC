App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	tokensSold: 0,
	tokensAvailable: 750000,

	init: function() {
		console.log("App initialized...")
		return App.initWeb3();
	},

	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			//if a web3 instance is already provided by the Meta Mask.
			App.web3Provider = web3.currentProvider;
			web3 =new Web3(web3.currentProvider);
		}else {
			//specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
			web3 = new Web3(App.web3Provider);
		}
		return App.initContracts();
	},

	initContracts: function() {
		$.getJSON("MICTokenSale.json", function(mictokensale) {
			App.contracts.MICTokenSale = TruffleContract(mictokensale);
			App.contracts.MICTokenSale.setProvider(App.web3Provider);
			App.contracts.MICTokenSale.deployed().then(function(mictokensale) {
				console.log("MIC Token Sale Address: ", mictokensale.address);
			});
		}).done(function() {
			$.getJSON("MICToken.json", function(mictoken) {
				App.contracts.MICToken = TruffleContract(mictoken);
				App.contracts.MICToken.setProvider(App.web3Provider);
				App.contracts.MICToken.deployed().then(function(mictoken) {
					console.log("MIC Token Address: ", mictoken.address);
				});
				App.listenForEvents();
				return App.render();
			});
		});
	},

	listenForEvents: function() {
		App.contracts.MICTokenSale.deployed().then(function(instance) {
			instance.Sell({}, {
				fromBlock: 0,
				toBlock: 'latest'
			}).watch(function(error, event) {
				console.log("Event triggered ", event);
				App.render();
			});
		});
	},

	render: function() {
		if (App.loading) {
			return;
		}
		App.loading = true;

		var loader = $('#loader');
		var content = $('#content');

		loader.show();
		content.hide();

		//load account data
		web3.eth.getCoinbase(function(err, account) {
			if (err === null) {
				console.log("Account: ", account);
				App.account = account;
				$('#accountAddress').html("Your Account: " + account);
			}
		})
			//load token sale contract
			App.contracts.MICTokenSale.deployed().then(function(instance) {
				micTokenSaleInstance = instance;
				return micTokenSaleInstance.tokenPrice();
			}).then(function(tokenPrice) {
				console.log("Token Price: " + tokenPrice);
				App.tokenPrice = tokenPrice;
				$('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
				return micTokenSaleInstance.tokensSold();
			}).then(function(tokensSold) {
				App.tokensSold = tokensSold.toNumber();
				$('.tokens-sold').html(App.tokensSold);
				$('.tokens-available').html(App.tokensAvailable);

				var progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
				console.log("Progress Percent: ", progressPercent);
				$('#progress').css('width', progressPercent + '%');

				//load token contract to check your balance
				App.contracts.MICToken.deployed().then(function(instance) {
					micTokenInstance = instance;
					return micTokenInstance.balanceOf(App.account);
				}).then(function(balance) {
					$('.mic-balance').html(balance.toNumber());

					App.loading = false;
					loader.hide();
					content.show();
				})
			});
	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();
		var numberOfTokens = $('#numberOfTokens').val();
		App.contracts.MICTokenSale.deployed().then(function(instance) {
			return instance.buyTokens(numberOfTokens, { 
				from: App.account,
				value: numberOfTokens * App.tokenPrice,
				gas: 500000
			}).then(function(result) {
				console.log("Token bought...");
				$('form').trigger('reset');
				//Wait for Sell event

				/*$('#loader').hide();
				$('#content').show();*/
			});
		})
	}
}

$(function() {
	$(window).load(function() {
		App.init();
	})
});