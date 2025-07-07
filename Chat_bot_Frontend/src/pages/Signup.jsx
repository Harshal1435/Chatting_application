import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function Signup() {
  const [authUser, setAuthUser] = useAuth();
 const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  const validatePasswordMatch = (value) => {
    return value === password || "Passwords do not match";
  };

  const onSubmit = async (data) => {
    const userInfo = {
      fullname: data.fullname,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    };

    try {
      const response = await axios.post(`${baseurl}/api/user/signup`, userInfo);
      if (response.data) {
        toast.success("Signup successful");
        localStorage.setItem("ChatApp", JSON.stringify(response.data));
        setAuthUser(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error("Error: " + error.response.data.error);
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-xl bg-slate-800 px-6 py-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold text-green-500 text-center mb-2">
          WhatsApp Signup
        </h1>
        <p className="text-center text-slate-300 mb-6">
          Create your account to start chatting
        </p>

        {/* Fullname */}
        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-1 block">Fullname</label>
          <input
            type="text"
            placeholder="Enter your name"
            {...register("fullname", { required: true })}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.fullname && (
            <span className="text-red-400 text-sm">This field is required</span>
          )}
        </div>

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
        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-1 block">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            {...register("password", { required: true })}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.password && (
            <span className="text-red-400 text-sm">This field is required</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="text-sm text-slate-300 mb-1 block">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Confirm password"
            {...register("confirmPassword", {
              required: true,
              validate: validatePasswordMatch,
            })}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.confirmPassword && (
            <span className="text-red-400 text-sm">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
        >
          Signup
        </button>

        {/* Login Link */}
        <p className="mt-4 text-center text-slate-300 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-green-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
