import { useState, useEffect } from 'react';
import { roleService } from '../../services';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Role form state
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
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

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setLoading(true);
      
      if (editingRole) {
        await roleService.updateRole(editingRole._id, {
          name: newRoleName,
          permissionIds: selectedPermissions
        });
        setSuccessMessage('Role updated successfully');
      } else {
        await roleService.createRole({
          name: newRoleName,
          permissionIds: selectedPermissions
        });
        setSuccessMessage('Role created successfully');
      }
      
      resetForm();
      await fetchData(); // refresh roles
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      setLoading(true);
      await roleService.deleteRole(roleId);
      setSuccessMessage('Role deleted successfully');
      if (editingRole?._id === roleId) resetForm();
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setSelectedPermissions(role.permissions.map(p => p._id));
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setNewRoleName('');
    setSelectedPermissions([]);
    setIsCreating(false);
    setEditingRole(null);
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
          onClick={() => {
            if (isCreating) {
              resetForm();
            } else {
              setIsCreating(true);
            }
          }}
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          <form onSubmit={handleSaveRole}>
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
          <div key={role._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 relative group">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditClick(role)}
                className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded"
                title="Edit Role"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button 
                onClick={() => handleDeleteRole(role._id)}
                className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded"
                title="Delete Role"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 pr-12">{role.name}</h3>
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
