import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiBriefcase } from "react-icons/fi";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
    <main className="grid min-h-screen bg-canvas p-4 lg:grid-cols-[1fr_520px] lg:p-0">
      <section className="hidden border-r border-border bg-white p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white">
            <FiBriefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink">CampusTrack</p>
            <p className="text-sm text-muted">Campus Interview Tracking</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Placement operations</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-ink">
            Manage students, drives, rounds, and offers with quiet confidence.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted">
            A clean command center for placement teams to keep interviews moving and results visible.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["JWT auth", "Live KPIs", "Kanban flow"].map((item) => (
            <div className="rounded-2xl border border-border bg-slate-50 p-4 text-sm font-semibold text-ink" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center">
        <motion.div
          className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
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
        </motion.div>
      </section>
    </main>
  );
}
