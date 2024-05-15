// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract Demo {
    address public owner;

    struct Payment {
        uint amount;
        uint timestamp;
        address from;
        string message;
    }

    struct Balance {
        uint totalPayments;
        mapping (uint => Payment) payments;
    }

    mapping (address => Balance) public balances;

    constructor() {
        owner = msg.sender;
    }

    function currentBalance() public view returns(uint) {
        return address(this).balance;
    }

    function getPayment(address _addr, uint _index) public view returns(Payment memory) {
        return balances[_addr].payments[_index];
    }

    function pay(string memory message) public payable returns(uint) {
        uint paymentNum = balances[msg.sender].totalPayments;
        balances[msg.sender].totalPayments++;

        Payment memory newPayment = Payment(
            msg.value,
            block.timestamp,
            msg.sender,
            message
        );

        balances[msg.sender].payments[paymentNum] = newPayment;

        return msg.value;
    }
}