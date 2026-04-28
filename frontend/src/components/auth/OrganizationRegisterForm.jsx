import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';

const OrganizationRegisterForm = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [orgType, setOrgType] = useState('college'); // 'college' or 'company'
  const [showPayment, setShowPayment] = useState(false);
  const [formDataCache, setFormDataCache] = useState(null);

  const registerSchema = Yup.object().shape({
    orgName: Yup.string().required('Organization name is required').min(2, 'Must be at least 2 characters'),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required').min(8, 'Must be at least 8 characters'),
    confirmPassword: Yup.string().required('Please confirm your password').oneOf([Yup.ref('password')], 'Passwords must match'),
    website: Yup.string().url('Must be a valid URL'),
    industry: Yup.string()
  });

  const formik = useFormik({
    initialValues: {
      orgName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      website: '',
      industry: ''
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      // Show payment mock
      setFormDataCache(values);
      setShowPayment(true);
    },
  });

  const handleMockPayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { confirmPassword: _confirmPassword, ...data } = formDataCache;
      
      if (orgType === 'college') {
        await authService.registerCollege(data);
      } else {
        await authService.registerCompany(data);
      }
      
      setSuccessMsg('Registration and payment successful! You can now log in.');
      setShowPayment(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setShowPayment(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (showPayment) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">Complete Registration</h3>
        <p className="text-white mb-6">Subscription Fee: $500.00 / year</p>
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-600 mb-2">Payment Simulation (Test Mode)</p>
          <p className="text-xs text-gray-500">Click below to simulate a successful Stripe payment and complete tenant registration.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPayment(false)}
            className="w-1/3 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleMockPayment}
            className="w-2/3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Pay & Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">{successMsg}</span>
        </div>
      )}

      <div className="flex mb-6 border-b border-gray-300">
        <button
          className={`flex-1 py-2 font-bold text-center ${orgType === 'college' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
          onClick={() => setOrgType('college')}
          type="button"
        >
          College
        </button>
        <button
          className={`flex-1 py-2 font-bold text-center ${orgType === 'company' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
          onClick={() => setOrgType('company')}
          type="button"
        >
          Company (Sponsor)
        </button>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {orgType === 'college' ? 'College/University Name' : 'Company Name'}
          </label>
          <input
            type="text"
            name="orgName"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.orgName && formik.errors.orgName ? "border-red-500" : "border-gray-300"}`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.orgName}
            disabled={isLoading}
          />
          {formik.touched.orgName && formik.errors.orgName && <p className="text-red-500 text-xs mt-1">{formik.errors.orgName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admin First Name</label>
            <input
              type="text"
              name="firstName"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.firstName && formik.errors.firstName ? "border-red-500" : "border-gray-300"}`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.firstName}
              disabled={isLoading}
            />
            {formik.touched.firstName && formik.errors.firstName && <p className="text-red-500 text-xs mt-1">{formik.errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Admin Last Name</label>
            <input
              type="text"
              name="lastName"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.lastName && formik.errors.lastName ? "border-red-500" : "border-gray-300"}`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.lastName}
              disabled={isLoading}
            />
            {formik.touched.lastName && formik.errors.lastName && <p className="text-red-500 text-xs mt-1">{formik.errors.lastName}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Work Email Address</label>
          <input
            type="email"
            name="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"}`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            disabled={isLoading}
          />
          {formik.touched.email && formik.errors.email && <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>}
        </div>

        {orgType === 'company' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Website (Optional)</label>
              <input
                type="text"
                name="website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.website}
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Industry (Optional)</label>
              <input
                type="text"
                name="industry"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.industry}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            name="password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"}`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            disabled={isLoading}
          />
          {formik.touched.password && formik.errors.password && <p className="text-red-500 text-xs mt-1">{formik.errors.password}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.confirmPassword}
            disabled={isLoading}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 disabled:opacity-50"
          disabled={isLoading}
        >
          Proceed to Payment
        </button>
      </form>
    </div>
  );
};

export default OrganizationRegisterForm;
