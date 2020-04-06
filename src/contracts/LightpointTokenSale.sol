pragma solidity ^0.5.0;

import './LightpointToken.sol';

contract LightpointTokenSale {
    address payable public admin;
    LightpointToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;
    bool public onSale;

    event Sell(address buyer, uint256 amount);

    event SaleChanged(bool onSale);

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    constructor(LightpointToken _tokenContract, uint256 _tokenPrice) public {
       admin = msg.sender;
       tokenContract = _tokenContract;
       tokenPrice = _tokenPrice;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x); 
    }

    function buyTokens(uint256 _numberOfTokens) public payable{
        require(onSale);
        require(msg.value == multiply(_numberOfTokens, tokenPrice));
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
        require(tokenContract.transfer(msg.sender, _numberOfTokens));
        admin.transfer(msg.value);
        tokensSold += _numberOfTokens;
        emit Sell(msg.sender, _numberOfTokens);
    }

    function startSale() public onlyAdmin {
        require(!onSale);
        onSale = true;
        emit SaleChanged(onSale);
    }

    function endSale() public payable {
        pauseSale();
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
        admin.transfer(address(this).balance); 
        tokensSold = 0;
    }

    function pauseSale() public onlyAdmin {
        require(onSale);
        onSale = false;
        emit SaleChanged(onSale);
    }

    function kill() public onlyAdmin { 
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
        selfdestruct(admin); 
    }
}