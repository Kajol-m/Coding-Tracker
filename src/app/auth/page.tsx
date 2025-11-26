'use client'
import { useState } from "react";
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import axios from "axios";

// --- Types ---
interface AuthForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Auth = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [formData, setFormData] = useState<AuthForm>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [visitedFields, setVisitedFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);

  // --- Validation regex ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)?$/;

  // --- Validators ---
  const validateSignup = (vals: AuthForm, validateAll = false): Errors => {
    const errs: Errors = {};

    if (validateAll || visitedFields.has("fullName")) {
      if (!vals.fullName.trim()) errs.fullName = "Full name is required";
      else if (!nameRegex.test(vals.fullName.trim()))
        errs.fullName = "Only Latin letters allowed";
    }

    if (validateAll || visitedFields.has("email")) {
      if (!vals.email.trim()) errs.email = "Email is required";
      else if (!emailRegex.test(vals.email)) errs.email = "Invalid email format";
    }

    if (validateAll || visitedFields.has("password")) {
      if (!vals.password) errs.password = "Password is required";
      else if (vals.password.length < 8)
        errs.password = "Minimum 8 characters required";
      else {
        const missing: string[] = [];
        if (!/[A-Z]/.test(vals.password)) missing.push("uppercase");
        if (!/[a-z]/.test(vals.password)) missing.push("lowercase");
        if (!/\d/.test(vals.password)) missing.push("digit");
        if (!/[@$!%*?&]/.test(vals.password)) missing.push("special character");

        if (missing.length)
          errs.password = `Must contain ${missing.join(", ")}`;
      }
    }

    if (validateAll || visitedFields.has("confirmPassword")) {
      if (!vals.confirmPassword)
        errs.confirmPassword = "Please confirm password";
      else if (vals.confirmPassword !== vals.password)
        errs.confirmPassword = "Passwords do not match";
    }

    return errs;
  };

  const validateSignin = (vals: AuthForm, validateAll = false): Errors => {
    const errs: Errors = {};

    if (validateAll || visitedFields.has("email")) {
      if (!vals.email.trim()) errs.email = "Email is required";
      else if (!emailRegex.test(vals.email)) errs.email = "Invalid email format";
    }

    if (validateAll || visitedFields.has("password")) {
      if (!vals.password) errs.password = "Password is required";
      else if (vals.password.length < 8)
        errs.password = "Minimum 8 characters required";
    }

    return errs;
  };

  // --- Field change ---
  const setField =
    (fieldName: keyof AuthForm) => (value: string) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      if (activeTab === "signup")
        setErrors(validateSignup({ ...formData, [fieldName]: value }));
      else setErrors(validateSignin({ ...formData, [fieldName]: value }));
    };

  // --- Focus & Blur ---
  const handleFocus = (field: keyof AuthForm) => () => {
    setVisitedFields((prev) => new Set(prev).add(field));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field: keyof AuthForm) => () => {
    setVisitedFields((prev) => new Set(prev).add(field));
    if (activeTab === "signup") setErrors(validateSignup(formData));
    else setErrors(validateSignin(formData));
  };

  // --- Signup handler ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateSignup(formData, true);
    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) return;

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/register", {
        user_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      // Auto-login after successful registration
      const createdAt = response.data.user.createdAt;
      const joinDate = createdAt 
        ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : "January 2025";

      // Save token + refreshToken + user
      localStorage.setItem("token", response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify({
        user_id: response.data.user.user_id,
        user_name: response.data.user.user_name,
        email: response.data.user.email,
        provider: response.data.user.provider,
        createdAt: response.data.user.createdAt,
        joinDate,
      }));

      toast.success("Account created successfully! Logging in...");
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Registration failed. Try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Signin handler ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateSignin(formData, true);
    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) return;

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      toast.success("Welcome back!");

      // Calculate joinDate from createdAt
      const createdAt = response.data.user.createdAt;
      const joinDate = createdAt 
        ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : "January 2025";

      // Save token + refreshToken + user (for JWT auth)
      localStorage.setItem("token", response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify({
        user_id: response.data.user.user_id,
        user_name: response.data.user.user_name,
        email: response.data.user.email,
        provider: response.data.user.provider,
        createdAt: response.data.user.createdAt,
        joinDate,
      }));

      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Invalid credentials. Try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google OAuth ---
  

const handleGoogleSignIn = () => {
  setIsLoading(true);
  signIn("google", { callbackUrl: "/" });
};


  // --------------------------- UI ----------------------------
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Cute pixel sparkles */}
      <div className="absolute top-10 left-10 text-4xl animate-sparkle"><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute top-20 right-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute bottom-20 left-1/4 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>
      <div className="absolute top-50 left-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute bottom-50 right-40 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>

      <Card className="w-full max-w-md pixel-shadow-lg border-4 border-border">
        <CardHeader className="text-center">
          <CardTitle className="lg:text-xl md:text-xl sm:text-md font-bold pixel-title">Pixel Coding Tracker</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs
            defaultValue="signin"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
          >
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------- SIGN IN FORM ---------- */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email"
                    value={formData.email}
                    onChange={(e) => setField("email")(e.target.value)}
                    onFocus={handleFocus("email")}
                    onBlur={handleBlur("email")}
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setField("password")(e.target.value)}
                    onFocus={handleFocus("password")}
                    onBlur={handleBlur("password")}
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <span><img src="/google-logo.png" alt="Google logo" className="w-[25px]" /></span>
                  Continue with Google
                </Button>
              </form>
            </TabsContent>

            {/* ---------- SIGN UP FORM ---------- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">

                <div>
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    placeholder="Kajol"
                    value={formData.fullName}
                    onChange={(e) => setField("fullName")(e.target.value)}
                    onFocus={handleFocus("fullName")}
                    onBlur={handleBlur("fullName")}
                    disabled={isLoading}
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email"
                    value={formData.email}
                    onChange={(e) => setField("email")(e.target.value)}
                    onFocus={handleFocus("email")}
                    onBlur={handleBlur("email")}
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => setField("password")(e.target.value)}
                    onFocus={handleFocus("password")}
                    onBlur={handleBlur("password")}
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setField("confirmPassword")(e.target.value)}
                    onFocus={handleFocus("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <span><img src="/google-logo.png" alt="Google logo" className="w-[25px]" /></span>
                  Continue with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
