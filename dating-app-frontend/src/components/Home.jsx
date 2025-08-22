import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

import HomepageVideo from "../assets/homepage-video.mp4";
import HomepageImage1 from "../assets/homepage-image1.jpg";
import HomepageImage2 from "../assets/homepage-image2.png";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  {
    quote: "I met someone amazing through Ocha, and our first date was unforgettable!",
    name: "Emma",
    city: "Tokyo",
  },
  {
    quote: "Dating in a new country felt scary, but Ocha made it easy.",
    name: "Liam",
    city: "Osaka",
  },
  {
    quote: "Ocha helped me meet people who truly understand my experience abroad.",
    name: "Sophie",
    city: "Kyoto",
  },
];


const Home = () => {
  const {isSignedIn} = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/app")
    }
  }, [isSignedIn, navigate]);

  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        {/* VIDEO */}
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={HomepageVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* HEADER */}
        <div className="fixed inset-x-0 top-0 h-[60px] p-4 flex justify-between items-center z-50">
          <h1 className="text-xl font-bold text-white">Ocha!</h1>
          <div>
            <SignedOut className="flex space-x-4">
              <SignInButton>
                <button className="py-[0.5px] px-2 bg-transparent text-white rounded-full">Login</button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/app/">
                <button className="py-[0.5px] px-2 bg-green-500 text-white rounded-full">Join</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>

        {/* TEXT at bottom */}
        <div className="absolute bottom-[90px] w-full text-center md:text-left md:pl-[50px] text-white text-[45px] font-bold z-50 leading-tight">
        Your Passport to Dating in Japan
        </div>

        <SignedIn>
          <p className="absolute bottom-20 w-full text-center text-white text-lg z-50">
            Redirecting you to the dashboard...
          </p>
        </SignedIn>
      </div>
      {/*SECOND SECTION */}
      <div>
        <div className="mt-[70px] md:mt-[0px] flex flex-col md:flex-row items-start items-center justify-between px-[40px]">
          <h1 className="font-bold text-[30px] pl-[40px]">Find love, one cup at a time.</h1>
          <div className="text-[20px] mt-[50px] md:mt-[200px] md:mr-[100px] text-center w-[500px] text-gray-700">At Ocha, we believe that dating in a new country shouldn’t be intimidating — it should be fun, authentic, and rewarding. Our app is designed specifically for foreigners in Japan, helping you connect with people who understand your experience and share your interests.</div>
        </div>
        <div>
          <div className="w-full md:w-[600px] md:ml-[50px] mt-[30px]">
            <motion.img
              src={HomepageImage1}
              alt="Couple dating in Japan"
              className="w-full md:w-[600px]shadow-lg object-cover md:rounded-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1}}
              viewport={{ once: true, amount: 0.5 }} // triggers when 50% visible
              transition={{ duration: 3 }}
            />
          </div>
        </div>
      </div>
      {/*THIRD SECTION */}
        <div className="bg-black px-6 mt-[70px] pt-[70px] text-center text-white">
          <h2 className="text-[20px] font-bold mb-8">Real Love Stories</h2>
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="!pb-12"
          >
            {testimonials.map((t, index) => (
              <SwiperSlide key={index}>
                <p className="text-xl md:text-[30px] mb-4 italic">"{t.quote}"</p>
                <span className="font-semibold">{t.name}, {t.city}</span>
              </SwiperSlide>
            ))}
          </Swiper>
      </div>
      {/*FORTH SECTION */}
      <div className="bg-transparent mt-[70px] px-6 text-center">
        <h2 className="text-[20px] font-bold mb-8">How it works</h2>
        <div className="flex flex-col md:flex-row items-center md:px-[100px]">
          <div className="w-[350px] md:min-w-[400px]">
            <motion.img
                src={HomepageImage2}
                alt="How it works"
                className="shadow-lg object-cover md:rounded-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1}}
                viewport={{ once: true, amount: 0.5 }} // triggers when 50% visible
                transition={{ duration: 3 }}
              />
          </div>
          <div className="text-[20px] text-gray-700 mt-[50px] md:ml-[20px]">It's a location-aware dating app that helps you discover people nearby, connect with matches in real time, and see how close they are. Find love effortlessly with distance-based suggestions and interactive features designed to make dating fun and easy.</div>
        </div>

      </div>
      {/*FIFTH SECTION */}
      <div className="bg-black mt-[70px] px-6 text-center py-20 flex flex-col items-center">
        <h2 className="py-[30px] text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Find Your Match?
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <SignUpButton>
            <button className="w-[200px] px-6 py-3 bg-white text-green-900 font-bold rounded-full hover:bg-gray-100 transition">
              Join Now
            </button>
          </SignUpButton>
          <SignInButton>
            <button className="w-[200px] px-6 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-green-900 transition">
              Login
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
};

export default Home;
