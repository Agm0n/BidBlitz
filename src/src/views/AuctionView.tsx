import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { greenColor, primaryColor, type auctionType, type bidHistoryEntry, type endedAuctionType, type newBidType } from "../App";
import { getTimeLeft } from "./AuctionListView";
import useSharedEventSource from "../hooks/useSharedEventSource";


function AuctionView() {
    const {auctionId} = useParams();
    const [auction, setAuction] = React.useState({} as auctionType);
    const [isLoading, setLoading] = React.useState(true);
    const [, setNow] = React.useState(Date.now());

    const fetchAuctionDetails = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:3005/api/auctions/${auctionId}`, {method: "GET", redirect: "follow"});
            const result = await response.json();
            setAuction(result);
        } catch (error) {
            console.error("Error fetching auctions:", error);
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    const addBid = async(newBid: newBidType) => {
        setAuction(prev => {
            if (!prev || prev.id !== newBid.auctionId) return prev;
            
            const formatedBid = { bidder: newBid.bidder, amount: newBid.amount, timestamp: newBid.timestamp };
            
            // Handle dupes
            if(prev.bidHistory.includes(formatedBid) || (prev.bidHistory.find(b => b.bidder === formatedBid.bidder && b.amount === formatedBid.amount && b.timestamp === formatedBid.timestamp))){
                return prev;
            }

            const updatedAuction = { ...prev } as auctionType;
            updatedAuction.currentBid = newBid.amount;
            updatedAuction.currentBidder = newBid.bidder;
            updatedAuction.bidCount += 1;
            updatedAuction.bidHistory = Array.isArray(updatedAuction.bidHistory) ? [...updatedAuction.bidHistory, formatedBid] : [formatedBid];
            return updatedAuction;
        });
    }

    useEffect(() => {
        // Initial fetch
        fetchAuctionDetails();

        const interval = setInterval(() => {
          // re-rendering every second to update the time left for each auction
          setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
      }, []);

    // If auction has just ended (status changed or time ran out), fetch details once
    useEffect(() => {
        if (!auction) return;
        const isEnded = auction.status === 'ended' || getTimeLeft(auction.endsAt) === 'Auction ended';
        if (isEnded) {
            fetchAuctionDetails();
        }
    }, [auction?.status, auction?.endsAt]);

    // Setup SSE using the hook with stable handlers
    const sseHandlers = React.useMemo(() => ({// Hook that is only updating between renders when something relevent changes
    events: {
        'new_bid': (event) => {
            const newBid = JSON.parse(event.data) as newBidType;
            if (newBid.auctionId === auctionId){
                console.log("New bid", newBid);
                addBid(newBid);
            }
        },
        'heartbeat': (event) => {
            //Ignoring gracefully
        },
        'auction_ended': (event) => {
            const auctionToEnd: endedAuctionType = JSON.parse(event.data);
            if(auctionToEnd.auctionId === auctionId){
                console.log("Auction ended:", auctionToEnd);
                fetchAuctionDetails();
            }
        }
    },
    onOpen: () => {
        console.log('Connection established');
        fetchAuctionDetails();
    },
    onError: (e) => {
        console.error('EventSource error, connection closed:', e);
    }
    }), [fetchAuctionDetails]);

    useSharedEventSource('http://127.0.0.1:3005/api/stream', sseHandlers, true);

    const styles = {
        titleCard: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            width: "fit-content",
            padding: "0.5rem",
            paddingTop: 0,
            paddingBottom: 0,
            borderRadius: "12px",
            backgroundColor: primaryColor.replace("0.3", "0.2"),
            borderBottomLeftRadius: "0",
            borderBottomRightRadius: "0",
        },
        button: {
            padding: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid " + primaryColor,
            backgroundColor: primaryColor,
            cursor: "pointer"
        },
        timeLeft: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "fit-content",
            backgroundColor: primaryColor,
            borderRadius: "0.5rem",
            padding: "0.5rem",
            transition: "background-color 0.2s",
        },
        lastBid: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            backgroundColor: greenColor.replace("0.3", "0.2"),
            padding: "0.5rem",
            borderRadius: "0.5rem",
        },
        historyWindow: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            borderRadius: "12px",
            border: "2px solid " + primaryColor,
            padding: "1rem",
            width: "70%",
            height: "33rem",
            gap: "0.5rem",
            overflowY: "scroll",
        },
        bidderCard: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: primaryColor.replace("0.3", "0.4"),
            borderRadius: "0.5rem",
            padding: "1rem",
            paddingBottom: 0,
            paddingTop: 0,
            width: "fit-content",
            gap: "0.5rem"
        }
    }



    return (
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
            {/* Loading symbol */}
            {isLoading &&
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", marginTop: "5rem"}}>
                Loading
                </div>
            }
            {/* The Title Card */}
            <div style={styles.titleCard as React.CSSProperties}>
                {/* Back Button */}
                <button title="Back to auctions" style={styles.button} onClick={() => {window.location.href = "/"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M9 14l-4 -4l4 -4" />
                        <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                    </svg>
                </button>
                {/* Title and Image of the Auction */}
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem"}}>
                    <h1>{auction.image}</h1>
                    <h2>{auction.title || "Loading..."}</h2>
                </div>
                {/* Last Bid */}
                <div style={styles as React.CSSProperties}>
                    <div title="Last bid" style={styles.lastBid as React.CSSProperties}>
                        <div style={{fontWeight: "bolder", fontSize: "1.2rem", color: "rgba(255, 255, 255, 1)", textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)"}}>
                        {auction.currentBid + "₪"}
                        </div>
                        {auction.currentBidder &&
                        <div style={{fontWeight: "bolder", fontSize: "0.8rem", color: "rgba(150, 150, 150, 0.9)"}}>
                            {"(" + auction.currentBidder + ")"}
                        </div>
                        }
                    </div>
                </div>
                {/* Time Left */}
                <div style={{...styles.timeLeft, backgroundColor: (parseInt(getTimeLeft(auction.endsAt).split(":")[0]) === 0 && parseInt(getTimeLeft(auction.endsAt).split(":")[1]) <= 30)? "rgba(180, 44, 38, 0.5)" : primaryColor}} title="Time left">
                    {getTimeLeft(auction.endsAt)}
                </div>
                {/* Refresh Button */}
                <button title="Check for updates" style={styles.button} onClick={() => {fetchAuctionDetails()}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                    </svg>
                </button>
            </div>
            {/* Auction History */}
            <div style={styles.historyWindow as React.CSSProperties}>
                <div style={{...(styles.bidderCard as React.CSSProperties)}}>
                    <h3 style={{textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>Start Price:</h3>
                    <h3 style={{fontWeight: "normal"}}>{auction.startPrice + "₪"}</h3>
                </div>
                {/* Showing Bid History */}
                {auction.bidHistory?.map((bid: bidHistoryEntry, index: number) => (
                    <div style={{display: "flex", justifyContent: false? "flex-end" : "flex-start", alignItems: "center"}}>
                        {/* Bidder Card */}
                        <div style={{...(styles.bidderCard as React.CSSProperties), backgroundColor: false? greenColor : primaryColor.replace("0.3", (0.15 + (index % 2)/12) + "")}}>
                            <h3 style={{fontWeight: "bolder", textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>{bid.bidder + ":"}</h3>
                            <h3 style={{fontWeight: "normal"}}>{bid.amount + "₪"}</h3>
                            <div style={{color: "rgba(200, 200, 200, 0.5)", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", padding: 0, margin: 0}}>
                                {new Date(bid.timestamp).getHours().toString() + ":" + new Date(bid.timestamp).getMinutes().toString().padStart(2, '0')}
                                <h4 style={{fontSize: "0.9rem", padding: 0}}>{":" + new Date(bid.timestamp).getSeconds().toString().padStart(2, '0')}</h4>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Displaying Auction Results */}
                {(auction.status === "ended" || getTimeLeft(auction.endsAt) === "Auction ended") &&
                    <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <div style={{...(styles.bidderCard as React.CSSProperties), backgroundColor: primaryColor.replace("0.3", "0.4")}}>
                            {auction.currentBidder?
                                <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "0.45rem"}}>
                                    <h2 style={{fontWeight: "bolder", textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>{auction.currentBidder}</h2>
                                    <h2 style={{fontWeight: "normal"}}>won the auction</h2>
                                </div>
                                : 
                                <h2 style={{textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>No bidders</h2>
                            }
                        </div>
                    </div>
                }
            </div>

        </div>
    )
}

export default AuctionView;