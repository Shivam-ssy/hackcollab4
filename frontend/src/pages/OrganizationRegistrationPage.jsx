import { useNavigate } from 'react-router-dom';
import OrganizationRegisterForm from '../components/auth/OrganizationRegisterForm';

const OrganizationRegistrationPage = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/login', { state: { message: 'Organization registration successful! Please log in as the admin.' } });
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
        <h1 className="text-center text-3xl font-extrabold text-blue-600 mb-4">HackCollab</h1>
        <h2 className="text-center text-2xl font-bold text-gray-800">
          Partner with Us
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 mb-8">
          Register your College to organize hackathons, or your Company to sponsor them.
        </p>
        <OrganizationRegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
};

export default OrganizationRegistrationPage;
