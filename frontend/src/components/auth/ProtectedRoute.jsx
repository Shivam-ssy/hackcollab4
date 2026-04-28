import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { authService } from '../../services';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Check if user is authenticated using authService
  const isAuthenticated = authService.isAuthenticated() && !!user;

  // Show loading indicator while checking authentication status
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based routing
  if (user) {
    const isAdmin = user.role === 'admin' || user.role === 'SUPER_ADMIN';
    const isOrganizer = user.role === 'organizer' || user.role === 'COLLEGE_ADMIN';
    const isSponsor = user.role === 'COMPANY_ADMIN';
    const isStudent = user.role === 'STUDENT' || user.role === 'participant' || !user.role;

    // Allow all authenticated users to access event routes and profile page
    if (location.pathname.includes('/events') || location.pathname.includes('/profile')) {
      return <Outlet />;
    }
    
    // If user is admin and trying to access non-admin routes (except events and profile)
    if (isAdmin && 
        !location.pathname.includes('/admindashboard') && 
        !location.pathname.includes('/events') && 
        !location.pathname.includes('/profile') &&
        !location.pathname.includes('/announcements') &&
        !location.pathname.includes('/leaderboard') &&
        !location.pathname.includes('/settings') &&
        !location.pathname.includes('/system-settings')
      ) {
      return <Navigate to="/admindashboard" replace />;
    }
    
    // If user is organizer and trying to access non-organizer routes (except events and profile)
    if (isOrganizer && 
        !location.pathname.includes('/organizerdashboard') && 
        !location.pathname.includes('/events') && 
        !location.pathname.includes('/profile') &&
        !location.pathname.includes('/announcements') &&
        !location.pathname.includes('/leaderboard') &&
        !location.pathname.includes('/settings')
      ) {
      return <Navigate to="/organizerdashboard" replace />;
    }
    
    // If user is sponsor and trying to access non-sponsor routes
    if (isSponsor && 
        !location.pathname.includes('/sponsordashboard') && 
        !location.pathname.includes('/events') && 
        !location.pathname.includes('/profile')
      ) {
      return <Navigate to="/sponsordashboard" replace />;
    }
    
    // If user is student/participant and trying to access admin or organizer routes
    if (isStudent && 
        (location.pathname.includes('/admindashboard') || 
         location.pathname.includes('/organizerdashboard') ||
         location.pathname.includes('/sponsordashboard'))) {
      return <Navigate to="/home" replace />;
    }
  }

  // Render the protected content
  return <Outlet />;
};

export default ProtectedRoute;