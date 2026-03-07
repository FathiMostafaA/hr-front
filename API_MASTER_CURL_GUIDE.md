# 🚀 HR SYSTEM: THE COMPLETE API MASTER GUIDE (cURL)
**Base URL:** `http://localhost:8080` (Docker) or `http://localhost:5094` (Local)

All endpoints requiring authorization must include the header: `-H "Authorization: Bearer <TOKEN>"`

---

## 🔐 1. Authentication & Session (`AuthController`)

**1.1 Login**
- **Endpoint:** `POST /api/Auth/login`
- **Description:** Returns JWT token and basic user info.
```bash
curl -X POST 'http://localhost:8080/api/Auth/login' \
-H 'Content-Type: application/json' \
-d '{
  "email": "admin@hr.com",
  "password": "AdminPassword123"
}'
```

**1.2 Register**
- **Endpoint:** `POST /api/Auth/register`
- **Description:** Registers a new user with the default "Employee" role.
```bash
curl -X POST 'http://localhost:8080/api/Auth/register' \
-H 'Content-Type: application/json' \
-d '{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!"
}'
```

**1.3 Refresh Token**
- **Endpoint:** `POST /api/Auth/refresh`
```bash
curl -X POST 'http://localhost:8080/api/Auth/refresh' \
-H 'Content-Type: application/json' \
-d '"<REFRESH_TOKEN_STRING>"'
```

**1.4 Logout**
- **Endpoint:** `POST /api/Auth/logout`
```bash
curl -X POST 'http://localhost:8080/api/Auth/logout' -H 'Authorization: Bearer <TOKEN>'
```

---

## 📊 2. Dashboard, Analytics & Reports

**2.1 Dashboard Stats (Basic Summary)**
- **Endpoint:** `GET /api/Dashboard/stats`
```bash
curl -X GET 'http://localhost:8080/api/Dashboard/stats' -H 'Authorization: Bearer <TOKEN>'
```

**2.2 Comprehensive Dashboard Analytics**
- **Endpoint:** `GET /api/Analytics/dashboard`
```bash
curl -X GET 'http://localhost:8080/api/Analytics/dashboard' -H 'Authorization: Bearer <TOKEN>'
```

**2.3 Attendance Trends**
- **Endpoint:** `GET /api/Analytics/attendance`
```bash
curl -X GET 'http://localhost:8080/api/Analytics/attendance?from=2024-01-01&to=2024-12-31' -H 'Authorization: Bearer <TOKEN>'
```

**2.4 Payroll Analytics**
- **Endpoint:** `GET /api/Analytics/payroll/{year}/{month}`
```bash
curl -X GET 'http://localhost:8080/api/Analytics/payroll/2024/10' -H 'Authorization: Bearer <TOKEN>'
```

**2.5 Employee Demographics**
- **Endpoint:** `GET /api/Analytics/demographics`
```bash
curl -X GET 'http://localhost:8080/api/Analytics/demographics' -H 'Authorization: Bearer <TOKEN>'
```

**2.6 Reports: Employee Summary**
- **Endpoint:** `GET /api/Reports/employees`
```bash
curl -X GET 'http://localhost:8080/api/Reports/employees' -H 'Authorization: Bearer <TOKEN>'
```

**2.7 Reports: Leave Usage**
- **Endpoint:** `GET /api/Reports/leaves`
```bash
curl -X GET 'http://localhost:8080/api/Reports/leaves?from=2024-01-01&to=2024-12-31' -H 'Authorization: Bearer <TOKEN>'
```

**2.8 Reports: Financial Payroll Summary**
- **Endpoint:** `GET /api/Reports/payroll/{year}/{month}`
```bash
curl -X GET 'http://localhost:8080/api/Reports/payroll/2024/10' -H 'Authorization: Bearer <TOKEN>'
```

---

## 👥 3. Employee Management (`EmployeesController`)

