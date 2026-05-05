import { useState, useEffect } from 'react';
import { roleService } from '../../services';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // New role form state
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setLoading(true);
      await roleService.createRole({
        name: newRoleName,
        permissionIds: selectedPermissions
      });
      setSuccessMessage('Role created successfully');
      setNewRoleName('');
      setSelectedPermissions([]);
      setIsCreating(false);
      await fetchData(); // refresh roles
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Role & Permission Management</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          {isCreating ? 'Cancel' : 'Create New Role'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Role</h3>
          <form onSubmit={handleCreateRole}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Role Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., MODERATOR"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4 rounded-md border border-gray-200 h-48 overflow-y-auto">
                {permissions.map(perm => (
                  <label key={perm._id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-purple-600 rounded"
                      checked={selectedPermissions.includes(perm._id)}
                      onChange={() => togglePermission(perm._id)}
                    />
                    <span className="text-sm text-gray-700">{perm.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md transition-colors font-medium"
                disabled={loading || !newRoleName.trim()}
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{role.name}</h3>
            {role.collegeId && (
              <p className="text-xs text-gray-500 mb-3 bg-gray-100 inline-block px-2 py-1 rounded">
                College-Specific
              </p>
            )}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Permissions ({role.permissions.length})</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                {role.permissions.map(perm => (
                  <span key={perm._id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-md">
                    {perm.name}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleManagement;
