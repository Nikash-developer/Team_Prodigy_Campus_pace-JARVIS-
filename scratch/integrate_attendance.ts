import fs from 'fs';
import path from 'path';

function updateFile(filePath: string, startMarker: string, endMarker: string, replacement: string) {
    let content = fs.readFileSync(filePath, 'utf8');
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(0, startIndex + startMarker.length) + 
                  replacement + 
                  content.substring(endIndex);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.error(`Markers not found in ${filePath}`);
        // Log what we found to debug
        console.log('Start index:', startIndex);
        console.log('End index:', endIndex);
        process.exit(1);
    }
}

// Update Faculty Dashboard
updateFile(
    'src/pages/FacultyDashboard.tsx',
    ") : activeNav === 'Attendance' ? (",
    ") : activeNav === 'Notices' ? (",
    "\n            <FacultyAttendancePage user={user} theme={t} themeMode={themeMode} />\n          "
);

// Add import to StudentDashboard.tsx
let studentContent = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');
if (!studentContent.includes('StudentAttendancePage')) {
    studentContent = "import { StudentAttendancePage } from '../components/attendance/StudentAttendancePage';\n" + studentContent;
    fs.writeFileSync('src/pages/StudentDashboard.tsx', studentContent);
    console.log('Added import to StudentDashboard.tsx');
}

// Update Student Dashboard
// Looking for the attendance tab block and replacing it
updateFile(
    'src/pages/StudentDashboard.tsx',
    "{activeTab === 'attendance' && (",
    "          {activeTab === 'dashboard' && (",
    "\n            <StudentAttendancePage user={studentProfile} theme={t} attendanceSummary={attendanceSummary} />\n          )}\n\n"
);
