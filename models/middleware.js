// import { NextResponse } from 'next/server';

// export function middleware(request) {
//   const role = request.cookies.get('user_role')?.value;

//   // Redirect logic
//   if (role === 'ADMIN') {
//     return NextResponse.redirect(new URL('/admin', request.url));
//   } else if (role === 'STUDENT') {
//     return NextResponse.redirect(new URL('/', request.url));
//   }

//   return NextResponse.next();
// }

// // Apply to specific paths
// export const config = {
//   matcher: ['/signup', '/login'], // Protect these routes
// };