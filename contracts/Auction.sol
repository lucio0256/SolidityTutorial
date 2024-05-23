// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

contract Auction {

    address public owner;
    uint constant DURATION = 2 days;
    uint constant FEE = 10;
    struct AuctionObj {
        address payable seller;
        uint startPrice;
        uint finalPrice;
        uint startAt;
        uint endsAt;
        uint discountRate;
        string item;
        bool stopped;
    }

    AuctionObj[] public auctions;

    event AuctionCreated(uint index, string itemName, uint startPrice, uint duration);
    event AuctionEnded(uint index, uint finalPrice, address winner);

    constructor() {
        owner = msg.sender;
    }

    function createAuction(uint _startPrice, uint _discountRate, string memory _item, uint _duration) external {
        uint duration = _duration == 0 ? DURATION : _duration;
        require(_startPrice >= _discountRate * duration, "incorrect starting price");

        AuctionObj memory newAuction = AuctionObj({
            seller: payable(msg.sender),
            startPrice: _startPrice,
            finalPrice: _startPrice,
            startAt: block.timestamp,
            endsAt: block.timestamp + duration,
            discountRate: _discountRate,
            item: _item,
            stopped: false
        });

        auctions.push(newAuction);
        emit AuctionCreated(auctions.length - 1, _item, _startPrice, duration);
    }


    function getPrice(uint index) public view returns(uint) {
        AuctionObj memory currentAuct = auctions[index];
        require(currentAuct.stopped != true, "Auction stopped");
        uint elapsed = block.timestamp - currentAuct.startAt;
        uint discount = elapsed * currentAuct.discountRate;
        return currentAuct.startPrice - discount;
    }

    function buy(uint index) external payable {
        AuctionObj storage currentAuc = auctions[index];
        require(currentAuc.stopped != true, "Auction stopped");
        require(currentAuc.endsAt > block.timestamp, "Auction ended");
        uint lastPrice = getPrice(index);
        require(msg.value >= lastPrice, "Not enough funds");
        currentAuc.stopped = true;
        currentAuc.finalPrice = lastPrice;

        if (msg.value > lastPrice) {
            uint ret = msg.value - lastPrice;
            payable(msg.sender).transfer(ret);
        }

        currentAuc.seller.transfer(lastPrice - ((lastPrice * FEE) / 100));
        emit AuctionEnded(index, lastPrice, msg.sender);

    }

}