import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import SiteFrame from './SiteFrame'
import AuctionListView from './views/AuctionListView';

function App() {
  document.body.className = 'light';

  return (
    <>
      <SiteFrame>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuctionListView />} />
          </Routes>
        </BrowserRouter>  
      </SiteFrame>
    </>
  )
}

export default App
