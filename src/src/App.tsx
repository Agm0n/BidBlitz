import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import SiteFrame from './SiteFrame'
import AuctionListView from './views/AuctionListView';
import React from 'react';
import AuctionView from './views/AuctionView';

export const SERVER_ADDR = "http://127.0.0.1:3005"

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
    bidHistory: bidHistoryEntry[] | undefined,
    bidCount: number | undefined
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
    // read cookie and decode safely (handles '=' in value)
    const readCookie = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
      if (cookie) {
        const idx = cookie.indexOf('=');
        const raw = cookie.substring(idx + 1);
        try {
          return decodeURIComponent(raw);
        } catch (e) {
          return raw;
        }
      }
      return undefined;
    };

    const [cookieValue, setCookieValue] = React.useState<string | undefined>(readCookie);

  const setCookie = (value: string) => {
    const encoded = encodeURIComponent(value);
    const maxAge = 60 * 60 * 24 * 365; // 1 year in seconds
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${key}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;

    // Update this hook instance
    setCookieValue(value);

    /// Broadcasting to force update the cookie on the selected tabs
    // Broadcast to same-tab listeners
    try {
      const ev = new CustomEvent('cookie-changed', { detail: { key, value } });
      window.dispatchEvent(ev);
    } catch (e) {
      // ignore if CustomEvent isn't available
    }
  };

  // Listen for other hook instances (same-tab via CustomEvent)
  React.useEffect(() => {
    const onCustom = (e: Event) => {
      const ev = e as CustomEvent<{ key: string, value: string }>;
      if (!ev?.detail) return;
      if (ev.detail.key !== key) return;
      setCookieValue(ev.detail.value);
    };

    window.addEventListener('cookie-changed', onCustom as EventListener);

    return () => {
      window.removeEventListener('cookie-changed', onCustom as EventListener);
    };
  }, [key]);

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
