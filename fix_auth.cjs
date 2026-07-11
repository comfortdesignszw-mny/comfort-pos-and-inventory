const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

// I will first replace the broken chunk back to its original state.
// The broken chunk is:
// </div>
//       <div className="flex-1 shrink-0 min-h-[2rem]"></div>
//     </div>
//   );
// }
//                 <div className="grid grid-cols-3 gap-3">
//
// Let's replace it with the proper `</div></div></div>`.

code = code.replace(
  /<\/div>\n      <div className="flex-1 shrink-0 min-h-\[2rem\]"><\/div>\n    <\/div>\n  \);\n}\n                <div className="grid grid-cols-3 gap-3">/,
  '                  </div>\n                </div>\n                <div className="grid grid-cols-3 gap-3">'
);

// We also have the end of file patched.
// The end of the file is currently:
// </p>
//       </div>
//       <div className="flex-1 shrink-0 min-h-[2rem]"></div>
//     </div>
//   );
// }

fs.writeFileSync('src/components/AuthScreen.tsx', code);
