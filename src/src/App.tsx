import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import SiteFrame from './SiteFrame'
import AuctionListView from './views/AuctionListView';
import React from 'react';
import AuctionView from './views/AuctionView';

export const primaryColor: string = "rgba(130, 130, 135, 0.3)";
export const greenColor: string = "rgba(38, 219, 44, 0.3)";

export type bidHistoryEntry = {
    bidder: string,
    amount: number,
    timestamp: number
}

export type auctionType = {
    id: string,
    title: string,
    image: string,
    startPrice: number,
    currentBid: number,
    currentBidder: string,
    endsAt: number,
    status: string,
    bidHistory: bidHistoryEntry[],
    bidCount: number
}

export type newBidType = {
  auctionId: string,
  bidder: string,
  amount: number,
  previousBid: number,
  timestamp: number,
  bid_id: string
}

export type endedAuctionType = {
  auctionId: string,
  title: string,
  winner: string,
  finalPrice: number,
  timestamp: number
}

// For easily accessing cookies
export const useCookies = (
  key: string
  ): [string | undefined, (value: string) => void] => {
    const [cookieValue, setCookieValue] = React.useState<string | undefined>(() => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
      if (cookie) {
        return cookie.split("=")[1];
      }
      return undefined;
    });

  const setCookie = (value: string) => {
    document.cookie = `${key}=${value}`;
    setCookieValue(value);
  };

  return [cookieValue, setCookie];
};

function App() {
  // const [theme,setCookieValue] = useCookies('theme');
  // document.body.className = theme?? "dark";

  return (
    <>
      <SiteFrame>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuctionListView />} />
            <Route path="/auction/:auctionId" element={<AuctionView />} />
          </Routes>
        </BrowserRouter>  
      </SiteFrame>
    </>
  )
}

export default App
