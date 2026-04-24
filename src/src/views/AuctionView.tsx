import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { greenColor, primaryColor, SERVER_ADDR, useCookies, type auctionType, type bidHistoryEntry, type endedAuctionType, type newBidType } from "../App";
import { getTimeLeft } from "./AuctionListView";
import useSharedEventSource from "../hooks/useSharedEventSource";


function AuctionView() {
    const {auctionId} = useParams();
    const [auction, setAuction] = React.useState({} as auctionType);
    const [isLoading, setLoading] = React.useState(true);
    const [insertedBid, setInsertedBid] = React.useState(0);
    const [infoMessage, setInfoMessage] = React.useState("");
    const [, setNow] = React.useState(Date.now());

    const [username, setUsername] = useCookies('username');
    
    const fetchAuctionDetails = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(SERVER_ADDR + `/api/auctions/${auctionId}`, {method: "GET", redirect: "follow"});
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

    useSharedEventSource(SERVER_ADDR + '/api/stream', sseHandlers, true);

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
            cursor: "pointer",
            color: "white"
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
        },
        bidInput: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0.5rem",
            backgroundColor: "rgba(140, 140, 145, 0.15)",
            border: "2px solid " + primaryColor,
            borderRadius: "4px",
            color: "#c1c1c2",
            width: "5rem",
            fontSize: "1.5rem"
        },
        infoMessage: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
            position: "absolute",
            backgroundColor: "rgba(179, 11, 11, 0.5)",
            borderRadius: "0.5rem",
            padding: "2rem",
            width: "fit-content",
            gap: "0.5rem",
            transition: "opacity 0.2s",
            pointerEvents: "none"
        }
    }
    
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInsertedBid(parseInt(event.target.value) > auction.currentBid? parseInt(event.target.value) : (auction.currentBid + 1))
    }
    
    const showInfoMessage = async (message: string, seconds: number = 3) => {
        setInfoMessage(message)
        setTimeout(() => {
            setInfoMessage("");
        }, seconds * 1000);
    }

    const highliteInput = async (id: string, seconds: number = 3) => {
        document.getElementById(id).style.borderBottomColor = "red";
        setTimeout(() => {
            document.getElementById(id).style.borderBottomColor = primaryColor;
        }, seconds * 1000);
    }
    
    const canEnterBid = (showWhy: boolean = false) => {
        if(insertedBid <= auction.currentBid) {
            if(showWhy){
                highliteInput("bidInput");
                showInfoMessage("Bid amount too low");
            }
            return false;
        }
        if (!username || username === "") {
            if(showWhy){
                highliteInput("usernameInput");
                showInfoMessage("Can't bid without a username");
            }
            return false;
        }
        if (isLoading) {
            if(showWhy){
                showInfoMessage("Bidding in progress");
            }
            return false;
        }
        return true;
    }

    // Placing the bid
    const submitBid = async() => {
        if(canEnterBid(true)){
            setLoading(true);
            const headers = new Headers();
            headers.append("Content-Type", "application/json");

            const requestOptions: RequestInit = {
                method: "POST",
                headers: headers,
                body: JSON.stringify({"auctionId": auctionId, "bidder": username, "amount": insertedBid}),
                redirect: "follow"
            };

            fetch(SERVER_ADDR + "/api/bid", requestOptions)
            .then((response) => response.text())
            .then((result) => {
                console.log(result);
                setLoading(false);
            })
            .catch((error) => console.error(error));
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            submitBid();
        }
    }

    return (
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
            {/* Loading symbol */}
            {isLoading &&
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", marginTop: "5rem", zIndex: 9999}}>
                    <img style={{width: "8rem", height: "8rem"}} className="rotating" src="/loading.png"/>
                </div>
            }
            {/* A popup for displaying mostly error info (for example bid too low) */}
            <div style={{...(styles.infoMessage as React.CSSProperties), opacity: infoMessage === ""? 0 : "1"}}>
                {infoMessage}
            </div>
            
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
                    <svg className={isLoading? "rotating" : ""} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <div style={{display: "flex", justifyContent: username === bid.bidder? "flex-end" : "flex-start", alignItems: "center"}}>
                        {/* Bidder Card */}
                        <div style={{...(styles.bidderCard as React.CSSProperties), backgroundColor: username === bid.bidder? greenColor : primaryColor.replace("0.3", (0.15 + (index % 2)/12) + "")}}>
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
                                    <h2 style={{fontWeight: "bolder", textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>{auction.currentBidder === username? "You" : auction.currentBidder}</h2>
                                    <h2 style={{fontWeight: "normal"}}>won the auction</h2>
                                </div>
                                : 
                                <h2 style={{textShadow: "2px 2px 2px rgba(0, 0, 0, 0.5)"}}>No bidders</h2>
                            }
                        </div>
                    </div>
                }
            </div>
            {(auction.status !== "ended" && getTimeLeft(auction.endsAt) !== "Auction ended") &&
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.2rem"}}>
                    <input id="bidInput" style={styles.bidInput} type="number" value={insertedBid} placeholder="Enter bid" min={auction.currentBid + 1} onChange={handleInputChange} onKeyDown={handleKeyDown}/>
                    <h2>₪</h2>
                    <button style={{...styles.button, margin: 0, marginLeft: "0.5rem", padding: "0.5rem", cursor: canEnterBid()? "pointer" : "not-allowed"}} onClick={submitBid}>
                        <h2 style={{padding: 0, margin: 0, fontWeight: "normal", fontSize: "1.5rem"}}>Enter bid</h2>
                    </button>
                </div>
            }
        </div>
    )
}

export default AuctionView;