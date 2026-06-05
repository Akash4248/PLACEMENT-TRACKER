import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiBriefcase } from "react-icons/fi";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import Button from "../components/ui/Button";
import FormField, { inputClass } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setError("");
    try {
      await login(values);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell>
        <motion.div
          className="w-full max-w-md rounded-2xl border border-border bg-white/95 p-6 shadow-lift backdrop-blur sm:p-8"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24 }}
        >
          <div className="mb-8 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white">
              <FiBriefcase className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-ink">Sign in to CampusTrack</h1>
          <p className="mt-2 text-sm text-muted">Use your placement officer credentials to continue.</p>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.email?.message} label="Email">
              <input
                className={inputClass}
                placeholder="admin@campus.edu"
                type="email"
                {...register("email", { required: "Email is required" })}
              />
            </FormField>
            <FormField error={errors.password?.message} label="Password">
              <input
                className={inputClass}
                placeholder="Enter password"
                type="password"
                {...register("password", { required: "Password is required" })}
              />
            </FormField>
            <Button className="w-full" loading={isSubmitting} size="lg" type="submit">
              Sign in
              <FiArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            New to CampusTrack?{" "}
            <Link className="font-semibold text-primary hover:text-primary-hover" to="/signup">
              Create account
            </Link>
          </p>
        </motion.div>
    </AuthShell>
  );
}
