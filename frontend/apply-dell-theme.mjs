import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// Colors
content = content.replace(/#0076ce/g, '#007db8');
content = content.replace(/#005a9e/g, '#005a8a');
content = content.replace(/bg-background-light/g, 'bg-[#F5F6F7]');

// Glassmorphism general container replacement
content = content.replace(/bg-white rounded-\[2\.5rem\] border border-\[#dbe0e6\] shadow-sm/g, 'bg-white/90 rounded-[2.5rem] border border-black/5 shadow-sm backdrop-blur-xl');
content = content.replace(/bg-white border border-\[#dbe0e6\] rounded-\[3rem\] shadow-sm/g, 'bg-white/90 border border-black/5 rounded-[3rem] shadow-sm backdrop-blur-xl');
content = content.replace(/bg-white border border-\[#dbe0e6\] shadow-sm/g, 'bg-white/90 border border-black/5 shadow-sm backdrop-blur-xl');

// Performance gauge/stats box
content = content.replace(/bg-white rounded-3xl border border-gray-100 p-6 shadow-sm/g, 'bg-white/90 rounded-3xl border border-black/5 p-6 shadow-sm backdrop-blur-xl');

// Typography
content = content.replace(/font-mono(?! uppercase)(\s|")/g, 'font-mono uppercase$1');

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated with Dell Theme.');
