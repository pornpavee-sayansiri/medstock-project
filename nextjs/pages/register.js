import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Register() {
  const router = useRouter();

  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!organizationName.trim()) {
      setError("Please enter your organization name");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organization_name: organizationName.trim(),
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed. Please try again."
        );
      }

      // Registration succeeded on the backend.
      // Never save the password in localStorage.
      await router.push("/login?registered=true");
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the server. Please check if the backend is running."
        );
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        {/* LEFT SIDE */}
        <section className="auth-left">
          <div className="platform-label">
            HEALTHCARE LOGISTICS PLATFORM
          </div>

          <h1>
            Next-Gen Medical
            <br />
            <span>Inventory Management</span>
          </h1>

          <p className="description">
            Streamline pharmaceutical tracking, manage critical stock levels,
            and receive real-time webhook automation for modern hospital
            operations.
          </p>

          <div className="medical-image">
            <div className="image-overlay"></div>
          </div>

          <div className="heartbeat">
            ──────╱╲──────
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="auth-right">
          <Card className="register-card">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                Create your MedStock account
              </CardTitle>

              <CardDescription>
                Register your organization to start managing your inventory.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Organization Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="organizationName"
                    className="text-sm font-medium"
                  >
                    Organization Name
                  </label>

                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="e.g. ABC Hospital"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    autoComplete="organization"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium"
                  >
                    Email
                  </label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </label>

                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                {/* Login Link */}
                <div className="text-center text-sm text-muted-foreground pt-2">
                  Already have an account?{" "}

                  <Link
                    href="/login"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Log in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(
              circle at 75% 50%,
              rgba(0, 145, 255, 0.13),
              transparent 38%
            ),
            linear-gradient(
              135deg,
              #020817 0%,
              #06142d 50%,
              #020a1b 100%
            );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .auth-container {
          width: 1120px;
          max-width: 92%;
          min-height: 650px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 70px;
          padding: 50px 0;
        }

        .auth-left {
          width: 100%;
        }

        .platform-label {
          display: inline-block;
          padding: 5px 11px;
          border-radius: 20px;
          background: rgba(0, 190, 255, 0.12);
          color: #38d5ff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 15px;
        }

        .auth-left h1 {
          margin: 0;
          font-size: 44px;
          line-height: 1.05;
          letter-spacing: -1.5px;
          font-weight: 800;
        }

        .auth-left h1 span {
          color: #42c7ff;
        }

        .description {
          max-width: 510px;
          margin-top: 18px;
          margin-bottom: 22px;
          color: #91a3bc;
          font-size: 13px;
          line-height: 1.6;
        }

        .medical-image {
          width: 470px;
          max-width: 100%;
          height: 245px;
          border-radius: 10px;
          overflow: hidden;
          background-image: url("/medical-inventory.png");
          background-size: cover;
          background-position: center;
        }

        .image-overlay {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.05),
            rgba(1, 10, 25, 0.45)
          );
        }

        .heartbeat {
          margin-top: 20px;
          color: #1fc7ff;
          font-size: 20px;
          letter-spacing: -2px;
        }

        .auth-right {
          display: flex;
          justify-content: center;
        }

        .register-card {
          width: 390px;
          background: rgba(10, 24, 45, 0.95);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }

        @media (max-width: 850px) {
          .auth-page {
            overflow-y: auto;
          }

          .auth-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 50px 0;
          }

          .auth-left {
            text-align: center;
          }

          .description {
            margin-left: auto;
            margin-right: auto;
          }

          .medical-image {
            margin-left: auto;
            margin-right: auto;
          }

          .heartbeat {
            margin-left: auto;
            margin-right: auto;
          }

          .auth-left h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  );
}