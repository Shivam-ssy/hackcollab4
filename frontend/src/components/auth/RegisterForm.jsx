import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import authService from '../../services/authService';

const RegisterForm = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [step, setStep] = useState(1);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const { register, googleLogin, sendVerificationOtp, verifyEmail } = useAuth();
  const [showCollegePrompt, setShowCollegePrompt] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [googleIdToken, setGoogleIdToken] = useState(null);
  const [collegeInput, setCollegeInput] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [googleProfile, setGoogleProfile] = useState(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const data = await authService.getColleges();
        setColleges(data);
      } catch (err) {
        console.error('Failed to fetch colleges', err);
      }
    };
    fetchColleges();
  }, []);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const registerSchema = Yup.object().shape({
    firstName: Yup.string()
      .trim()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name too long')
      .matches(/^[A-Za-z]+$/, 'Only alphabets are allowed'),

    lastName: Yup.string()
      .trim()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name too long')
      .matches(/^[A-Za-z]+$/, 'Only alphabets are allowed'),

    email: Yup.string()
      .trim()
      .lowercase()
      .email('Invalid email address')
      .required('Email is required')
      .max(100, 'Email too long')
      .matches(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email format is invalid'
      ),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
    collegeId: Yup.string().required('Please select a college'),
    acceptTerms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      collegeId: '',
      acceptTerms: false
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);

      try {
        // Remove confirmPassword and acceptTerms from the data sent to the API
        const { confirmPassword: _confirmPassword, acceptTerms: _acceptTerms, ...registrationData } = values;

        // Call the register function from AuthContext
        await register(registrationData);

        // After registration, move to OTP step
        setRegisteredEmail(registrationData.email);
        await sendVerificationOtp(registrationData.email);
        setStep(2);
        setSuccessMsg('Account created! Please check your email for the OTP.');
      } catch (err) {
        setError(err.message || 'Failed to register. Please try again.');
        console.error('Registration error:', err);
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Google signup handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const idToken = credentialResponse.credential;
      const response = await googleLogin(idToken);
      if (response.needCollege) {
        setShowCollegePrompt(true);
        setGoogleIdToken(idToken);
        setGoogleProfile(response.googleProfile);
      } else if (response.success) {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Google signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await googleLogin(googleIdToken, collegeInput);
      if (response.success) {
        setShowCollegePrompt(false);
        setGoogleIdToken(null);
        setGoogleProfile(null);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Google signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await verifyEmail(registeredEmail, otpToken);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendVerificationOtp(registeredEmail);
      setSuccessMsg('OTP resent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Title moved to parent component */}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <>
          <form onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.firstName && formik.errors.firstName
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200"
                    }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.firstName}
                  disabled={isLoading}
                />
                {formik.touched.firstName && formik.errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {formik.errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.lastName && formik.errors.lastName
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200"
                    }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.lastName}
                  disabled={isLoading}
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {formik.errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
                  }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={isLoading}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="collegeId"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                College/University
              </label>
              <select
                id="collegeId"
                name="collegeId"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white ${formik.touched.collegeId && formik.errors.collegeId
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
                  }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.collegeId}
                disabled={isLoading || colleges.length === 0}
              >
                <option value="" disabled>
                  {colleges.length === 0 ? "Loading colleges..." : "Select your college"}
                </option>
                {colleges.map((col) => (
                  <option key={col._id} value={col._id}>
                    {col.name}
                  </option>
                ))}
              </select>
              {formik.touched.collegeId && formik.errors.collegeId && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.collegeId}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.password && formik.errors.password
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
                  }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                disabled={isLoading}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
                  }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={isLoading}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  name="acceptTerms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  checked={formik.values.acceptTerms}
                  disabled={isLoading}
                />
                <label
                  htmlFor="acceptTerms"
                  className="ml-2 block text-sm text-gray-700"
                >
                  I accept the{" "}
                  <a href="#" className="text-yellow-300 hover:text-yellow-800">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-yellow-300 hover:text-yellow-600">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {formik.touched.acceptTerms && formik.errors.acceptTerms && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.acceptTerms}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex justify-center items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="flex justify-center mt-6">
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                useOneTap // Optional
              />
            </GoogleOAuthProvider>
          </div>

          {showCollegePrompt && (
            <form onSubmit={handleCollegeSubmit} className="mt-4">
              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  College/University Name
                </label>
                <input
                  type="text"
                  value={collegeInput}
                  onChange={(e) => setCollegeInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mt-2"
              >
                Submit
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="mt-4">
          <p className="text-white text-center mb-4 text-sm font-medium">An OTP has been sent to {registeredEmail}.</p>
          <form onSubmit={handleOtpSubmit}>
            <input
              type="text"
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200 text-center text-lg tracking-widest font-bold"
              required
              maxLength={6}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mt-4 font-bold disabled:bg-blue-400"
              disabled={isLoading || otpToken.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-blue-100 py-2 px-4 hover:text-white mt-2 underline text-sm"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;