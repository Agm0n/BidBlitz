import React, { useEffect } from "react";
import { greenColor, primaryColor, SERVER_ADDR, type auctionType, type endedAuctionType, type newBidType } from "../App";
import useSharedEventSource from '../hooks/useSharedEventSource';

export const getTimeLeft = (auctionTime) => {
  var timeLeftString = "";
  const timeLeft = (new Date(auctionTime).getTime() - new Date().getTime());
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  // timeLeftString = seconds + " seconds left";
  // if (minutes > 0) {
  //   timeLeftString = minutes + " minutes, " + timeLeftString;
  // } if (hours > 0) {
  //   timeLeftString = hours + " hours, " + timeLeftString;
  // }
  timeLeftString = minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + " left";
  if(seconds < 0 && minutes < 0 && hours < 0) {
    timeLeftString = "Auction ended";
  }
  return timeLeftString;
};



function AuctionListView() {
  const [auctions, setAuctions] = React.useState([]);
  const [isLoading, setLoading] = React.useState(true);
  // state updated every second to force re-render so time-left text updates
  const [, setNow] = React.useState(Date.now());

  const fetchAuctions = async () => {
    setLoading(true);
    fetch(SERVER_ADDR + "/api/auctions", {method: "GET", redirect: "follow"})
      .then((response) => response.json())
      .then((result) => {
        setAuctions(result);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching auctions:", error));
  }

  const updateAuction = async (newBid: newBidType) => {
    setLoading(true);
    setAuctions(prev => {
      const other = prev.filter(a => a.id !== newBid.auctionId);
      const found = prev.find(a => a.id === newBid.auctionId);
      const updated: auctionType = { ...(found ?? {}), currentBid: newBid.amount, currentBidder: newBid.bidder };
      return [...other, updated];
    });
    setLoading(false);
  }

  const endAuction = async (endedAuction: endedAuctionType) => {
    setLoading(true);
    setAuctions(prev => {
      const other = prev.filter(a => a.id !== endedAuction.auctionId);
      const found = prev.find(a => a.id === endedAuction.auctionId);
      const updated: auctionType = { ...(found ?? {}), currentBid: endedAuction.finalPrice, currentBidder: endedAuction.winner, status: "ended" };
      return [...other, updated];
    });
    setLoading(false);
  }

  useEffect(() => {
    // initial fetch of all auctions when component mounts
    fetchAuctions();

    const interval = setInterval(() => {
      // re-rendering every second to update the time left for each auction
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  // Setup SSE using the hook with stable handlers
  const sseHandlers = React.useMemo(() => ({// Hook that is only updating between renders when something relevent changes
    events: {
      'new_bid': (event: any) => {
        const newBid: newBidType = JSON.parse(event.data);
        console.log("New bid", newBid);
        updateAuction(newBid);
      },
      'heartbeat': (_event: any) => {
        //Ignoring gracefully
      },
      'auction_ended': (event: any) => {
        const auctionToEnd: endedAuctionType = JSON.parse(event.data);
        console.log("Auction ended:", auctionToEnd);
        endAuction(auctionToEnd);
      }
    },
    onOpen: () => {
      console.log('Connection established');
      fetchAuctions();
    },
    onError: (e) => {
      console.error('EventSource error, connection closed:', e);
    }
  }), [fetchAuctions]);

  useSharedEventSource(SERVER_ADDR + '/api/stream', sseHandlers, true);

  const styles = {
    auctionCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "70%",
      flexDirection: "row",
      border: "1px solid " + primaryColor,
      borderRadius: "0.5rem",
      padding: 0,
      paddingLeft: "0.5rem",
      paddingRight: "0.5rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
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
      backgroundColor: greenColor,
      padding: "0.5rem",
      borderRadius: "0.5rem",
    },
    WeightedSegment: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "15rem"
    },
    title: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "25rem"
    }
  }

  return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
      {/* Loading symbol */}
      {isLoading &&
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", marginTop: "10rem", zIndex: 9999}}>
          <img style={{width: "8rem", height: "8rem"}} className="rotating" src="/loading.png"/>
        </div>
      }
      
      <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem"}}>
        <h1>Auctions</h1>
        {/* Refresh Button */}
        <button title="Check for updates" style={{padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid " + primaryColor, backgroundColor: primaryColor, cursor: "pointer"}} onClick={() => {fetchAuctions()}}>
          <svg className={isLoading? "rotating" : ""} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </button>
      </div>
      {/* Active Auctions */}
      {auctions.filter((auction: auctionType) => auction.status === "active" && getTimeLeft(auction.endsAt) !== "Auction ended").sort((a: auctionType, b: auctionType) => a.endsAt - b.endsAt).map((auction: auctionType, index: number) => (
        <div id={"auction-" + auction.id} style={{...(styles.auctionCard as React.CSSProperties), backgroundColor: (parseInt(getTimeLeft(auction.endsAt).split(":")[0]) === 0 && parseInt(getTimeLeft(auction.endsAt).split(":")[1]) <= 30)? "rgba(219, 44, 38, " + (0.1 + (index % 2)/10) + ")" : greenColor.replace("0.3", (0.1 + (index % 2)/10) + "")}} title="click to enter" onClick={() => window.location.href = "/auction/" + auction.id}>
          {/* Image */}
          <h2>{auction.image}</h2>
          
          {/* Title */}
          <h3 style={styles.title as React.CSSProperties}>{auction.title}</h3>
          {/* Last Bid */}
          <div style={styles.WeightedSegment as React.CSSProperties}>
            <div title="Last bid" style={styles.lastBid as React.CSSProperties}>
              <div style={{fontWeight: "bolder", fontSize: "1.5rem", color: "rgba(255, 255, 255, 1)", textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)"}}>
                {auction.currentBid + "₪"}
              </div>
              {auction.currentBidder &&
                <div style={{fontWeight: "bolder", color: "rgba(150, 150, 150, 0.9)"}}>
                  {"(" + auction.currentBidder + ")"}
                </div>
              }
            </div>
          </div>
          {/* Time Left */}
          <div>
            <div style={{...styles.timeLeft, backgroundColor: (parseInt(getTimeLeft(auction.endsAt).split(":")[0]) === 0 && parseInt(getTimeLeft(auction.endsAt).split(":")[1]) <= 30)? "rgba(180, 44, 38, 0.5)" : primaryColor}} title="Time left">
              {getTimeLeft(auction.endsAt)}
            </div>
          </div>
        </div>
      ))}

      {/* Ended Auctions */}
      {auctions.filter((auction: auctionType) => auction.status === "ended").map((auction: auctionType, index: number) => (
        <div id={"auction-" + auction.id} style={{...(styles.auctionCard as React.CSSProperties), backgroundColor: primaryColor.replace("0.3", (0.1 + (index % 2)/12) + "")}} title="Click to enter" onClick={() => window.location.href = "/auction/" + auction.id}>
          {/* Image */}
          <h2>{auction.image}</h2>
          
          {/* Title */}
          <h3 style={{...(styles.title as React.CSSProperties), marginLeft: "1rem"}}>{auction.title}</h3>

          {/* Ended Auction Info */}
          <div style={styles.title}>
            <div style={styles.timeLeft as React.CSSProperties}>
              {auction.currentBidder ? "Sold to " + auction.currentBidder + " for " + auction.currentBid + "₪" : "Auction ended with no bids"}
            </div>
          </div>

          {/* Ended Auction Icon */}
          <div>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6.5" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M22 22l-5 -5" />
              <path d="M17 22l5 -5" />
             </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AuctionListView;