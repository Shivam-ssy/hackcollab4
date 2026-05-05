import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { UserManagement, CollegeManagement, RoleManagement } from '../components/admin';
import { adminService, eventService } from '../services';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalColleges: 0,
    totalCompanies: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    registrations: 0,
    platformRevenue: 0,
    systemHealth: '99.8%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if user is not an admin
  useEffect(() => {
    const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN';
    if (user && !isAdmin) {
      navigate('/home');
    }
  }, [user, navigate]);
  
  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN';
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        
        // Fetch users and calculate role-based counts
        const usersData = await adminService.getAllUsers();
        const allUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);
        const totalUsers = allUsers.length;
        const totalColleges = allUsers.filter(u => u.role === 'COLLEGE_ADMIN' || u.role === 'organizer').length;
        const totalCompanies = allUsers.filter(u => u.role === 'COMPANY_ADMIN').length;
        
        // Fetch events stats
        try {
          const statsData = await eventService.getAdminEventStats();
          const { activeEvents, upcomingEvents, totalRegistrations, revenue } = statsData;

          // Mock Platform Revenue: $499 per college + $299 per company + 5% of all registrations
          const collegeRevenue = totalColleges * 499;
          const companyRevenue = totalCompanies * 299;
          const platformCut = revenue * 0.05;
          
          setStats({
            totalUsers,
            totalColleges,
            totalCompanies,
            activeEvents,
            upcomingEvents,
            registrations: totalRegistrations,
            platformRevenue: Math.floor(collegeRevenue + companyRevenue + platformCut),
            systemHealth: '99.8%'
          });
        } catch (statsErr) {
          console.error('Failed to fetch admin stats', statsErr);
          // Fallback to basic stats if the endpoint fails
          setStats({
            totalUsers,
            totalColleges,
            totalCompanies,
            activeEvents: 0,
            upcomingEvents: 0,
            registrations: 0,
            platformRevenue: Math.floor(totalColleges * 499 + totalCompanies * 299),
            systemHealth: '99.8%'
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError('Failed to load platform statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user]);

  return (
    <div className="pb-12">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-800 px-6 py-4">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <div className="p-6">
          <p className="text-lg text-gray-700 mb-6">Welcome to the admin dashboard, {user?.firstName || 'Admin'}!</p>
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-6 font-medium text-sm focus:outline-none ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-6 font-medium text-sm focus:outline-none ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('colleges')}
              className={`py-2 px-6 font-medium text-sm focus:outline-none ${
                activeTab === 'colleges'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Colleges
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-6 font-medium text-sm focus:outline-none ${
                activeTab === 'roles'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Roles & Permissions
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Management Card */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">Manage users, roles, and permissions across the platform.</p>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300"
                    onClick={() => setActiveTab('users')}
                  >
                    Manage Users
                  </button>
                </div>

                {/* Event Management Card */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Event Management</h2>
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">Review and approve events, manage categories, and monitor event metrics.</p>
                  <Link to="/events" className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-300">
                    Manage Events
                  </Link>
                </div>

                {/* System Settings Card */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">Configure system settings, manage integrations, and monitor platform health.</p>
                  <Link to="/system-settings" className="inline-block bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition duration-300">
                    System Settings
                  </Link>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Analytics</h2>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-blue-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Total Users</h3>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-indigo-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Colleges</h3>
                        <p className="text-2xl font-bold text-indigo-600">{stats.totalColleges}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-pink-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Companies</h3>
                        <p className="text-2xl font-bold text-pink-600">{stats.totalCompanies}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-green-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Active</h3>
                        <p className="text-2xl font-bold text-green-600">{stats.activeEvents}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-yellow-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Upcoming</h3>
                        <p className="text-2xl font-bold text-yellow-600">{stats.upcomingEvents}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-purple-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Registrations</h3>
                        <p className="text-2xl font-bold text-purple-600">{stats.registrations}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border-b-4 border-emerald-500">
                        <h3 className="text-gray-500 text-xs font-medium uppercase">Platform Rev</h3>
                        <p className="text-2xl font-bold text-emerald-600">${stats.platformRevenue}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="mt-4">
              <UserManagement />
            </div>
          )}

          {activeTab === 'colleges' && (
            <div className="mt-4">
              <CollegeManagement />
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="mt-4">
              <RoleManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;