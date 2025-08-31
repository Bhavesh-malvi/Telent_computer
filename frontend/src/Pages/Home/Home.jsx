import React from "react";
import HomeHeroSection from "../../Components/HomeHeroSection/HomeHeroSection";
import WhyUs from "../../Components/WhyUs/WhyUs";
import FeatureCards from "../../Components/FeatureCards/FeatureCards";
import HomeAboutUs from "../../Components/HomeAboutUs/HomeAboutUs";
import PopularCourses from "../../Components/PopularCourses/PopularCourses";
import Courses from "../../Components/Courses/Courses";
import PopularLanguages from "../../Components/PopularLanguages/PopularLanguages";
import Reviews from "../../Components/Reviews/Reviews";

const Home = () => {
  return(
  <>
    <HomeHeroSection />
    <WhyUs />
    <Reviews 
      reviewsData={[
        {
          id: 1,
          name: 'Sneha Prajapati',
          avatar: 'S',
          meta: '1 review',
          stars: 5,
          date: 'a week ago',
          badge: 'NEW',
          text: `I recently attended TCIT and I must say it was an incredible experience! The instructor was knowledgeable, enthusiastic, and made the subject matter engaging and easy to understand. I highly recommend this class to anyone interested in learning. Great experience!`,
        },
        {
          id: 2,
          name: 'Jatin R. Panchal',
          avatar: 'J',
          meta: '1 review',
          stars: 5,
          date: '4 months ago',
          text: `I've been taking the Full Stack Development course at Talent Computer Classes, and it's been an amazing experience! The instructors are incredibly knowledgeable and patient, always ready to answer questions and guide you through challenging concepts. The curriculum is well-structured, covering both front-end and back-end technologies in great detail. The learning environment is supportive, and I feel motivated to keep improving every day. I highly recommend Talent Computer Classes to anyone looking to dive into full stack development!`,
        },
        {
          id: 3,
          name: 'Ragini Rajput',
          avatar: 'R',
          meta: '2 reviews',
          stars: 5,
          date: 'a month ago',
          text: `I enrolled in the CCC course at a TCIT center to improve my basic computer skills, and it was a great decision. The course covered all the essentials like MS Office, internet usage, email, and digital payments. The instructor explained topics in simple language, and there were regular practical sessions that made learning easier.`,
        },
        {
          id: 4,
          name: 'Vansh Shah',
          avatar: 'V',
          meta: '1 reviews',
          stars: 5,
          date: '4 month ago',
          text: `Talent Computer Classes is a great place to learn programming and web development. They provide excellent training in C, C++, Java, HTML, CSS, php,python and DBMS. The instructors explain concepts clearly, making it easy to understand even for beginners. The course content is well-structured, with practical examples and hands-on projects that help students apply what they learn. The learning environment is friendly, and doubts are cleared effectively. Overall, it's a great institute for anyone looking to build strong programming skills. So, I have done with courses like c,c++,java,html,DBMS.`,
        },
        {
          id: 5,
          name: 'Divya Patel',
          avatar: 'D',
          meta: '2 reviews',
          stars: 5,
          date: '5 month ago',
          text: `I'm coming for web design course. This class was excellent. The instructor was knowledgeable and articulate. This was the first time I have taken a virtual class. my physical space was private and quiet and very conducive to learning! Thank you so much faculty member ✨`,
        },
      ]}
    />
    <FeatureCards />
    <HomeAboutUs />
    <PopularLanguages />
    <Courses />
    <PopularCourses />
  </>
  )
};

export default Home;
