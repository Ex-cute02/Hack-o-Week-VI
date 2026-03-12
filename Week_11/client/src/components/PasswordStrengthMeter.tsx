import zxcvbn from "zxcvbn";

const COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
const LABELS = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

interface Props {
  password: string;
}

export function PasswordStrengthMeter({ password }: Props) {
  if (!password) return null;

  const result = zxcvbn(password);
  const score = result.score; // 0-4

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i <= score ? COLORS[score] : "#e0e0e0",
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: COLORS[score] }}>
        {LABELS[score]}
      </p>
      {result.feedback.warning && (
        <p className="text-xs text-amber-600 mt-1">{result.feedback.warning}</p>
      )}
      {result.feedback.suggestions.map((s, i) => (
        <p key={i} className="text-xs text-gray-500 mt-0.5">
          {s}
        </p>
      ))}
    </div>
  );
}
