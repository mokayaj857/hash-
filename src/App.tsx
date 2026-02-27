import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Hero from "./Components/Hero";
import Home from "./Components/Home";
import Header from "./Components/Header";
import Nav from "./Components/Nav";
import Scroll from "./Components/scroll";
import White from "./Components/white";
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Qrcode under Testimonials */}
        <Route path="hero" element={<Hero />} /> 
        <Route path="/" element={<Home />} />
        <Route path="nav" element={<Nav />} />
        <Route path="white" element={<White />} />
        <Route path="header" element={<Header />} />
        <Route path="scroll" element={<Scroll />} />
        {/* <Route path="weather" element={<Weather />} /> */}
        {/* <Route path="kenya" element={<Kenya />} /> */}
        {/* <Route path="home" element={<Home />} /> */}
        {/* <Route path="chatbot" element={<Chatbot />} /> */} 
      </Routes>   
    </Router>
  );
};

export default App;