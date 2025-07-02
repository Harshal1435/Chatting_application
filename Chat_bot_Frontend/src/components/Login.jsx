import axios from "axios";
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const [authUser, setAuthUser] = useAuth();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    const userInfo = {
      email: data.email,
      password: data.password,
    };

    axios
      .post(`${baseurl}/api/user/login`, userInfo)
      .then((response) => {
        if (response.data) {
          toast.success("Login successful");
          localStorage.setItem("ChatApp", JSON.stringify(response.data));
          setAuthUser(response.data);
        }
      })
      .catch((error) => {
        if (error.response) {
          toast.error("Error: " + error.response.data.error);
        }
      });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-xl bg-slate-800 px-6 py-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold text-green-500 text-center mb-2">
          Chatting App Login
        </h1>
        <p className="text-center text-slate-300 mb-6">
          Sign in to continue to your chat
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-1 block">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            {...register("email", { required: true })}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.email && (
            <span className="text-red-400 text-sm">This field is required</span>
          )}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-slate-300 mb-1 block">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            {...register("password", { required: true })}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.password && (
            <span className="text-red-400 text-sm">This field is required</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
        >
          Login
        </button>

        {/* Signup Link */}
        <p className="mt-4 text-center text-slate-300 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-500 hover:underline">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
