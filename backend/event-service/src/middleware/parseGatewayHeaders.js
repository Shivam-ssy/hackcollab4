const parseGatewayHeaders = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const collegeId = req.headers['x-college-id'];
  const role = req.headers['x-user-role'];
  const permissionsHeader = req.headers['x-permissions'];

  if (userId) {
    req.user = {
      userId,
      collegeId: collegeId !== 'undefined' ? collegeId : null,
      role,
      permissions: permissionsHeader ? JSON.parse(permissionsHeader) : []
    };
  }

  next();
};

module.exports = parseGatewayHeaders;
