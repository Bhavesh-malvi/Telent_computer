import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import './Reviews.css';
import { StarFilledIcon } from '@radix-ui/react-icons';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';


const sampleReviewsData = [
  {
    id: 1,
    name: 'Sneha prajapati',
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
    stars: 4,
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
    text: `Talent Computer Classes is a great place to learn programming and web development. They provide excellent training in C, C++, Java, HTML, CSS, php,python and DBMS. The instructors explain concepts clearly, making it easy to understand even for beginners. The course content is well-structured, with practical examples and hands-on projects that help students apply what they learn. The learning environment is friendly, and doubts are cleared effectively. Overall, it's a great institute for anyone looking to build strong programming skills.
    So, I have done with courses like c,c++,java,html,DBMS.`,
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
];



// Utility function to calculate review statistics
const calculateReviewStats = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const totalReviews = reviews.length;
  const totalStars = reviews.reduce((sum, review) => sum + review.stars, 0);
  const averageRating = totalStars / totalReviews;

  const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    starDistribution[review.stars] = (starDistribution[review.stars] || 0) + 1;
  });

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    starDistribution
  };
};

function getShortText(text, wordLimit = 15) {
  const words = text.split(' ');
  if (words.length <= wordLimit) return [text, false];
  return [words.slice(0, wordLimit).join(' ') + '...', true];
}

const Reviews = ({ 
  reviewsData = null
}) => {
  const [expanded, setExpanded] = useState([]);
  const [reviews] = useState(reviewsData || sampleReviewsData);



  // Initialize expanded state when reviews data changes
  useEffect(() => {
    setExpanded(Array(reviews.length).fill(false));
  }, [reviews.length]);

  // Calculate review statistics dynamically
  const reviewStats = calculateReviewStats(reviews);

  const handleToggle = idx => {
    setExpanded(expanded => expanded.map((v, i) => (i === idx ? !v : v)));
  };

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    dots: true,
    adaptiveHeight: true,
  };

  // Calculate percentage for each star rating
  const getStarPercentage = (starCount) => {
    if (reviewStats.totalReviews === 0) return 0;
    return (starCount / reviewStats.totalReviews) * 100;
  };

  // Review summary data (dynamic)
  const reviewSummary = (
    <div className="review-summary">
      <div className="review-bars">
        <div className="review-summary-title">
          Review summary
        </div>
        {[5, 4, 3, 2, 1].map((star) => {
          const starCount = reviewStats.starDistribution[star] || 0;
          const percentage = getStarPercentage(starCount);
          return (
            <div className="review-bar-row" key={star}>
              <span className="review-bar-label">{star}</span>
              <div className="review-bar-bg">
                <div 
                  className="review-bar-fill" 
                  style={{
                    width: `${percentage}%`, 
                    background: percentage > 0 ? '#ffc107' : '#eee'
                  }}
                ></div>
              </div>
              <span className="review-bar-count">({starCount})</span>
            </div>
          );
        })}
      </div>
             <div className="review-summary-score-block">
         <div className="review-summary-score">
           {reviewStats.averageRating}
         </div>
         <div className="review-summary-stars">
           {[...Array(5)].map((_, i) => (
             <StarFilledIcon 
               key={i} 
               style={{
                 color: i < Math.floor(reviewStats.averageRating) ? '#ffc107' : '#eee', 
                 fontSize: '1.2rem'
               }} 
             />
           ))}
         </div>
         <div className="review-summary-count">
           {reviewStats.totalReviews} reviews
         </div>
       </div>
    </div>
  );



  return (
    <section className="reviews-section full-width-reviews">
      <h2 className="reviews-title center">What Our Students Say</h2>
      <div className="reviews-2col-layout">
        <div className="reviews-2col-left">
          {reviewSummary}
        </div>
        <div className="reviews-2col-right">
          <div className="reviews-slider-wrapper">
            <Slider {...settings} className="reviews-slider-slick">
              {reviews.map((review, idx) => {
                const [shortText, isLong] = getShortText(review.text);
                return (
                  <div key={review.id || idx}>
                    <div className="featured-review slider-review active">
                      <div className="review-row-flex">
                        <div className="review-column-top">
                          <div className="featured-review-header">
                            {review.profilePhoto ? (
                              <img src={review.profilePhoto} alt={review.name} className="featured-review-avatar-img" />
                            ) : review.avatar && review.avatar.startsWith('http') ? (
                              <img src={review.avatar} alt={review.name} className="featured-review-avatar-img" />
                            ) : (
                              <div className="featured-review-avatar">{review.avatar}</div>
                            )}
                            <div>
                              <div className="featured-review-name">{review.name}</div>
                              <div className="featured-review-meta">{review.meta}</div>
                            </div>
                          </div>
                          <div className="featured-review-stars-date">
                            <div className="featured-review-stars">
                              {[...Array(review.stars)].map((_, i) => <StarFilledIcon key={i} style={{color:'#ffc107', fontSize:'1.1rem'}} />)}
                              {[...Array(5 - review.stars)].map((_, i) => <StarFilledIcon key={i+10} style={{color:'#eee', fontSize:'1.1rem'}} />)}
                            </div>
                            <div className="featured-review-date">{review.date}</div>
                          </div>
                        </div>
                        <div className="review-column-bottom">
                          <div className="featured-review-text">
                            {expanded[idx] || !isLong ? review.text : shortText}
                            {isLong && (
                              <span className="review-more-toggle always-visible" onClick={() => handleToggle(idx)}>
                                {expanded[idx] ? ' Show less' : ' more'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews; 