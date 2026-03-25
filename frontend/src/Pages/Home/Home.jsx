import React from "react";
import HomeHeroSection from "../../Components/HomeHeroSection/HomeHeroSection";
import WhyUs from "../../Components/WhyUs/WhyUs";
import FeatureCards from "../../Components/FeatureCards/FeatureCards";
import HomeAboutUs from "../../Components/HomeAboutUs/HomeAboutUs";
import PopularCourses from "../../Components/PopularCourses/PopularCourses";
import Courses from "../../Components/Courses/Courses";
import PopularLanguages from "../../Components/PopularLanguages/PopularLanguages";
import GoogleReviewsWidget from "../../Components/GoogleReviewsWidget/GoogleReviewsWidget";

const Home = () => {
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
