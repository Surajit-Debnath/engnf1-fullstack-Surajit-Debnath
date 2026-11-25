import Navbar from '../components/landingPage/Navbar';
import Hero from '../components/landingPage/Hero';
import Features from '../components/landingPage/Features';
import About from '../components/landingPage/About';
import Resources from '../components/landingPage/Resources';
import Footer from '../components/landingPage/Footer';

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
