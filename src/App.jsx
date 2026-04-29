import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import BusinessDetails from './pages/BusinessDetails';

import About from './pages/About';
import Careers from './pages/Careers';
import Press from './pages/Press';
import InvestorRelations from './pages/InvestorRelations';
import TrustSafety from './pages/TrustSafety';

import CostGuides from './pages/CostGuides';
import Collections from './pages/Collections';
import Talk from './pages/Talk';
import Events from './pages/Events';
import Blog from './pages/Blog';

import ClaimBusiness from './pages/ClaimBusiness';
import Advertise from './pages/Advertise';
import RestaurantOwners from './pages/RestaurantOwners';
import SuccessStories from './pages/SuccessStories';
import BusinessSupport from './pages/BusinessSupport';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/biz/:id" element={<BusinessDetails />} />
          
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/investor-relations" element={<InvestorRelations />} />
          <Route path="/trust-safety" element={<TrustSafety />} />
          
          <Route path="/cost-guides" element={<CostGuides />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/talk" element={<Talk />} />
          <Route path="/events" element={<Events />} />
          <Route path="/blog" element={<Blog />} />
          
          <Route path="/claim-business" element={<ClaimBusiness />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/restaurant-owners" element={<RestaurantOwners />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/business-support" element={<BusinessSupport />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
