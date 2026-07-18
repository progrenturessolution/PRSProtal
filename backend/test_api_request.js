const http = require('http');

const postData = JSON.stringify({
  email: 'admin@progrentures.com',
  password: 'PRSPortal@2026',
  role: 'admin'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const responseObj = JSON.parse(data);
      console.log('Login Response:', responseObj.success ? 'SUCCESS' : 'FAILED');
      if (!responseObj.success) {
        console.log('Error payload:', responseObj);
        process.exit(1);
      }
      
      const token = responseObj.token;
      console.log('Obtained Token successfully');
      
      // Let's first fetch all groups to find a valid group ID if the hardcoded one doesn't exist
      const groupsOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/groups',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const groupsReq = http.request(groupsOptions, (groupsRes) => {
        let groupsData = '';
        groupsRes.on('data', (chunk) => { groupsData += chunk; });
        groupsRes.on('end', () => {
          try {
            const groupsResponse = JSON.parse(groupsData);
            if (!groupsResponse.success) {
              console.error('Failed to fetch groups:', groupsResponse);
              process.exit(1);
            }
            const groupsList = groupsResponse.groups || [];
            console.log('Total groups fetched:', groupsList.length);
            if (groupsList.length === 0) {
              console.log('No groups in DB');
              process.exit(0);
            }
            
            const targetGroupId = groupsList[0]._id;
            console.log('Requesting group details for group ID:', targetGroupId);
            
            const detailsOptions = {
              hostname: 'localhost',
              port: 5000,
              path: `/api/admin/groups/${targetGroupId}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            };
            
            const detailsReq = http.request(detailsOptions, (detailsRes) => {
              let detailsData = '';
              detailsRes.on('data', (chunk) => { detailsData += chunk; });
              detailsRes.on('end', () => {
                try {
                  const detailsResponse = JSON.parse(detailsData);
                  console.log('Details API Status Code:', detailsRes.statusCode);
                  console.log('Details API success:', detailsResponse.success);
                  if (detailsResponse.success) {
                    console.log('Details payload keys:', Object.keys(detailsResponse.group));
                    console.log('Students count:', detailsResponse.group.students.length);
                    if (detailsResponse.group.students.length > 0) {
                      console.log('First student sample:', detailsResponse.group.students[0]);
                    }
                  } else {
                    console.log('Error payload:', detailsResponse);
                  }
                  process.exit(0);
                } catch (e) {
                  console.error('Failed to parse details response:', e);
                  console.log('Raw details response:', detailsData);
                  process.exit(1);
                }
              });
            });
            detailsReq.on('error', (e) => {
              console.error('Details API request error:', e);
              process.exit(1);
            });
            detailsReq.end();
            
          } catch (e) {
            console.error('Failed to parse groups list response:', e);
            process.exit(1);
          }
        });
      });
      groupsReq.on('error', (e) => {
        console.error('Groups API request error:', e);
        process.exit(1);
      });
      groupsReq.end();
      
    } catch (e) {
      console.error('Failed to parse login response:', e);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Login request error:', e);
  process.exit(1);
});

req.write(postData);
req.end();
