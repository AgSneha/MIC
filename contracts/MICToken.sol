pragma solidity >=0.4.21 <0.6.0;

contract MICToken {
	string public name = "MIC Token";
	string public symbol = "MIC";
	string public standard = "MIC Token v1.0";
	uint256 public totalSupply;

	event Approval(
		address indexed _owner,
		address indexed _to,
		uint256 _value);

	event Transfer(
		address indexed _from, 
		address indexed _to,
		uint256 _value);

	mapping (address => uint256) public balanceOf;

	//allowance
	mapping (address => mapping (address => uint256)) public allowance;
	
	constructor (uint256 _initialSupply) public {
		balanceOf[msg.sender] = _initialSupply;
		totalSupply = _initialSupply;
		//allocate the inital Supply
	}

	//transfer 
	function transfer (address _to, uint256 _value) public returns(bool success) {
		//exception of account doesn't have enuf
		require(balanceOf[msg.sender] >= _value); 
		//runs the code below only if require is true
		//transfer the balance
		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;
		//transfer event
		emit Transfer(msg.sender, _to, _value);
		//return boolean
		return true;

	}
	
	//delegated transfer

	//approve
	function approve (address _spender, uint256 _value) public returns(bool success) {
		//allowance
		allowance[msg.sender][_spender] = _value;
		//approval event
		emit Approval(msg.sender, _spender, _value);

		return true;
	}
	

	//transferFrom
	function transferFrom (address _from, address _to, uint256 _value) public returns(bool success) {
		
		//require _from has enuf tokens
		require (_value <= balanceOf[_from]);
		
		//requre allowance is big enuf
		require (_value <= allowance[_from][msg.sender]);
		
		//change the balance
		balanceOf[_from] -= _value;
		balanceOf[_to] += _value;

		//update the allowance
		allowance[_from][msg.sender] -= _value;

		//transfer event 
		emit Transfer(_from, _to, _value);

		//return a boolean
		return true;
	}
	

}