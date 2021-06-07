// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ICOToken.sol";

contract Calculator {
    ICOToken private _token;
    address private _owner;
    uint256 private constant _PRICE = 1 ether;

    event Calculated(string calc, address indexed user, int256 nb1, int256 nb2, int256 result);

    constructor(address tokenAddress, address owner_) {
        _token = ICOToken(tokenAddress);
        _owner = owner_;
    }

     modifier paymentValue() {
        require(
            _token.balanceOf(msg.sender) >= 1 ether,
            "Calculator: you do not have enough token to use this function"
        );
        require(
            _token.allowance(msg.sender, address(this)) >= 1 ether,
            "Calculator: you need to approve this smart contract for at least 1 token before using it"
        );
        _;
    }

       function add(int256 nb1, int256 nb2) public returns (int256) {
        _token.transferFrom(msg.sender, _owner, _PRICE);
        emit Calculated("Addition", msg.sender, nb1, nb2, nb1 + nb2);
        return nb1 + nb2;
    }

      function sub(int256 nb1, int256 nb2) public paymentValue returns (int256) {
        _token.transferFrom(msg.sender, _owner, _PRICE);
        emit Calculated("Substraction", msg.sender, nb1, nb2, nb1 - nb2);
        return nb1 - nb2;
    }

    function mul(int256 nb1, int256 nb2) public paymentValue returns (int256) {
        _token.transferFrom(msg.sender, _owner, _PRICE);
        emit Calculated("Multiplication", msg.sender, nb1, nb2, nb1 * nb2);
        return nb1 * nb2;
    }

     function div(int256 nb1, int256 nb2) public paymentValue returns (int256) {
        require(nb2 != 0, "Calculator: can not divide by zero");
        _token.transferFrom(msg.sender, _owner, _PRICE);
        emit Calculated("Division", msg.sender, nb1, nb2, nb1 / nb2);
        return nb1 / nb2;
    }

     function mod(int256 nb1, int256 nb2) public paymentValue returns (int256) {
        require(nb2 != 0, "Calculator: can not modulus by zero");
        _token.transferFrom(msg.sender, _owner, _PRICE);
        emit Calculated("Modulus", msg.sender, nb1, nb2, nb1 % nb2);
        return nb1 % nb2;
    }

      function owner() public view returns (address) {
        return _owner;
    }

   function price() public pure returns (uint256) {
        return _PRICE;
    }
}
