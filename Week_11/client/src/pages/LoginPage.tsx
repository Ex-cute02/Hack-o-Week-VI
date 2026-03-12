import { useState, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = (location.state as { registered?: boolean })
    ?.registered;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white   shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>

        {justRegistered && (
          <div className="bg-green-50 text-green-700 text-sm p-3   mb-4">
            Account created successfully. Please sign in.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3   mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-2.5 bg-indigo-600 text-white   font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-700"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
