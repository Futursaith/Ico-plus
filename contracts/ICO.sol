//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./ICOToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



contract ICOToken is Ownable {
    
    using Address for address payable;

    BlueCoin private _coin;
    address private _owner;
    uint256 public tokenPrice;
    uint256 public currentTime;
    uint256 public timeEnd;
    uint256 private _numTokensApproved;

    enum State {inactive, active}
    State public curStatus;

    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed recipient, uint256 amount);

   
    constructor(address coinAddress) {
        _coin = BlueCoin(coinAddress);
        _owner = _coin.getOwner();
        Ownable.transferOwnership(_owner);
        tokenPrice = 1e9; 
        curStatus = State.active;
        timeEnd = block.timestamp + 1209600; 
    }

    modifier onlyActive {
        require(block.timestamp < timeEnd, "BlueICO: This operation is reserved for active contracts.");
        _;
    }

    modifier onlyInactive {
        require(block.timestamp >= timeEnd, "BlueICO: This operation is reserved for inactive contracts.");
        _;
    }

   
    function getState() public view returns (State) {
        if (block.timestamp >= timeEnd) {
            return State.inactive; 
        } else {
            return State.active; 
        }
    }

    
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

   
    function getMyTokenBalance() public view returns (uint256) {
        return _coin.balanceOf(msg.sender);
    }

   
    function getTotalSupply() public view returns (uint256) {
        return _coin.totalSupply();
    }


    function approveInitialSupply(uint256 numTokensApproved) public onlyOwner {
        _coin.approve(address(this), numTokensApproved);
    }

  
    receive() external payable {
        buyTokens();
    }

   
    function buyTokens() public payable {
        _buyTokens(msg.sender, msg.value);
    }


    function _buyTokens(address sender, uint256 amount) private onlyActive {
        require(
            amount % 10**9 == 0,
            "ICOToken: Contract doesn't give back change. The received amount must be divisible by price."
        );
        uint256 numTokens = amount * 10**9;
        _coin.transferFrom(_owner, sender, numTokens);
        emit Deposit(sender, amount);
    }

    
    function withdrawEther() public onlyOwner onlyInactive {
        uint256 depositBalance = address(this).balance;
        require(depositBalance > 0, "FlashCoinICO: can not withdraw 0 ether");

        payable(_owner).sendValue(depositBalance);
        emit Withdraw(_owner, depositBalance);
    }

    /

    function getOwner() public view returns (address) {
        return Ownable.owner();
    }
}
