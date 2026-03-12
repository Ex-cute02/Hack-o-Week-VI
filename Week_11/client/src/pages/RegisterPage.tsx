import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import zxcvbn from "zxcvbn";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordScore = password ? zxcvbn(password).score : 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const longEnough = password.length >= 10;
  const passwordsMatch = password === confirmPassword;
  const isValid =
    longEnough &&
    hasLower &&
    hasUpper &&
    hasDigit &&
    passwordScore >= 3 &&
    passwordsMatch &&
    email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);

    try {
      await register(email, password);
      navigate("/login", { state: { registered: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white   shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create Account
        </h1>

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
            <PasswordStrengthMeter password={password} />
            {password && (
              <div className="mt-2 space-y-1">
                <Requirement met={longEnough} text="At least 10 characters" />
                <Requirement met={hasLower} text="Lowercase letter" />
                <Requirement met={hasUpper} text="Uppercase letter" />
                <Requirement met={hasDigit} text="A digit" />
                <Requirement
                  met={passwordScore >= 3}
                  text="Strength: Strong or better"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-2.5 bg-indigo-600 text-white   font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <p
      className={`text-xs flex items-center gap-1 ${met ? "text-green-600" : "text-gray-400"}`}
    >
      <span>{met ? "\u2713" : "\u2717"}</span> {text}
    </p>
  );
}
