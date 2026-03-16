import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/autoplay";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { Eye, EyeOff, LogIn } from "lucide-react";
import BASE_URL from "@/config/base-url";
// import logoLogin from "@/assets/receipt/fts_log.png";
import { toast } from "sonner";
import banner1 from "@/assets/auth/banner1.jpeg";
import banner2 from "@/assets/auth/banner2.jpeg";

export default function LoginAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [activeBanner, setActiveBanner] = useState(1);
  const emailInputRef = useRef(null);

  // Auto-cycle background images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev === 1 ? 2 : 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadingMessages = [
    "Setting things up for you...",
    "Checking your credentials...",
    "Preparing your dashboard...",
    "Almost there...",
  ];

  // Auto-focus on email input
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let messageIndex = 0;
    let intervalId;

    if (isLoading) {
      setLoadingMessage(loadingMessages[0]);
      intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 800);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  // Fix for form submission with Enter key
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !isLoading) {
      handleSubmit(event);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await axios.post(`${BASE_URL}/api/panel-login`, formData);

      if (res.data.code === 200) {
        if (!res.data.UserInfo || !res.data.UserInfo.token) {
          toast.error("Login Failed: No token received.");
          setIsLoading(false);
          return;
        }

        const { UserInfo, version, company_detils } = res.data;
        const isProduction = window.location.protocol === "https:";

        const cookieOptions = {
          expires: 7,
          secure: isProduction,
          sameSite: "Strict",
          path: "/",
        };

        // Set all cookies based on the actual response structure
        localStorage.setItem("sidebar:state", true);

        // UserInfo cookies
        Cookies.set("token", UserInfo.token, cookieOptions);
        Cookies.set("id", UserInfo.user.id, cookieOptions); // Changed from user_type_id to id
        Cookies.set("name", UserInfo.user.name, cookieOptions); // Changed from first_name to name
        Cookies.set("username", UserInfo.user.name, cookieOptions);
        Cookies.set("user_type", UserInfo.user.user_type, cookieOptions);
        Cookies.set(
          "user_position",
          UserInfo.user.user_position,
          cookieOptions,
        );
        Cookies.set("email", UserInfo.user.email, cookieOptions);
        Cookies.set("mobile", UserInfo.user.mobile, cookieOptions);
        Cookies.set("status", UserInfo.user.status, cookieOptions);

        // Token expiry
        Cookies.set(
          "token-expire-time",
          UserInfo.token_expires_at,
          cookieOptions,
        );

        // Version info
        Cookies.set("ver_con", version?.version_panel, cookieOptions);

        // Company details
        Cookies.set("company_id", company_detils?.id, cookieOptions);
        Cookies.set(
          "company_name",
          company_detils?.company_name,
          cookieOptions,
        );
        Cookies.set(
          "company_email",
          company_detils?.company_email,
          cookieOptions,
        );
        Cookies.set(
          "company_short",
          company_detils?.company_short,
          cookieOptions,
        );

        // Set current year if needed (extract from token_expires_at or use current year)
        const currentYear = new Date().getFullYear();
        Cookies.set("currentYear", currentYear.toString(), cookieOptions);

        // Verify cookies were set
        const token = Cookies.get("token");
        const tokenExpireTime = Cookies.get("token-expire-time");

        if (!token || !tokenExpireTime) {
          throw new Error("Cookies not set properly");
        }

        navigate("/home", { replace: true });
      } else {
        toast.error(res.data.message || "Login Failed: Unexpected response.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(
        "❌ Login Error:",
        error.response?.data?.message || error.message,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.",
      );

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900 border-none">
      {/* Background container with dynamic images */}
      <div className="absolute inset-0 overflow-hidden z-0 bg-black">
        {/* Banner 1 */}
        <motion.div
          animate={{ opacity: activeBanner === 1 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner1})` }}
        />
        {/* Banner 2 */}
        <motion.div
          animate={{ opacity: activeBanner === 2 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner2})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/20 backdrop-blur-[1px] z-10" />
      </div>

      {/* login container  */}
      <motion.div
        className="flex flex-row shadow-2xl rounded-2xl bg-white w-[400px] overflow-hidden max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full  px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-transparent"
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="pb-4 md:pb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="space-y-1 md:space-y-2">
                  <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-[var(--team-color)] to-[var(--color-dark)] bg-clip-text text-transparent">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm md:text-base">
                    Sign in to your Fleet Crm account
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-2 ">
                <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
                  <div className="space-y-4 ">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Username
                      </Label>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Input
                          ref={emailInputRef}
                          id="email"
                          type="text"
                          placeholder="Enter your username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          minLength={1}
                          maxLength={50}
                          required
                          className="h-10 md:h-11 border-gray-300 focus:border-[var(--color-border)] focus:ring-[var(--color-border)] transition-colors"
                          autoComplete="username"
                        />
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={1}
                            maxLength={16}
                            className="h-10 md:h-11 pr-10 border-gray-300 focus:border-[var(--color-border)] focus:ring-[var(--color-border)] transition-colors"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-10 md:h-11 bg-gradient-to-r from-[var(--team-color)] to-[var(--color-dark)] hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <motion.span
                            key={loadingMessage}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-sm"
                          >
                            {loadingMessage}
                          </motion.span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <LogIn size={16} className="md:size-[18px]" />
                            Sign In
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-4 mt-4 flex flex-row items-center  justify-between mx-5 text-center"
              >
                {/* <button
                    onClick={() => navigate("/signup")}
                    className="text-xs md:text-sm text-[var(--color)] hover:text-[var(--color-dark)] font-medium transition-colors duration-200 hover:underline"
                  >
                    Signup
                  </button> */}
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs md:text-sm text-[var(--color)] hover:text-[var(--color-dark)] font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot your password?
                </button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