**3.1 List All Employees**
- **Endpoint:** `GET /api/Employees`
```bash
curl -X GET 'http://localhost:8080/api/Employees' -H 'Authorization: Bearer <TOKEN>'
```

**3.2 Get Employee By ID**
- **Endpoint:** `GET /api/Employees/{id}`
```bash
curl -X GET 'http://localhost:8080/api/Employees/<ID>' -H 'Authorization: Bearer <TOKEN>'
```

**3.3 Create New Employee**
- **Endpoint:** `POST /api/Employees`
```bash
curl -X POST 'http://localhost:8080/api/Employees' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "email": "ahmed.ali@hr.com",
  "phone": "+201010101010",
  "dateOfBirth": "1995-05-15",
  "gender": "Male",
  "address": "Maadi, Cairo",
  "city": "Cairo",
  "country": "Egypt",
  "postalCode": "12345",
  "departmentId": "<DEPT_ID>",
  "jobTitle": "DevOps Engineer",
  "hireDate": "2024-02-01T00:00:00Z",
  "employmentTypeStr": "FullTime",
  "baseSalary": 4500,
  "currency": "USD"
}'
```

**3.4 Update Employee**
- **Endpoint:** `PUT /api/Employees/{id}`
```bash
curl -X PUT 'http://localhost:8080/api/Employees/<ID>' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "jobTitle": "Senior DevOps",
  "baseSalary": 5500,
  "employmentStatus": "Active"
}'
```

**3.5 Delete Employee (Admin Only)**
- **Endpoint:** `DELETE /api/Employees/{id}`
```bash
curl -X DELETE 'http://localhost:8080/api/Employees/<ID>' -H 'Authorization: Bearer <TOKEN>'
```

**3.6 Search Employees**
- **Endpoint:** `GET /api/Employees/search`
```bash
curl -X GET 'http://localhost:8080/api/Employees/search?term=Ahmed' -H 'Authorization: Bearer <TOKEN>'
```

---

## 🏢 4. Departments (`DepartmentsController`)

**4.1 All Departments**
- **Endpoint:** `GET /api/Departments`
```bash
curl -X GET 'http://localhost:8080/api/Departments' -H 'Authorization: Bearer <TOKEN>'
```

**4.2 Create Department**
- **Endpoint:** `POST /api/Departments`
```bash
curl -X POST 'http://localhost:8080/api/Departments' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "departmentName": "Marketing",
  "departmentCode": "MKT",
  "description": "Growth and Sales",
  "parentDepartmentId": null,
  "managerId": "<EMPLOYEE_ID>"
}'
```

**4.3 Department Hierarchy (Org Chart)**
- **Endpoint:** `GET /api/Departments/hierarchy`
```bash
curl -X GET 'http://localhost:8080/api/Departments/hierarchy' -H 'Authorization: Bearer <TOKEN>'
```

**4.4 Employees in Department**
- **Endpoint:** `GET /api/Departments/{id}/employees`
```bash
curl -X GET 'http://localhost:8080/api/Departments/<ID>/employees' -H 'Authorization: Bearer <TOKEN>'
```

---

## 🛡️ 5. User Administration (`UsersController`)

**5.1 List All System Users**
- **Endpoint:** `GET /api/Users`
```bash
curl -X GET 'http://localhost:8080/api/Users' -H 'Authorization: Bearer <TOKEN>'
```

**5.2 Create Admin/HR User**
- **Endpoint:** `POST /api/Users`
```bash
curl -X POST 'http://localhost:8080/api/Users' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "firstName": "Admin",
  "lastName": "User",
  "email": "manager@hr.com",
  "password": "Password123!",
  "role": "HRManager"
}'
```

**5.3 Toggle User Status (Enable/Disable)**
- **Endpoint:** `PATCH /api/Users/{id}/toggle-status`
```bash
curl -X PATCH 'http://localhost:8080/api/Users/<ID>/toggle-status' -H 'Authorization: Bearer <TOKEN>'
```

