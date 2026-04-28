import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (userRole) => {
    // Redirect based on role
    if (userRole === 'COMPANY_ADMIN') {
      navigate('/sponsordashboard');
    } else if (userRole === 'COLLEGE_ADMIN' || userRole === 'organizer') {
      navigate('/organizerdashboard');
    } else if (userRole === 'SUPER_ADMIN' || userRole === 'admin') {
      navigate('/admindashboard');
    } else {
      navigate('/events'); // students
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/beach2.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 ring-1 ring-white/10">
        <h1 className="text-center text-3xl font-extrabold text-white mb-4 drop-shadow-md">HackCollab</h1>
        <h2 className="text-center text-2xl font-bold text-white drop-shadow-sm">
          Sign in to your account
        </h2>
        <div className="mt-8">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
        <div className="mt-6 text-center border-t border-white/20 pt-4">
          <p className="text-white text-sm drop-shadow-sm">
            Are you a College or Company?{' '}
            <a href="/register-organization" className="font-bold text-blue-200 hover:text-white underline">
              Partner with Us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;