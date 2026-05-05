import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { eventService, collegeService, paymentService } from '../services';

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myCollege, setMyCollege] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Redirect if user is not an organizer
  useEffect(() => {
    const isOrganizer = user?.role === 'organizer' || user?.role === 'COLLEGE_ADMIN';
    if (user && !isOrganizer) {
      navigate('/home');
    }
  }, [user, navigate]);
  
  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch college info if user is a college admin
        if (user?.role === 'COLLEGE_ADMIN') {
          try {
            const collegeData = await collegeService.getMyCollege();
            setMyCollege(collegeData);
          } catch (err) {
            console.error('Failed to fetch college:', err);
          }
        }

        // Get all events and filter by the current organizer
        const allEvents = await eventService.getAllEvents();
        const organizerEvents = allEvents.data ? allEvents.data.filter(event => 
          event.createdBy === user.id || event.collegeId === user.collegeId
        ) : allEvents.filter(event => 
          event.createdBy === user.id || event.collegeId === user.collegeId
        );
        
        // Sort events by date (upcoming first)
        organizerEvents.sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date));
        
        setEvents(organizerEvents);

        // Fetch precise stats from backend
        try {
          const statsData = await eventService.getOrganizerStats();
          setStats(statsData);
        } catch (statErr) {
          console.error('Failed to fetch organizer stats:', statErr);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      const orderData = await paymentService.createOrder();
      
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'HackCollab',
        description: 'College Subscription Payment',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            await paymentService.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            // Update local state to hide banner
            setMyCollege({ ...myCollege, paymentStatus: 'COMPLETED' });
            alert('Payment successful!');
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
        },
        theme: {
          color: '#059669' // green-600
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        console.error('Payment failed', response.error);
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error('Payment initiation failed:', err);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-green-600 to-teal-700 px-6 py-4">
          <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
        </div>
        <div className="p-6">
          <p className="text-lg text-gray-700 mb-6">Welcome to the organizer dashboard, {user?.firstName || 'Organizer'}!</p>
          
          {myCollege && (myCollege.paymentStatus === 'PENDING' || myCollege.paymentStatus === 'FAILED') && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-md shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-yellow-800">Subscription Payment Required</h3>
                  <p className="text-yellow-700 mt-1">Your college subscription payment is pending. You need to complete the payment of ₹499 to activate your account fully.</p>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded shadow transition-colors"
                >
                  {paymentLoading ? 'Processing...' : 'Pay ₹499'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Event Card */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Create Event</h2>
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Create a new event, set up registration, and publish it to participants.</p>
              <Link to="/events/create" className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-300">
                Create New Event
              </Link>
            </div>

            {/* Manage Events Card */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">My Events</h2>
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-4">View and manage your created events, track registrations, and update details.</p>
              <Link to="/events" className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300">
                Manage Events
              </Link>
            </div>

            {/* Announcements Card */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Create and send announcements to event participants and keep them updated.</p>
              <Link to="/announcements/create" className="inline-block bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition duration-300">
                Create Announcement
              </Link>
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Upcoming Events</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white shadow sm:rounded-md p-6 text-center">
                <p className="text-gray-500">You haven't created any events yet.</p>
                <Link to="/events/create" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                  Create your first event
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {events.map(event => {
                    // Determine event status
                    const eventDate = new Date(event.startDate || event.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset time to start of day
                    
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    let status = '';
                    let statusClass = '';
                    
                    if (eventDate < today) {
                      status = 'Completed';
                      statusClass = 'bg-gray-100 text-gray-800';
                    } else if (eventDate >= today && eventDate < tomorrow) {
                      status = 'Active';
                      statusClass = 'bg-green-100 text-green-800';
                    } else {
                      status = 'Upcoming';
                      statusClass = 'bg-yellow-100 text-yellow-800';
                    }
                    
                    // Format date
                    const formattedDate = new Date(event.startDate || event.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    
                    return (
                      <li key={event._id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-indigo-600">{event.title}</p>
                            <div className="ml-2 flex flex-shrink-0">
                              <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusClass}`}>
                                {status}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                {event.location}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <p>{formattedDate}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-3">
                            <Link to={`/events/${event._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-3 py-1 rounded">
                              View details
                            </Link>
                            <Link to={`/events/${event._id}/submissions`} className="text-sm font-medium text-green-600 hover:text-green-500 bg-green-50 px-3 py-1 rounded">
                              Manage Submissions & Teams
                            </Link>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Event Statistics */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Event Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
                <p className="text-green-500 text-sm">{stats.totalEvents > 0 ? `${stats.totalEvents} events created` : 'No events yet'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-gray-500 text-sm font-medium">Registrations</h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalRegistrations}
                </p>
                <p className="text-green-500 text-sm">Total registrations</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center border-t-4 border-green-500">
                <h3 className="text-gray-500 text-sm font-medium">Hackathon Revenue</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${stats.revenue}
                </p>
                <p className="text-gray-500 text-sm">From registration fees</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-gray-500 text-sm font-medium">Active Events</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.activeEvents}
                </p>
                <p className="text-green-500 text-sm">Events happening today</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center md:col-span-4 lg:col-span-1 lg:mt-0 lg:ml-auto lg:mr-auto">
                <h3 className="text-gray-500 text-sm font-medium">Upcoming Events</h3>
                <p className="text-3xl font-bold text-teal-600">
                  {stats.upcomingEvents}
                </p>
                <p className="text-gray-500 text-sm">Future events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;