**5.4 Assign Role**
- **Endpoint:** `POST /api/Users/assign-role`
```bash
curl -X POST 'http://localhost:8080/api/Users/assign-role' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"userId":"<ID>","role":"Admin"}'
```

---

## ⏰ 6. Attendance & Time Tracking (`AttendanceController`)

**6.1 Clock In**
- **Endpoint:** `POST /api/Attendance/clock-in`
```bash
curl -X POST 'http://localhost:8080/api/Attendance/clock-in' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"employeeId":"<ID>","notes":"On-site"}'
```

**6.2 Clock Out**
- **Endpoint:** `POST /api/Attendance/clock-out`
```bash
curl -X POST 'http://localhost:8080/api/Attendance/clock-out' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"attendanceId":"<ID>","notes":"Leaving for today"}'
```

**6.3 Attendance History**
- **Endpoint:** `GET /api/Attendance/employee/{id}`
```bash
curl -X GET 'http://localhost:8080/api/Attendance/employee/<ID>?from=2024-01-01&to=2024-12-31' -H 'Authorization: Bearer <TOKEN>'
```

---

## 🔄 7. Shifts & Roster (`ShiftsController`)

**7.1 Create Shift Type**
- **Endpoint:** `POST /api/Shifts`
```bash
curl -X POST 'http://localhost:8080/api/Shifts' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"shiftName":"Evening","startTime":"14:00","endTime":"22:00"}'
```

**7.2 Assign Shift to Employee**
- **Endpoint:** `POST /api/Shifts/assign`
```bash
curl -X POST 'http://localhost:8080/api/Shifts/assign' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"employeeId":"<ID>","shiftId":"<SID>","scheduleDate":"2024-11-25"}'
```

**7.3 Daily Shift Roster**
- **Endpoint:** `GET /api/Shifts/daily`
```bash
curl -X GET 'http://localhost:8080/api/Shifts/daily?date=2024-11-25' -H 'Authorization: Bearer <TOKEN>'
```

---

## 🏖️ 8. Leave Management (`LeavesController`)

**8.1 Request Leave**
- **Endpoint:** `POST /api/Leaves/request`
```bash
curl -X POST 'http://localhost:8080/api/Leaves/request' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "employeeId": "<ID>",
  "leaveType": "Sick",
  "startDate": "2024-11-01",
  "endDate": "2024-11-03",
  "reason": "Flu"
}'
```

**8.2 Approve/Reject Leave**
- **Endpoint:** `PUT /api/Leaves/{id}/approve` (or `/reject`)
```bash
curl -X PUT 'http://localhost:8080/api/Leaves/<ID>/approve' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '"Approved by HR"'
```

**8.3 Check Leave Balance**
- **Endpoint:** `GET /api/Leaves/balance/{employeeId}/{type}/{year}`
```bash
curl -X GET 'http://localhost:8080/api/Leaves/balance/<ID>/Annual/2024' -H 'Authorization: Bearer <TOKEN>'
```

---

## 💸 9. Payroll & Salary (`PayrollController`)

**9.1 Calculate/Draft Payroll**
- **Endpoint:** `POST /api/Payroll/calculate`
```bash
curl -X POST 'http://localhost:8080/api/Payroll/calculate' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"employeeId":"<ID>","periodStart":"2024-10-01","periodEnd":"2024-10-31"}'
```

**9.2 Process Monthly Batch**
- **Endpoint:** `POST /api/Payroll/process-monthly/{year}/{month}`
```bash
curl -X POST 'http://localhost:8080/api/Payroll/process-monthly/2024/10' -H 'Authorization: Bearer <TOKEN>'
```

**9.3 Add Salary Component (Earning/Deduction)**
- **Endpoint:** `POST /api/Payroll/components`
```bash
curl -X POST 'http://localhost:8080/api/Payroll/components' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"employeeId":"<ID>","name":"Car Allowance","type":"Earning","amount":300,"isPercentage":false,"isActive":true}'
```

