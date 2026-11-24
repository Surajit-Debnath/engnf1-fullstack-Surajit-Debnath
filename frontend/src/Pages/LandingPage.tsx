import Navbar from "../components/LandingPage/Navbar";
import Hero from "../components/LandingPage/Hero";
import Features from "../components/LandingPage/Features";
import About from "../components/LandingPage/About";
import Resources from "../components/LandingPage/Resources";
import Footer from "../components/LandingPage/Footer";

const LandingPage = () => {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Features />
        <About />
        <Resources />
      </main>

      <Footer />
    </>
  );
};

export default LandingPage;