pragma solidity >=0.4.21 <0.6.0;

import "./MICToken.sol";

contract MICTokenSale {
	address payable admin;
	MICToken public tokenContract;
	uint256 public tokenPrice;
	uint256 public tokensSold;

	event Sell(address _buyer, uint256 _amount);
	

	constructor (MICToken _tokenContract, uint256 _tokenPrice) public {

		//assign an admin
		admin = msg.sender;
		//token contract
		tokenContract = _tokenContract;
		//token price
		tokenPrice = _tokenPrice;
	}

	//multiply from ds-math library
	function multiply (uint x, uint y) internal pure returns(uint z) {
		require (y == 0 || (z = x*y) / y == x);
	}
	

	//buy tokens
	function buyTokens (uint256 _numberOfTokens) public payable {
		//require that value is equal to tokens
		require (msg.value == multiply(_numberOfTokens, tokenPrice));
		//require that there are enuf tokens in the contract
		require (tokenContract.balanceOf(address(this)) >= _numberOfTokens);
		//require that transfer is successful
		require (tokenContract.transfer(msg.sender, _numberOfTokens));
		//keep track of the no. of tokens solidity
		tokensSold += _numberOfTokens;
		//trigger a sell event
		emit Sell(msg.sender, _numberOfTokens);
	}

	//ending the token sale
	function endSale() public {
		//require admin to do this
		require (msg.sender == admin);
		//transfer the left amount of tokens to admin
		require (tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
		//destroy this contract
		selfdestruct(admin);
	}
	

}