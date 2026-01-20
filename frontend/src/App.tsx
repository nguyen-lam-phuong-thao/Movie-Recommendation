import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
