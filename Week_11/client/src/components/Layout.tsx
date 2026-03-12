import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg font-semibold text-indigo-600 no-underline"
          >
            Wearable IAM
          </Link>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm text-gray-600 hover:text-indigo-600 no-underline"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600 bg-transparent border-none cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-indigo-600 no-underline"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded no-underline"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
