import { useEffect } from "react";

const GoogleReviewsWidget = () => {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div style={{ width: "100%" }} className="mt-20">
        <h2 className="text-center text-[2rem] font-semibold text-[#232a36] ">What Our Students Say</h2>
        <div className="elfsight-app-38659169-dc15-4ad8-8774-3605d165c4dc" data-elfsight-app-lazy></div>
    </div>
  );
};

export default GoogleReviewsWidget;
