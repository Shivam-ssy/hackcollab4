import { useState, useEffect } from 'react';
import { adminService, roleService } from '../../services';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, rolesData] = await Promise.all([
          adminService.getAllUsers(),
          roleService.getRoles()
        ]);
        setUsers(usersResponse.data);
        setFilteredUsers(usersResponse.data);
        setAvailableRoles(rolesData);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      return fullName.includes(lowercasedSearch) || email.includes(lowercasedSearch);
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      setRoleUpdateLoading(true);
      await adminService.updateUserRole(userId, newRole);
      
      // Update the user in the local state
      const updatedRoleObj = availableRoles.find(r => r._id === newRole);
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, roleId: updatedRoleObj, role: updatedRoleObj ? updatedRoleObj.name : user.role } : user
      ));
      
      setSuccessMessage(`User role updated successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setRoleUpdateLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
      
      {/* Search input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found matching your search criteria.
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Email</th>
                  <th className="py-3 px-6 text-left">College</th>
                  <th className="py-3 px-6 text-left">Current Role</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {filteredUsers.map(user => (
                <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-3 px-6 text-left">{user.email}</td>
                  <td className="py-3 px-6 text-left">{user.college}</td>
                  <td className="py-3 px-6 text-left">
                    <span className={`py-1 px-3 rounded-full text-xs bg-gray-200 text-gray-800`}>
                      {user.roleId?.name || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <select 
                        className="border rounded px-2 py-1 text-sm"
                        value={user.roleId?._id || ''}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={roleUpdateLoading}
                      >
                        <option value="">Select Role</option>
                        {availableRoles.map(role => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;