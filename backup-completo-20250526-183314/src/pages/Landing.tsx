import { Link } from 'react-router-dom';
import { DownloadButton } from '../components/DownloadButton';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-5xl font-bold mb-8 text-center">
        Optimize Your Gaming Experience
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl text-center mb-12">
        Boost your FPS, reduce latency, and enhance your gaming performance with our advanced optimization tools.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/pricing" 
          className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:from-cyan-400 hover:to-purple-400 transition-all duration-200"
        >
          Get Started Now
          <svg className="ml-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <DownloadButton />
      </div>
    </div>
  );
};