import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  
async function handleSubmit(event) {
  event.preventDefault();
  console.log("Login button clicked");

  setError("");
  setLoading(true);

  try {
    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }

    console.log("Sending login request...");

    // Send login information to the backend
    const response = await fetch(
      "http://127.0.0.1:8000/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      }
    );

    const data = await response.json();

    console.log("Login response status:", response.status);
    console.log("Login response data:", data);

    // Handle login errors returned by the backend
    if (!response.ok) {
      throw new Error(
        data.detail || "Invalid email or password"
      );
    }

    
    // Save authentication and account information for this tab
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("email", data.email);
    sessionStorage.setItem(
      "organizationName",
      data.organization_name || ""
    );
    sessionStorage.setItem("role", data.role);
    sessionStorage.setItem(
      "subscription",
      data.subscription
    );

    // Remove old shared login data
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("organizationName");
    localStorage.removeItem("role");
    localStorage.removeItem("subscription");

    console.log("User role:", data.role);
    console.log("Redirecting to dashboard...");

    // Redirect based on the user's role
    if (data.role === "ADMIN") {
      await router.push("/admin/dashboard");
    } else {
      await router.push("/hosdashboard");
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err instanceof TypeError) {
      setError(
        "Cannot connect to the server. Please check if the backend is running."
      );
    } else {
      setError(
        err.message || "Login failed. Please try again."
      );
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


        {/* RIGHT SIDE - CARD เดิม */}
        <section className="auth-right">

          <Card className="login-card">

            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                MedStock Portal
              </CardTitle>

              <CardDescription>
                Enter your credentials to access the portal
              </CardDescription>
            </CardHeader>

            <CardContent>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>


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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />
                </div>


                {error && (
                  <p className="text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}


                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Logging in..."
                    : "Sign In to Portal"}
                </Button>


                <div className="text-center text-sm text-muted-foreground pt-2">
                  Don't have an account?{" "}

                  <Link
                    href="/register"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register
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


        /* LEFT */

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


        /* รูปที่ใส่ใน public */

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


        /* RIGHT */

        .auth-right {
          display: flex;
          justify-content: center;
        }


        .login-card {
          width: 390px;

          background: rgba(10, 24, 45, 0.95);

          border-color: rgba(255, 255, 255, 0.08);

          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.35);
        }


        /* MOBILE */

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