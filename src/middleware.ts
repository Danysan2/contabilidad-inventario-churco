export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/inventory/:path*",
    "/movements/:path*",
    "/egresos/:path*",
    "/catalogo/:path*",
    "/ranking/:path*",
    "/settings/:path*",
    "/api/products/:path*",
    "/api/sales/:path*",
    "/api/egresos/:path*",
    "/api/gastos-fijos/:path*",
    "/api/dashboard/:path*",
    "/api/categories/:path*",
    "/api/movements/:path*",
    "/api/ranking/:path*",
    "/api/users/:path*",
  ],
};
