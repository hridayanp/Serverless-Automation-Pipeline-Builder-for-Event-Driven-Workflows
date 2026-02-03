import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  const hasAccessToken = localStorage.getItem('access_token') !== null;
  const hasRefreshToken = localStorage.getItem('refresh_token') !== null;

  return (
    <div className="flex items-center justify-center absolute top-[40%] left-[5%]">
      <div className="text-center space-y-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-[#1a3b68]">
          404 | Page Not Found
        </h1>
        <p className="text-lg text-center w-[60%] font-semibold text-[#1a3b68]">
          The page you are looking for does not exist. You may have mistyped the
          address or the page may have moved.
        </p>
        <Button
          onClick={() => {
            if (hasAccessToken || hasRefreshToken) {
              // At least one of the tokens is present
              console.log('Access token or refresh token is present.');
              localStorage.clear();
              navigate('/');
            } else {
              // Neither token is present
              navigate('/');
            }
          }}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
