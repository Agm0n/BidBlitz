import { describe, it, expect } from "vitest";
import { validateBid, containsDupes } from "../src/views/AuctionView"
import { type auctionType } from "../src/App"
import { getTimeLeft, lessThan30 } from "../src/views/AuctionListView";
const testAuction = {
    "id": "a5",
    "title": "Retro Arcade Machine",
    "image": "👾",
    "startPrice": 150,
    "currentBid": 161,
    "currentBidder": "NostalgiaNate",
    "endsAt": 1777045692436,
    "status": "ended",
    "bidHistory": [
        {
            "bidder": "VintageVicki",
            "amount": 155,
            "timestamp": 1777045656758
        },
        {
            "bidder": "CoolUsername",
            "amount": 156,
            "timestamp": 1777045664356
        },
        {
            "bidder": "NostalgiaNate",
            "amount": 161,
            "timestamp": 1777045676996
        }
    ],
};

describe('bid validation logic', () => {
    
    it('Has no username', () => {
        const result = validateBid(162 as number, testAuction as auctionType, undefined, false);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('no_username');
    });
    it('Username is empty or with whitespaces', () => {
        const empty = validateBid(162 as number, testAuction as auctionType, "", false);
        expect(empty.valid).toBe(false);
        expect(empty.reason).toBe('no_username');

        const whitespaces = validateBid(162 as number, testAuction as auctionType, "     ", false);
        expect(whitespaces.valid).toBe(false);
        expect(whitespaces.reason).toBe('no_username');
    });

    it('Low bid', () => {
        const result = validateBid(152 as number, testAuction as auctionType, "User", false);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('low');
    });

    it('In the process of submiting a bid', () => {
        const result = validateBid(662 as number, testAuction as auctionType, "User", true);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('loading');
    });

    it('Valid bid', () => {
        const result = validateBid(662 as number, testAuction as auctionType, "User", false);
        expect(result.valid).toBe(true);
    });
});


describe('duplicate event detection', () => {
    it('Is a duplicate message', () => {
        //Everywhere else duplicate events dont matter
        expect(containsDupes(testAuction as auctionType, {
            "bidder": "NostalgiaNate",
            "amount": 161,
            "timestamp": 1777045676996
        })).toBe(true);
    });

    it('Is not a duplicate message', () => {
        expect(containsDupes(testAuction as auctionType, {
            "bidder": "NostalgiaNate",
            "amount": 162,
            "timestamp": 1777045676997
        })).toBe(false);
    });
});


describe('countdown calculation', () => {
    it("Will end in 2 minutes", () => {
        const in2Minutes: Date = new Date();
        in2Minutes.setMinutes(in2Minutes.getMinutes() + 2);
        const result = getTimeLeft(in2Minutes);
        expect(result).toBeOneOf(["02:00 left", "01:59 left"]); //incase a second passes until it gets the result
    })
    it("Will end in 30 seconds", () => {
        const in30Seconds: Date = new Date();
        in30Seconds.setSeconds(in30Seconds.getSeconds() + 30);
        const result = getTimeLeft(in30Seconds);

        expect(result).toBeOneOf(["00:30 left", "00:29 left"]); //incase a second passes until it gets the result
    })
    it("Already ended", () => {
        const tenSecondsAgo: Date = new Date();
        tenSecondsAgo.setSeconds(tenSecondsAgo.getSeconds() - 10);
        const result = getTimeLeft(tenSecondsAgo);

        expect(result).toBe("Auction ended");
    })
    it("Ended right now", () => {
        const result = getTimeLeft(new Date());
        expect(result).toBeOneOf(["00:00 left", "Auction ended"]);
    })
    it("Is less then 30 seconds", () => {
        const in30Seconds: Date = new Date();
        in30Seconds.setSeconds(in30Seconds.getSeconds() + 29);
        
        expect(lessThan30(in30Seconds)).toBe(true);
    })
})