---

## 📈 10. Performance Reviews (`PerformanceController`)

**10.1 Create Review Cycle**
- **Endpoint:** `POST /api/Performance`
```bash
curl -X POST 'http://localhost:8080/api/Performance' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"employeeId":"<E_ID>","reviewerId":"<M_ID>","reviewPeriodStart":"2024-01-01","reviewPeriodEnd":"2024-06-30"}'
```

**10.2 Complete/Update Review**
- **Endpoint:** `PUT /api/Performance/{id}`
```bash
curl -X PUT 'http://localhost:8080/api/Performance/<ID>' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"overallRating":5,"status":"Completed","comments":"Outstanding work on the backend"}'
```

**10.3 Employee Acknowledge**
- **Endpoint:** `PUT /api/Performance/{id}/acknowledge`
```bash
curl -X PUT 'http://localhost:8080/api/Performance/<ID>/acknowledge' -H 'Authorization: Bearer <TOKEN>'
```

---

## 🤝 11. Recruitment Pipeline (`RecruitmentController`)

**11.1 Post Job Opening**
- **Endpoint:** `POST /api/Recruitment/jobs`
```bash
curl -X POST 'http://localhost:8080/api/Recruitment/jobs' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
  "jobTitle": "Frontend Developer",
  "jobDescription": "Build UIs",
  "location": "Cairo",
  "salaryRangeMin": 3000,
  "salaryRangeMax": 4500
}'
```

**11.2 Public Application**
- **Endpoint:** `POST /api/Recruitment/apply`
```bash
curl -X POST 'http://localhost:8080/api/Recruitment/apply' \
-H 'Content-Type: application/json' \
-d '{"jobPostingId":"<JID>","firstName":"Sara","lastName":"Ahmed","email":"sara@example.com","resumeUrl":"link-to-resume"}'
```

**11.3 Update Candidate Stage**
- **Endpoint:** `PUT /api/Recruitment/candidates/{id}/stage`
```bash
curl -X PUT 'http://localhost:8080/api/Recruitment/candidates/<ID>/stage' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{"currentStage":"Interview","rating":5,"notes":"Promising candidate"}'
```

---

## 📄 12. Documents (`DocumentsController`)

**12.1 Upload File**
- **Endpoint:** `POST /api/Documents/upload`
```bash
curl -X POST 'http://localhost:8080/api/Documents/upload' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: multipart/form-data' \
-F 'EmployeeId=<ID>' \
-F 'DocumentName=Contract' \
-F 'DocumentType=Legal' \
-F 'file=@/path/to/contract.pdf'
```

**12.2 Expiring Documents Alert**
- **Endpoint:** `GET /api/Documents/expiring`
```bash
curl -X GET 'http://localhost:8080/api/Documents/expiring?daysAhead=30' -H 'Authorization: Bearer <TOKEN>'
```

---

## 📥 13. System Exports (`ExportsController`)

**13.1 Download Employee Excel**
- **Endpoint:** `GET /api/Exports/employees/excel`
```bash
curl -X GET 'http://localhost:8080/api/Exports/employees/excel' -H 'Authorization: Bearer <TOKEN>' --output roster.xlsx
```

**13.2 Generate Payroll PDF (Payslip)**
- **Endpoint:** `GET /api/Exports/payroll/{id}/pdf`
```bash
curl -X GET 'http://localhost:8080/api/Exports/payroll/<ID>/pdf' -H 'Authorization: Bearer <TOKEN>' --output payslip.pdf
```

**13.3 Attendance Report CSV**
- **Endpoint:** `GET /api/Exports/attendance/csv`
```bash
curl -X GET 'http://localhost:8080/api/Exports/attendance/csv?from=2024-01-01&to=2024-12-31' -H 'Authorization: Bearer <TOKEN>' --output attendance.csv
```
