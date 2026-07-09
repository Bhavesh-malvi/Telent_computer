import React from "react";
import HomeHeroSection from "../../Components/HomeHeroSection/HomeHeroSection";
import WhyUs from "../../Components/WhyUs/WhyUs";
import FeatureCards from "../../Components/FeatureCards/FeatureCards";
import HomeAboutUs from "../../Components/HomeAboutUs/HomeAboutUs";
import PopularCourses from "../../Components/PopularCourses/PopularCourses";
import Courses from "../../Components/Courses/Courses";
import PopularLanguages from "../../Components/PopularLanguages/PopularLanguages";
import GoogleReviewsWidget from "../../Components/GoogleReviewsWidget/GoogleReviewsWidget";
import { useSEO } from "../../hooks/useSEO";

const Home = () => {
  useSEO({
    title: "Talent Computer Institute - Best Software Training in Vastral",
    description: "Enroll at Talent Computer Institute (TCIT) Vastral for expert-led software training in Python, MERN Stack, Java, C/C++, and Tally. Practical-oriented coding courses.",
    keywords: "vastral software training, C programming, C++ course, Python training, web development, web design, Tally course, coding for kids, TCIT"
  });

  return(
  <>
    <HomeHeroSection />
    <WhyUs />
    <PopularCourses />
    <Courses />
    <PopularLanguages />
    <GoogleReviewsWidget/>
    <FeatureCards />
    <HomeAboutUs />
  </>
  )
};

export default Home;
